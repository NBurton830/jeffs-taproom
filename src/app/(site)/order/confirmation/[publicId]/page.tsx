import type { Metadata } from 'next'
import { DirectionsLink } from '@/components/site/DirectionsLink'
import { OrderTracker } from '@/components/site/OrderTracker'
import { ADDRESS_LINE1, ADDRESS_LINE2, formatCents, PHONE_DISPLAY, PHONE_TEL } from '@/lib/money'
import { findOrderByPublicId } from '@/lib/orders'

export const metadata: Metadata = { title: 'Your order', robots: { index: false, follow: false } } // SEO-006

export default async function ConfirmationPage({ params }: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await params
  const order = /^[A-Za-z0-9_-]{21}$/.test(publicId) ? await findOrderByPublicId(publicId) : null
  if (!order) {
    return (
      <div className="py-10">
        <h1 className="mb-3 text-4xl font-bold uppercase">Order not found</h1>
        <p className="text-lg">We couldn&apos;t find that order.</p>
        <p className="mt-2">
          Questions? Call <a href={PHONE_TEL} className="underline">{PHONE_DISPLAY}</a>
        </p>
      </div>
    )
  }
  const first = order.customer.name.trim().split(/\s+/)[0]
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_24rem]">
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold uppercase">Thanks, {first}! Your order is in.</h1>
          <p className="mt-2 text-lg">
            Order <strong data-testid="order-number">#{order.number}</strong>
          </p>
        </div>
        <OrderTracker
          publicId={order.publicId}
          phone={PHONE_DISPLAY}
          initial={{ status: order.status, promisedAt: order.pickup.promisedAt, cancelReason: order.cancelReason ?? undefined }}
        />
        <p className="text-lg">
          {order.paymentMethod === 'cash'
            ? `Pay with cash at pickup — ${formatCents(order.totalCents)} after your ${Math.round((order.cashDiscountCents / order.subtotalCents) * 100) || 3}% discount`
            : `Pay with card at pickup — ${formatCents(order.totalCents)}`}
        </p>
        <div className="card p-5">
          <h2 className="mb-1 text-xl font-bold uppercase">Pick up at</h2>
          <address className="not-italic">
            {ADDRESS_LINE1}
            <br />
            {ADDRESS_LINE2}
          </address>
          <div className="mt-3 flex flex-wrap gap-2">
            <a href={PHONE_TEL} className="btn btn-secondary">
              Call us
            </a>
            <DirectionsLink className="btn btn-secondary">Directions</DirectionsLink>
          </div>
        </div>
      </div>
      <section aria-labelledby="conf-summary" className="card h-fit p-5">
        <h2 id="conf-summary" className="mb-3 text-2xl font-bold uppercase">
          Your order
        </h2>
        <ul className="mb-3 divide-y divide-cream-dark">
          {order.lines.map((l, i) => (
            <li key={i} className="py-2 text-sm">
              <div className="flex justify-between gap-2">
                <span className="font-semibold">
                  {l.quantity} × {l.itemName}
                  {l.variantLabel ? ` (${l.variantLabel})` : ''}
                </span>
                <span>{formatCents(l.lineTotalCents)}</span>
              </div>
              {l.modifiers?.length > 0 && <p className="text-muted">{l.modifiers.map((m) => m.label).join(', ')}</p>}
              {l.notes && <p className="italic">&quot;{l.notes}&quot;</p>}
            </li>
          ))}
        </ul>
        <dl className="space-y-1">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd data-testid="summary-subtotal">{formatCents(order.subtotalCents)}</dd>
          </div>
          {order.cashDiscountCents > 0 && (
            <div className="flex justify-between">
              <dt>Cash discount</dt>
              <dd data-testid="summary-cash-discount">{formatCents(-order.cashDiscountCents)}</dd>
            </div>
          )}
          {order.taxCents > 0 && (
            <div className="flex justify-between">
              <dt>Tax</dt>
              <dd data-testid="summary-tax">{formatCents(order.taxCents)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt>Tip</dt>
            <dd data-testid="summary-tip">{formatCents(order.tipCents)}</dd>
          </div>
          <div className="flex justify-between border-t border-cream-dark pt-2 text-lg font-bold">
            <dt>Total</dt>
            <dd data-testid="summary-total">{formatCents(order.totalCents)}</dd>
          </div>
        </dl>
      </section>
    </div>
  )
}
