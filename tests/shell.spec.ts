import { test, expect, addItem, DEFAULT_NOW } from './fixtures/app'
import { PHONE_DISPLAY, PHONE_TEL } from './fixtures/menu'

// specs/10-site-shell.md

const PUBLIC_PAGES = ['/', '/menu', '/order', '/specials', '/events', '/on-tap', '/burger-challenge', '/private-events', '/visit']

test.describe('Site shell', () => {
  test('SHELL-001 every public page has banner, main#main and contentinfo landmarks', async ({ page }) => {
    for (const path of PUBLIC_PAGES) {
      await page.goto(path)
      await expect(page.getByRole('banner'), path).toBeVisible()
      await expect(page.locator('main#main'), path).toHaveCount(1)
      await expect(page.getByRole('contentinfo'), path).toBeVisible()
    }
  })

  test('SHELL-002 skip link is first focusable element and targets #main', async ({ page }) => {
    await page.goto('/')
    await page.keyboard.press('Tab')
    const skip = page.getByRole('link', { name: 'Skip to content' })
    await expect(skip).toBeFocused()
    await expect(skip).toHaveAttribute('href', '#main')
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/#main$/)
  })

  test('SHELL-003 primary nav links and aria-current @desktop', async ({ page }) => {
    await page.goto('/events')
    const nav = page.getByRole('navigation', { name: 'Primary' })
    const expected: [string, string][] = [
      ['Menu', '/menu'],
      ['Order Pickup', '/order'],
      ['Specials', '/specials'],
      ['Events', '/events'],
      ['On Tap', '/on-tap'],
      ['Burger Challenge', '/burger-challenge'],
      ['Private Events', '/private-events'],
      ['Visit', '/visit'],
    ]
    for (const [name, href] of expected) {
      await expect(nav.getByRole('link', { name, exact: true })).toHaveAttribute('href', href)
    }
    await expect(nav.getByRole('link', { name: 'Events', exact: true })).toHaveAttribute('aria-current', 'page')
    await expect(nav.getByRole('link', { name: 'Menu', exact: true })).not.toHaveAttribute('aria-current', 'page')
  })

  test('SHELL-004 mobile nav toggle, Escape closes and restores focus @mobile', async ({ page }) => {
    await page.goto('/')
    const toggle = page.getByRole('banner').getByRole('button', { name: 'Menu', exact: true })
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
    const nav = page.getByRole('navigation', { name: 'Primary' })
    await expect(nav.getByRole('link', { name: 'Visit', exact: true })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await expect(toggle).toBeFocused()
  })

  test('SHELL-005 VIS-010 open status badge while open (Fri 5 PM)', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('banner').getByTestId('open-status')).toHaveText('Open now · until 12:00 AM')
  })

  test('SHELL-005 VIS-010 closing soon within 60 minutes of close', async ({ page, app }) => {
    await app.setClock('2026-11-05T21:15:00-05:00') // Thu, closes 10 PM
    await page.goto('/')
    await expect(page.getByRole('banner').getByTestId('open-status')).toHaveText('Closing soon · until 10:00 PM')
  })

  test('SHELL-005 VIS-010 closed, opens later today', async ({ page, app }) => {
    await app.setClock('2026-11-06T09:00:00-05:00')
    await page.goto('/')
    await expect(page.getByRole('banner').getByTestId('open-status')).toHaveText('Closed · opens 11:00 AM')
  })

  test('SHELL-005 VIS-010 closed, opens tomorrow', async ({ page, app }) => {
    await app.setClock('2026-11-05T22:30:00-05:00') // Thu after close
    await page.goto('/')
    await expect(page.getByRole('banner').getByTestId('open-status')).toHaveText('Closed · opens Fri 11:00 AM')
  })

  test('SHELL-005 VIS-010 past-midnight close counts as previous day (Sat 12:30 AM is closed)', async ({ page, app }) => {
    await app.setClock('2026-11-07T00:30:00-05:00')
    await page.goto('/')
    await expect(page.getByRole('banner').getByTestId('open-status')).toHaveText('Closed · opens 11:00 AM')
  })

  test('SHELL-006 mobile sticky action bar: Call, Directions, Order @mobile', async ({ page }) => {
    await page.goto('/menu')
    const bar = page.getByTestId('mobile-action-bar')
    await expect(bar).toBeVisible()
    await expect(bar.getByRole('link', { name: 'Call' })).toHaveAttribute('href', PHONE_TEL)
    await expect(bar.getByRole('link', { name: 'Directions' })).toHaveAttribute('href', /maps|openstreetmap/)
    await expect(bar.getByRole('link', { name: 'Order' })).toHaveAttribute('href', '/order')
    await page.mouse.wheel(0, 3000)
    await expect(bar).toBeInViewport()
  })

  test('SHELL-006 no mobile action bar on desktop @desktop', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('mobile-action-bar')).toBeHidden()
  })

  test('SHELL-007 footer contents', async ({ page }) => {
    await page.goto('/')
    const footer = page.getByRole('contentinfo')
    await expect(footer).toContainText('416 Market Street')
    await expect(footer).toContainText('Bridgeville, DE 19933')
    await expect(footer.getByRole('link', { name: PHONE_DISPLAY })).toHaveAttribute('href', PHONE_TEL)
    await expect(footer).toContainText(`© ${new Date(DEFAULT_NOW).getFullYear()} Jeff's Taproom & Grill`)
    for (const day of ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']) await expect(footer).toContainText(day)
    await expect(footer).toContainText('11:00 AM')
  })

  test('SHELL-008 announcement banner shows and can be dismissed for the session', async ({ page, app }) => {
    await app.settings({ announcement: { enabled: true, text: 'Closed Thanksgiving Day' } })
    await page.goto('/')
    const banner = page.getByTestId('announcement')
    await expect(banner).toContainText('Closed Thanksgiving Day')
    await banner.getByRole('button', { name: /dismiss/i }).click()
    await expect(banner).toBeHidden()
    await page.goto('/menu')
    await expect(page.getByTestId('announcement')).toBeHidden()
  })

  test('SHELL-008 no announcement when disabled', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('announcement')).toHaveCount(0)
  })

  test('SHELL-009 cart button appears with item count after adding', async ({ page }) => {
    await page.goto('/menu')
    await expect(page.getByTestId('cart-button')).toHaveCount(0)
    await addItem(page, 'Sweet Potato Fries', { quantity: 2 })
    await expect(page.getByTestId('cart-count')).toHaveText('2')
    await expect(page.getByTestId('cart-button')).toHaveAccessibleName('Cart, 2 items')
    await page.goto('/visit')
    await expect(page.getByTestId('cart-button')).toBeVisible()
  })

  test('SHELL-010 web app manifest', async ({ request }) => {
    const res = await request.get('/manifest.webmanifest')
    expect(res.status()).toBe(200)
    const m = await res.json()
    expect(m.name).toBe("Jeff's Taproom & Grill")
    expect(m.short_name).toBe("Jeff's")
    expect(m.start_url).toBe('/')
    expect(m.display).toBe('standalone')
    expect(m.theme_color).toBeTruthy()
    const sizes = m.icons.map((i: { sizes: string }) => i.sizes)
    expect(sizes).toEqual(expect.arrayContaining(['192x192', '512x512']))
    expect(m.icons.some((i: { purpose?: string }) => i.purpose?.includes('maskable'))).toBe(true)
  })

  test('SHELL-010 manifest is linked from the document', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', '/manifest.webmanifest')
  })

  test('SHELL-011 service worker registers and serves offline page', async ({ page, context }) => {
    await page.goto('/')
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready
    })
    await page.goto('/menu') // warm cache
    await page.reload()
    await context.setOffline(true)
    await page.goto('/some-uncached-page-xyz').catch(() => {})
    await expect(page.getByText("You're offline.", { exact: false })).toBeVisible()
    await context.setOffline(false)
  })

  test('SHELL-012 cached menu works offline with stale-price banner', async ({ page, context }) => {
    await page.goto('/menu')
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready
    })
    await page.reload()
    await context.setOffline(true)
    await page.reload()
    await expect(page.getByRole('heading', { name: 'Taproom Famous Wings' })).toBeVisible()
    await expect(page.getByText("You're offline. Menu prices may be out of date. Ordering requires a connection.")).toBeVisible()
    await context.setOffline(false)
  })

  test('SHELL-020 branded 404', async ({ page }) => {
    const res = await page.goto('/definitely-not-a-page')
    expect(res?.status()).toBe(404)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('main').getByRole('link', { name: /menu/i }).first()).toHaveAttribute('href', '/menu')
    await expect(page.getByRole('main').getByRole('link', { name: /home/i }).first()).toHaveAttribute('href', '/')
  })
})
