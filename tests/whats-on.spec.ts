import { test, expect } from './fixtures/app'

// specs/18-events-specials-taps.md

test.describe('Events', () => {
  test('EVT-001 upcoming events ascending with date, badge and description', async ({ page }) => {
    await page.goto('/events')
    const ids = await page.locator('[data-testid^="event-"]').evaluateAll((els) => els.map((e) => e.getAttribute('data-testid')))
    expect(ids).toEqual(['event-karaoke-night', 'event-sunday-football', 'event-trivia-night', 'event-live-music-saturday'])
    const trivia = page.getByTestId('event-trivia-night')
    await expect(trivia).toHaveRole('article')
    await expect(trivia.getByRole('heading')).toHaveText('Trivia Night')
    await expect(trivia).toContainText('Wed, Nov 11 · 7:00 PM')
    await expect(trivia).toContainText('Trivia')
    await expect(page.getByTestId('event-karaoke-night')).toContainText('Fri, Nov 6 · 9:00 PM')
    await expect(page.getByTestId('event-live-music-saturday')).toContainText('Live Music')
  })

  test('EVT-001 an event earlier today is still listed', async ({ page, app }) => {
    await app.setClock('2026-11-06T23:30:00-05:00')
    await page.goto('/events')
    await expect(page.getByTestId('event-karaoke-night')).toBeVisible()
  })

  test('EVT-002 past events are never shown', async ({ page }) => {
    await page.goto('/events')
    await expect(page.getByTestId('event-halloween-bash')).toHaveCount(0)
    expect((await page.goto('/events/halloween-bash'))?.status()).toBe(404)
  })

  test('EVT-002 empty state', async ({ page, app }) => {
    await app.setClock('2026-12-01T12:00:00-05:00')
    await page.goto('/events')
    await expect(page.getByText('No events on the calendar right now — follow us for updates')).toBeVisible()
  })

  test('EVT-003 detail page with Add to calendar', async ({ page }) => {
    await page.goto('/events/trivia-night')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Trivia Night')
    await expect(page.getByRole('link', { name: 'Add to calendar' })).toHaveAttribute('href', '/events/trivia-night/ics')
  })

  test('EVT-003 ICS file is valid with Eastern DTSTART', async ({ request }) => {
    const res = await request.get('/events/trivia-night/ics')
    expect(res.status()).toBe(200)
    expect(res.headers()['content-type']).toContain('text/calendar')
    const ics = (await res.text()).replace(/\r\n/g, '\n')
    expect(ics).toMatch(/^BEGIN:VCALENDAR\n/)
    expect(ics).toContain('VERSION:2.0')
    expect(ics).toContain('BEGIN:VEVENT')
    expect(ics).toMatch(/UID:.+/)
    expect(ics).toContain('SUMMARY:Trivia Night')
    expect(ics).toContain('DTSTART;TZID=America/New_York:20261111T190000')
    expect(ics).toMatch(/LOCATION:416 Market Street/)
    expect(ics.trim()).toMatch(/END:VCALENDAR$/)
  })

  test('EVT-004 category filter chips', async ({ page }) => {
    await page.goto('/events')
    const chip = page.getByRole('button', { name: 'Trivia', exact: true })
    await chip.click()
    await expect(chip).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByTestId('event-trivia-night')).toBeVisible()
    await expect(page.getByTestId('event-sunday-football')).toBeHidden()
    await page.getByRole('button', { name: 'Sports', exact: true }).click()
    await expect(page.getByTestId('event-sunday-football')).toBeVisible()
    await expect(page.getByTestId('event-live-music-saturday')).toBeHidden()
  })
})

test.describe('Specials', () => {
  const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

  test('SPC-001 weekly grid of active specials', async ({ page }) => {
    await page.goto('/specials')
    for (const d of days) await expect(page.getByTestId(`specials-day-${d}`)).toHaveCount(1)
    for (const d of ['mon', 'tue', 'wed', 'thu', 'fri']) {
      const day = page.getByTestId(`specials-day-${d}`)
      await expect(day).toContainText('Happy Hour')
      await expect(day).toContainText('$1 off drafts')
      await expect(day).toContainText('4–7 PM')
    }
    await expect(page.getByTestId('specials-day-fri')).toContainText('Fish Fry Friday')
    await expect(page.getByTestId('specials-day-fri')).toContainText('Rockfish & Chips $12.95')
    await expect(page.getByTestId('specials-day-wed')).toContainText('Wing Wednesday')
    await expect(page.getByTestId('specials-day-tue')).toContainText('Burger Tuesday')
    await expect(page.getByTestId('specials-day-sat')).not.toContainText('Happy Hour')
    await expect(page.getByRole('main')).not.toContainText('Retired Special')
  })

  test('SPC-002 today is highlighted', async ({ page }) => {
    await page.goto('/specials')
    await expect(page.getByTestId('specials-day-fri')).toHaveAttribute('aria-current', 'date')
    await expect(page.locator('[data-testid^="specials-day-"][aria-current="date"]')).toHaveCount(1)
  })

  test('SPC-002 today is listed first on mobile @mobile', async ({ page }) => {
    await page.goto('/specials')
    const first = page.locator('[data-testid^="specials-day-"]:visible').first()
    await expect(first).toHaveAttribute('data-testid', 'specials-day-fri')
  })

  test('SPC-003 Happening now during the time window only', async ({ page, app }) => {
    await page.goto('/specials')
    const fri = page.getByTestId('specials-day-fri')
    await expect(fri.getByText('Happening now')).toHaveCount(1)
    await app.setClock('2026-11-06T19:30:00-05:00')
    await page.reload()
    await expect(page.getByTestId('specials-day-fri').getByText('Happening now')).toHaveCount(0)
  })
})

test.describe('On Tap', () => {
  test('TAP-001 on-tap list with brewery, style and ABV, then coming soon', async ({ page }) => {
    await page.goto('/on-tap')
    const on = page.getByRole('region', { name: 'On tap now' })
    for (const name of ['Dogfish Head 60 Minute IPA', 'Miller Lite', 'Yuengling Lager', 'Guinness']) await expect(on).toContainText(name)
    await expect(on).toContainText('Dogfish Head')
    await expect(on).toContainText('IPA')
    await expect(on).toContainText('6.0% ABV')
    await expect(on).not.toContainText('Seasonal Pumpkin Ale')
    const soon = page.getByRole('region', { name: 'Coming soon' })
    await expect(soon).toContainText('Seasonal Pumpkin Ale')
  })

  test('TAP-002 kicked taps hidden; updated time shown', async ({ page }) => {
    await page.goto('/on-tap')
    await expect(page.getByRole('main')).not.toContainText('Old Kicked Keg')
    await expect(page.getByText(/^Updated /)).toBeVisible()
  })

  test('TAP-003 to-go notice; no ordering of beer', async ({ page }) => {
    await page.goto('/on-tap')
    await expect(page.getByText('Beer is available in-house. Ask your bartender about to-go options.')).toBeVisible()
    await expect(page.getByRole('button', { name: /^Add / })).toHaveCount(0)
  })
})
