import 'server-only'
import { now } from './clock'
import { getOrderingStatus, getOpenStatus, openStatusText } from './hours'
import { getPayloadClient } from './payload'
import { startOfDay, type DayKey } from './time'
import type { HoursData, MenuCategory, MenuGroup, MenuItem, PublicMenu, SettingsData } from './types'

const sys = { overrideAccess: true, depth: 0 } as const

export async function loadSettings(): Promise<SettingsData> {
  const p = await getPayloadClient()
  const s = (await p.findGlobal({ slug: 'settings', ...sys })) as unknown as Partial<SettingsData>
  return {
    onlineOrderingEnabled: s.onlineOrderingEnabled ?? true,
    orderingPausedUntil: s.orderingPausedUntil ?? null,
    pauseMessage: s.pauseMessage || 'Online ordering is paused — please call (302) 337-8602.',
    prepLeadMinutes: s.prepLeadMinutes ?? 20,
    slotIntervalMinutes: s.slotIntervalMinutes || 15,
    lastOrderMinutesBeforeClose: s.lastOrderMinutesBeforeClose ?? 30,
    cashDiscountPercent: s.cashDiscountPercent ?? 3,
    taxRatePercent: s.taxRatePercent ?? 0,
    tipPresetsPercent: s.tipPresetsPercent?.length ? s.tipPresetsPercent : [0, 10, 15, 20],
    maxOnlineSubtotalCents: s.maxOnlineSubtotalCents ?? 50000,
    orderNotificationEmail: s.orderNotificationEmail || null,
    phone: s.phone || '(302) 337-8602',
    address: s.address || '416 Market Street, Bridgeville, DE 19933',
    geo: { lat: s.geo?.lat ?? 38.7426, lng: s.geo?.lng ?? -75.6044 },
    socialLinks: (s.socialLinks ?? []).map((l) => ({ label: l.label, url: l.url })),
    announcement: { enabled: !!s.announcement?.enabled, text: s.announcement?.text ?? '', link: s.announcement?.link ?? null },
  }
}

export async function loadHours(): Promise<HoursData> {
  const p = await getPayloadClient()
  const h = (await p.findGlobal({ slug: 'hours', ...sys })) as unknown as HoursData
  return {
    weekly: (h.weekly ?? []).map((w) => ({ day: w.day as DayKey, open: w.open, close: w.close, closed: !!w.closed })),
    exceptions: (h.exceptions ?? []).map((e) => ({ date: e.date, closed: !!e.closed, open: e.open, close: e.close, note: e.note })),
  }
}

export async function loadOrderingStatus() {
  const [hours, settings] = await Promise.all([loadHours(), loadSettings()])
  return getOrderingStatus(hours, settings, now())
}

export async function loadOpenStatusText() {
  const hours = await loadHours()
  const t = now()
  return openStatusText(getOpenStatus(hours, t), t)
}

type RawGroup = {
  key: string
  name: string
  minSelect: number
  maxSelect: number
  maxSelectByVariant?: Record<string, number> | null
  options?: { label: string; priceDeltaCents: number; default?: boolean | null }[]
}
type RawItem = {
  slug: string
  name: string
  description?: string | null
  available?: boolean | null
  onlineOrderable?: boolean | null
  orderingNote?: string | null
  tags?: string[] | null
  variants?: { label?: string | null; priceCents?: number | null; isMarketPrice?: boolean | null }[]
  modifierGroups?: (RawGroup | string | number)[]
  category: { slug: string } | string | number
  image?: { url?: string; alt?: string; width?: number; height?: number } | null
}

export function toMenuGroup(g: RawGroup): MenuGroup {
  return {
    key: g.key,
    name: g.name,
    minSelect: g.minSelect ?? 0,
    maxSelect: g.maxSelect ?? 1,
    maxSelectByVariant: (g.maxSelectByVariant && typeof g.maxSelectByVariant === 'object' ? g.maxSelectByVariant : {}) as Record<string, number>,
    options: (g.options ?? []).map((o) => ({ label: o.label, priceDeltaCents: o.priceDeltaCents ?? 0, default: !!o.default })),
  }
}

export function toMenuItem(i: RawItem): MenuItem {
  return {
    slug: i.slug,
    name: i.name,
    description: i.description ?? '',
    available: i.available !== false,
    onlineOrderable: i.onlineOrderable !== false,
    orderingNote: i.orderingNote ?? '',
    tags: i.tags ?? [],
    variants: (i.variants ?? []).map((v) => ({
      label: v.label ?? '',
      priceCents: v.priceCents ?? null,
      isMarketPrice: !!v.isMarketPrice,
    })),
    modifierGroups: (i.modifierGroups ?? []).filter((g): g is RawGroup => typeof g === 'object' && g !== null).map(toMenuGroup),
    image: i.image?.url ? { url: i.image.url, alt: i.image.alt ?? '', width: i.image.width ?? 640, height: i.image.height ?? 480 } : null,
  }
}

/** CHK-055 */
export async function loadMenu(): Promise<PublicMenu> {
  const p = await getPayloadClient()
  const [cats, items] = await Promise.all([
    p.find({ collection: 'menu-categories', ...sys, limit: 100, sort: 'sortOrder' }),
    p.find({ collection: 'menu-items', overrideAccess: true, depth: 1, limit: 500, sort: 'sortOrder' }),
  ])
  const byCat = new Map<string, MenuItem[]>()
  for (const raw of items.docs as unknown as RawItem[]) {
    const slug = typeof raw.category === 'object' ? raw.category.slug : ''
    if (!byCat.has(slug)) byCat.set(slug, [])
    byCat.get(slug)!.push(toMenuItem(raw))
  }
  const categories: MenuCategory[] = cats.docs.map((c) => ({
    slug: c.slug as string,
    name: c.name as string,
    note: (c.note as string) ?? '',
    items: byCat.get(c.slug as string) ?? [],
  }))
  return { categories }
}

export async function loadItemBySlug(slug: string) {
  const p = await getPayloadClient()
  const res = await p.find({ collection: 'menu-items', overrideAccess: true, depth: 1, limit: 1, where: { slug: { equals: slug } } })
  return res.docs[0] ? toMenuItem(res.docs[0] as unknown as RawItem) : null
}

export type EventDoc = { slug: string; title: string; startsAt: string; endsAt?: string | null; description?: string | null; category: string }

/** EVT-001: events starting from the start of today (local). */
export async function loadUpcomingEvents(limit = 100): Promise<EventDoc[]> {
  const p = await getPayloadClient()
  const res = await p.find({
    collection: 'events',
    ...sys,
    limit,
    sort: 'startsAt',
    where: { startsAt: { greater_than_equal: startOfDay(now()).toISOString() } },
  })
  return res.docs as unknown as EventDoc[]
}

export async function loadEvent(slug: string): Promise<EventDoc | null> {
  const p = await getPayloadClient()
  const res = await p.find({ collection: 'events', ...sys, limit: 1, where: { slug: { equals: slug } } })
  const ev = res.docs[0] as unknown as EventDoc | undefined
  if (!ev || new Date(ev.startsAt) < startOfDay(now())) return null
  return ev
}

export type SpecialDoc = { id: string | number; title: string; description?: string | null; priceText?: string | null; days: DayKey[]; startTime?: string | null; endTime?: string | null }

export async function loadSpecials(): Promise<SpecialDoc[]> {
  const p = await getPayloadClient()
  const res = await p.find({ collection: 'specials', ...sys, limit: 100, where: { active: { equals: true } }, sort: 'createdAt' })
  return res.docs as unknown as SpecialDoc[]
}

export async function loadHome() {
  const p = await getPayloadClient()
  return (await p.findGlobal({ slug: 'home', ...sys })) as unknown as { heroHeadline?: string; heroSubhead?: string; featuredItemSlugs?: string[] }
}
