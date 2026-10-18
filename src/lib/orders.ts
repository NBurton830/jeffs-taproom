import 'server-only'
import { nanoid } from 'nanoid'
import { publish } from './bus'
import { now } from './clock'
import { loadHours, loadMenu, loadSettings } from './data'
import { canCheckout, getOrderingStatus } from './hours'
import { sendMail } from './mail'
import { formatCents, normalizePhone } from './money'
import { getPayloadClient } from './payload'
import { computeTotals, lineUnitCents } from './pricing'
import { formatTime } from './time'
import type { MenuItem, PaymentMethod, TipInput } from './types'

// specs/14-checkout.md (Order API contract), 15, 16

export type OrderError = { status: number; code: string; message: string; path?: string; totalCents?: number }
type Result<T> = { ok: true; value: T } | { ok: false; error: OrderError }

const fail = (status: number, code: string, message: string, extra: Partial<OrderError> = {}): { ok: false; error: OrderError } => ({
  ok: false,
  error: { status, code, message, ...extra },
})
const invalid = (message: string, path?: string) => fail(422, 'VALIDATION', message, { path })

export type OrderLineDoc = {
  itemSlug: string
  itemName: string
  variantLabel: string
  unitPriceCents: number
  quantity: number
  modifiers: { group: string; label: string; priceDeltaCents: number }[]
  notes: string
  lineTotalCents: number
}

export type OrderDoc = {
  id: string | number
  number: number
  publicId: string
  status: 'new' | 'accepted' | 'ready' | 'completed' | 'cancelled'
  lines: OrderLineDoc[]
  customer: { name: string; phone: string; email?: string | null }
  pickup: { mode: 'asap' | 'scheduled'; requestedAt?: string | null; promisedAt: string }
  paymentMethod: PaymentMethod
  subtotalCents: number
  cashDiscountCents: number
  taxCents: number
  tipCents: number
  totalCents: number
  orderNotes?: string | null
  cancelReason?: string | null
  placedAt: string
  statusChangedAt: string
  statusHistory: { status: string; at: string; byUser?: string | number | null }[]
}

export type CreatedOrder = { number: number; publicId: string; status: 'new'; totalCents: number; promisedAt: string; statusUrl: string }

import { siteUrl } from './seo'
export const statusUrl = (publicId: string) => `${siteUrl()}/order/confirmation/${publicId}`

type LineInput = { itemSlug?: unknown; variantLabel?: unknown; quantity?: unknown; modifiers?: unknown; notes?: unknown }

function priceLine(raw: LineInput, i: number, items: Map<string, MenuItem>): Result<OrderLineDoc> {
  const path = `lines.${i}`
  if (typeof raw !== 'object' || raw === null) return invalid('Invalid line', path)
  const slug = typeof raw.itemSlug === 'string' ? raw.itemSlug : ''
  const qty = raw.quantity === undefined ? 1 : raw.quantity
  if (!Number.isInteger(qty) || (qty as number) < 1 || (qty as number) > 20) return invalid('Quantity must be 1–20', `${path}.quantity`)
  const notes = raw.notes === undefined || raw.notes === null ? '' : raw.notes
  if (typeof notes !== 'string' || notes.length > 140) return invalid('Notes must be at most 140 characters', `${path}.notes`)

  const item = items.get(slug)
  if (!item) return fail(422, 'ITEM_NOT_FOUND', `Unknown item "${slug}"`, { path })
  if (!item.onlineOrderable) return fail(422, 'NOT_ORDERABLE', `${item.name} is ${item.orderingNote || 'not available online'}`, { path })
  if (!item.available) return fail(422, 'ITEM_UNAVAILABLE', `${item.name} is sold out today`, { path })

  const label = typeof raw.variantLabel === 'string' ? raw.variantLabel : ''
  const variant = label === '' ? item.variants[0] : item.variants.find((v) => v.label === label)
  if (!variant) return invalid(`Unknown size "${label}" for ${item.name}`, `${path}.variantLabel`)
  if (variant.priceCents === null) return fail(422, 'MARKET_PRICE', `${item.name} is market price — please call`, { path })

  const mods = raw.modifiers ?? []
  if (!Array.isArray(mods)) return fail(422, 'INVALID_MODIFIERS', 'Invalid modifiers', { path })
  const chosen: OrderLineDoc['modifiers'] = []
  const counts = new Map<string, number>()
  for (const m of mods as { group?: unknown; option?: unknown }[]) {
    const group = item.modifierGroups.find((g) => g.key === m?.group)
    if (!group) return fail(422, 'INVALID_MODIFIERS', `Option group "${String(m?.group)}" is not available for ${item.name}`, { path })
    const option = group.options.find((o) => o.label === m.option)
    if (!option) return fail(422, 'INVALID_MODIFIERS', `Unknown option "${String(m.option)}" for ${group.name}`, { path })
    if (chosen.some((c) => c.group === group.key && c.label === option.label)) {
      return fail(422, 'INVALID_MODIFIERS', `Duplicate option "${option.label}"`, { path })
    }
    chosen.push({ group: group.key, label: option.label, priceDeltaCents: option.priceDeltaCents })
    counts.set(group.key, (counts.get(group.key) ?? 0) + 1)
  }
  for (const group of item.modifierGroups) {
    let n = counts.get(group.key) ?? 0
    if (n < group.minSelect) {
      // A required group with a default (e.g. Side: Chips) falls back to its default.
      const defaults = group.options.filter((o) => o.default)
      if (defaults.length >= group.minSelect) {
        for (const d of defaults.slice(0, group.minSelect - n)) chosen.push({ group: group.key, label: d.label, priceDeltaCents: d.priceDeltaCents })
        n = group.minSelect
      } else {
        return fail(422, 'INVALID_MODIFIERS', `Please choose a ${group.name} for ${item.name}`, { path })
      }
    }
    const max = group.maxSelectByVariant[variant.label] ?? group.maxSelect
    if (n > max) return fail(422, 'INVALID_MODIFIERS', `Choose at most ${max} for ${group.name}`, { path })
  }

  const unit = lineUnitCents(variant.priceCents, chosen.map((c) => c.priceDeltaCents))
  return {
    ok: true,
    value: {
      itemSlug: item.slug,
      itemName: item.name,
      variantLabel: variant.label,
      unitPriceCents: unit,
      quantity: qty as number,
      modifiers: chosen,
      notes: notes.trim(),
      lineTotalCents: unit * (qty as number),
    },
  }
}

function parseTip(t: unknown): TipInput | null {
  if (!t || typeof t !== 'object') return { type: 'none' }
  const tip = t as { type?: unknown; value?: unknown; cents?: unknown }
  if (tip.type === 'none') return { type: 'none' }
  if (tip.type === 'percent' && typeof tip.value === 'number' && tip.value >= 0 && tip.value <= 100) return { type: 'percent', value: tip.value }
  if (tip.type === 'amount' && Number.isInteger(tip.cents) && (tip.cents as number) >= 0 && (tip.cents as number) <= 20000) {
    return { type: 'amount', cents: tip.cents as number }
  }
  return null
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function createOrder(body: Record<string, unknown>): Promise<Result<CreatedOrder>> {
  const t = now()

  // Idempotency (CHK-053)
  const key = typeof body.idempotencyKey === 'string' ? body.idempotencyKey : ''
  if (!key || key.length > 100) return invalid('idempotencyKey is required', 'idempotencyKey')
  const payload = await getPayloadClient()
  const prior = await payload.find({ collection: 'orders', overrideAccess: true, depth: 0, limit: 1, where: { idempotencyKey: { equals: key } } })
  const existing = prior.docs[0] as unknown as OrderDoc | undefined
  if (existing && new Date(existing.placedAt).getTime() > t.getTime() - 24 * 3600_000) {
    return {
      ok: true,
      value: { number: existing.number, publicId: existing.publicId, status: 'new', totalCents: existing.totalCents, promisedAt: existing.pickup.promisedAt, statusUrl: statusUrl(existing.publicId) },
    }
  }

  // Basic validation (VALIDATION)
  const c = (body.customer ?? {}) as { name?: unknown; phone?: unknown; email?: unknown }
  const name = typeof c.name === 'string' ? c.name.trim() : ''
  if (name.length < 2 || name.length > 60) return invalid('Name must be 2–60 characters', 'customer.name')
  const phone = typeof c.phone === 'string' ? normalizePhone(c.phone) : null
  if (!phone) return invalid('Enter a valid US phone number', 'customer.phone')
  const email = typeof c.email === 'string' ? c.email.trim() : ''
  if (email && !EMAIL.test(email)) return invalid('Enter a valid email', 'customer.email')
  const paymentMethod = body.paymentMethod ?? 'card_at_pickup'
  if (paymentMethod !== 'cash' && paymentMethod !== 'card_at_pickup') return invalid('Unsupported payment method', 'paymentMethod')
  const tip = parseTip(body.tip)
  if (!tip) return invalid('Invalid tip', 'tip')
  const orderNotes = typeof body.orderNotes === 'string' ? body.orderNotes.trim() : ''
  if (orderNotes.length > 280) return invalid('Order notes must be at most 280 characters', 'orderNotes')
  const lines = body.lines
  if (!Array.isArray(lines) || lines.length < 1 || lines.length > 50) return invalid('Add at least one item', 'lines')
  const pickup = (body.pickup ?? { mode: 'asap' }) as { mode?: unknown; slot?: unknown }
  if (pickup.mode !== 'asap' && pickup.mode !== 'scheduled') return invalid('Invalid pickup', 'pickup')

  // Ordering state (503)
  const [hours, settings, menu] = await Promise.all([loadHours(), loadSettings(), loadMenu()])
  const status = getOrderingStatus(hours, settings, t)
  if (status.state === 'disabled') return fail(503, 'ORDERING_DISABLED', status.message)
  if (status.state === 'paused') return fail(503, 'ORDERING_PAUSED', status.message)
  if (!canCheckout(status)) return fail(503, 'ORDERING_CLOSED', status.message)

  // Items & modifiers
  const items = new Map(menu.categories.flatMap((cat) => cat.items).map((i) => [i.slug, i]))
  const priced: OrderLineDoc[] = []
  for (const [i, raw] of lines.entries()) {
    const r = priceLine(raw as LineInput, i, items)
    if (!r.ok) return r
    priced.push(r.value)
  }

  // Pickup slot
  let promisedAt: string
  if (pickup.mode === 'asap') {
    if (!status.asapAt) return fail(422, 'INVALID_SLOT', `ASAP pickup is not available yet — please choose a pickup time.`, { path: 'pickup' })
    promisedAt = status.asapAt
  } else {
    const slot = typeof pickup.slot === 'string' ? new Date(pickup.slot) : null
    const match = slot && !isNaN(slot.getTime()) ? status.slots.find((s) => new Date(s).getTime() === slot.getTime()) : undefined
    if (!match) return fail(422, 'INVALID_SLOT', 'That pickup time is no longer available — please choose another pickup time.', { path: 'pickup.slot' })
    promisedAt = match
  }

  const subtotalCents = priced.reduce((a, l) => a + l.lineTotalCents, 0)
  if (subtotalCents > settings.maxOnlineSubtotalCents) {
    return fail(422, 'SUBTOTAL_LIMIT', `For orders over ${formatCents(settings.maxOnlineSubtotalCents).replace('.00', '')}, please call ${settings.phone}`)
  }
  const totals = computeTotals({
    subtotalCents,
    paymentMethod,
    tip,
    cashDiscountPercent: settings.cashDiscountPercent,
    taxRatePercent: settings.taxRatePercent,
  })
  if (typeof body.expectedTotalCents === 'number' && body.expectedTotalCents !== totals.totalCents) {
    return fail(409, 'PRICE_CHANGED', `Prices have changed. Your new total is ${formatCents(totals.totalCents)}.`, { totalCents: totals.totalCents })
  }

  const last = await payload.find({ collection: 'orders', overrideAccess: true, depth: 0, limit: 1, sort: '-number' })
  const number = Math.max(1000, ((last.docs[0]?.number as number) ?? 1000)) + 1
  const publicId = nanoid(21)
  const placedAt = t.toISOString()
  const data = {
    number,
    numberLabel: `#${number}`,
    publicId,
    idempotencyKey: existing ? null : key,
    status: 'new' as const,
    customerDisplay: `${name} · ${phone}`,
    pickupDisplay: `${pickup.mode === 'asap' ? 'ASAP' : 'Scheduled'} · ${formatTime(promisedAt)}`,
    lines: priced,
    customer: { name, phone, email: email || null },
    pickup: { mode: pickup.mode, requestedAt: pickup.mode === 'scheduled' ? promisedAt : null, promisedAt },
    paymentMethod,
    paymentStatus: 'unpaid' as const,
    ...totals,
    orderNotes,
    placedAt,
    statusChangedAt: placedAt,
    statusHistory: [{ status: 'new', at: placedAt, byUser: null }],
  }
  const doc = (await payload.create({ collection: 'orders', overrideAccess: true, data: data as never })) as unknown as OrderDoc

  const result: CreatedOrder = { number, publicId, status: 'new', totalCents: totals.totalCents, promisedAt, statusUrl: statusUrl(publicId) }

  publish('order.created', toTicket(doc))
  await sendOrderEmails(doc, settings.orderNotificationEmail)
  return { ok: true, value: result }
}

/** A success-looking response for bots that fill the honeypot (CHK-054). Nothing is stored. */
export function fakeOrderResponse(): CreatedOrder {
  const publicId = nanoid(21)
  return { number: 1000 + Math.floor(Math.random() * 9000), publicId, status: 'new', totalCents: 0, promisedAt: now().toISOString(), statusUrl: statusUrl(publicId) }
}

function orderText(o: OrderDoc) {
  const lines = o.lines.map((l) => {
    const mods = l.modifiers.map((m) => m.label).join(', ')
    return `${l.quantity} × ${l.itemName}${l.variantLabel ? ` (${l.variantLabel})` : ''} — ${formatCents(l.lineTotalCents)}${mods ? `\n    ${mods}` : ''}${l.notes ? `\n    "${l.notes}"` : ''}`
  })
  const pay = o.paymentMethod === 'cash' ? 'Cash at pickup' : 'Card at pickup'
  return [
    `Order #${o.number}`,
    `Pickup: ${o.pickup.mode === 'asap' ? 'ASAP' : 'Scheduled'} · ready around ${formatTime(o.pickup.promisedAt)}`,
    '',
    ...lines,
    '',
    `Subtotal: ${formatCents(o.subtotalCents)}`,
    o.cashDiscountCents ? `Cash discount: ${formatCents(-o.cashDiscountCents)}` : '',
    o.taxCents ? `Tax: ${formatCents(o.taxCents)}` : '',
    `Tip: ${formatCents(o.tipCents)}`,
    `Total: ${formatCents(o.totalCents)} (${pay})`,
    o.orderNotes ? `\nNotes: ${o.orderNotes}` : '',
  ]
    .filter((l) => l !== '')
    .join('\n')
}

async function sendOrderEmails(o: OrderDoc, notify: string | null) {
  if (notify) {
    await sendMail({
      to: notify,
      subject: `New online order #${o.number}`,
      text: `${o.customer.name} · ${o.customer.phone}\n\n${orderText(o)}\n\nKitchen display: ${siteUrl()}/kitchen`,
    })
  }
  if (o.customer.email) {
    await sendMail({
      to: o.customer.email,
      subject: `Jeff's Taproom order #${o.number}`,
      text: `Thanks, ${o.customer.name.split(' ')[0]}! We've got your order.\n\n${orderText(o)}\n\nTrack your order: ${statusUrl(o.publicId)}\n\nJeff's Taproom & Grill · 416 Market Street, Bridgeville, DE 19933 · (302) 337-8602`,
    })
  }
}

// ---------- Kitchen ----------

export function shortName(name: string) {
  const parts = name.trim().split(/\s+/)
  return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0]
}

export type Ticket = {
  number: number
  publicId: string
  status: OrderDoc['status']
  customerName: string
  phone: string
  pickupMode: 'asap' | 'scheduled'
  promisedAt: string
  placedAt: string
  statusChangedAt: string
  lines: OrderLineDoc[]
  orderNotes: string
  paymentMethod: PaymentMethod
  totalCents: number
  cancelReason: string | null
}

export function toTicket(o: OrderDoc): Ticket {
  return {
    number: o.number,
    publicId: o.publicId,
    status: o.status,
    customerName: shortName(o.customer?.name ?? ''),
    phone: o.customer?.phone ?? '',
    pickupMode: o.pickup.mode,
    promisedAt: o.pickup.promisedAt,
    placedAt: o.placedAt,
    statusChangedAt: o.statusChangedAt,
    lines: (o.lines ?? []).map((l) => ({ ...l, modifiers: l.modifiers ?? [], notes: l.notes ?? '', variantLabel: l.variantLabel ?? '' })),
    orderNotes: o.orderNotes ?? '',
    paymentMethod: o.paymentMethod,
    totalCents: o.totalCents,
    cancelReason: o.cancelReason ?? null,
  }
}

export async function findOrderByNumber(number: number) {
  const payload = await getPayloadClient()
  const res = await payload.find({ collection: 'orders', overrideAccess: true, depth: 0, limit: 1, where: { number: { equals: number } } })
  return (res.docs[0] as unknown as OrderDoc) ?? null
}

export async function findOrderByPublicId(publicId: string) {
  const payload = await getPayloadClient()
  const res = await payload.find({ collection: 'orders', overrideAccess: true, depth: 0, limit: 1, where: { publicId: { equals: publicId } } })
  return (res.docs[0] as unknown as OrderDoc) ?? null
}

export async function listKitchenOrders(statuses: string[]) {
  const payload = await getPayloadClient()
  const res = await payload.find({
    collection: 'orders',
    overrideAccess: true,
    depth: 0,
    limit: 200,
    sort: 'pickup.promisedAt',
    where: { status: { in: statuses } },
  })
  return (res.docs as unknown as OrderDoc[]).map(toTicket)
}

export async function listCompletedToday() {
  const payload = await getPayloadClient()
  const t = now()
  const res = await payload.find({
    collection: 'orders',
    overrideAccess: true,
    depth: 0,
    limit: 50,
    sort: '-statusChangedAt',
    where: { and: [{ status: { equals: 'completed' } }, { statusChangedAt: { greater_than: new Date(t.getTime() - 24 * 3600_000).toISOString() } }] },
  })
  return (res.docs as unknown as OrderDoc[]).map(toTicket)
}

const TRANSITIONS: Record<string, string[]> = {
  new: ['accepted', 'cancelled'],
  accepted: ['ready', 'cancelled'],
  ready: ['completed'],
  completed: [],
  cancelled: [],
}

export const CANCEL_REASONS = ['Out of an item', 'Kitchen closed', 'Customer request', 'Other']

export async function changeStatus(number: number, next: string, userId: string | number, cancelReason?: string): Promise<Result<Ticket>> {
  const order = await findOrderByNumber(number)
  if (!order) return fail(404, 'NOT_FOUND', `Order #${number} not found`)
  const t = now()
  const history = order.statusHistory ?? []
  const lastChange = history[history.length - 1]
  const previous = history[history.length - 2]
  const isUndo = !!previous && previous.status === next && !!lastChange && t.getTime() - new Date(lastChange.at).getTime() <= 60_000
  if (!isUndo && !TRANSITIONS[order.status]?.includes(next)) {
    return fail(409, 'INVALID_TRANSITION', `Cannot move order #${number} from ${order.status} to ${next}`)
  }
  if (next === 'cancelled' && !isUndo && !cancelReason) return fail(422, 'VALIDATION', 'A cancel reason is required', { path: 'cancelReason' })

  const payload = await getPayloadClient()
  const at = t.toISOString()
  const updated = (await payload.update({
    collection: 'orders',
    id: order.id,
    overrideAccess: true,
    data: {
      status: next,
      statusChangedAt: at,
      cancelReason: next === 'cancelled' ? cancelReason ?? order.cancelReason : isUndo ? null : order.cancelReason,
      statusHistory: [...history.map((h) => ({ status: h.status, at: h.at, byUser: h.byUser ?? null })), { status: next, at, byUser: userId }],
    } as never,
  })) as unknown as OrderDoc

  const ticket = toTicket(updated)
  publish('order.updated', ticket)
  if (next === 'ready' && !isUndo && updated.customer?.email) {
    await sendMail({
      to: updated.customer.email,
      subject: `Your order #${updated.number} is ready`,
      text: `Your order is ready! Head to the bar to pick up.\n\n${statusUrl(updated.publicId)}\n\nJeff's Taproom & Grill · 416 Market Street, Bridgeville, DE 19933`,
    })
  }
  return { ok: true, value: ticket }
}

export async function delayOrder(number: number, minutes: number): Promise<Result<Ticket>> {
  if (minutes !== 5 && minutes !== 10) return fail(422, 'VALIDATION', 'minutes must be 5 or 10', { path: 'minutes' })
  const order = await findOrderByNumber(number)
  if (!order) return fail(404, 'NOT_FOUND', `Order #${number} not found`)
  if (order.status === 'completed' || order.status === 'cancelled') return fail(409, 'INVALID_TRANSITION', 'Order is closed')
  const promisedAt = new Date(new Date(order.pickup.promisedAt).getTime() + minutes * 60000).toISOString()
  const payload = await getPayloadClient()
  const updated = (await payload.update({
    collection: 'orders',
    id: order.id,
    overrideAccess: true,
    data: {
      pickup: { ...order.pickup, promisedAt },
      pickupDisplay: `${order.pickup.mode === 'asap' ? 'ASAP' : 'Scheduled'} · ${formatTime(promisedAt)}`,
      statusChangedAt: now().toISOString(),
    } as never,
  })) as unknown as OrderDoc
  const ticket = toTicket(updated)
  publish('order.updated', ticket)
  return { ok: true, value: ticket }
}

/** SEC-007: redact customer PII on orders older than 180 days. */
export async function redactOldPii() {
  const payload = await getPayloadClient()
  const cutoff = new Date(now().getTime() - 180 * 24 * 3600_000).toISOString()
  const res = await payload.find({
    collection: 'orders',
    overrideAccess: true,
    depth: 0,
    limit: 1000,
    where: { and: [{ placedAt: { less_than: cutoff } }, { piiRedacted: { not_equals: true } }] },
  })
  for (const o of res.docs as unknown as OrderDoc[]) {
    const last4 = (o.customer?.phone ?? '').replace(/\D/g, '').slice(-4)
    await payload.update({
      collection: 'orders',
      id: o.id,
      overrideAccess: true,
      data: {
        customer: { name: o.customer?.name ?? '', phone: `***-${last4}`, email: null },
        customerDisplay: `${o.customer?.name ?? ''} · ***-${last4}`,
        piiRedacted: true,
      } as never,
    })
  }
  return res.docs.length
}
