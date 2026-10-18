import { test, expect, loginAs, staffApi, STAFF } from './fixtures/app'
import type { APIRequestContext } from '@playwright/test'

// specs/17-admin-cms.md

async function itemId(request: APIRequestContext, slug: string) {
  const res = await request.get(`/api/menu-items?where[slug][equals]=${slug}&depth=0`)
  expect(res.status()).toBe(200)
  return (await res.json()).docs[0].id as string | number
}

async function publicItem(request: APIRequestContext, slug: string) {
  const menu = await (await request.get('/api/menu')).json()
  return menu.categories.flatMap((c: { items: any[] }) => c.items).find((i: { slug: string }) => i.slug === slug)
}

test.describe('Admin / CMS', () => {
  test('ADM-001 /admin requires login', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/admin\/login/)
  })

  test('ADM-001 kitchen role: may toggle availability and read orders, nothing else', async ({ request, app, playwright, baseURL }) => {
    await app.createOrder({ lines: [{ itemSlug: 'soda' }] })
    const k = await staffApi(playwright, baseURL!, 'kitchen')
    const id = await itemId(k.request, 'soda')
    expect((await k.request.patch(`/api/menu-items/${id}`, { data: { available: false } })).status()).toBe(200)
    expect((await publicItem(request, 'soda')).available).toBe(false)
    const priceAttempt = await k.request.patch(`/api/menu-items/${id}`, { data: { variants: [{ label: '', priceCents: 1, isMarketPrice: false }] } })
    expect([200, 403]).toContain(priceAttempt.status())
    expect((await publicItem(request, 'soda')).variants[0].priceCents).toBe(300)
    expect((await k.request.get('/api/orders')).status()).toBe(200)
    expect((await k.request.post('/api/events', { data: { title: 'Nope', slug: 'nope', startsAt: '2026-11-20T20:00:00-05:00', category: 'other' } })).status()).toBe(403)
    const users = await (await k.request.get('/api/users')).json()
    expect(users.docs.map((u: { email: string }) => u.email)).toEqual(['kitchen@jeffstaproom.test'])
    await k.dispose()
  })

  test('ADM-001 manager edits content but not users; admin manages users', async ({ playwright, baseURL }) => {
    const m = await staffApi(playwright, baseURL!, 'manager')
    const ev = await m.request.post('/api/events', {
      data: { title: 'Pool Tournament', slug: 'pool-tournament', startsAt: '2026-11-20T20:00:00-05:00', category: 'other', description: 'Bring your cue.' },
    })
    expect(ev.status()).toBe(201)
    const newUser = { email: 'new@jeffstaproom.test', password: 'NewUser!test1', role: 'kitchen' }
    expect((await m.request.post('/api/users', { data: newUser })).status()).toBe(403)
    await m.dispose()
    const a = await staffApi(playwright, baseURL!, 'admin')
    expect((await a.request.post('/api/users', { data: newUser })).status()).toBe(201)
    await a.dispose()
  })

  test('ADM-002 price edit by a manager shows on the next menu load', async ({ page, playwright, baseURL }) => {
    await page.goto('/menu')
    await expect(page.getByTestId('menu-item-cheese-sticks').getByTestId('item-price')).toHaveText('$8.50')
    const m = await staffApi(playwright, baseURL!, 'manager')
    const id = await itemId(m.request, 'cheese-sticks')
    const res = await m.request.patch(`/api/menu-items/${id}`, { data: { variants: [{ label: '', priceCents: 925, isMarketPrice: false }] } })
    expect(res.status()).toBe(200)
    await m.dispose()
    await page.reload()
    await expect(page.getByTestId('menu-item-cheese-sticks').getByTestId('item-price')).toHaveText('$9.25')
  })

  test('ADM-002 edit made through the admin UI', async ({ page }) => {
    await loginAs(page, 'manager')
    await page.goto('/admin/collections/menu-items?where[slug][equals]=soda')
    await page.getByRole('link', { name: 'Soda', exact: true }).first().click()
    await page.getByLabel('Description').fill('Pepsi products. One refill included (dine-in).')
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByText(/updated successfully/i)).toBeVisible()
    await page.goto('/menu')
    await expect(page.getByTestId('menu-item-soda')).toContainText('Pepsi products.')
  })

  test('ADM-003 sidebar groups', async ({ page }) => {
    await loginAs(page, 'admin')
    await page.goto('/admin')
    for (const group of ['Menu', 'Orders', "What's On", 'Burger Challenge', 'Inquiries', 'Site', 'Staff']) {
      await expect(page.getByText(group, { exact: true }).first(), group).toBeVisible()
    }
  })

  test('ADM-003 kitchen does not see Staff', async ({ page }) => {
    await loginAs(page, 'kitchen')
    await page.goto('/admin')
    await expect(page.getByRole('link', { name: 'Users' })).toHaveCount(0)
  })

  test('ADM-004 orders list default columns', async ({ page, app }) => {
    await app.createOrder({ lines: [{ itemSlug: 'soda' }] })
    await loginAs(page, 'manager')
    await page.goto('/admin/collections/orders')
    const head = page.locator('table thead')
    for (const col of ['Number', 'Status', 'Customer', 'Pickup', 'Total', 'Payment', 'Created']) await expect(head, col).toContainText(col)
    await expect(page.locator('table tbody tr')).toHaveCount(1)
  })

  test('ADM-005 holiday exception overrides hours everywhere', async ({ page, request, playwright, baseURL }) => {
    const m = await staffApi(playwright, baseURL!, 'manager')
    const hours = await (await m.request.get('/api/globals/hours')).json()
    const res = await m.request.post('/api/globals/hours', {
      data: { ...hours, exceptions: [{ date: '2026-11-06', closed: true, note: 'Staff party' }] },
    })
    expect(res.status()).toBe(200)
    await m.dispose()
    await page.goto('/')
    await expect(page.getByRole('banner').getByTestId('open-status')).toHaveText('Closed · opens Sat 11:00 AM')
    expect((await (await request.get('/api/ordering-status')).json()).state).toBe('closed')
    await page.goto('/visit')
    await expect(page.getByRole('main')).toContainText('Staff party')
  })

  test('ADM-005 exception with special hours', async ({ page, playwright, baseURL }) => {
    const m = await staffApi(playwright, baseURL!, 'manager')
    const hours = await (await m.request.get('/api/globals/hours')).json()
    await m.request.post('/api/globals/hours', {
      data: { ...hours, exceptions: [{ date: '2026-11-06', closed: false, open: '11:00', close: '18:00', note: 'Early close' }] },
    })
    await m.dispose()
    await page.goto('/')
    await expect(page.getByRole('banner').getByTestId('open-status')).toHaveText('Closing soon · until 6:00 PM')
  })

  test('ADM-007 inline availability switches and Mark all available', async ({ page, request, app }) => {
    await app.updateItem('onion-petals', { available: false })
    await app.updateItem('soda', { available: false })
    await loginAs(page, 'manager')
    await page.goto('/admin/collections/menu-items?limit=100')
    await expect(page.getByRole('switch', { name: 'Onion Petals' })).toHaveAttribute('aria-checked', 'false')
    await page.getByRole('button', { name: 'Mark all available' }).click()
    await expect(page.getByRole('switch', { name: 'Onion Petals' })).toHaveAttribute('aria-checked', 'true')
    expect((await publicItem(request, 'onion-petals')).available).toBe(true)
    expect((await publicItem(request, 'soda')).available).toBe(true)
  })

  test('SEC-009 admin login is locked after 5 failed attempts', async ({ request }) => {
    for (let i = 0; i < 5; i++) {
      await request.post('/api/users/login', { data: { email: STAFF.manager.email, password: 'wrong' } })
    }
    const res = await request.post('/api/users/login', { data: STAFF.manager })
    expect(res.status()).not.toBe(200)
  })
})
