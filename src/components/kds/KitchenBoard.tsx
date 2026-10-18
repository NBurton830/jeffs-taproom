'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useModal } from '@/components/site/useModal'
import { formatCents, telHref } from '@/lib/money'
import type { Ticket } from '@/lib/orders'
import { formatTime } from '@/lib/time'

// specs/16-kitchen-display.md

type BoardData = { now: string; orders: Ticket[]; completed: Ticket[]; paused: boolean }
type Item = { slug: string; name: string; available: boolean }
type UndoToast = { id: number; message: string; number: number; previous: string }

const CANCEL_REASONS = ['Out of an item', 'Kitchen closed', 'Customer request', 'Other']
const PAUSE_OPTIONS: [string, number | null][] = [
  ['15 min', 15],
  ['30 min', 30],
  ['60 min', 60],
  ['Until I turn it back on', null],
]

export function KitchenBoard({ initial, items: initialItems, userEmail }: { initial: BoardData; items: Item[]; userEmail: string }) {
  const [orders, setOrders] = useState(initial.orders)
  const [completed, setCompleted] = useState(initial.completed)
  const [paused, setPaused] = useState(initial.paused)
  const [items, setItems] = useState(initialItems)
  const [offset, setOffset] = useState(() => new Date(initial.now).getTime() - Date.now())
  const [, setTick] = useState(0)
  const [offline, setOffline] = useState(false)
  const [sound, setSound] = useState(true)
  const [flash, setFlash] = useState(0)
  const [toast, setToast] = useState<UndoToast | null>(null)
  const [alert, setAlert] = useState<string | null>(null)
  const [cancelFor, setCancelFor] = useState<number | null>(null)
  const [pauseOpen, setPauseOpen] = useState(false)
  const [itemsOpen, setItemsOpen] = useState(false)
  const [showDone, setShowDone] = useState(false)
  const audio = useRef<AudioContext | null>(null)
  const soundRef = useRef(sound)
  soundRef.current = sound

  const serverNow = () => Date.now() + offset

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/kitchen/orders?status=new,accepted,ready&completed=1', { cache: 'no-store' })
      if (res.status === 401) {
        window.location.assign('/kitchen/login')
        return
      }
      if (!res.ok) throw new Error(String(res.status))
      const data = (await res.json()) as BoardData
      setOrders(data.orders)
      setCompleted(data.completed ?? [])
      setPaused(data.paused)
      setOffset(new Date(data.now).getTime() - Date.now())
      setOffline(false)
    } catch {
      setOffline(true)
    }
  }, [])

  const chime = useCallback(() => {
    setFlash((f) => f + 1)
    if (soundRef.current && audio.current) {
      const ctx = audio.current
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.frequency.value = 880
      gain.gain.setValueAtTime(0.2, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)
      osc.connect(gain).connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.6)
    }
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try {
        new Notification('New online order')
      } catch {}
    }
  }, [])

  // ARCH-005: SSE with polling fallback
  useEffect(() => {
    let es: EventSource | null = null
    try {
      es = new EventSource('/api/kitchen/stream')
      es.addEventListener('order.created', () => {
        chime()
        void refresh()
      })
      es.addEventListener('order.updated', () => void refresh())
      es.addEventListener('settings.updated', () => void refresh())
      es.onopen = () => void refresh()
      es.onerror = () => {
        if (!navigator.onLine) setOffline(true)
      }
    } catch {}
    const poll = setInterval(() => void refresh(), 5000)
    const tick = setInterval(() => setTick((t) => t + 1), 20_000)
    const onOffline = () => setOffline(true)
    const onOnline = () => void refresh()
    window.addEventListener('offline', onOffline)
    window.addEventListener('online', onOnline)
    // Unlock audio on first interaction (KDS-015)
    const unlock = () => {
      if (!audio.current && typeof AudioContext !== 'undefined') audio.current = new AudioContext()
      void audio.current?.resume()
    }
    window.addEventListener('pointerdown', unlock, { once: true })
    return () => {
      es?.close()
      clearInterval(poll)
      clearInterval(tick)
      window.removeEventListener('offline', onOffline)
      window.removeEventListener('online', onOnline)
      window.removeEventListener('pointerdown', unlock)
    }
  }, [refresh, chime])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast((cur) => (cur?.id === toast.id ? null : cur)), 5000)
    return () => clearTimeout(t)
  }, [toast])

  async function post(url: string, body: unknown, method = 'POST') {
    setAlert(null)
    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: method === 'DELETE' ? undefined : JSON.stringify(body) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setAlert(data?.error?.message ?? 'That change was not saved.')
        return null
      }
      return data
    } catch {
      setOffline(true)
      setAlert("Not saved — you're offline. Try again when the connection is back.")
      return null
    }
  }

  async function setStatus(t: Ticket, status: string, cancelReason?: string, isUndo = false) {
    const ok = await post(`/api/kitchen/orders/${t.number}/status`, { status, cancelReason })
    if (!ok) return
    await refresh()
    if (!isUndo) {
      const verb = { accepted: 'Accepted', ready: 'Marked ready', completed: 'Picked up', cancelled: 'Cancelled' }[status] ?? status
      setToast({ id: Date.now(), message: `${verb} #${t.number}`, number: t.number, previous: t.status })
    } else setToast(null)
  }

  async function undo() {
    if (!toast) return
    const ok = await post(`/api/kitchen/orders/${toast.number}/status`, { status: toast.previous })
    setToast(null)
    if (ok) await refresh()
  }

  const nowMs = serverNow()
  const later = (t: Ticket) => t.pickupMode === 'scheduled' && new Date(t.promisedAt).getTime() - nowMs > 45 * 60000
  const byTime = (a: Ticket, b: Ticket) => new Date(a.promisedAt).getTime() - new Date(b.promisedAt).getTime()
  const newOrders = orders.filter((o) => o.status === 'new').sort((a, b) => Number(later(a)) - Number(later(b)) || byTime(a, b))
  const columns: [string, string, Ticket[]][] = [
    ['new', 'New', newOrders],
    ['in-progress', 'In progress', orders.filter((o) => o.status === 'accepted').sort(byTime)],
    ['ready', 'Ready', orders.filter((o) => o.status === 'ready').sort(byTime)],
  ]
  const cancelTicket = orders.find((o) => o.number === cancelFor) ?? null

  return (
    <main id="main" className="min-h-screen p-3 md:p-5">
      <header className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="mr-auto text-3xl font-bold uppercase">Kitchen display</h1>
        <SwitchButton
          label="Pause online ordering"
          checked={paused}
          onClick={async () => {
            if (!paused) setPauseOpen(true)
            else if (await post('/api/kitchen/pause', null, 'DELETE')) {
              setPaused(false)
              void refresh()
            }
          }}
        />
        <SwitchButton label="Sound" checked={sound} onClick={() => setSound((s) => !s)} />
        <button type="button" className="btn btn-secondary" onClick={() => setItemsOpen(true)}>
          86 items
        </button>
        <span className="text-sm text-cream/70">{userEmail}</span>
      </header>

      {offline && (
        <p data-testid="kds-offline" role="status" className="mb-3 rounded-md bg-gold px-4 py-2 font-bold text-charcoal">
          Reconnecting…
        </p>
      )}
      {paused && <p className="mb-3 rounded-md bg-red px-4 py-2 font-bold text-white">Online ordering is paused</p>}
      {alert && (
        <p role="alert" className="mb-3 rounded-md border-2 border-gold px-4 py-2 font-semibold">
          {alert}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {columns.map(([key, title, list]) => (
          <section key={key} data-testid={`kds-column-${key}`} aria-labelledby={`col-${key}`} className="rounded-xl bg-white/5 p-3">
            <h2 id={`col-${key}`} key={key === 'new' ? `f${flash}` : key} className={`mb-3 rounded px-2 text-2xl font-bold uppercase ${key === 'new' && flash ? 'flash' : ''}`}>
              {title} <span data-testid="kds-count">{list.length}</span>
            </h2>
            <div className="space-y-3">
              {list.map((t) => (
                <TicketCard
                  key={t.number}
                  t={t}
                  nowMs={nowMs}
                  later={key === 'new' && later(t)}
                  onStatus={(s) => void setStatus(t, s)}
                  onCancel={() => setCancelFor(t.number)}
                  onDelay={async (m) => {
                    if (await post(`/api/kitchen/orders/${t.number}/delay`, { minutes: m })) void refresh()
                  }}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      <section data-testid="kds-completed" aria-label="Today's completed" className="mt-6 rounded-xl bg-white/5 p-3">
        <button type="button" className="btn btn-ghost" aria-expanded={showDone} onClick={() => setShowDone((s) => !s)}>
          Today&apos;s completed ({completed.length})
        </button>
        {showDone && (
          <ul className="mt-2 grid gap-1 md:grid-cols-3">
            {completed.map((t) => (
              <li key={t.number}>
                #{t.number} · {t.customerName} · {formatTime(t.statusChangedAt)}
              </li>
            ))}
          </ul>
        )}
      </section>

      {toast && (
        <div data-testid="toast" aria-live="polite" className="fixed inset-x-0 bottom-4 z-50 mx-auto flex w-fit items-center gap-3 rounded-lg bg-cream px-4 py-2 text-charcoal shadow-lg">
          <span>{toast.message}</span>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => void undo()}>
            Undo
          </button>
        </div>
      )}

      {cancelTicket && (
        <CancelDialog
          ticket={cancelTicket}
          onClose={() => setCancelFor(null)}
          onConfirm={async (reason) => {
            setCancelFor(null)
            await setStatus(cancelTicket, 'cancelled', reason)
          }}
        />
      )}
      {pauseOpen && (
        <PauseDialog
          onClose={() => setPauseOpen(false)}
          onPause={async (minutes) => {
            setPauseOpen(false)
            if (await post('/api/kitchen/pause', { minutes })) {
              setPaused(true)
              void refresh()
            }
          }}
        />
      )}
      {itemsOpen && (
        <ItemsDialog
          items={items}
          onClose={() => setItemsOpen(false)}
          onToggle={async (slug, available) => {
            setItems((cur) => cur.map((i) => (i.slug === slug ? { ...i, available } : i)))
            const ok = await post(`/api/kitchen/items/${slug}/availability`, { available })
            if (!ok) setItems((cur) => cur.map((i) => (i.slug === slug ? { ...i, available: !available } : i)))
          }}
        />
      )}
    </main>
  )
}

function SwitchButton({ label, checked, onClick }: { label: string; checked: boolean; onClick: () => void }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={onClick} className="btn btn-secondary gap-3">
      <span>{label}</span>
      <span aria-hidden="true" className={`relative inline-block h-6 w-11 rounded-full ${checked ? 'bg-red' : 'bg-muted'}`}>
        <span className={`absolute top-0.5 size-5 rounded-full bg-white ${checked ? 'left-5' : 'left-0.5'}`} />
      </span>
    </button>
  )
}

function TicketCard({
  t,
  nowMs,
  later,
  onStatus,
  onCancel,
  onDelay,
}: {
  t: Ticket
  nowMs: number
  later: boolean
  onStatus: (s: string) => void
  onCancel: () => void
  onDelay: (m: number) => void
}) {
  const age = Math.max(0, Math.floor((nowMs - new Date(t.placedAt).getTime()) / 60000))
  const late = (t.status === 'new' || t.status === 'accepted') && new Date(t.promisedAt).getTime() < nowMs
  return (
    <article data-testid={`kds-ticket-${t.number}`} className={`rounded-lg bg-cream p-3 text-charcoal ${later ? 'opacity-60' : ''} ${late ? 'ring-4 ring-red' : ''}`}>
      <div className="flex flex-wrap items-center gap-2">
        <strong className="font-display text-3xl">#{t.number}</strong>
        {late && (
          <span data-testid="ticket-late" className="badge badge-red">
            LATE
          </span>
        )}
        {later && <span className="badge badge-dark">Later</span>}
        <span data-testid="ticket-age" className="ml-auto text-sm font-semibold">
          {age} min
        </span>
      </div>
      <p className="text-lg font-bold">
        {t.pickupMode === 'asap' ? 'ASAP' : 'Scheduled'} · {formatTime(t.promisedAt)}
      </p>
      <p>
        {t.customerName} ·{' '}
        <a href={telHref(t.phone)} className="underline">
          {t.phone}
        </a>
      </p>
      <ul className="my-2 space-y-1.5 border-y border-cream-dark py-2">
        {t.lines.map((l, i) => (
          <li key={i}>
            <p className="text-lg font-bold">
              {l.quantity} × {l.itemName}
              {l.variantLabel ? ` (${l.variantLabel})` : ''}
            </p>
            {l.modifiers.length > 0 && (
              <ul className="pl-4 text-base">
                {l.modifiers.map((m) => (
                  <li key={m.label}>{m.label}</li>
                ))}
              </ul>
            )}
            {l.notes && <p className="mt-0.5 rounded bg-gold px-2 font-semibold">{l.notes}</p>}
          </li>
        ))}
      </ul>
      {t.orderNotes && <p className="mb-2 rounded bg-gold/60 px-2 font-semibold">Note: {t.orderNotes}</p>}
      <p className="font-bold">{t.paymentMethod === 'cash' ? `CASH — collect ${formatCents(t.totalCents)}` : `CARD at pickup — ${formatCents(t.totalCents)}`}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {t.status === 'new' && (
          <button type="button" className="btn btn-primary" onClick={() => onStatus('accepted')}>
            Accept
          </button>
        )}
        {t.status === 'accepted' && (
          <button type="button" className="btn btn-primary" onClick={() => onStatus('ready')}>
            Mark ready
          </button>
        )}
        {t.status === 'ready' && (
          <button type="button" className="btn btn-primary" onClick={() => onStatus('completed')}>
            Picked up
          </button>
        )}
        {(t.status === 'new' || t.status === 'accepted') && (
          <>
            <button type="button" className="btn btn-secondary" onClick={() => onDelay(5)}>
              +5 min
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => onDelay(10)}>
              +10 min
            </button>
            <button type="button" className="btn btn-ghost underline" onClick={onCancel}>
              Cancel order
            </button>
          </>
        )}
        <a href={`/kitchen/ticket/${t.number}`} target="_blank" rel="noopener" className="btn btn-ghost underline">
          Print ticket
        </a>
      </div>
    </article>
  )
}

function CancelDialog({ ticket, onClose, onConfirm }: { ticket: Ticket; onClose: () => void; onConfirm: (reason: string) => void }) {
  const ref = useModal(true, onClose)
  const [reason, setReason] = useState(CANCEL_REASONS[0])
  return (
    <dialog ref={ref} className="sheet" aria-labelledby="cancel-title" aria-modal="true">
      <div className="space-y-4 p-5">
        <h2 id="cancel-title" className="text-2xl font-bold uppercase">
          Cancel order #{ticket.number}
        </h2>
        <div>
          <label htmlFor="cancel-reason" className="field-label">
            Reason
          </label>
          <select id="cancel-reason" className="input" value={reason} onChange={(e) => setReason(e.target.value)}>
            {CANCEL_REASONS.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button type="button" className="btn btn-primary" onClick={() => onConfirm(reason)}>
            Confirm cancel
          </button>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Keep order
          </button>
        </div>
      </div>
    </dialog>
  )
}

function PauseDialog({ onClose, onPause }: { onClose: () => void; onPause: (minutes: number | null) => void }) {
  const ref = useModal(true, onClose)
  const [choice, setChoice] = useState(1)
  return (
    <dialog ref={ref} className="sheet" aria-labelledby="pause-title" aria-modal="true">
      <div className="space-y-4 p-5">
        <h2 id="pause-title" className="text-2xl font-bold uppercase">
          Pause online ordering
        </h2>
        <fieldset className="space-y-2">
          <legend className="mb-1 font-bold">For how long?</legend>
          {PAUSE_OPTIONS.map(([label], i) => (
            <label key={label} className="flex min-h-11 items-center gap-3">
              <input type="radio" name="pause" className="size-5 accent-red" checked={choice === i} onChange={() => setChoice(i)} />
              <span>{label}</span>
            </label>
          ))}
        </fieldset>
        <div className="flex gap-2">
          <button type="button" className="btn btn-primary" onClick={() => onPause(PAUSE_OPTIONS[choice][1])}>
            Pause
          </button>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Never mind
          </button>
        </div>
      </div>
    </dialog>
  )
}

function ItemsDialog({ items, onClose, onToggle }: { items: Item[]; onClose: () => void; onToggle: (slug: string, available: boolean) => void }) {
  const ref = useModal(true, onClose)
  return (
    <dialog ref={ref} className="sheet" aria-labelledby="items-title" aria-modal="true">
      <div className="flex max-h-[inherit] flex-col">
        <div className="flex items-center justify-between border-b border-cream-dark p-4">
          <h2 id="items-title" className="text-2xl font-bold uppercase">
            Item availability
          </h2>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Done
          </button>
        </div>
        <ul className="divide-y divide-cream-dark overflow-y-auto">
          {items.map((i) => (
            <li key={i.slug} className="flex items-center justify-between gap-3 px-4 py-2">
              <span className={i.available ? '' : 'text-muted line-through'}>{i.name}</span>
              <button
                type="button"
                role="switch"
                aria-checked={i.available}
                aria-label={i.name}
                onClick={() => onToggle(i.slug, !i.available)}
                className={`btn btn-sm min-w-24 ${i.available ? 'btn-secondary' : 'btn-primary'}`}
              >
                {i.available ? 'Available' : "86'd"}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </dialog>
  )
}
