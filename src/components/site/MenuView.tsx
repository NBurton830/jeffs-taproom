'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { fold, isOrderable, priceText, TAG_LABEL, unavailableReason, isMarketItem, hasPricedVariant } from '@/lib/menuDisplay'
import type { MenuItem, PublicMenu } from '@/lib/types'
import { AddButton } from './AddButton'

// specs/12-menu.md
const CHIPS = [
  ['seafood', 'Seafood'],
  ['spicy', 'Spicy'],
  ['vegetarian', 'Vegetarian'],
  ['popular', 'Popular'],
] as const

export function MenuView({ menu }: { menu: PublicMenu }) {
  const [q, setQ] = useState('')
  const [chips, setChips] = useState<string[]>([])
  const [active, setActive] = useState(menu.categories[0]?.slug ?? '')
  const lockUntil = useRef(0)
  const jumpRef = useRef<HTMLElement>(null)

  const filtering = q.trim() !== '' || chips.length > 0
  const visible = useMemo(() => {
    const needle = fold(q.trim())
    const set = new Set<string>()
    for (const c of menu.categories)
      for (const i of c.items) {
        const textOk = !needle || fold(`${i.name} ${i.description}`).includes(needle)
        const chipOk = !chips.length || chips.some((t) => i.tags.includes(t))
        if (textOk && chipOk) set.add(i.slug)
      }
    return set
  }, [menu, q, chips])

  // MENU-003 scroll spy
  useEffect(() => {
    const sections = menu.categories.map((c) => document.getElementById(c.slug)).filter(Boolean) as HTMLElement[]
    const obs = new IntersectionObserver(
      (entries) => {
        if (Date.now() < lockUntil.current) return
        const top = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
        if (top) setActive(top.target.id)
      },
      { rootMargin: '-140px 0px -55% 0px' },
    )
    sections.forEach((s) => obs.observe(s))
    return () => obs.disconnect()
  }, [menu])

  // MENU-012 deep link
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1))
    if (id && menu.categories.some((c) => c.slug === id)) {
      setActive(id)
      lockUntil.current = Date.now() + 1000
      document.getElementById(id)?.scrollIntoView()
    }
  }, [menu])

  useEffect(() => {
    jumpRef.current?.querySelector('[aria-current="true"]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [active])

  const jump = (e: React.MouseEvent, slug: string) => {
    e.preventDefault()
    const heading = document.getElementById(`${slug}-heading`)
    lockUntil.current = Date.now() + 1200
    setActive(slug)
    history.replaceState(null, '', `#${slug}`)
    document.getElementById(slug)?.scrollIntoView()
    heading?.focus({ preventScroll: true })
  }

  const count = visible.size

  return (
    <div>
      <nav
        ref={jumpRef}
        aria-label="Menu categories"
        className="no-scrollbar sticky top-[5.6rem] sm:top-[3.75rem] z-30 -mx-4 overflow-x-auto border-b border-cream-dark bg-cream/95 px-4 py-2 backdrop-blur md:top-[6.5rem]"
      >
        <ul className="flex gap-2 whitespace-nowrap">
          {menu.categories.map((c) => (
            <li key={c.slug}>
              <a
                href={`#${c.slug}`}
                aria-current={active === c.slug ? 'true' : undefined}
                onClick={(e) => jump(e, c.slug)}
                className="inline-flex min-h-11 items-center rounded-full border border-charcoal px-4 font-semibold no-underline aria-[current=true]:bg-charcoal aria-[current=true]:text-cream"
              >
                {c.name}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="my-4 flex flex-col gap-3 md:flex-row md:items-end">
        <div className="md:w-80">
          <label htmlFor="menu-search" className="field-label">
            Search the menu
          </label>
          <input id="menu-search" type="search" className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Wings, crab, burger…" />
        </div>
        <div role="group" aria-label="Filter by" className="flex flex-wrap gap-2">
          {CHIPS.map(([tag, label]) => {
            const on = chips.includes(tag)
            return (
              <button
                key={tag}
                type="button"
                aria-pressed={on}
                className={`btn btn-sm rounded-full border-charcoal ${on ? 'bg-charcoal text-cream' : 'bg-white text-charcoal'}`}
                onClick={() => setChips((c) => (on ? c.filter((t) => t !== tag) : [...c, tag]))}
              >
                {label}
              </button>
            )
          })}
        </div>
        <p className="md:ml-auto" aria-live="polite">
          {filtering && <span data-testid="menu-result-count">{count === 1 ? '1 item' : `${count} items`}</span>}
        </p>
      </div>

      {filtering && count === 0 && (
        <div className="card mb-6 p-6 text-center">
          <p className="mb-3 font-semibold">No items match &quot;{q.trim() || chips.map((c) => TAG_LABEL[c]).join(', ')}&quot;</p>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setQ('')
              setChips([])
            }}
          >
            Clear
          </button>
        </div>
      )}

      {menu.categories.map((c) => {
        const items = c.items.filter((i) => visible.has(i.slug))
        return (
          <section key={c.slug} id={c.slug} aria-labelledby={`${c.slug}-heading`} hidden={items.length === 0} className="mb-10 scroll-mt-40">
            <h2 id={`${c.slug}-heading`} tabIndex={-1} className="mb-1 text-3xl font-bold text-red uppercase">
              {c.name}
            </h2>
            {c.note && (
              <p data-testid="category-note" className="mb-4 text-muted">
                {c.note}
              </p>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              {c.items.map((i) => (
                <MenuCard key={i.slug} item={i} hidden={!visible.has(i.slug)} />
              ))}
            </div>
          </section>
        )
      })}

      <div className="card space-y-1 p-4 text-sm">
        <p>Sodas: $3.00 (one refill included)</p>
        <p>3% discount applied when paying with cash.</p>
      </div>
    </div>
  )
}

export function MenuCard({ item, hidden = false, headingLevel = 3 }: { item: MenuItem; hidden?: boolean; headingLevel?: 3 }) {
  const reason = unavailableReason(item)
  const soldOut = !item.available
  const Heading = `h${headingLevel}` as 'h3'
  return (
    <article data-testid={`menu-item-${item.slug}`} hidden={hidden} className={`card flex flex-col gap-2 p-4 ${soldOut ? 'opacity-70' : ''}`}>
      {item.image && (
        <img src={item.image.url} alt={item.image.alt} width={item.image.width} height={item.image.height} loading="lazy" className="h-40 w-full rounded-md object-cover" />
      )}
      <div className="flex flex-wrap items-start justify-between gap-x-3">
        <Heading className="text-xl font-bold">{item.name}</Heading>
        <span data-testid="item-price" className="font-semibold">
          {priceText(item)}
        </span>
      </div>
      {item.description && <p className="text-muted">{item.description}</p>}
      <div className="mt-auto flex flex-wrap items-center gap-2">
        {item.tags.map((t) => (
          <span key={t} className="badge">
            {TAG_LABEL[t] ?? t}
          </span>
        ))}
        {isMarketItem(item) && hasPricedVariant(item) && <span className="badge">Market price</span>}
        {soldOut && <span className="badge badge-red">Sold out today</span>}
        {reason && (
          <span data-testid="item-unavailable-reason" className="text-sm font-semibold text-muted">
            {reason}
          </span>
        )}
        {isOrderable(item) && <AddButton item={item} className="btn btn-primary ml-auto" />}
      </div>
    </article>
  )
}
