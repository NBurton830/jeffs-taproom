'use client'

import { useEffect, useState } from 'react'
import { formatTime } from '@/lib/time'

// TRK-002/003/005/006
const STEPS = [
  ['new', 'Received'],
  ['accepted', 'Accepted'],
  ['ready', 'Ready for pickup'],
  ['completed', 'Picked up'],
] as const

type Status = { status: string; promisedAt: string; cancelReason?: string }

export function OrderTracker({ publicId, initial, phone }: { publicId: string; initial: Status; phone: string }) {
  const [s, setS] = useState(initial)

  useEffect(() => {
    let stopped = false
    let timer: ReturnType<typeof setTimeout> | undefined
    const done = (st: string) => st === 'completed' || st === 'cancelled'
    if (done(initial.status)) return
    const poll = async () => {
      if (stopped) return
      if (document.visibilityState === 'visible') {
        try {
          const res = await fetch(`/api/orders/${publicId}/status`, { cache: 'no-store' })
          if (res.ok) {
            const next = (await res.json()) as Status
            setS(next)
            if (done(next.status)) return
          }
        } catch {
          /* offline: keep trying */
        }
      }
      timer = setTimeout(poll, 5000)
    }
    timer = setTimeout(poll, 5000)
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        clearTimeout(timer)
        void poll()
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      stopped = true
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [publicId, initial.status])

  if (s.status === 'cancelled') {
    return (
      <div className="rounded-lg border-2 border-red bg-white p-5" aria-live="polite">
        <p className="text-xl font-bold">This order was cancelled</p>
        {s.cancelReason && <p className="mt-1">Reason: {s.cancelReason}</p>}
        <p className="mt-2">Questions? Call {phone}</p>
      </div>
    )
  }

  const current = STEPS.findIndex(([k]) => k === s.status)
  return (
    <div className="space-y-4">
      {s.status === 'ready' && (
        <p className="on-dark rounded-lg bg-green p-5 text-xl font-bold text-white">Your order is ready! Head to the bar to pick up.</p>
      )}
      <p className="text-lg font-semibold">Ready around {formatTime(s.promisedAt)}</p>
      <div data-testid="order-status">
        <ol className="grid grid-cols-4 gap-1 text-center text-sm font-semibold">
          {STEPS.map(([key, label], i) => (
            <li
              key={key}
              aria-current={i === current ? 'step' : undefined}
              className={`rounded-md border-b-4 px-1 py-2 ${i <= current ? 'border-red text-ink' : 'border-cream-dark text-muted'} ${i === current ? 'bg-white' : ''}`}
            >
              {label}
            </li>
          ))}
        </ol>
        <p className="sr-only" aria-live="polite">
          Status: {STEPS[current]?.[1] ?? s.status}
        </p>
      </div>
    </div>
  )
}
