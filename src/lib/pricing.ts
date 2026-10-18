import { roundHalfUp } from './money'
import type { PaymentMethod, TipInput } from './types'

// specs/14-checkout.md — single source of truth for price math (client and server).

export function lineUnitCents(variantPriceCents: number, deltas: number[]) {
  return variantPriceCents + deltas.reduce((a, b) => a + b, 0)
}

export type Totals = {
  subtotalCents: number
  cashDiscountCents: number
  taxCents: number
  tipCents: number
  totalCents: number
}

export function tipCents(subtotalCents: number, tip: TipInput) {
  if (tip.type === 'percent') return roundHalfUp((subtotalCents * tip.value) / 100)
  if (tip.type === 'amount') return Math.max(0, Math.round(tip.cents))
  return 0
}

export function computeTotals(args: {
  subtotalCents: number
  paymentMethod: PaymentMethod
  tip: TipInput
  cashDiscountPercent: number
  taxRatePercent: number
}): Totals {
  const { subtotalCents, paymentMethod, tip, cashDiscountPercent, taxRatePercent } = args
  const cashDiscountCents = paymentMethod === 'cash' ? roundHalfUp((subtotalCents * cashDiscountPercent) / 100) : 0
  const taxCents = taxRatePercent > 0 ? roundHalfUp(((subtotalCents - cashDiscountCents) * taxRatePercent) / 100) : 0
  const tip$ = tipCents(subtotalCents, tip)
  return {
    subtotalCents,
    cashDiscountCents,
    taxCents,
    tipCents: tip$,
    totalCents: subtotalCents - cashDiscountCents + taxCents + tip$,
  }
}
