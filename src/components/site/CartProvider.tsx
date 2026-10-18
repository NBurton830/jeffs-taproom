'use client'

import { createPortal } from 'react-dom'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  CART_KEY,
  checkLine,
  configKey,
  itemCount,
  loadCart,
  MAX_QTY,
  newId,
  saveCart,
  subtotal,
  type CartLine,
  type LineFlag,
} from '@/lib/cart'
import { formatCents } from '@/lib/money'
import type { MenuItem, OrderingStatus, PublicMenu } from '@/lib/types'
import { CartDrawer } from './CartDrawer'
import { ItemDialog } from './ItemDialog'

export type ClientSettings = {
  cashDiscountPercent: number
  taxRatePercent: number
  tipPresetsPercent: number[]
  maxOnlineSubtotalCents: number
  phone: string
}

type Toast = { id: number; message: string; action?: { label: string; onClick: () => void }; ms: number }
type DialogState = { item: MenuItem; editLine?: CartLine; returnFocus?: HTMLElement | null } | null

type CartContextValue = {
  ready: boolean
  lines: CartLine[]
  flags: Record<string, LineFlag>
  count: number
  subtotalCents: number
  status: OrderingStatus
  settings: ClientSettings
  blockedReason: string | null
  addLine: (line: Omit<CartLine, 'id'>) => void
  replaceLine: (id: string, line: Omit<CartLine, 'id'>) => void
  setQuantity: (id: string, q: number) => void
  removeLine: (id: string) => void
  clear: () => void
  openItem: (item: MenuItem, opts?: { editLine?: CartLine; returnFocus?: HTMLElement | null }) => void
  openItemBySlug: (slug: string, opts?: { editLine?: CartLine; returnFocus?: HTMLElement | null }) => Promise<void>
  cartOpen: boolean
  openCart: () => void
  closeCart: () => void
  toast: (message: string, action?: Toast['action'], ms?: number) => void
  announce: (message: string) => void
  refreshMenu: () => Promise<PublicMenu | null>
  refreshStatus: () => Promise<void>
  revalidateCart: () => Promise<void>
}

const CartContext = createContext<CartContextValue | null>(null)

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart outside CartProvider')
  return ctx
}

export function CartProvider({
  children,
  initialStatus,
  settings,
}: {
  children: ReactNode
  initialStatus: OrderingStatus
  settings: ClientSettings
}) {
  const [ready, setReady] = useState(false)
  const [lines, setLines] = useState<CartLine[]>([])
  const [flags, setFlags] = useState<Record<string, LineFlag>>({})
  const [status, setStatus] = useState(initialStatus)
  const [cartOpen, setCartOpen] = useState(false)
  const [dialog, setDialog] = useState<DialogState>(null)
  const [toastState, setToast] = useState<Toast | null>(null)
  const [liveText, setLiveText] = useState('')
  const menuRef = useRef<PublicMenu | null>(null)
  const cartReturnFocus = useRef<HTMLElement | null>(null)

  const persist = useCallback((next: CartLine[]) => {
    saveCart(next)
    return next
  }, [])

  const refreshMenu = useCallback(async () => {
    try {
      const res = await fetch('/api/menu', { cache: 'no-store' })
      if (!res.ok) return menuRef.current
      menuRef.current = (await res.json()) as PublicMenu
    } catch {
      /* offline */
    }
    return menuRef.current
  }, [])

  /** ORD-025 */
  const revalidate = useCallback(
    async (current: CartLine[]) => {
      if (!current.length) return
      const menu = await refreshMenu()
      if (!menu) return
      const nextFlags: Record<string, LineFlag> = {}
      let changed = false
      const updated = current.map((l) => {
        const f = checkLine(l, menu)
        if (!f) return l
        nextFlags[l.id] = f
        if (f.kind === 'price_updated') {
          changed = true
          return { ...l, unitPriceCents: f.unitPriceCents }
        }
        return l
      })
      setFlags(nextFlags)
      if (changed) setLines(persist(updated))
    },
    [persist, refreshMenu],
  )

  useEffect(() => {
    const initial = loadCart()
    setLines(initial)
    setReady(true)
    void revalidate(initial)
    const onStorage = (e: StorageEvent) => {
      if (e.key === CART_KEY) setLines(loadCart())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [revalidate])

  const toast = useCallback((message: string, action?: Toast['action'], ms = 5000) => {
    setToast({ id: Date.now(), message, action, ms })
  }, [])

  useEffect(() => {
    if (!toastState) return
    const t = setTimeout(() => setToast((cur) => (cur?.id === toastState.id ? null : cur)), toastState.ms)
    return () => clearTimeout(t)
  }, [toastState])

  const announce = useCallback((message: string) => {
    setLiveText('')
    requestAnimationFrame(() => setLiveText(message))
  }, [])

  const addLine = useCallback(
    (line: Omit<CartLine, 'id'>) => {
      setLines((cur) => {
        const key = configKey(line)
        const idx = cur.findIndex((l) => configKey(l) === key)
        const next =
          idx >= 0
            ? cur.map((l, i) => (i === idx ? { ...l, quantity: Math.min(MAX_QTY, l.quantity + line.quantity), unitPriceCents: line.unitPriceCents } : l))
            : [...cur, { ...line, id: newId() }]
        return persist(next)
      })
    },
    [persist],
  )

  const replaceLine = useCallback(
    (id: string, line: Omit<CartLine, 'id'>) => {
      setLines((cur) => persist(cur.map((l) => (l.id === id ? { ...line, id } : l))))
      setFlags((f) => {
        const { [id]: _, ...rest } = f
        return rest
      })
    },
    [persist],
  )

  const setQuantity = useCallback(
    (id: string, q: number) => setLines((cur) => persist(cur.map((l) => (l.id === id ? { ...l, quantity: Math.max(1, Math.min(MAX_QTY, q)) } : l)))),
    [persist],
  )

  const linesRef = useRef(lines)
  linesRef.current = lines

  const removeLine = useCallback(
    (id: string) => {
      const cur = linesRef.current
      const index = cur.findIndex((l) => l.id === id)
      if (index < 0) return
      const removed = cur[index]
      setLines(persist(cur.filter((l) => l.id !== id)))
      toast(`Removed ${removed.name}`, {
        label: 'Undo',
        onClick: () => {
          setLines((now) => {
            if (now.some((l) => l.id === removed.id)) return now
            const restored = [...now]
            restored.splice(Math.min(index, restored.length), 0, removed)
            return persist(restored)
          })
          setToast(null)
        },
      })
    },
    [persist, toast],
  )

  const revalidateCart = useCallback(() => revalidate(linesRef.current), [revalidate])

  const clear = useCallback(() => {
    setLines(persist([]))
    setFlags({})
  }, [persist])

  const openItem = useCallback((item: MenuItem, opts: { editLine?: CartLine; returnFocus?: HTMLElement | null } = {}) => {
    setCartOpen(false)
    setDialog({ item, editLine: opts.editLine, returnFocus: opts.returnFocus ?? (document.activeElement as HTMLElement | null) })
  }, [])

  const openItemBySlug = useCallback(
    async (slug: string, opts: { editLine?: CartLine; returnFocus?: HTMLElement | null } = {}) => {
      const menu = menuRef.current ?? (await refreshMenu())
      const item = menu?.categories.flatMap((c) => c.items).find((i) => i.slug === slug)
      if (item) openItem(item, opts)
    },
    [openItem, refreshMenu],
  )

  const refreshStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/ordering-status', { cache: 'no-store' })
      if (res.ok) setStatus(await res.json())
    } catch {
      /* offline */
    }
  }, [])

  const openCart = useCallback(() => {
    cartReturnFocus.current = document.activeElement as HTMLElement | null
    setCartOpen(true)
  }, [])
  const closeCart = useCallback(() => {
    setCartOpen(false)
    const el = cartReturnFocus.current
    if (el?.isConnected) requestAnimationFrame(() => el.focus())
  }, [])

  const sub = subtotal(lines)
  const blockedReason = useMemo(() => {
    if (lines.some((l) => flags[l.id]?.kind === 'sold_out')) return 'Remove sold-out items to check out.'
    if (status.state === 'closed' || status.state === 'paused' || status.state === 'disabled') return status.message
    if (sub > settings.maxOnlineSubtotalCents) {
      return `For orders over ${formatCents(settings.maxOnlineSubtotalCents).replace('.00', '')}, please call ${settings.phone}`
    }
    return null
  }, [flags, lines, settings, status, sub])

  const value: CartContextValue = {
    ready,
    lines,
    flags,
    count: itemCount(lines),
    subtotalCents: sub,
    status,
    settings,
    blockedReason,
    addLine,
    replaceLine,
    setQuantity,
    removeLine,
    clear,
    openItem,
    openItemBySlug,
    cartOpen,
    openCart,
    closeCart,
    toast,
    announce,
    refreshMenu,
    refreshStatus,
    revalidateCart,
  }

  return (
    <CartContext.Provider value={value}>
      {children}
      {dialog && <ItemDialog key={`${dialog.item.slug}-${dialog.editLine?.id ?? 'new'}`} {...dialog} onClose={() => setDialog(null)} />}
      <CartDrawer />
      <div className="sr-only" aria-live="polite" role="status">
        {liveText}
      </div>
      <ToastHost>
        {toastState && (
          <div
            data-testid="toast"
            className="on-dark pointer-events-auto flex max-w-md items-center gap-3 rounded-lg bg-charcoal px-4 py-2 text-white shadow-lg"
          >
            <span>{toastState.message}</span>
            {toastState.action && (
              <button type="button" className="btn btn-sm bg-white text-charcoal" onClick={toastState.action.onClick}>
                {toastState.action.label}
              </button>
            )}
          </div>
        )}
      </ToastHost>
    </CartContext.Provider>
  )
}

/** Toasts render inside the open modal dialog (if any): content outside a modal <dialog> is inert. */
function ToastHost({ children }: { children: ReactNode }) {
  const [host, setHost] = useState<Element | null>(null)
  useEffect(() => {
    const pick = () => {
      const open = Array.from(document.querySelectorAll('dialog[open]'))
      setHost(open[open.length - 1] ?? document.body)
    }
    pick()
    const obs = new MutationObserver(pick)
    obs.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['open'], childList: true })
    return () => obs.disconnect()
  }, [])
  if (!host) return null
  return createPortal(
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex justify-center px-4 md:bottom-6">
      {children}
    </div>,
    host,
  )
}
