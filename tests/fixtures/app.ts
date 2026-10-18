import { test as base, expect, type APIRequestContext, type Page, type Locator } from '@playwright/test'

// Harness contract: specs/40-testing.md (TEST-003..006)

export const DEFAULT_NOW = '2026-11-06T17:00:00-05:00' // Friday 5:00 PM ET

export const STAFF = {
  admin: { email: 'admin@jeffstaproom.test', password: 'Taproom!test1' },
  manager: { email: 'manager@jeffstaproom.test', password: 'Manager!test1' },
  kitchen: { email: 'kitchen@jeffstaproom.test', password: 'Kitchen!test1' },
} as const
export type Role = keyof typeof STAFF

export type OrderLineInput = {
  itemSlug: string
  variantLabel?: string
  quantity?: number
  modifiers?: { group: string; option: string }[]
  notes?: string
}

export type OrderInput = {
  idempotencyKey?: string
  lines: OrderLineInput[]
  customer?: { name: string; phone: string; email?: string }
  pickup?: { mode: 'asap' } | { mode: 'scheduled'; slot: string }
  paymentMethod?: 'cash' | 'card_at_pickup'
  tip?: { type: 'none' } | { type: 'percent'; value: number } | { type: 'amount'; cents: number }
  orderNotes?: string
  expectedTotalCents?: number
  website?: string
}

export function orderBody(input: OrderInput) {
  return {
    idempotencyKey: input.idempotencyKey ?? crypto.randomUUID(),
    customer: { name: 'Pat Doe', phone: '3025550123' },
    pickup: { mode: 'asap' },
    paymentMethod: 'card_at_pickup',
    tip: { type: 'none' },
    orderNotes: '',
    website: '',
    ...input,
    lines: input.lines.map((l) => ({ variantLabel: '', quantity: 1, modifiers: [], notes: '', ...l })),
  }
}

/** The worked example from CHK-031. */
export const WORKED_EXAMPLE_LINES: OrderLineInput[] = [
  {
    itemSlug: 'jeffs-famous-cheeseburger',
    modifiers: [
      { group: 'burger-cheese', option: 'American' },
      { group: 'side-swap', option: 'Krinkle-cut fries' },
    ],
  },
  {
    itemSlug: 'bone-in-wings',
    variantLabel: '16 wings',
    modifiers: [
      { group: 'wing-sauce', option: 'Hot' },
      { group: 'wing-sauce', option: 'Old Bay' },
      { group: 'wing-dressing', option: 'Ranch' },
      { group: 'wing-extras', option: 'Extra celery' },
    ],
  },
]

export class AppApi {
  constructor(readonly request: APIRequestContext) {}

  async reset(now: string | null = DEFAULT_NOW) {
    const res = await this.request.post('/api/test/reset', { data: now ? { now } : {} })
    expect(res.status(), 'POST /api/test/reset').toBe(200)
  }
  async setClock(now: string | null) {
    const res = await this.request.post('/api/test/clock', { data: { now } })
    expect(res.status(), 'POST /api/test/clock').toBe(200)
  }
  async settings(patch: Record<string, unknown>) {
    const res = await this.request.patch('/api/test/settings', { data: patch })
    expect(res.status(), 'PATCH /api/test/settings').toBe(200)
  }
  async updateItem(slug: string, patch: Record<string, unknown>) {
    const res = await this.request.patch(`/api/test/menu-items/${slug}`, { data: patch })
    expect(res.status(), `PATCH /api/test/menu-items/${slug}`).toBe(200)
  }
  /** Creates an order bypassing rate limits. Returns the 201 body. */
  async createOrder(input: OrderInput) {
    const res = await this.request.post('/api/test/orders', { data: orderBody(input) })
    expect(res.status(), 'POST /api/test/orders').toBe(201)
    return (await res.json()) as { number: number; publicId: string; totalCents: number; promisedAt: string; statusUrl: string }
  }
  async outbox() {
    const res = await this.request.get('/api/test/outbox')
    expect(res.status()).toBe(200)
    return (await res.json()) as { to: string; subject: string; text: string }[]
  }
}

/** Logs a staff user in via the Payload REST API; cookies are shared with the page's context. */
export async function loginAs(page: Page, role: Role) {
  const res = await page.request.post('/api/users/login', { data: STAFF[role] })
  expect(res.status(), `login as ${role}`).toBe(200)
}

/** A separate, logged-in API context (cookies are NOT shared with the customer's page). */
export async function staffApi(playwright: { request: { newContext: (o: { baseURL: string; extraHTTPHeaders?: Record<string, string> }) => Promise<APIRequestContext> } }, baseURL: string, role: Role) {
  const anon = await playwright.request.newContext({ baseURL })
  const res = await anon.post('/api/users/login', { data: STAFF[role] })
  expect(res.status(), `login as ${role}`).toBe(200)
  const { token } = (await res.json()) as { token: string }
  await anon.dispose()
  // Non-browser clients authenticate with the token header; cookie auth is CSRF-protected (Origin / Sec-Fetch-Site).
  const request = await playwright.request.newContext({ baseURL, extraHTTPHeaders: { Authorization: `JWT ${token}` } })
  return {
    request,
    async setStatus(number: number, status: string, cancelReason?: string) {
      const r = await request.post(`/api/kitchen/orders/${number}/status`, { data: { status, cancelReason } })
      expect(r.status(), `#${number} → ${status}`).toBe(200)
    },
    async findOrder(number: number) {
      const r = await request.get(`/api/orders?where[number][equals]=${number}&depth=0`)
      expect(r.status()).toBe(200)
      return (await r.json()).docs[0] as Record<string, any>
    },
    dispose: () => request.dispose(),
  }
}

export async function orderStatus(request: APIRequestContext, publicId: string) {
  const res = await request.get(`/api/orders/${publicId}/status`)
  expect(res.status()).toBe(200)
  return (await res.json()) as { number: number; status: string; promisedAt: string; updatedAt: string; cancelReason?: string }
}

/** Presses Tab until `target` has focus (keyboard-only navigation, A11Y-002). */
export async function tabTo(page: Page, target: Locator, max = 250) {
  for (let i = 0; i < max; i++) {
    if (await target.evaluate((el) => el === document.activeElement).catch(() => false)) return
    await page.keyboard.press('Tab')
  }
  throw new Error(`tabTo: target not reached after ${max} Tab presses`)
}

// ---------- UI helpers ----------

export type AddItemOptions = {
  variant?: string
  /** legend (group name, without "Required"/"Optional") → option labels (prefix match, price suffix ignored) */
  choices?: Record<string, string[]>
  quantity?: number
  notes?: string
}

export function itemDialog(page: Page, name: string) {
  return page.getByRole('dialog', { name })
}

export function fieldset(scope: Page | Locator, legend: string) {
  return scope.getByRole('group', { name: new RegExp(`^${escapeRe(legend)}(?=\\s|$)`) })
}

export async function openItem(page: Page, name: string) {
  await page.getByRole('button', { name: `Add ${name}`, exact: true }).first().click()
  const dialog = itemDialog(page, name)
  await expect(dialog).toBeVisible()
  return dialog
}

export async function configureItem(dialog: Locator, opts: AddItemOptions = {}) {
  if (opts.variant) {
    await dialog.getByRole('radio', { name: new RegExp(`^${escapeRe(opts.variant)} — `) }).check()
  }
  for (const [legend, options] of Object.entries(opts.choices ?? {})) {
    const group = fieldset(dialog, legend)
    for (const option of options) {
      const control = group.getByRole(/* radio or checkbox */ 'radio', { name: new RegExp(`^${escapeRe(option)}( \\(|$)`) })
      if (await control.count()) await control.check()
      else await group.getByRole('checkbox', { name: new RegExp(`^${escapeRe(option)}( \\(|$)`) }).check()
    }
  }
  if (opts.quantity && opts.quantity > 1) {
    const inc = dialog.getByRole('button', { name: 'Increase quantity' })
    for (let i = 1; i < opts.quantity; i++) await inc.click()
  }
  if (opts.notes) await dialog.getByLabel('Special instructions (optional)').fill(opts.notes)
}

export async function addItem(page: Page, name: string, opts: AddItemOptions = {}) {
  const dialog = await openItem(page, name)
  await configureItem(dialog, opts)
  await dialog.getByRole('button', { name: /^Add to order · \$/ }).click()
  await expect(dialog).toBeHidden()
}

/** Adds the CHK-031 worked example through the UI. */
export async function addWorkedExample(page: Page) {
  await addItem(page, "Jeff's Famous Cheeseburger", { choices: { Cheese: ['American'], Side: ['Krinkle-cut fries'] } })
  await addItem(page, 'Bone-In Wings', {
    variant: '16 wings',
    choices: { Sauce: ['Hot', 'Old Bay'], Dressing: ['Ranch'], Extras: ['Extra celery'] },
  })
}

export async function openCart(page: Page) {
  await page.getByTestId('cart-button').click()
  const drawer = page.getByRole('dialog', { name: 'Your order' })
  await expect(drawer).toBeVisible()
  return drawer
}

export async function fillCustomer(page: Page, c = { name: 'Pat Doe', phone: '302-555-0123', email: '' }) {
  await page.getByLabel('Name', { exact: true }).fill(c.name)
  await page.getByLabel('Phone', { exact: true }).fill(c.phone)
  if (c.email) await page.getByLabel('Email (optional)').fill(c.email)
}

export function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

type Fixtures = { app: AppApi; resetEach: void }

export const test = base.extend<Fixtures>({
  app: async ({ request }, use) => {
    await use(new AppApi(request))
  },
  // Every test starts from the deterministic seed + default clock (TEST-001).
  resetEach: [
    async ({ app }, use) => {
      await app.reset()
      await use()
    },
    { auto: true },
  ],
})

export { expect }
