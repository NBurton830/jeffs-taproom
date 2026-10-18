import { lineUnitCents } from './pricing'
import type { MenuItem, PublicMenu } from './types'

export type CartModifier = { group: string; option: string; priceDeltaCents: number }
export type CartLine = {
  id: string
  itemSlug: string
  name: string
  variantLabel: string
  quantity: number
  modifiers: CartModifier[]
  notes: string
  unitPriceCents: number
}
export type LineFlag = { kind: 'sold_out' } | { kind: 'price_updated'; unitPriceCents: number }

export const CART_KEY = 'jt-cart-v1'
export const CUSTOMER_KEY = 'jt-customer-v1'
export const MAX_QTY = 20

export const lineTotal = (l: CartLine) => l.unitPriceCents * l.quantity
export const subtotal = (lines: CartLine[]) => lines.reduce((a, l) => a + lineTotal(l), 0)
export const itemCount = (lines: CartLine[]) => lines.reduce((a, l) => a + l.quantity, 0)

/** ORD-011: identical configuration = same item, variant, modifiers and notes. */
export function configKey(l: Pick<CartLine, 'itemSlug' | 'variantLabel' | 'modifiers' | 'notes'>) {
  const mods = l.modifiers.map((m) => `${m.group}:${m.option}`).sort().join('|')
  return `${l.itemSlug}#${l.variantLabel}#${mods}#${l.notes.trim()}`
}

export function findItem(menu: PublicMenu, slug: string): MenuItem | undefined {
  for (const c of menu.categories) for (const i of c.items) if (i.slug === slug) return i
  return undefined
}

/** ORD-025: revalidate a line against the live menu. */
export function checkLine(line: CartLine, menu: PublicMenu): LineFlag | null {
  const item = findItem(menu, line.itemSlug)
  if (!item || !item.available || !item.onlineOrderable) return { kind: 'sold_out' }
  const variant = item.variants.find((v) => v.label === line.variantLabel)
  if (!variant || variant.priceCents === null) return { kind: 'sold_out' }
  const deltas: number[] = []
  for (const m of line.modifiers) {
    const opt = item.modifierGroups.find((g) => g.key === m.group)?.options.find((o) => o.label === m.option)
    if (!opt) return { kind: 'sold_out' }
    deltas.push(opt.priceDeltaCents)
  }
  const unit = lineUnitCents(variant.priceCents, deltas)
  return unit !== line.unitPriceCents ? { kind: 'price_updated', unitPriceCents: unit } : null
}

export function loadCart(): CartLine[] {
  try {
    const raw = localStorage.getItem(CART_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    return Array.isArray(parsed?.lines) ? parsed.lines : []
  } catch {
    return []
  }
}

export function saveCart(lines: CartLine[]) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify({ v: 1, lines }))
  } catch {
    /* storage unavailable */
  }
}

export const newId = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : String(Math.random()).slice(2))
