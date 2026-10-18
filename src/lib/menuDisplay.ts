import { formatCents, PHONE_DISPLAY } from './money'
import type { MenuItem, MenuVariant } from './types'

// MENU-004 price text: "$9.25" or "Small $4.50 | Large $6.50"
export function variantPrice(v: MenuVariant) {
  return v.priceCents === null ? 'MKT' : formatCents(v.priceCents)
}

export function priceText(item: MenuItem) {
  if (item.variants.length === 1 && !item.variants[0].label) return variantPrice(item.variants[0])
  return item.variants.map((v) => `${v.label} ${variantPrice(v)}`.trim()).join(' | ')
}

export const hasPricedVariant = (item: MenuItem) => item.variants.some((v) => v.priceCents !== null)
export const isMarketItem = (item: MenuItem) => item.variants.some((v) => v.isMarketPrice)

/** Orderable online right now (Add button shown). */
export const isOrderable = (item: MenuItem) => item.onlineOrderable && item.available && hasPricedVariant(item)

/** MENU-006 reason shown instead of the Add button (sold-out items show their own badge). */
export function unavailableReason(item: MenuItem): string | null {
  if (!item.onlineOrderable) return item.orderingNote || 'Not available online'
  if (!hasPricedVariant(item)) return `Market price — call ${PHONE_DISPLAY}`
  return null
}

export const TAG_LABEL: Record<string, string> = {
  popular: 'Popular',
  spicy: 'Spicy',
  seafood: 'Seafood',
  vegetarian: 'Vegetarian',
  new: 'New',
}

/** Case- and accent-insensitive (MENU-007) */
export const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
