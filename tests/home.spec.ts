import { test, expect } from './fixtures/app'
import { PHONE_DISPLAY, PHONE_TEL, WING_SAUCES } from './fixtures/menu'

// specs/11-home.md

test.describe('Home', () => {
  test('HOME-001 hero h1 and subhead', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText("Beer. Wings. Bridgeville's Taproom.")
  })

  test('HOME-002 Order Pickup and View Menu CTAs above the fold on mobile @mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    const main = page.getByRole('main')
    const order = main.getByRole('link', { name: 'Order Pickup' }).first()
    const menu = main.getByRole('link', { name: 'View Menu' }).first()
    await expect(order).toHaveAttribute('href', '/order')
    await expect(menu).toHaveAttribute('href', '/menu')
    await expect(order).toBeInViewport({ ratio: 1 })
    await expect(menu).toBeInViewport({ ratio: 1 })
  })

  test('HOME-002 CTAs navigate', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('main').getByRole('link', { name: 'Order Pickup' }).first().click()
    await expect(page).toHaveURL(/\/order$/)
  })

  test('HOME-003 hero shows status, address and tap-to-call', async ({ page }) => {
    await page.goto('/')
    const hero = page.getByRole('main').locator('section').first()
    await expect(hero).toContainText('Open now · until 12:00 AM')
    await expect(hero).toContainText('416 Market Street')
    await expect(hero.getByRole('link', { name: PHONE_DISPLAY })).toHaveAttribute('href', PHONE_TEL)
  })

  test("HOME-004 Today at Jeff's lists today's specials and events (Friday)", async ({ page }) => {
    await page.goto('/')
    const today = page.getByTestId('home-today')
    await expect(today).toHaveRole('region')
    await expect(today).toHaveAccessibleName("Today at Jeff's")
    await expect(today).toContainText('Happy Hour')
    await expect(today).toContainText('Fish Fry Friday')
    await expect(today).toContainText('Karaoke Night')
    await expect(today).not.toContainText('Wing Wednesday')
    await expect(today).not.toContainText('Retired Special')
  })

  test("HOME-004 shows today's hours when nothing is on (Sunday)", async ({ page, app }) => {
    await app.setClock('2026-11-01T12:00:00-05:00') // Sunday, no specials/events seeded
    await page.goto('/')
    const today = page.getByTestId('home-today')
    await expect(today).toContainText('11:00 AM')
    await expect(today).toContainText('9:00 PM')
  })

  test('HOME-005 fan favourites cards with Add opening the item dialog', async ({ page }) => {
    await page.goto('/')
    const section = page.getByRole('region', { name: 'Fan favourites' })
    for (const name of ['Bone-In Wings', "Jeff's Famous Cheeseburger", 'Rockfish & Chips', 'Loaded Nachos']) {
      await expect(section.getByRole('heading', { name })).toBeVisible()
    }
    await expect(section).toContainText('$14.95')
    await section.getByRole('button', { name: 'Add Rockfish & Chips' }).click()
    await expect(page.getByRole('dialog', { name: 'Rockfish & Chips' })).toBeVisible()
  })

  test('HOME-006 next 3 upcoming events and link to all', async ({ page }) => {
    await page.goto('/')
    const section = page.getByRole('region', { name: 'Upcoming events' })
    await expect(section.getByRole('article')).toHaveCount(3)
    await expect(section).toContainText('Karaoke Night')
    await expect(section).toContainText('Sunday Football Watch Party')
    await expect(section).toContainText('Trivia Night')
    await expect(section).not.toContainText('Halloween Bash')
    await expect(section.getByRole('link', { name: 'See all events' })).toHaveAttribute('href', '/events')
  })

  test('HOME-007 burger challenge teaser', async ({ page }) => {
    await page.goto('/')
    const section = page.getByRole('region', { name: 'Big Burger Challenge' })
    await expect(section).toContainText('$35.99')
    await expect(section).toContainText('30 minutes')
    await expect(section.getByRole('link').first()).toHaveAttribute('href', '/burger-challenge')
  })

  test('HOME-008 wing sauce strip lists all 11 sauces', async ({ page }) => {
    await page.goto('/')
    const section = page.getByRole('region', { name: 'Wing sauces' })
    for (const sauce of WING_SAUCES) await expect(section.getByText(sauce, { exact: true })).toBeVisible()
  })

  test('HOME-009 visit block with map, hours, directions', async ({ page }) => {
    await page.goto('/')
    const section = page.getByRole('region', { name: 'Visit us' })
    await expect(section.getByTestId('map')).toBeVisible()
    await expect(section).toContainText('416 Market Street')
    await expect(section.getByRole('link', { name: /directions/i })).toBeVisible()
  })

  test('HOME-011 sections are labelled regions; hero is the first section', async ({ page }) => {
    await page.goto('/')
    for (const name of ["Today at Jeff's", 'Fan favourites', 'Upcoming events', 'Big Burger Challenge', 'Wing sauces', 'Visit us']) {
      const region = page.getByRole('region', { name, exact: true })
      await expect(region, name).toHaveCount(1)
      await expect(region.getByRole('heading', { level: 2 }).first()).toHaveText(name)
    }
    await expect(page.locator('main section').first().getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('HOME-010 no dialog on load', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('dialog')).toHaveCount(0)
  })
})
