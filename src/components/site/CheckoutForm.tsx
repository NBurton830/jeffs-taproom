'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { CUSTOMER_KEY, lineTotal, newId, subtotal as cartSubtotal } from '@/lib/cart'
import { formatCents, normalizePhone } from '@/lib/money'
import { computeTotals } from '@/lib/pricing'
import { formatTime } from '@/lib/time'
import type { OrderingStatus, PaymentMethod, TipInput } from '@/lib/types'
import { useCart, type ClientSettings } from './CartProvider'

// specs/14-checkout.md

type Field = 'name' | 'phone' | 'email' | 'notes' | 'customTip'
const LABELS: Record<Field, string> = { name: 'Name', phone: 'Phone', email: 'Email', notes: 'Order notes', customTip: 'Custom tip amount' }
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const ITEM_CODES = ['ITEM_UNAVAILABLE', 'NOT_ORDERABLE', 'MARKET_PRICE', 'ITEM_NOT_FOUND', 'INVALID_MODIFIERS', 'PRICE_CHANGED']

export function CheckoutForm({ status: initialStatus, settings }: { status: OrderingStatus; settings: ClientSettings }) {
  const cart = useCart()
  const router = useRouter()
  const [status, setStatus] = useState(initialStatus)
  const [mode, setMode] = useState<'asap' | 'scheduled'>(initialStatus.state === 'open' ? 'asap' : 'scheduled')
  const [slot, setSlot] = useState(initialStatus.slots[0] ?? '')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [remember, setRemember] = useState(true)
  const [payment, setPayment] = useState<PaymentMethod>('card_at_pickup')
  const [tipChoice, setTipChoice] = useState<string>('none')
  const [customTip, setCustomTip] = useState('')
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({})
  const [showSummary, setShowSummary] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const idempotencyKey = useRef(newId())
  const summaryRef = useRef<HTMLDivElement>(null)
  const website = useRef<HTMLInputElement>(null)

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(CUSTOMER_KEY) || 'null')
      if (saved) {
        setName(saved.name ?? '')
        setPhone(saved.phone ?? '')
        setEmail(saved.email ?? '')
      }
    } catch {}
  }, [])

  useEffect(() => {
    if (!status.slots.includes(slot)) setSlot(status.slots[0] ?? '')
    if (status.state !== 'open' && mode === 'asap') setMode('scheduled')
  }, [status]) // eslint-disable-line react-hooks/exhaustive-deps

  const subtotalCents = cartSubtotal(cart.lines)
  const tip: TipInput = useMemo(() => {
    if (tipChoice === 'none') return { type: 'none' }
    if (tipChoice === 'custom') {
      const v = parseFloat(customTip.replace(/[$,]/g, ''))
      return isFinite(v) && v >= 0 && v <= 200 ? { type: 'amount', cents: Math.round(v * 100) } : { type: 'none' }
    }
    return { type: 'percent', value: Number(tipChoice) }
  }, [tipChoice, customTip])
  const totals = computeTotals({
    subtotalCents,
    paymentMethod: payment,
    tip,
    cashDiscountPercent: settings.cashDiscountPercent,
    taxRatePercent: settings.taxRatePercent,
  })

  const soldOut = cart.lines.some((l) => cart.flags[l.id]?.kind === 'sold_out')
  const blocked =
    status.state === 'closed' || status.state === 'paused' || status.state === 'disabled'
      ? status.message
      : soldOut
        ? 'Remove sold-out items to place your order.'
        : subtotalCents > settings.maxOnlineSubtotalCents
          ? `For orders over ${formatCents(settings.maxOnlineSubtotalCents).replace('.00', '')}, please call ${settings.phone}`
          : null

  function validate(field: Field, value: string): string {
    switch (field) {
      case 'name':
        return value.trim().length < 2 || value.trim().length > 60 ? 'Enter your name (2–60 characters)' : ''
      case 'phone':
        return normalizePhone(value) ? '' : 'Enter a 10-digit US phone number'
      case 'email':
        return value.trim() && !EMAIL.test(value.trim()) ? 'Enter a valid email address' : ''
      case 'notes':
        return value.length > 280 ? 'Order notes must be 280 characters or fewer' : ''
      case 'customTip': {
        if (tipChoice !== 'custom') return ''
        const v = parseFloat(value.replace(/[$,]/g, ''))
        return !isFinite(v) || v < 0 || v > 200 ? 'Enter a tip between $0 and $200' : ''
      }
    }
  }
  const check = (field: Field, value: string) => setErrors((e) => ({ ...e, [field]: validate(field, value) }))

  const fieldProps = (field: Field, id: string, hint?: boolean) => ({
    id,
    'aria-invalid': errors[field] ? (true as const) : undefined,
    'aria-describedby': [hint ? `${id}-hint` : '', errors[field] ? `${id}-err` : ''].filter(Boolean).join(' ') || undefined,
  })

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (submitting) return
    setServerError(null)
    const values: Record<Field, string> = { name, phone, email, notes, customTip }
    const next: Partial<Record<Field, string>> = {}
    for (const f of Object.keys(values) as Field[]) {
      const msg = validate(f, values[f])
      if (msg) next[f] = msg
    }
    setErrors(next)
    if (Object.keys(next).length) {
      setShowSummary(true)
      requestAnimationFrame(() => summaryRef.current?.focus())
      return
    }
    setShowSummary(false)
    if (blocked || !cart.lines.length) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idempotencyKey: idempotencyKey.current,
          lines: cart.lines.map((l) => ({
            itemSlug: l.itemSlug,
            variantLabel: l.variantLabel,
            quantity: l.quantity,
            modifiers: l.modifiers.map((m) => ({ group: m.group, option: m.option })),
            notes: l.notes,
          })),
          customer: { name: name.trim(), phone: normalizePhone(phone) ?? phone, email: email.trim() },
          pickup: mode === 'asap' ? { mode: 'asap' } : { mode: 'scheduled', slot },
          paymentMethod: payment,
          tip,
          orderNotes: notes.trim(),
          expectedTotalCents: totals.totalCents,
          website: website.current?.value ?? '',
        }),
      })
      const body = await res.json().catch(() => ({}))
      if (res.status === 201) {
        try {
          if (remember) localStorage.setItem(CUSTOMER_KEY, JSON.stringify({ name: name.trim(), phone: normalizePhone(phone) ?? phone, email: email.trim() }))
          else localStorage.removeItem(CUSTOMER_KEY)
        } catch {}
        cart.clear()
        router.push(new URL(body.statusUrl, window.location.origin).pathname)
        return
      }
      const code: string = body?.error?.code ?? ''
      setServerError(body?.error?.message || 'Something went wrong. Please try again or call us.')
      if (ITEM_CODES.includes(code)) await cart.revalidateCart()
      if (code.startsWith('ORDERING_') || code === 'INVALID_SLOT') {
        const s = await fetch('/api/ordering-status', { cache: 'no-store' }).then((r) => r.json()).catch(() => null)
        if (s) setStatus(s)
      }
      setSubmitting(false)
    } catch {
      setServerError("We couldn't reach the restaurant. Check your connection and try again.")
      setSubmitting(false)
    }
  }

  if (cart.ready && cart.lines.length === 0 && !submitting) {
    return (
      <div className="card my-6 p-8 text-center">
        <p className="mb-4 text-lg font-semibold">Your order is empty</p>
        <Link href="/order" className="btn btn-primary">
          Browse the menu
        </Link>
      </div>
    )
  }

  const presets = settings.tipPresetsPercent
  const errorList = (Object.keys(errors) as Field[]).filter((f) => errors[f])
  const ids: Record<Field, string> = { name: 'co-name', phone: 'co-phone', email: 'co-email', notes: 'co-notes', customTip: 'co-tip' }

  return (
    <form onSubmit={submit} noValidate className="lg:grid lg:grid-cols-[1fr_24rem] lg:gap-10">
      <div className="space-y-8">
        <p>
          <Link href="/order" className="font-semibold underline">
            ← Back to menu
          </Link>
        </p>

        {showSummary && errorList.length > 0 && (
          <div ref={summaryRef} role="alert" tabIndex={-1} className="rounded-lg border-2 border-red bg-white p-4">
            <h2 className="text-xl font-bold">Please fix the following</h2>
            <ul className="mt-2 list-disc pl-6">
              {errorList.map((f) => (
                <li key={f}>
                  <a
                    href={`#${ids[f]}`}
                    className="underline"
                    onClick={(e) => {
                      e.preventDefault()
                      document.getElementById(ids[f])?.focus()
                    }}
                  >
                    {LABELS[f]}: {errors[f]}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
        {serverError && (
          <div role="alert" className="rounded-lg border-2 border-red bg-white p-4 font-semibold text-red-dark">
            {serverError}
          </div>
        )}

        <section aria-labelledby="co-pickup">
          <h2 id="co-pickup" className="mb-3 text-2xl font-bold uppercase">
            <span aria-hidden="true">1 </span>Pickup time
          </h2>
          <div role="radiogroup" aria-label="Pickup time" className="space-y-2">
            <label className="flex min-h-11 items-center gap-3 rounded-md border border-cream-dark bg-white px-3 has-[:disabled]:opacity-60">
              <input
                type="radio"
                name="pickup"
                className="size-5 accent-red"
                checked={mode === 'asap'}
                disabled={status.state !== 'open'}
                onChange={() => setMode('asap')}
              />
              <span>{status.asapAt ? `ASAP — ready around ${formatTime(status.asapAt)}` : 'ASAP'}</span>
            </label>
            {status.state === 'before_open' && status.opensAt && (
              <p className="field-hint">ASAP available once we open at {formatTime(status.opensAt)}</p>
            )}
            <label className="flex min-h-11 items-center gap-3 rounded-md border border-cream-dark bg-white px-3 has-[:disabled]:opacity-60">
              <input
                type="radio"
                name="pickup"
                className="size-5 accent-red"
                checked={mode === 'scheduled'}
                disabled={!status.slots.length}
                onChange={() => setMode('scheduled')}
              />
              <span>Schedule for later</span>
            </label>
          </div>
          {mode === 'scheduled' && status.slots.length > 0 && (
            <div className="mt-3 max-w-xs">
              <label htmlFor="co-slot" className="field-label">
                Pickup time
              </label>
              <select id="co-slot" className="input" value={slot} onChange={(e) => setSlot(e.target.value)}>
                {status.slots.map((s) => (
                  <option key={s} value={s}>
                    {formatTime(s)}
                  </option>
                ))}
              </select>
            </div>
          )}
        </section>

        <section aria-labelledby="co-details" className="space-y-4">
          <h2 id="co-details" className="text-2xl font-bold uppercase">
            <span aria-hidden="true">2 </span>Your details
          </h2>
          <div>
            <label htmlFor="co-name" className="field-label">
              Name
            </label>
            <input
              {...fieldProps('name', 'co-name', true)}
              className="input"
              autoComplete="name"
              aria-required="true"
              maxLength={60}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={(e) => check('name', e.target.value)}
            />
            <p id="co-name-hint" className="field-hint">
              Required
            </p>
            {errors.name && (
              <p id="co-name-err" className="field-error">
                {errors.name}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="co-phone" className="field-label">
              Phone
            </label>
            <input
              {...fieldProps('phone', 'co-phone', true)}
              className="input"
              type="tel"
              autoComplete="tel"
              aria-required="true"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onBlur={(e) => {
                const n = normalizePhone(e.target.value)
                if (n) setPhone(n)
                check('phone', e.target.value)
              }}
            />
            <p id="co-phone-hint" className="field-hint">
              Required — we&apos;ll call only if there&apos;s a problem with your order
            </p>
            {errors.phone && (
              <p id="co-phone-err" className="field-error">
                {errors.phone}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="co-email" className="field-label">
              Email (optional)
            </label>
            <input
              {...fieldProps('email', 'co-email', true)}
              className="input"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={(e) => check('email', e.target.value)}
            />
            <p id="co-email-hint" className="field-hint">
              We&apos;ll send a receipt and let you know when it&apos;s ready.
            </p>
            {errors.email && (
              <p id="co-email-err" className="field-error">
                {errors.email}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="co-notes" className="field-label">
              Order notes (optional)
            </label>
            <textarea
              {...fieldProps('notes', 'co-notes')}
              className="input min-h-20"
              maxLength={280}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            {errors.notes && (
              <p id="co-notes-err" className="field-error">
                {errors.notes}
              </p>
            )}
          </div>
          <div className="hidden" aria-hidden="true">
            <label htmlFor="co-website">Website</label>
            <input ref={website} id="co-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
          </div>
          <label className="flex min-h-11 items-center gap-3">
            <input type="checkbox" className="size-5 accent-red" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            <span>Remember my details</span>
          </label>
        </section>

        <section aria-labelledby="co-pay" className="space-y-4">
          <h2 id="co-pay" className="text-2xl font-bold uppercase">
            <span aria-hidden="true">3 </span>Payment &amp; tip
          </h2>
          <div role="radiogroup" aria-label="Payment" className="space-y-2">
            {(
              [
                ['cash', 'Pay with cash at pickup — save 3%'],
                ['card_at_pickup', 'Pay with card at pickup'],
              ] as const
            ).map(([value, label]) => (
              <label key={value} className="flex min-h-11 items-center gap-3 rounded-md border border-cream-dark bg-white px-3">
                <input
                  type="radio"
                  name="payment"
                  value={value}
                  className="size-5 accent-red"
                  checked={payment === value}
                  onChange={() => setPayment(value)}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
          <div role="radiogroup" aria-label="Tip for the kitchen" className="space-y-2">
            <p className="font-bold" aria-hidden="true">
              Tip for the kitchen
            </p>
            <div className="flex flex-wrap gap-2">
              {presets.map((p) => {
                const value = p === 0 ? 'none' : String(p)
                const label = p === 0 ? 'No tip' : `${p}% (${formatCents(computeTotals({ subtotalCents, paymentMethod: 'card_at_pickup', tip: { type: 'percent', value: p }, cashDiscountPercent: 0, taxRatePercent: 0 }).tipCents)})`
                return (
                  <label key={value} className="flex min-h-11 items-center gap-2 rounded-md border border-cream-dark bg-white px-3">
                    <input type="radio" name="tip" className="size-5 accent-red" checked={tipChoice === value} onChange={() => setTipChoice(value)} />
                    <span>{label}</span>
                  </label>
                )
              })}
              <label className="flex min-h-11 items-center gap-2 rounded-md border border-cream-dark bg-white px-3">
                <input type="radio" name="tip" className="size-5 accent-red" checked={tipChoice === 'custom'} onChange={() => setTipChoice('custom')} />
                <span>Custom</span>
              </label>
            </div>
          </div>
          {tipChoice === 'custom' && (
            <div className="max-w-xs">
              <label htmlFor="co-tip" className="field-label">
                Custom tip amount
              </label>
              <input
                {...fieldProps('customTip', 'co-tip')}
                className="input"
                inputMode="decimal"
                value={customTip}
                onChange={(e) => setCustomTip(e.target.value)}
                onBlur={(e) => check('customTip', e.target.value)}
              />
              {errors.customTip && (
                <p id="co-tip-err" className="field-error">
                  {errors.customTip}
                </p>
              )}
            </div>
          )}
        </section>
      </div>

      <section aria-labelledby="co-review" className="mt-8 lg:mt-0">
        <div className="card sticky top-32 p-5">
          <h2 id="co-review" className="mb-3 text-2xl font-bold uppercase">
            Review
          </h2>
          <div data-testid="order-summary">
            <ul className="mb-3 divide-y divide-cream-dark">
              {cart.lines.map((l) => {
                const flag = cart.flags[l.id]
                return (
                  <li key={l.id} className="py-2 text-sm">
                    <div className="flex justify-between gap-2">
                      <span className="font-semibold">
                        {l.quantity} × {l.name}
                        {l.variantLabel ? ` (${l.variantLabel})` : ''}
                      </span>
                      <span>{formatCents(lineTotal(l))}</span>
                    </div>
                    {l.modifiers.length > 0 && <p className="text-muted">{l.modifiers.map((m) => m.option).join(', ')}</p>}
                    {l.notes && <p className="italic">&quot;{l.notes}&quot;</p>}
                    {flag?.kind === 'sold_out' && <p className="font-semibold text-red-dark">Sold out — please remove</p>}
                    {flag?.kind === 'price_updated' && <p className="font-semibold text-red-dark">Price updated to {formatCents(flag.unitPriceCents)}</p>}
                  </li>
                )
              })}
            </ul>
            <dl className="space-y-1">
              <Row label="Subtotal" id="summary-subtotal" value={formatCents(totals.subtotalCents)} />
              {payment === 'cash' && (
                <Row label={`Cash discount (${settings.cashDiscountPercent}%)`} id="summary-cash-discount" value={formatCents(-totals.cashDiscountCents)} />
              )}
              {totals.taxCents > 0 && <Row label={`Tax (${settings.taxRatePercent}%)`} id="summary-tax" value={formatCents(totals.taxCents)} />}
              <Row label="Tip" id="summary-tip" value={formatCents(totals.tipCents)} />
              <div className="flex justify-between border-t border-cream-dark pt-2 text-lg font-bold">
                <dt>Total</dt>
                <dd data-testid="summary-total">{formatCents(totals.totalCents)}</dd>
              </div>
            </dl>
          </div>
          {blocked && (
            <p data-testid="checkout-blocked-reason" className="mt-3 font-semibold text-red-dark">
              {blocked}
            </p>
          )}
          <button type="submit" className="btn btn-primary mt-4 w-full text-lg" disabled={submitting || !!blocked}>
            {submitting ? 'Placing order…' : `Place order · ${formatCents(totals.totalCents)}`}
          </button>
          <p className="mt-2 text-center text-sm text-muted">You&apos;ll pay at the bar when you pick up.</p>
        </div>
      </section>
    </form>
  )
}

function Row({ label, id, value }: { label: string; id: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt>{label}</dt>
      <dd data-testid={id}>{value}</dd>
    </div>
  )
}
