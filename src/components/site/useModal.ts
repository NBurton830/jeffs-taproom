'use client'

import { useEffect, useRef } from 'react'

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/** WAI-ARIA modal dialog on a native <dialog>: showModal, focus trap, Escape, focus return (ORD-001, A11Y-006). */
export function useModal(open: boolean, onClose: () => void, opts: { initialFocus?: () => HTMLElement | null; returnFocus?: HTMLElement | null } = {}) {
  const ref = useRef<HTMLDialogElement>(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  const returnTo = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      returnTo.current = opts.returnFocus ?? (document.activeElement as HTMLElement | null)
      dialog.showModal()
      const target = opts.initialFocus?.() ?? dialog.querySelector<HTMLElement>(FOCUSABLE)
      target?.focus()
    } else if (!open && dialog.open) {
      dialog.close()
      const el = returnTo.current
      if (el?.isConnected) el.focus()
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    const onCancel = (e: Event) => {
      e.preventDefault()
      closeRef.current()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const items = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null || el === document.activeElement)
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement
      if (e.shiftKey && (active === first || !dialog.contains(active))) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && (active === last || !dialog.contains(active))) {
        e.preventDefault()
        first.focus()
      }
    }
    dialog.addEventListener('cancel', onCancel)
    dialog.addEventListener('keydown', onKey)
    return () => {
      dialog.removeEventListener('cancel', onCancel)
      dialog.removeEventListener('keydown', onKey)
    }
  }, [])

  // Unmount while open (e.g. the item dialog) — still restore focus
  useEffect(
    () => () => {
      const el = returnTo.current
      if (el?.isConnected) setTimeout(() => el.focus(), 0)
    },
    [],
  )

  return ref
}
