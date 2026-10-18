import { test, expect, orderBody, WORKED_EXAMPLE_LINES, type OrderInput } from './fixtures/app'
import { ITEMS, CATEGORY_ORDER } from './fixtures/menu'
import type { APIRequestContext } from '@playwright/test'

// specs/14-checkout.md (Order API contract), SEC-001/003/004/006

const post = (request: APIRequestContext, input: OrderInput, extra: Record<string, unknown> = {}) =>
  request.post('/api/orders', { data: { ...orderBody(input), ...extra } })

async function expectError(res: Awaited<ReturnType<typeof post>>, status: number, code: string) {
  expect(res.status(), await res.text()).toBe(status)
  const body = await res.json()
  expect(body.error.code).toBe(code)
  return body.error
}

const SODA = [{ itemSlug: 'soda' }]

test.describe('POST /api/orders', () => {
  test('CHK-051 201 body shape (worked example, cash + 15%)', async ({ request }) => {
    const res = await post(request, { lines: WORKED_EXAMPLE_LINES, paymentMethod: 'cash', tip: { type: 'percent', value: 15 } })
    expect(res.status()).toBe(201)
    const body = await res.json()
    expect(body.number).toBe(1001)
    expect(body.publicId).toMatch(/^[A-Za-z0-9_-]{21}$/)
    expect(body.status).toBe('new')
    expect(body.totalCents).toBe(4693)
    expect(new Date(body.promisedAt).toISOString()).toBe(new Date('2026-11-06T17:20:00-05:00').toISOString())
    expect(body.statusUrl).toMatch(new RegExp(`/order/confirmation/${body.publicId}$`))
  })

  test('CHK-031 card + no tip totals 4190', async ({ request }) => {
    const res = await post(request, { lines: WORKED_EXAMPLE_LINES })
    expect((await res.json()).totalCents).toBe(4190)
  })

  test('CHK-031 amount tip', async ({ request }) => {
    const res = await post(request, { lines: WORKED_EXAMPLE_LINES, tip: { type: 'amount', cents: 500 } })
    expect((await res.json()).totalCents).toBe(4690)
  })

  test('CHK-050 SEC-001 client-supplied prices are ignored', async ({ request }) => {
    const res = await request.post('/api/orders', {
      data: {
        ...orderBody({ lines: WORKED_EXAMPLE_LINES }),
        lines: orderBody({ lines: WORKED_EXAMPLE_LINES }).lines.map((l) => ({ ...l, unitPriceCents: 1, lineTotalCents: 1 })),
        subtotalCents: 1,
        totalCents: 1,
      },
    })
    expect(res.status()).toBe(201)
    expect((await res.json()).totalCents).toBe(4190)
  })

  test('CHK-050 order numbers increment', async ({ request }) => {
    const a = await (await post(request, { lines: SODA })).json()
    const b = await (await post(request, { lines: SODA })).json()
    expect([a.number, b.number]).toEqual([1001, 1002])
  })

  test('CHK-051 scheduled pickup is honoured', async ({ request }) => {
    const res = await post(request, { lines: SODA, pickup: { mode: 'scheduled', slot: '2026-11-06T18:30:00-05:00' } })
    expect(res.status()).toBe(201)
    expect(new Date((await res.json()).promisedAt).toISOString()).toBe(new Date('2026-11-06T18:30:00-05:00').toISOString())
  })

  test('CHK-051 409 PRICE_CHANGED when expectedTotalCents mismatches', async ({ request }) => {
    const res = await post(request, { lines: WORKED_EXAMPLE_LINES, expectedTotalCents: 4000 })
    const err = await expectError(res, 409, 'PRICE_CHANGED')
    expect(err.totalCents).toBe(4190)
  })

  test('CHK-051 expectedTotalCents match is accepted', async ({ request }) => {
    const res = await post(request, { lines: WORKED_EXAMPLE_LINES, expectedTotalCents: 4190 })
    expect(res.status()).toBe(201)
  })

  test('CHK-051 VALIDATION: missing name, bad phone, bad quantity', async ({ request }) => {
    await expectError(await post(request, { lines: SODA, customer: { name: '', phone: '3025550123' } }), 422, 'VALIDATION')
    await expectError(await post(request, { lines: SODA, customer: { name: 'Pat', phone: '123' } }), 422, 'VALIDATION')
    await expectError(await post(request, { lines: [{ itemSlug: 'soda', quantity: 0 }] }), 422, 'VALIDATION')
    await expectError(await post(request, { lines: [{ itemSlug: 'soda', quantity: 21 }] }), 422, 'VALIDATION')
    await expectError(await post(request, { lines: [] }), 422, 'VALIDATION')
  })

  test('CHK-051 ITEM_NOT_FOUND', async ({ request }) => {
    await expectError(await post(request, { lines: [{ itemSlug: 'lobster-thermidor' }] }), 422, 'ITEM_NOT_FOUND')
  })

  test("CHK-051 ITEM_UNAVAILABLE for 86'd items", async ({ request, app }) => {
    await app.updateItem('soda', { available: false })
    const err = await expectError(await post(request, { lines: SODA }), 422, 'ITEM_UNAVAILABLE')
    expect(err.path).toBeTruthy()
  })

  test('CHK-051 NOT_ORDERABLE for in-house-only items', async ({ request }) => {
    await expectError(await post(request, { lines: [{ itemSlug: 'big-burger-challenge' }] }), 422, 'NOT_ORDERABLE')
  })

  test('CHK-051 MENU-DATA-003 MARKET_PRICE when no price is set', async ({ request }) => {
    await expectError(await post(request, { lines: [{ itemSlug: 'crab-balls', variantLabel: 'Dozen' }] }), 422, 'MARKET_PRICE')
  })

  test('CHK-051 unknown variant is VALIDATION', async ({ request }) => {
    await expectError(
      await post(request, {
        lines: [{ itemSlug: 'krinkle-cut-fries', variantLabel: 'Jumbo' }],
      }),
      422,
      'VALIDATION',
    )
  })

  test('CHK-052 INVALID_MODIFIERS: unknown option', async ({ request }) => {
    const lines = [
      {
        itemSlug: 'bone-in-wings',
        variantLabel: '8 wings',
        modifiers: [
          { group: 'wing-sauce', option: 'Ketchup' },
          { group: 'wing-dressing', option: 'Ranch' },
        ],
      },
    ]
    await expectError(await post(request, { lines }), 422, 'INVALID_MODIFIERS')
  })

  test('CHK-052 INVALID_MODIFIERS: too many sauces for 8 wings, OK for 16', async ({ request }) => {
    const mods = [
      { group: 'wing-sauce', option: 'Hot' },
      { group: 'wing-sauce', option: 'Mild' },
      { group: 'wing-dressing', option: 'Ranch' },
    ]
    await expectError(await post(request, { lines: [{ itemSlug: 'bone-in-wings', variantLabel: '8 wings', modifiers: mods }] }), 422, 'INVALID_MODIFIERS')
    const ok = await post(request, { lines: [{ itemSlug: 'bone-in-wings', variantLabel: '16 wings', modifiers: mods }] })
    expect(ok.status()).toBe(201)
  })

  test('CHK-052 INVALID_MODIFIERS: missing required group', async ({ request }) => {
    const lines = [{ itemSlug: 'bone-in-wings', variantLabel: '8 wings', modifiers: [{ group: 'wing-sauce', option: 'Hot' }] }]
    await expectError(await post(request, { lines }), 422, 'INVALID_MODIFIERS')
  })

  test('CHK-052 INVALID_MODIFIERS: group not attached to item', async ({ request }) => {
    const lines = [{ itemSlug: 'cheese-sticks', modifiers: [{ group: 'burger-cheese', option: 'Swiss' }] }]
    await expectError(await post(request, { lines }), 422, 'INVALID_MODIFIERS')
  })

  test('CHK-052 INVALID_MODIFIERS: unknown group', async ({ request }) => {
    const lines = [{ itemSlug: 'cheese-sticks', modifiers: [{ group: 'gravy', option: 'Yes' }] }]
    await expectError(await post(request, { lines }), 422, 'INVALID_MODIFIERS')
  })

  test('CHK-051 INVALID_SLOT: off-grid, too soon, after last order', async ({ request }) => {
    for (const slot of ['2026-11-06T18:07:00-05:00', '2026-11-06T17:15:00-05:00', '2026-11-06T23:45:00-05:00', '2026-11-07T12:00:00-05:00']) {
      await expectError(await post(request, { lines: SODA, pickup: { mode: 'scheduled', slot } }), 422, 'INVALID_SLOT')
    }
  })

  test('CHK-051 CHK-013 before opening: ASAP is INVALID_SLOT, first slot accepted', async ({ request, app }) => {
    await app.setClock('2026-11-06T09:00:00-05:00')
    await expectError(await post(request, { lines: SODA }), 422, 'INVALID_SLOT')
    const ok = await post(request, { lines: SODA, pickup: { mode: 'scheduled', slot: '2026-11-06T11:30:00-05:00' } })
    expect(ok.status()).toBe(201)
  })

  test('CHK-051 ORD-027 SUBTOTAL_LIMIT over $500', async ({ request }) => {
    const lines = [
      { itemSlug: 'steamed-shrimp', variantLabel: 'Pound', quantity: 20 },
      { itemSlug: 'appetizer-sampler', quantity: 5 },
    ]
    await expectError(await post(request, { lines }), 422, 'SUBTOTAL_LIMIT')
  })

  test('CHK-051 503 ORDERING_CLOSED', async ({ request, app }) => {
    await app.setClock('2026-11-05T22:30:00-05:00')
    await expectError(await post(request, { lines: SODA }), 503, 'ORDERING_CLOSED')
  })

  test('CHK-051 KDS-012 503 ORDERING_PAUSED', async ({ request, app }) => {
    await app.settings({ orderingPausedUntil: '2026-11-06T18:00:00-05:00' })
    const err = await expectError(await post(request, { lines: SODA }), 503, 'ORDERING_PAUSED')
    expect(err.message).toBe('Online ordering is paused — please call (302) 337-8602.')
  })

  test('CHK-051 503 ORDERING_DISABLED', async ({ request, app }) => {
    await app.settings({ onlineOrderingEnabled: false })
    await expectError(await post(request, { lines: SODA }), 503, 'ORDERING_DISABLED')
  })

  test('CHK-053 same idempotencyKey returns the original order', async ({ request }) => {
    const key = crypto.randomUUID()
    const a = await post(request, { idempotencyKey: key, lines: WORKED_EXAMPLE_LINES })
    const b = await post(request, { idempotencyKey: key, lines: WORKED_EXAMPLE_LINES })
    expect(a.status()).toBe(201)
    expect(b.status()).toBe(201)
    expect(await b.json()).toEqual(await a.json())
    const c = await (await post(request, { lines: SODA })).json()
    expect(c.number).toBe(1002)
  })

  test('CHK-054 SEC-004 honeypot returns success-looking response but stores nothing', async ({ request, app }) => {
    const fake = await post(request, { lines: SODA, customer: { name: 'Bot', phone: '3025550123', email: 'bot@example.com' } }, { website: 'http://spam.example' })
    expect(fake.status()).toBe(201)
    const body = await fake.json()
    expect(body.publicId).toBeTruthy()
    expect((await request.get(`/api/orders/${body.publicId}/status`)).status()).toBe(404)
    expect(await app.outbox()).toHaveLength(0)
    const real = await (await post(request, { lines: SODA })).json()
    expect(real.number).toBe(1001)
  })

  test('SEC-003 rate limit: 6th order in 10 minutes from one IP gets 429 with Retry-After', async ({ request }) => {
    for (let i = 0; i < 5; i++) expect((await post(request, { lines: SODA })).status()).toBe(201)
    const res = await post(request, { lines: SODA })
    expect(res.status()).toBe(429)
    expect(Number(res.headers()['retry-after'])).toBeGreaterThan(0)
  })

  test('SEC-003 rate limit window expires', async ({ request, app }) => {
    for (let i = 0; i < 5; i++) await post(request, { lines: SODA })
    await app.setClock('2026-11-06T17:11:00-05:00')
    expect((await post(request, { lines: SODA })).status()).toBe(201)
  })
})

test.describe('GET /api/orders/{publicId}/status', () => {
  test('TRK-007 SEC-006 returns only the public projection', async ({ request, app }) => {
    const { publicId } = await app.createOrder({
      lines: SODA,
      customer: { name: 'Pat Doe', phone: '3025550123', email: 'pat@example.com' },
    })
    const res = await request.get(`/api/orders/${publicId}/status`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(Object.keys(body).sort()).toEqual(expect.arrayContaining(['number', 'promisedAt', 'status', 'updatedAt']))
    for (const k of Object.keys(body)) expect(['number', 'status', 'promisedAt', 'updatedAt', 'cancelReason']).toContain(k)
    const raw = JSON.stringify(body)
    expect(raw).not.toContain('5550123')
    expect(raw).not.toContain('pat@example.com')
    expect(raw).not.toContain('Pat')
  })

  test('TRK-007 unknown publicId is 404', async ({ request }) => {
    expect((await request.get('/api/orders/AAAAAAAAAAAAAAAAAAAAA/status')).status()).toBe(404)
  })
})

test.describe('GET /api/menu', () => {
  test('CHK-055 public menu JSON shape', async ({ request }) => {
    const res = await request.get('/api/menu')
    expect(res.status()).toBe(200)
    const { categories } = await res.json()
    expect(categories.map((c: { slug: string }) => c.slug)).toEqual(CATEGORY_ORDER.map((c) => c.slug))
    const items = categories.flatMap((c: { items: unknown[] }) => c.items)
    expect(items).toHaveLength(ITEMS.length)
    const wings = items.find((i: { slug: string }) => i.slug === 'bone-in-wings')
    expect(wings).toMatchObject({
      name: 'Bone-In Wings',
      available: true,
      onlineOrderable: true,
      tags: expect.arrayContaining(['popular']),
      variants: [
        { label: '8 wings', priceCents: 1295, isMarketPrice: false },
        { label: '16 wings', priceCents: 2395, isMarketPrice: false },
      ],
    })
    const sauce = wings.modifierGroups.find((g: { key: string }) => g.key === 'wing-sauce')
    expect(sauce).toMatchObject({ name: 'Sauce', minSelect: 1, maxSelect: 1, maxSelectByVariant: { '16 wings': 2 } })
    expect(sauce.options).toHaveLength(11)
    const crab = items.find((i: { slug: string }) => i.slug === 'crab-balls')
    expect(crab.variants[0]).toEqual({ label: 'Half dozen', priceCents: null, isMarketPrice: true })
    expect(JSON.stringify(categories)).not.toMatch(/"orders?"|customer/)
  })
})

test.describe('GET /api/ordering-status', () => {
  test('CHK-056 open', async ({ request }) => {
    const s = await (await request.get('/api/ordering-status')).json()
    expect(s.state).toBe('open')
    expect(new Date(s.asapAt).toISOString()).toBe(new Date('2026-11-06T17:20:00-05:00').toISOString())
    expect(s.slots).toHaveLength(25)
    expect(new Date(s.slots[0]).toISOString()).toBe(new Date('2026-11-06T17:30:00-05:00').toISOString())
    expect(new Date(s.slots.at(-1)).toISOString()).toBe(new Date('2026-11-06T23:30:00-05:00').toISOString())
  })

  test('CHK-056 before_open, closed, paused, disabled', async ({ request, app }) => {
    await app.setClock('2026-11-06T09:00:00-05:00')
    let s = await (await request.get('/api/ordering-status')).json()
    expect(s.state).toBe('before_open')
    expect(s.asapAt).toBeNull()
    expect(new Date(s.slots[0]).toISOString()).toBe(new Date('2026-11-06T11:30:00-05:00').toISOString())

    await app.setClock('2026-11-05T22:30:00-05:00')
    s = await (await request.get('/api/ordering-status')).json()
    expect(s).toMatchObject({ state: 'closed', asapAt: null, slots: [] })

    await app.reset()
    await app.settings({ orderingPausedUntil: '2026-11-06T18:00:00-05:00' })
    s = await (await request.get('/api/ordering-status')).json()
    expect(s.state).toBe('paused')
    expect(s.message).toBe('Online ordering is paused — please call (302) 337-8602.')

    await app.settings({ orderingPausedUntil: null, onlineOrderingEnabled: false })
    s = await (await request.get('/api/ordering-status')).json()
    expect(s.state).toBe('disabled')
  })
})
