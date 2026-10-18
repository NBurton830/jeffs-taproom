import { test, expect, staffApi } from './fixtures/app'
import { ADDRESS, PHONE_DISPLAY, PHONE_TEL } from './fixtures/menu'
import type { Page } from '@playwright/test'

// specs/19-visit-contact.md

const GOOGLE = 'https://www.google.com/maps/dir/?api=1&destination=416+Market+Street,+Bridgeville,+DE+19933'
const APPLE = 'https://maps.apple.com/?daddr=416+Market+Street,+Bridgeville,+DE+19933'

test.describe('Visit', () => {
  test('VIS-001 address and phone', async ({ page }) => {
    await page.goto('/visit')
    await expect(page.getByRole('main').locator('address')).toContainText(ADDRESS)
    await expect(page.getByRole('main').getByRole('link', { name: PHONE_DISPLAY })).toHaveAttribute('href', PHONE_TEL)
  })

  test('VIS-002 VIS-011 hours table with today highlighted and past-midnight close', async ({ page }) => {
    await page.goto('/visit')
    const table = page.getByRole('table', { name: 'Hours' })
    await expect(table.locator('tbody tr')).toHaveCount(7)
    const today = table.locator('tr[aria-current="date"]')
    await expect(today).toHaveCount(1)
    await expect(today).toContainText('Fri')
    await expect(today).toContainText('11:00 AM')
    await expect(today).toContainText('12:00 AM')
    const expected: [string, string][] = [
      ['Mon', '11:00 AM – 10:00 PM'],
      ['Tue', '11:00 AM – 10:00 PM'],
      ['Wed', '11:00 AM – 10:00 PM'],
      ['Thu', '11:00 AM – 10:00 PM'],
      ['Fri', '11:00 AM – 12:00 AM'],
      ['Sat', '11:00 AM – 12:00 AM'],
      ['Sun', '11:00 AM – 9:00 PM'],
    ]
    for (const [day, hours] of expected) await expect(table.locator('tbody tr', { hasText: day }), day).toContainText(hours)
  })

  test('VIS-002 holiday exceptions in the next 14 days are listed', async ({ page, playwright, baseURL }) => {
    const m = await staffApi(playwright, baseURL!, 'manager')
    const hours = await (await m.request.get('/api/globals/hours')).json()
    await m.request.post('/api/globals/hours', {
      data: {
        ...hours,
        exceptions: [
          { date: '2026-11-11', closed: true, note: 'Veterans Day' },
          { date: '2026-11-26', closed: true, note: 'Thanksgiving' },
        ],
      },
    })
    await m.dispose()
    await page.goto('/visit')
    await expect(page.getByRole('main')).toContainText('Veterans Day')
    await expect(page.getByRole('main')).not.toContainText('Thanksgiving')
  })

  async function directions(page: Page) {
    return page.getByRole('main').getByRole('link', { name: 'Get directions' })
  }

  test('VIS-003 directions link defaults to Google Maps in a new tab', async ({ page }) => {
    await page.goto('/visit')
    const link = await directions(page)
    await expect(link).toHaveAttribute('href', GOOGLE)
    await expect(link).toHaveAttribute('target', '_blank')
    await expect(link).toHaveAttribute('rel', /noopener/)
  })

  test('VIS-003 server renders the Google link', async ({ request }) => {
    const html = (await (await request.get('/visit')).text()).replace(/&amp;/g, '&')
    expect(html).toContain(GOOGLE)
  })

  test('VIS-003 Apple devices get Apple Maps', async ({ browser, baseURL }) => {
    const ctx = await browser.newContext({
      baseURL,
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
    })
    const page = await ctx.newPage()
    await page.goto('/visit')
    await expect(await directions(page)).toHaveAttribute('href', APPLE)
    await ctx.close()
  })

  test('VIS-004 OSM map with attribution and marker', async ({ page }) => {
    await page.goto('/visit')
    const map = page.getByTestId('map')
    await expect(map).toBeVisible()
    await expect(map).toContainText('OpenStreetMap')
    await expect(map.locator('.leaflet-marker-icon')).toHaveCount(1)
  })
})

test.describe('Private events', () => {
  const fields = ['Name', 'Email', 'Phone', 'Event date', 'Number of guests', 'Event type', 'Message']

  async function fill(page: Page) {
    await page.getByLabel('Name', { exact: true }).fill('Casey Lee')
    await page.getByLabel('Email', { exact: true }).fill('casey@example.com')
    await page.getByLabel('Phone', { exact: true }).fill('302-555-0199')
    await page.getByLabel('Event date').fill('2026-11-21')
    await page.getByLabel('Number of guests').fill('25')
    await page.getByLabel('Event type').selectOption('Birthday')
    await page.getByLabel('Message').fill('Back room for a 40th, around 7 PM.')
  }

  test('VIS-020 form fields', async ({ page }) => {
    await page.goto('/private-events')
    for (const f of fields) await expect(page.getByLabel(f, { exact: true }), f).toBeVisible()
    const types = await page.getByLabel('Event type').locator('option').allTextContents()
    expect(types).toEqual(expect.arrayContaining(['Birthday', 'Team party', 'Watch party', 'Catering', 'Other']))
    await expect(page.getByRole('button', { name: 'Send inquiry' })).toBeVisible()
  })

  test('VIS-021 success stores the inquiry and notifies the restaurant', async ({ page, app, playwright, baseURL }) => {
    await page.goto('/private-events')
    await fill(page)
    await page.getByRole('button', { name: 'Send inquiry' }).click()
    await expect(page.getByText("Thanks! We'll get back to you within 2 business days.")).toBeVisible()
    const m = await staffApi(playwright, baseURL!, 'manager')
    const docs = (await (await m.request.get('/api/inquiries')).json()).docs
    await m.dispose()
    expect(docs).toHaveLength(1)
    expect(docs[0]).toMatchObject({ name: 'Casey Lee', email: 'casey@example.com', guests: 25, type: 'Birthday', status: 'new' })
    const mail = await app.outbox()
    expect(mail.some((x) => x.to === 'orders@jeffstaproom.test' && x.text.includes('Casey Lee'))).toBe(true)
  })

  test('VIS-022 validation: error summary, date must be after today, guests 1–200', async ({ page }) => {
    await page.goto('/private-events')
    await page.getByRole('button', { name: 'Send inquiry' }).click()
    const summary = page.getByRole('alert').filter({ has: page.getByRole('link') })
    await expect(summary).toBeFocused()
    await fill(page)
    await page.getByLabel('Event date').fill('2026-11-06')
    await page.getByLabel('Number of guests').fill('500')
    await page.getByRole('button', { name: 'Send inquiry' }).click()
    await expect(page.getByLabel('Event date')).toHaveAttribute('aria-invalid', 'true')
    await expect(page.getByLabel('Number of guests')).toHaveAttribute('aria-invalid', 'true')
    await expect(page.getByLabel('Name', { exact: true })).not.toHaveAttribute('aria-invalid', 'true')
  })

  const body = {
    name: 'Casey Lee',
    email: 'casey@example.com',
    phone: '3025550199',
    date: '2026-11-21',
    guests: 25,
    type: 'Birthday',
    message: 'Hi',
    website: '',
  }

  test('VIS-022 SEC-004 honeypot stores nothing', async ({ request, playwright, baseURL }) => {
    const res = await request.post('/api/inquiries', { data: { ...body, website: 'spam' } })
    expect(res.status()).toBeLessThan(300)
    const m = await staffApi(playwright, baseURL!, 'manager')
    expect((await (await m.request.get('/api/inquiries')).json()).docs).toHaveLength(0)
    await m.dispose()
  })

  test('VIS-022 SEC-003 inquiries are rate limited to 3 per 10 minutes', async ({ request }) => {
    for (let i = 0; i < 3; i++) expect((await request.post('/api/inquiries', { data: body })).status()).toBeLessThan(300)
    const res = await request.post('/api/inquiries', { data: body })
    expect(res.status()).toBe(429)
    expect(res.headers()['retry-after']).toBeTruthy()
  })
})
