'use client'

import Link from 'next/link'
import { useState } from 'react'

export type EventCard = { slug: string; title: string; when: string; category: string; categoryLabel: string; description: string }

const CHIPS = [
  ['trivia', 'Trivia'],
  ['music', 'Live Music'],
  ['sports', 'Sports'],
  ['party', 'Party'],
] as const

// EVT-001, EVT-004
export function EventList({ events }: { events: EventCard[] }) {
  const [chips, setChips] = useState<string[]>([])
  return (
    <>
      <div role="group" aria-label="Filter events" className="mb-6 flex flex-wrap gap-2">
        {CHIPS.map(([key, label]) => {
          const on = chips.includes(key)
          return (
            <button
              key={key}
              type="button"
              aria-pressed={on}
              className={`btn btn-sm rounded-full border-charcoal ${on ? 'bg-charcoal text-cream' : 'bg-white text-charcoal'}`}
              onClick={() => setChips((c) => (on ? c.filter((x) => x !== key) : [...c, key]))}
            >
              {label}
            </button>
          )
        })}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {events.map((e) => (
          <article key={e.slug} data-testid={`event-${e.slug}`} hidden={chips.length > 0 && !chips.includes(e.category)} className="card p-5">
            <span className="badge">{e.categoryLabel}</span>
            <h2 className="mt-2 text-2xl font-bold">
              <Link href={`/events/${e.slug}`}>{e.title}</Link>
            </h2>
            <p className="font-semibold text-red-dark">{e.when}</p>
            {e.description && <p className="mt-2 text-muted">{e.description}</p>}
          </article>
        ))}
      </div>
    </>
  )
}
