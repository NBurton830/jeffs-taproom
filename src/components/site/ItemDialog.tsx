'use client'

import { useId, useMemo, useRef, useState } from 'react'
import type { CartLine, CartModifier } from '@/lib/cart'
import { formatCents, PHONE_DISPLAY } from '@/lib/money'
import { lineUnitCents } from '@/lib/pricing'
import type { MenuGroup, MenuItem } from '@/lib/types'
import { useCart } from './CartProvider'
import { useModal } from './useModal'

// specs/13-ordering-cart.md ORD-001..011

const WING_ITEMS = ['bone-in-wings', 'boneless-wings', 'eastern-shore-wing-combo']

const effectiveMax = (g: MenuGroup, variantLabel: string) => g.maxSelectByVariant?.[variantLabel] ?? g.maxSelect

function initialSelections(item: MenuItem, edit?: CartLine): Record<string, string[]> {
  const sel: Record<string, string[]> = {}
  for (const g of item.modifierGroups) {
    sel[g.key] = edit ? edit.modifiers.filter((m) => m.group === g.key).map((m) => m.option) : g.options.filter((o) => o.default).map((o) => o.label)
  }
  return sel
}

export function ItemDialog({
  item,
  editLine,
  returnFocus,
  onClose,
}: {
  item: MenuItem
  editLine?: CartLine
  returnFocus?: HTMLElement | null
  onClose: () => void
}) {
  const cart = useCart()
  const uid = useId()
  const firstPriced = Math.max(0, item.variants.findIndex((v) => v.priceCents !== null))
  const [variantIdx, setVariantIdx] = useState(() => {
    const i = editLine ? item.variants.findIndex((v) => v.label === editLine.variantLabel) : -1
    return i >= 0 ? i : firstPriced
  })
  const [sel, setSel] = useState(() => initialSelections(item, editLine))
  const [qty, setQty] = useState(editLine?.quantity ?? 1)
  const [notes, setNotes] = useState(editLine?.notes ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const groupRefs = useRef<Record<string, HTMLFieldSetElement | null>>({})
  const closeBtn = useRef<HTMLButtonElement>(null)
  const ref = useModal(true, onClose, { initialFocus: () => closeBtn.current, returnFocus })

  const variant = item.variants[variantIdx]
  const multiVariant = item.variants.length > 1
  const mods: CartModifier[] = useMemo(
    () =>
      item.modifierGroups.flatMap((g) =>
        (sel[g.key] ?? []).map((label) => ({ group: g.key, option: label, priceDeltaCents: g.options.find((o) => o.label === label)?.priceDeltaCents ?? 0 })),
      ),
    [item, sel],
  )
  const unit = lineUnitCents(variant?.priceCents ?? 0, mods.map((m) => m.priceDeltaCents))
  const total = unit * qty

  const chooseVariant = (i: number) => {
    setVariantIdx(i)
    const label = item.variants[i].label
    // ORD-005: trim selections that exceed the new variant's limit
    setSel((cur) => {
      const next = { ...cur }
      for (const g of item.modifierGroups) {
        const max = effectiveMax(g, label)
        if ((next[g.key]?.length ?? 0) > max) next[g.key] = next[g.key].slice(0, max)
      }
      return next
    })
  }

  const toggle = (g: MenuGroup, label: string, checked: boolean, single: boolean) => {
    setErrors((e) => ({ ...e, [g.key]: '' }))
    setSel((cur) => {
      if (single) return { ...cur, [g.key]: label ? [label] : [] }
      const list = cur[g.key] ?? []
      return { ...cur, [g.key]: checked ? [...list.filter((l) => l !== label), label] : list.filter((l) => l !== label) }
    })
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const errs: Record<string, string> = {}
    for (const g of item.modifierGroups) if ((sel[g.key]?.length ?? 0) < g.minSelect) errs[g.key] = `Please choose a ${g.name}`
    setErrors(errs)
    const firstBad = item.modifierGroups.find((g) => errs[g.key])
    if (firstBad) {
      groupRefs.current[firstBad.key]?.focus()
      return
    }
    if (!variant || variant.priceCents === null) return
    const line = {
      itemSlug: item.slug,
      name: item.name,
      variantLabel: variant.label,
      quantity: qty,
      modifiers: mods,
      notes: notes.trim(),
      unitPriceCents: unit,
    }
    if (editLine) {
      cart.replaceLine(editLine.id, line)
      cart.announce(`Updated ${item.name}`)
    } else {
      cart.addLine(line)
      const msg = `Added ${qty} × ${item.name} to your order`
      cart.announce(msg)
      cart.toast(msg, { label: 'View order', onClick: () => cart.openCart() })
    }
    onClose()
  }

  const hasUnpricedMkt = item.variants.some((v) => v.priceCents === null)

  return (
    <dialog ref={ref} className="sheet" aria-labelledby={`${uid}-title`} aria-modal="true">
      <form onSubmit={submit} noValidate className="flex max-h-[inherit] flex-col">
        <div className="flex items-start justify-between gap-3 border-b border-cream-dark px-5 pt-4 pb-3">
          <div>
            <h2 id={`${uid}-title`} className="text-2xl font-bold uppercase">
              {item.name}
            </h2>
            {item.description && <p className="mt-1 text-sm text-muted">{item.description}</p>}
          </div>
          <button ref={closeBtn} type="button" className="btn btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
          {hasUnpricedMkt && <p className="rounded-md bg-cream p-3 text-sm">Call {PHONE_DISPLAY} for today&apos;s price.</p>}

          {multiVariant && (
            <fieldset>
              <legend className="mb-2 font-bold">{WING_ITEMS.includes(item.slug) ? 'How many?' : 'Size'}</legend>
              <div className="grid gap-2">
                {item.variants.map((v, i) => (
                  <label key={v.label} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md border border-cream-dark px-3 has-[:disabled]:opacity-60">
                    <input
                      type="radio"
                      name={`${uid}-variant`}
                      checked={i === variantIdx}
                      disabled={v.priceCents === null}
                      onChange={() => chooseVariant(i)}
                      className="size-5 accent-red"
                    />
                    <span>
                      {v.label} — {v.priceCents === null ? 'MKT' : formatCents(v.priceCents)}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {item.modifierGroups.map((g) => {
            const max = effectiveMax(g, variant?.label ?? '')
            const single = max === 1
            const chosen = sel[g.key] ?? []
            const required = g.minSelect > 0
            const err = errors[g.key]
            return (
              <fieldset
                key={g.key}
                ref={(el) => {
                  groupRefs.current[g.key] = el
                }}
                tabIndex={-1}
                aria-describedby={err ? `${uid}-${g.key}-err` : undefined}
              >
                <legend className="mb-2 flex flex-wrap items-baseline gap-2">
                  <span className="font-bold">{g.name}</span>
                  <span className={`badge ${required ? 'badge-dark' : ''}`}>{required ? 'Required' : 'Optional'}</span>
                  {max > 1 && <span className="text-sm text-muted">Choose up to {max}</span>}
                </legend>
                {err && (
                  <p id={`${uid}-${g.key}-err`} role="alert" className="field-error mb-2">
                    {err}
                  </p>
                )}
                <div className="grid gap-2 sm:grid-cols-2">
                  {single && !required && (
                    <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md border border-cream-dark px-3">
                      <input type="radio" name={`${uid}-${g.key}`} checked={chosen.length === 0} onChange={() => toggle(g, '', true, true)} className="size-5 accent-red" />
                      <span>None</span>
                    </label>
                  )}
                  {g.options.map((o) => {
                    const checked = chosen.includes(o.label)
                    const label = o.priceDeltaCents ? `${o.label} (+${formatCents(o.priceDeltaCents)})` : o.label
                    return (
                      <label key={o.label} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md border border-cream-dark px-3 has-[:disabled]:opacity-50">
                        <input
                          type={single ? 'radio' : 'checkbox'}
                          name={`${uid}-${g.key}`}
                          checked={checked}
                          disabled={!single && !checked && chosen.length >= max}
                          onChange={(e) => toggle(g, o.label, e.target.checked, single)}
                          className="size-5 accent-red"
                        />
                        <span>{label}</span>
                      </label>
                    )
                  })}
                </div>
              </fieldset>
            )
          })}

          <div>
            <label htmlFor={`${uid}-qty`} className="field-label">
              Quantity
            </label>
            <div className="flex items-center gap-2">
              <button type="button" className="btn btn-secondary" disabled={qty <= 1} onClick={() => setQty((q) => Math.max(1, q - 1))}>
                <span aria-hidden="true">−</span>
                <span className="sr-only">Decrease quantity</span>
              </button>
              <input
                id={`${uid}-qty`}
                className="input w-16 text-center"
                inputMode="numeric"
                value={qty}
                onChange={(e) => {
                  const n = parseInt(e.target.value, 10)
                  if (!isNaN(n)) setQty(Math.max(1, Math.min(20, n)))
                }}
              />
              <button type="button" className="btn btn-secondary" disabled={qty >= 20} onClick={() => setQty((q) => Math.min(20, q + 1))}>
                <span aria-hidden="true">+</span>
                <span className="sr-only">Increase quantity</span>
              </button>
            </div>
          </div>

          <div>
            <label htmlFor={`${uid}-notes`} className="field-label">
              Special instructions (optional)
            </label>
            <textarea
              id={`${uid}-notes`}
              className="input min-h-20"
              maxLength={140}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              aria-describedby={`${uid}-notes-help`}
            />
            <div className="mt-1 flex justify-between gap-2">
              <p id={`${uid}-notes-help`} className="field-hint">
                No substitutions beyond the options above may be possible.
              </p>
              <span data-testid="notes-counter" className="field-hint shrink-0">
                {notes.length}/140
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-cream-dark px-5 py-3">
          <button type="submit" className="btn btn-primary w-full text-lg">
            {editLine ? 'Update order' : 'Add to order'} · {formatCents(total)}
          </button>
        </div>
      </form>
    </dialog>
  )
}
