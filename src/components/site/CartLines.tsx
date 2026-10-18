'use client'

import Link from 'next/link'
import { useState } from 'react'
import { lineTotal } from '@/lib/cart'
import { formatCents } from '@/lib/money'
import { useCart } from './CartProvider'

/** ORD-021..027: shared by the drawer and the desktop /order panel. */
export function CartLines({ inDrawer = false }: { inDrawer?: boolean }) {
  const cart = useCart()
  const [suggestDismissed, setSuggestDismissed] = useState(false)

  if (!cart.lines.length) {
    return (
      <div className="px-5 py-8 text-center">
        <p className="mb-4 text-lg font-semibold">Your order is empty</p>
        <Link href="/order" className="btn btn-secondary" onClick={() => inDrawer && cart.closeCart()}>
          Browse the menu
        </Link>
      </div>
    )
  }

  const hasFries = cart.lines.some((l) => /fries/i.test(l.name) || l.modifiers.some((m) => /fries/i.test(m.option)))
  const suggestions = [
    { slug: 'krinkle-cut-fries', name: 'Krinkle-Cut French Fries' },
    { slug: 'sweet-potato-fries', name: 'Sweet Potato Fries' },
  ]

  return (
    <div className="flex flex-col">
      <ul className="divide-y divide-cream-dark">
        {cart.lines.map((l) => {
          const flag = cart.flags[l.id]
          const mods = l.modifiers.map((m) => m.option).join(', ')
          return (
            <li key={l.id} data-testid="cart-line" className="px-5 py-3">
              <div className="flex justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold">
                    <span data-testid="line-quantity">{l.quantity}</span> × {l.name}
                    {l.variantLabel && <span className="font-normal text-muted"> ({l.variantLabel})</span>}
                  </p>
                  {mods && (
                    <p data-testid="line-modifiers" className="text-sm text-muted">
                      {mods}
                    </p>
                  )}
                  {l.notes && <p className="text-sm italic">&quot;{l.notes}&quot;</p>}
                  {flag?.kind === 'sold_out' && <p className="mt-1 font-semibold text-red-dark">Sold out — please remove</p>}
                  {flag?.kind === 'price_updated' && (
                    <p className="mt-1 text-sm font-semibold text-red-dark">Price updated to {formatCents(flag.unitPriceCents)}</p>
                  )}
                </div>
                <span data-testid="line-total" className="shrink-0 font-semibold">
                  {formatCents(lineTotal(l))}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button type="button" className="btn btn-secondary btn-sm" disabled={l.quantity <= 1} onClick={() => cart.setQuantity(l.id, l.quantity - 1)}>
                  <span aria-hidden="true">−</span>
                  <span className="sr-only">Decrease quantity</span>
                </button>
                <button type="button" className="btn btn-secondary btn-sm" disabled={l.quantity >= 20} onClick={() => cart.setQuantity(l.id, l.quantity + 1)}>
                  <span aria-hidden="true">+</span>
                  <span className="sr-only">Increase quantity</span>
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm underline"
                  onClick={(e) => void cart.openItemBySlug(l.itemSlug, { editLine: l, returnFocus: e.currentTarget })}
                >
                  Edit<span className="sr-only"> {l.name}</span>
                </button>
                <button type="button" className="btn btn-ghost btn-sm underline" onClick={() => cart.removeLine(l.id)}>
                  Remove<span className="sr-only"> {l.name}</span>
                </button>
              </div>
            </li>
          )
        })}
      </ul>

      {!hasFries && !suggestDismissed && (
        <section aria-labelledby={`suggest-${inDrawer ? 'd' : 'p'}`} className="mx-5 my-3 rounded-lg bg-cream p-3">
          <div className="flex items-center justify-between">
            <h3 id={`suggest-${inDrawer ? 'd' : 'p'}`} className="font-bold">
              Add a side?
            </h3>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSuggestDismissed(true)}>
              Dismiss<span className="sr-only"> side suggestions</span>
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button key={s.slug} type="button" className="btn btn-secondary btn-sm" onClick={(e) => void cart.openItemBySlug(s.slug, { returnFocus: e.currentTarget })}>
                <span aria-hidden="true">+ {s.name}</span>
                <span className="sr-only">Add {s.name}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="border-t border-cream-dark px-5 py-4">
        <div className="flex justify-between text-lg font-bold">
          <span>Subtotal</span>
          <span data-testid="cart-subtotal">{formatCents(cart.subtotalCents)}</span>
        </div>
        <p className="mb-3 text-sm text-muted">Discounts and tip at checkout</p>
        {cart.blockedReason ? (
          <>
            <p data-testid="checkout-blocked-reason" className="mb-2 font-semibold text-red-dark">
              {cart.blockedReason}
            </p>
            <button type="button" className="btn btn-primary w-full" disabled>
              Checkout
            </button>
          </>
        ) : (
          <Link href="/order/checkout" className="btn btn-primary w-full" onClick={() => inDrawer && cart.closeCart()}>
            Checkout
          </Link>
        )}
      </div>
    </div>
  )
}
