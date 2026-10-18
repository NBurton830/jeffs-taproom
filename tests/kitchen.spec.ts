import { test, expect, loginAs, staffApi, orderStatus, orderBody, STAFF, WORKED_EXAMPLE_LINES } from './fixtures/app'
import type { Page } from '@playwright/test'

// specs/16-kitchen-display.md — desktop only (@kds)

const column = (page: Page, key: 'new' | 'in-progress' | 'ready') => page.getByTestId(`kds-column-${key}`)
const ticket = (page: Page, n: number) => page.getByTestId(`kds-ticket-${n}`)

async function openBoard(page: Page) {
  await loginAs(page, 'kitchen')
  await page.goto('/kitchen')
  await expect(column(page, 'new')).toBeVisible()
}

test.describe('Kitchen display @kds', () => {
  test('KDS-001 unauthenticated visitors are redirected to login', async ({ page }) => {
    await page.goto('/kitchen')
    await expect(page).toHaveURL(/\/kitchen\/login/)
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
  })

  test('KDS-001 wrong password shows an error', async ({ page }) => {
    await page.goto('/kitchen/login')
    await page.getByLabel('Email').fill(STAFF.kitchen.email)
    await page.getByLabel('Password').fill('nope')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page.getByText('Invalid email or password')).toBeVisible()
  })

  test('KDS-001 kitchen and manager can sign in to the board', async ({ page, context }) => {
    for (const role of ['kitchen', 'manager'] as const) {
      await context.clearCookies()
      await page.goto('/kitchen/login')
      await page.getByLabel('Email').fill(STAFF[role].email)
      await page.getByLabel('Password').fill(STAFF[role].password)
      await page.getByRole('button', { name: 'Sign in' }).click()
      await expect(page).toHaveURL(/\/kitchen$/)
      await expect(column(page, 'new')).toBeVisible()
    }
  })

  test('KDS-002 SEC-002 kitchen APIs return 401 without a session', async ({ request }) => {
    expect((await request.get('/api/kitchen/orders?status=new')).status()).toBe(401)
    expect((await request.post('/api/kitchen/orders/1001/status', { data: { status: 'accepted' } })).status()).toBe(401)
    expect((await request.post('/api/kitchen/pause', { data: { minutes: 15 } })).status()).toBe(401)
    expect((await request.post('/api/kitchen/items/soda/availability', { data: { available: false } })).status()).toBe(401)
    expect((await request.get('/api/kitchen/stream')).status()).toBe(401)
  })

  test('KDS-003 three columns with counts; new order appears live within 5 s', async ({ page, app }) => {
    await openBoard(page)
    await expect(column(page, 'new').getByRole('heading')).toContainText('New')
    await expect(column(page, 'in-progress').getByRole('heading')).toContainText('In progress')
    await expect(column(page, 'ready').getByRole('heading')).toContainText('Ready')
    await expect(column(page, 'new').getByTestId('kds-count')).toHaveText('0')
    await app.createOrder({ lines: WORKED_EXAMPLE_LINES })
    await expect(column(page, 'new').getByTestId('kds-ticket-1001')).toBeVisible({ timeout: 5_000 })
    await expect(column(page, 'new').getByTestId('kds-count')).toHaveText('1')
  })

  test('KDS-004 ticket contents (cash)', async ({ page, app }) => {
    await app.createOrder({
      lines: [
        ...WORKED_EXAMPLE_LINES.slice(0, 1),
        { ...WORKED_EXAMPLE_LINES[1], quantity: 2, notes: 'extra crispy' },
      ],
      paymentMethod: 'cash',
      tip: { type: 'percent', value: 15 },
      orderNotes: 'Blue truck out front',
    })
    await openBoard(page)
    const t = ticket(page, 1001)
    await expect(t).toContainText('#1001')
    await expect(t).toContainText('Pat D.')
    await expect(t.getByRole('link', { name: /302.*555-0123/ })).toHaveAttribute('href', 'tel:+13025550123')
    await expect(t).toContainText('ASAP · 5:20 PM')
    await expect(t.getByTestId('ticket-age')).toHaveText('0 min')
    await expect(t).toContainText('2 × Bone-In Wings (16 wings)')
    await expect(t).toContainText("1 × Jeff's Famous Cheeseburger")
    await expect(t).toContainText('Old Bay')
    await expect(t).toContainText('extra crispy')
    await expect(t).toContainText('Blue truck out front')
    // 1745 + 2×2445 = 6635; cash −199; tip 15% of 6635 = 995 → 7431
    await expect(t).toContainText('CASH — collect $74.31')
  })

  test('KDS-004 ticket contents (card, scheduled) and age from server clock', async ({ page, app }) => {
    await app.createOrder({ lines: WORKED_EXAMPLE_LINES, pickup: { mode: 'scheduled', slot: '2026-11-06T18:30:00-05:00' } })
    await app.setClock('2026-11-06T17:04:00-05:00')
    await openBoard(page)
    const t = ticket(page, 1001)
    await expect(t).toContainText('Scheduled · 6:30 PM')
    await expect(t).toContainText('CARD at pickup — $41.90')
    await expect(t.getByTestId('ticket-age')).toHaveText('4 min')
  })

  test('KDS-005 sorted by promisedAt; far-off scheduled orders are "Later" at the bottom', async ({ page, app }) => {
    await app.createOrder({ lines: [{ itemSlug: 'soda' }], pickup: { mode: 'scheduled', slot: '2026-11-06T21:00:00-05:00' } }) // 1001
    await app.createOrder({ lines: [{ itemSlug: 'soda' }] }) // 1002, 5:20 PM
    await app.createOrder({ lines: [{ itemSlug: 'soda' }], pickup: { mode: 'scheduled', slot: '2026-11-06T17:45:00-05:00' } }) // 1003
    await openBoard(page)
    const ids = await column(page, 'new').locator('[data-testid^="kds-ticket-"]').evaluateAll((els) => els.map((e) => e.getAttribute('data-testid')))
    expect(ids).toEqual(['kds-ticket-1002', 'kds-ticket-1003', 'kds-ticket-1001'])
    await expect(ticket(page, 1001).getByText('Later', { exact: true })).toBeVisible()
    await expect(ticket(page, 1003).getByText('Later', { exact: true })).toHaveCount(0)
  })

  test('KDS-006 LATE badge once past promisedAt and not ready', async ({ page, app }) => {
    await app.createOrder({ lines: [{ itemSlug: 'soda' }] }) // promised 5:20 PM
    await app.setClock('2026-11-06T17:25:00-05:00')
    await openBoard(page)
    await expect(ticket(page, 1001).getByTestId('ticket-late')).toHaveText('LATE')
  })

  test('KDS-007 KDS-009 KDS-010 Accept → Mark ready → Picked up', async ({ page, app, request }) => {
    const { publicId } = await app.createOrder({ lines: WORKED_EXAMPLE_LINES })
    await openBoard(page)
    await ticket(page, 1001).getByRole('button', { name: 'Accept' }).click()
    await expect(column(page, 'in-progress').getByTestId('kds-ticket-1001')).toBeVisible()
    expect((await orderStatus(request, publicId)).status).toBe('accepted')
    await ticket(page, 1001).getByRole('button', { name: 'Mark ready' }).click()
    await expect(column(page, 'ready').getByTestId('kds-ticket-1001')).toBeVisible()
    expect((await orderStatus(request, publicId)).status).toBe('ready')
    await ticket(page, 1001).getByRole('button', { name: 'Picked up' }).click()
    await expect(page.locator('[data-testid^="kds-column-"] [data-testid="kds-ticket-1001"]')).toHaveCount(0)
    const done = page.getByTestId('kds-completed')
    await done.getByRole('button').first().click() // expand
    await expect(done).toContainText('#1001')
    expect((await orderStatus(request, publicId)).status).toBe('completed')
  })

  test('KDS-008 +5 min pushes promisedAt and the customer sees it', async ({ page, app, request }) => {
    const { publicId } = await app.createOrder({ lines: [{ itemSlug: 'soda' }] })
    await openBoard(page)
    await ticket(page, 1001).getByRole('button', { name: '+5 min' }).click()
    await expect(ticket(page, 1001)).toContainText('ASAP · 5:25 PM')
    expect(new Date((await orderStatus(request, publicId)).promisedAt).toISOString()).toBe(new Date('2026-11-06T17:25:00-05:00').toISOString())
    await ticket(page, 1001).getByRole('button', { name: '+10 min' }).click()
    await expect(ticket(page, 1001)).toContainText('ASAP · 5:35 PM')
    await page.goto(`/order/confirmation/${publicId}`)
    await expect(page.getByRole('main')).toContainText('Ready around 5:35 PM')
  })

  test('KDS-011 cancel with reason', async ({ page, app, request }) => {
    const { publicId } = await app.createOrder({ lines: [{ itemSlug: 'soda' }] })
    await openBoard(page)
    await ticket(page, 1001).getByRole('button', { name: 'Cancel order' }).click()
    const dialog = page.getByRole('dialog', { name: 'Cancel order #1001' })
    await dialog.getByLabel('Reason').selectOption('Out of an item')
    await dialog.getByRole('button', { name: 'Confirm cancel' }).click()
    await expect(ticket(page, 1001)).toHaveCount(0)
    const s = await orderStatus(request, publicId)
    expect(s.status).toBe('cancelled')
    expect(s.cancelReason).toBe('Out of an item')
  })

  test('KDS-012 pause and resume online ordering', async ({ page, request }) => {
    await openBoard(page)
    const sw = page.getByRole('switch', { name: 'Pause online ordering' })
    await expect(sw).toHaveAttribute('aria-checked', 'false')
    await sw.click()
    const dialog = page.getByRole('dialog', { name: 'Pause online ordering' })
    for (const d of ['15 min', '30 min', '60 min', 'Until I turn it back on']) await expect(dialog.getByRole('radio', { name: d })).toBeVisible()
    await dialog.getByRole('radio', { name: '30 min' }).check()
    await dialog.getByRole('button', { name: 'Pause' }).click()
    await expect(sw).toHaveAttribute('aria-checked', 'true')
    const paused = await request.post('/api/orders', { data: orderBody({ lines: [{ itemSlug: 'soda' }] }) })
    expect(paused.status()).toBe(503)
    expect((await paused.json()).error.code).toBe('ORDERING_PAUSED')
    const st = await (await request.get('/api/ordering-status')).json()
    expect(st.state).toBe('paused')
    await sw.click()
    await expect(sw).toHaveAttribute('aria-checked', 'false')
    expect((await request.post('/api/orders', { data: orderBody({ lines: [{ itemSlug: 'soda' }] }) })).status()).toBe(201)
  })

  test('KDS-013 Undo reverts the last status change', async ({ page, app, request }) => {
    const { publicId } = await app.createOrder({ lines: [{ itemSlug: 'soda' }] })
    await openBoard(page)
    await ticket(page, 1001).getByRole('button', { name: 'Accept' }).click()
    await expect(column(page, 'in-progress').getByTestId('kds-ticket-1001')).toBeVisible()
    await page.getByTestId('toast').getByRole('button', { name: 'Undo' }).click()
    await expect(column(page, 'new').getByTestId('kds-ticket-1001')).toBeVisible()
    expect((await orderStatus(request, publicId)).status).toBe('new')
  })

  test('KDS-014 86 an item from the board', async ({ page, request }) => {
    await openBoard(page)
    await page.getByRole('button', { name: '86 items' }).click()
    const panel = page.getByRole('dialog', { name: 'Item availability' })
    await expect(panel.getByRole('switch')).toHaveCount(46)
    const sw = panel.getByRole('switch', { name: 'Onion Petals', exact: true })
    await expect(sw).toHaveAttribute('aria-checked', 'true')
    await sw.click()
    await expect(sw).toHaveAttribute('aria-checked', 'false')
    const menu = await (await request.get('/api/menu')).json()
    const item = menu.categories.flatMap((c: { items: { slug: string; available: boolean }[] }) => c.items).find((i: { slug: string }) => i.slug === 'onion-petals')
    expect(item.available).toBe(false)
    const pub = await page.context().newPage()
    await pub.goto('/menu')
    await expect(pub.getByTestId('menu-item-onion-petals').getByText('Sold out today')).toBeVisible()
  })

  test('KDS-015 Sound switch defaults on', async ({ page }) => {
    await openBoard(page)
    await expect(page.getByRole('switch', { name: 'Sound' })).toHaveAttribute('aria-checked', 'true')
  })

  test('KDS-016 print ticket view', async ({ page, app }) => {
    await app.createOrder({ lines: WORKED_EXAMPLE_LINES })
    await openBoard(page)
    await expect(ticket(page, 1001).getByRole('link', { name: 'Print ticket' })).toHaveAttribute('href', '/kitchen/ticket/1001')
    await page.goto('/kitchen/ticket/1001')
    await expect(page.getByText('#1001')).toBeVisible()
    await expect(page.getByText('Bone-In Wings (16 wings)')).toBeVisible()
  })

  test('KDS-017 every status change is recorded with user and time', async ({ page, app, playwright, baseURL }) => {
    await app.createOrder({ lines: [{ itemSlug: 'soda' }] })
    await openBoard(page)
    await ticket(page, 1001).getByRole('button', { name: 'Accept' }).click()
    await expect(column(page, 'in-progress').getByTestId('kds-ticket-1001')).toBeVisible()
    const admin = await staffApi(playwright, baseURL!, 'admin')
    const order = await admin.findOrder(1001)
    await admin.dispose()
    expect(order.statusHistory.map((h: { status: string }) => h.status)).toEqual(['new', 'accepted'])
    const accepted = order.statusHistory[1]
    expect(accepted.byUser).toBeTruthy()
    expect(new Date(accepted.at).toISOString()).toBe(new Date('2026-11-06T17:00:00-05:00').toISOString())
  })

  test('KDS-018 shows Reconnecting… while offline and recovers', async ({ page, context }) => {
    await openBoard(page)
    await context.setOffline(true)
    await expect(page.getByTestId('kds-offline')).toHaveText(/Reconnecting…/, { timeout: 15_000 })
    await context.setOffline(false)
    await expect(page.getByTestId('kds-offline')).toBeHidden({ timeout: 15_000 })
  })

  test('KDS-018 actions taken offline are queued or clearly rejected', async ({ page, app, context, request }) => {
    const { publicId } = await app.createOrder({ lines: [{ itemSlug: 'soda' }] })
    await openBoard(page)
    await context.setOffline(true)
    await expect(page.getByTestId('kds-offline')).toBeVisible({ timeout: 15_000 })
    await ticket(page, 1001).getByRole('button', { name: 'Accept' }).click()
    const rejected = page.getByRole('alert').filter({ hasText: /offline|not saved|try again/i })
    await context.setOffline(false)
    await expect
      .poll(async () => (await rejected.count()) > 0 || (await orderStatus(request, publicId)).status === 'accepted', { timeout: 15_000 })
      .toBe(true)
  })
})

test.describe('Kitchen API @kds', () => {
  test('KDS-003 GET /api/kitchen/orders filters by status', async ({ app, playwright, baseURL }) => {
    await app.createOrder({ lines: [{ itemSlug: 'soda' }] })
    await app.createOrder({ lines: [{ itemSlug: 'soda' }] })
    const k = await staffApi(playwright, baseURL!, 'kitchen')
    await k.setStatus(1002, 'accepted')
    const res = await k.request.get('/api/kitchen/orders?status=new')
    expect(res.status()).toBe(200)
    const body = await res.json()
    const list = Array.isArray(body) ? body : body.orders
    expect(list.map((o: { number: number }) => o.number)).toEqual([1001])
    await k.dispose()
  })

  test('KDS-007 invalid transitions are 409 INVALID_TRANSITION', async ({ app, playwright, baseURL }) => {
    await app.createOrder({ lines: [{ itemSlug: 'soda' }] })
    const k = await staffApi(playwright, baseURL!, 'kitchen')
    for (const status of ['ready', 'completed']) {
      const res = await k.request.post('/api/kitchen/orders/1001/status', { data: { status } })
      expect(res.status()).toBe(409)
      expect((await res.json()).error.code).toBe('INVALID_TRANSITION')
    }
    await k.dispose()
  })

  test('KDS-013 undo allowed within 60 s, rejected after', async ({ app, playwright, baseURL }) => {
    await app.createOrder({ lines: [{ itemSlug: 'soda' }] })
    await app.createOrder({ lines: [{ itemSlug: 'soda' }] })
    const k = await staffApi(playwright, baseURL!, 'kitchen')
    await k.setStatus(1001, 'accepted')
    await k.setStatus(1001, 'new') // undo
    await k.setStatus(1002, 'accepted')
    await app.setClock('2026-11-06T17:01:01-05:00')
    const res = await k.request.post('/api/kitchen/orders/1002/status', { data: { status: 'new' } })
    expect(res.status()).toBe(409)
    await k.dispose()
  })

  test('KDS-011 cancelling requires a reason', async ({ app, playwright, baseURL }) => {
    await app.createOrder({ lines: [{ itemSlug: 'soda' }] })
    const k = await staffApi(playwright, baseURL!, 'kitchen')
    const res = await k.request.post('/api/kitchen/orders/1001/status', { data: { status: 'cancelled' } })
    expect(res.status()).toBe(422)
    await k.dispose()
  })

  test('KDS-012 POST /api/kitchen/pause with null pauses indefinitely; DELETE resumes', async ({ request, playwright, baseURL }) => {
    const k = await staffApi(playwright, baseURL!, 'kitchen')
    expect((await k.request.post('/api/kitchen/pause', { data: { minutes: null } })).status()).toBe(200)
    expect((await (await request.get('/api/ordering-status')).json()).state).toBe('paused')
    expect((await k.request.delete('/api/kitchen/pause')).status()).toBe(200)
    expect((await (await request.get('/api/ordering-status')).json()).state).toBe('open')
    await k.dispose()
  })

  test('KDS-012 timed pause expires', async ({ request, app, playwright, baseURL }) => {
    const k = await staffApi(playwright, baseURL!, 'kitchen')
    await k.request.post('/api/kitchen/pause', { data: { minutes: 15 } })
    await k.dispose()
    expect((await (await request.get('/api/ordering-status')).json()).state).toBe('paused')
    await app.setClock('2026-11-06T17:16:00-05:00')
    expect((await (await request.get('/api/ordering-status')).json()).state).toBe('open')
  })

  test('KDS-008 delay endpoint only accepts 5 or 10', async ({ app, playwright, baseURL }) => {
    await app.createOrder({ lines: [{ itemSlug: 'soda' }] })
    const k = await staffApi(playwright, baseURL!, 'kitchen')
    expect((await k.request.post('/api/kitchen/orders/1001/delay', { data: { minutes: 10 } })).status()).toBe(200)
    expect((await k.request.post('/api/kitchen/orders/1001/delay', { data: { minutes: 7 } })).status()).toBe(422)
    await k.dispose()
  })

  test('KDS-003 SSE stream emits order.created', async ({ app, page }) => {
    await loginAs(page, 'kitchen')
    await page.goto('/kitchen')
    const event = page.evaluate(
      () =>
        new Promise<string>((resolve) => {
          const es = new EventSource('/api/kitchen/stream')
          es.addEventListener('order.created', (e) => {
            es.close()
            resolve((e as MessageEvent).data)
          })
        }),
    )
    await page.waitForTimeout(500)
    await app.createOrder({ lines: [{ itemSlug: 'soda' }] })
    expect(JSON.parse(await event).number).toBe(1001)
  })
})
