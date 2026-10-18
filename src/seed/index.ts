import type { Payload } from 'payload'
import { CHALLENGE_RULES, FEATURED, GROUPS, MENU, WEEKLY_HOURS } from './menu'
import { CHALLENGE_ENTRIES, EVENTS, SPECIALS, TAPS, TEST_USERS } from './demo'

const ctx = { context: { seeding: true }, overrideAccess: true } as const

/** Idempotent: creates missing menu items, never overwrites existing ones (ARCH-007). */
export async function seedMenu(payload: Payload) {
  const groupIds = new Map<string, number>()
  for (const g of GROUPS) {
    const existing = await payload.find({ collection: 'modifier-groups', where: { key: { equals: g.key } }, limit: 1, depth: 0 })
    const doc =
      existing.docs[0] ??
      (await payload.create({
        collection: 'modifier-groups',
        ...ctx,
        data: {
          key: g.key,
          name: g.name,
          adminName: g.adminName,
          minSelect: g.min,
          maxSelect: g.max,
          maxSelectByVariant: g.byVariant ?? null,
          options: g.options.map(([label, priceDeltaCents, isDefault]) => ({ label, priceDeltaCents, default: !!isDefault })),
        },
      }))
    groupIds.set(g.key, doc.id as number)
  }

  let catOrder = 0
  for (const c of MENU) {
    catOrder += 10
    const existing = await payload.find({ collection: 'menu-categories', where: { slug: { equals: c.slug } }, limit: 1, depth: 0 })
    const cat =
      existing.docs[0] ??
      (await payload.create({ collection: 'menu-categories', ...ctx, data: { name: c.name, slug: c.slug, note: c.note ?? '', sortOrder: catOrder } }))
    let order = 0
    for (const i of c.items) {
      order += 10
      const found = await payload.find({ collection: 'menu-items', where: { slug: { equals: i.slug } }, limit: 1, depth: 0 })
      if (found.docs.length) continue
      const variants = typeof i.price === 'number' ? [{ label: '', priceCents: i.price, isMarketPrice: false }] : i.price.map(([label, p]) => ({ label, priceCents: p, isMarketPrice: p === null }))
      await payload.create({
        collection: 'menu-items',
        ...ctx,
        data: {
          name: i.name,
          slug: i.slug,
          category: cat.id,
          description: i.description ?? '',
          variants,
          modifierGroups: (i.groups ?? []).map((k) => groupIds.get(k)!),
          available: true,
          onlineOrderable: i.onlineOrderable ?? true,
          orderingNote: i.orderingNote ?? '',
          tags: (i.tags ?? []) as ('popular' | 'spicy' | 'seafood' | 'vegetarian' | 'new')[],
          sortOrder: catOrder * 100 + order,
        },
      })
    }
  }
}

export async function seedSite(payload: Payload, opts: { notificationEmail?: string | null } = {}) {
  await payload.updateGlobal({ slug: 'hours', ...ctx, data: { weekly: WEEKLY_HOURS.map((w) => ({ ...w })), exceptions: [] } })
  await payload.updateGlobal({
    slug: 'settings',
    ...ctx,
    data: {
      onlineOrderingEnabled: true,
      orderingPausedUntil: null,
      pauseMessage: 'Online ordering is paused — please call (302) 337-8602.',
      prepLeadMinutes: 20,
      slotIntervalMinutes: 15,
      lastOrderMinutesBeforeClose: 30,
      cashDiscountPercent: 3,
      taxRatePercent: 0,
      tipPresetsPercent: [0, 10, 15, 20],
      maxOnlineSubtotalCents: 50000,
      orderNotificationEmail: opts.notificationEmail ?? null,
      phone: '(302) 337-8602',
      address: '416 Market Street, Bridgeville, DE 19933',
      geo: { lat: 38.7426, lng: -75.6044 },
      socialLinks: [],
      announcement: { enabled: false, text: '', link: '' },
    },
  })
  await payload.updateGlobal({
    slug: 'home',
    ...ctx,
    data: {
      heroHeadline: "Beer. Wings. Bridgeville's Taproom.",
      heroSubhead: 'Famous wings, fresh-ground burgers and cold drafts on Market Street. Order ahead for pickup.',
      featuredItemSlugs: FEATURED,
    },
  })
  await payload.updateGlobal({ slug: 'challenge', ...ctx, data: { rules: CHALLENGE_RULES.map((text) => ({ text })) } })
}

export async function seedDemo(payload: Payload) {
  for (const e of EVENTS) await payload.create({ collection: 'events', ...ctx, data: e as never })
  for (const s of SPECIALS) await payload.create({ collection: 'specials', ...ctx, data: s as never })
  let i = 0
  for (const t of TAPS) await payload.create({ collection: 'taps', ...ctx, data: { ...t, sortOrder: ++i } as never })
  for (const c of CHALLENGE_ENTRIES) await payload.create({ collection: 'challenge-entries', ...ctx, data: c as never })
}

export async function seedTestUsers(payload: Payload) {
  for (const u of TEST_USERS) await payload.create({ collection: 'users', ...ctx, data: u as never })
}

/** ADM-009: first boot creates the admin from env. */
export async function seedStaffFromEnv(payload: Payload) {
  const email = process.env.SEED_STAFF_EMAIL
  const password = process.env.SEED_STAFF_PASSWORD
  if (!email || !password) return
  const { totalDocs } = await payload.count({ collection: 'users', overrideAccess: true })
  if (totalDocs > 0) return
  await payload.create({ collection: 'users', ...ctx, data: { email, password, role: 'admin' } as never })
  payload.logger.info(`Seeded admin user ${email}`)
}
