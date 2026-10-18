import AxeBuilder from '@axe-core/playwright'
import { test, expect, addItem, addWorkedExample, openItem, openCart, loginAs, tabTo, WORKED_EXAMPLE_LINES } from './fixtures/app'
import type { Page } from '@playwright/test'

// specs/30-accessibility.md

const PUBLIC = ['/', '/menu', '/order', '/events', '/specials', '/on-tap', '/visit', '/private-events', '/burger-challenge', '/accessibility']

async function expectNoSeriousViolations(page: Page, label: string) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
  const bad = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
  expect(
    bad.map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(', ')})`),
    label,
  ).toEqual([])
}

test.describe('Accessibility', () => {
  test('A11Y-001 axe: public pages', async ({ page }) => {
    for (const path of PUBLIC) {
      await page.goto(path)
      await expectNoSeriousViolations(page, path)
    }
  })

  test('A11Y-001 axe: 404 page', async ({ page }) => {
    await page.goto('/nope-not-here')
    await expectNoSeriousViolations(page, '404')
  })

  test('A11Y-001 axe: item dialog and cart drawer open', async ({ page }) => {
    await page.goto('/order')
    await openItem(page, 'Bone-In Wings')
    await expectNoSeriousViolations(page, 'item dialog')
    await page.keyboard.press('Escape')
    await addItem(page, 'Soda')
    await openCart(page)
    await expectNoSeriousViolations(page, 'cart drawer')
  })

  test('A11Y-001 axe: checkout with a cart, including error state', async ({ page }) => {
    await page.goto('/order')
    await addWorkedExample(page)
    await page.goto('/order/checkout')
    await expectNoSeriousViolations(page, 'checkout')
    await page.getByRole('button', { name: /^Place order/ }).click()
    await expectNoSeriousViolations(page, 'checkout errors')
  })

  test('A11Y-001 axe: confirmation page', async ({ page, app }) => {
    const order = await app.createOrder({ lines: WORKED_EXAMPLE_LINES })
    await page.goto(order.statusUrl)
    await expectNoSeriousViolations(page, 'confirmation')
  })

  test('A11Y-001 axe: kitchen login and board @kds', async ({ page, app }) => {
    await page.goto('/kitchen/login')
    await expectNoSeriousViolations(page, 'kitchen login')
    await app.createOrder({ lines: WORKED_EXAMPLE_LINES })
    await loginAs(page, 'kitchen')
    await page.goto('/kitchen')
    await expect(page.getByTestId('kds-ticket-1001')).toBeVisible()
    await expectNoSeriousViolations(page, 'kitchen board')
  })

  test('A11Y-002 full ordering flow with the keyboard only', async ({ page }) => {
    await page.goto('/order')
    await tabTo(page, page.getByRole('button', { name: "Add Jeff's Famous Cheeseburger", exact: true }))
    await page.keyboard.press('Enter')
    const dialog = page.getByRole('dialog', { name: "Jeff's Famous Cheeseburger" })
    await expect(dialog).toBeVisible()
    await tabTo(page, dialog.getByRole('radio', { name: 'American' }), 40)
    await page.keyboard.press('Space')
    await expect(dialog.getByRole('radio', { name: 'American' })).toBeChecked()
    await tabTo(page, dialog.getByRole('button', { name: /^Add to order/ }), 40)
    await page.keyboard.press('Enter')
    await expect(dialog).toBeHidden()
    await tabTo(page, page.getByTestId('cart-button'))
    await page.keyboard.press('Enter')
    const drawer = page.getByRole('dialog', { name: 'Your order' })
    await tabTo(page, drawer.getByRole('link', { name: 'Checkout' }), 40)
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/order\/checkout$/)
    await tabTo(page, page.getByLabel('Name', { exact: true }))
    await page.keyboard.type('Pat Doe')
    await tabTo(page, page.getByLabel('Phone', { exact: true }), 10)
    await page.keyboard.type('3025550123')
    await tabTo(page, page.getByRole('button', { name: /^Place order/ }))
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/order\/confirmation\//)
  })

  test('A11Y-002 visible focus outline ≥ 2 px', async ({ page }) => {
    await page.goto('/menu')
    const targets = [
      page.getByRole('link', { name: 'Skip to content' }),
      page.getByRole('searchbox', { name: 'Search the menu' }),
      page.getByRole('button', { name: 'Add Cheese Sticks', exact: true }),
    ]
    for (const t of targets) {
      await tabTo(page, t)
      const style = await t.evaluate((el) => {
        const s = getComputedStyle(el)
        return { style: s.outlineStyle, width: parseFloat(s.outlineWidth) }
      })
      expect(style.style).not.toBe('none')
      expect(style.width).toBeGreaterThanOrEqual(2)
    }
  })

  test('A11Y-004 exactly one h1 and no skipped heading levels', async ({ page }) => {
    for (const path of [...PUBLIC, '/events/trivia-night']) {
      await page.goto(path)
      const levels = await page.locator('h1, h2, h3, h4, h5, h6').evaluateAll((els) =>
        els.filter((e) => (e as HTMLElement).offsetParent !== null || getComputedStyle(e).position === 'fixed').map((e) => Number(e.tagName[1])),
      )
      expect(levels.filter((l) => l === 1), path).toHaveLength(1)
      for (let i = 1; i < levels.length; i++) expect(levels[i] - levels[i - 1], `${path} heading ${i}`).toBeLessThanOrEqual(1)
    }
  })

  test('A11Y-005 html lang and unique, well-formed titles', async ({ page }) => {
    const titles = new Map<string, string>()
    for (const path of PUBLIC) {
      await page.goto(path)
      await expect(page.locator('html')).toHaveAttribute('lang', 'en')
      titles.set(path, await page.title())
    }
    expect(titles.get('/')).toBe("Jeff's Taproom & Grill | Bridgeville, DE")
    for (const [path, title] of titles) if (path !== '/') expect(title, path).toMatch(/^.+ \| Jeff's Taproom & Grill$/)
    expect(new Set(titles.values()).size).toBe(titles.size)
  })

  test('A11Y-006 toasts are polite live regions', async ({ page }) => {
    await page.goto('/menu')
    await addItem(page, 'Soda')
    const toast = page.getByTestId('toast')
    const live = await toast.evaluate((el) => el.closest('[aria-live]')?.getAttribute('aria-live') ?? el.getAttribute('aria-live'))
    expect(live).toBe('polite')
  })

  test('A11Y-007 primary touch targets are at least 44×44', async ({ page }) => {
    const check = async (loc: ReturnType<Page['locator']>, label: string) => {
      const box = await loc.boundingBox()
      expect(box, label).not.toBeNull()
      expect(box!.width, `${label} width`).toBeGreaterThanOrEqual(44)
      expect(box!.height, `${label} height`).toBeGreaterThanOrEqual(44)
    }
    await page.goto('/order')
    await check(page.getByRole('button', { name: 'Add Cheese Sticks', exact: true }), 'Add')
    const dialog = await openItem(page, 'Cheese Sticks')
    await check(dialog.getByRole('button', { name: 'Increase quantity' }), 'stepper +')
    await check(dialog.getByRole('button', { name: 'Decrease quantity' }), 'stepper −')
    await check(dialog.getByRole('button', { name: /^Add to order/ }), 'Add to order')
    await dialog.getByRole('button', { name: /^Add to order/ }).click()
    const drawer = await openCart(page)
    await check(drawer.getByRole('link', { name: 'Checkout' }), 'Checkout')
    await page.goto('/order/checkout')
    await check(page.getByRole('button', { name: /^Place order/ }), 'Place order')
  })

  test('A11Y-007 KDS buttons are at least 44×44 @kds', async ({ page, app }) => {
    await app.createOrder({ lines: [{ itemSlug: 'soda' }] })
    await loginAs(page, 'kitchen')
    await page.goto('/kitchen')
    for (const name of ['Accept', 'Cancel order', '+5 min']) {
      const box = await page.getByTestId('kds-ticket-1001').getByRole('button', { name }).boundingBox()
      expect(box!.width, name).toBeGreaterThanOrEqual(44)
      expect(box!.height, name).toBeGreaterThanOrEqual(44)
    }
  })

  test('A11Y-008 required fields are marked with text', async ({ page }) => {
    await page.goto('/order')
    await addItem(page, 'Soda')
    await page.goto('/order/checkout')
    for (const id of ['Name', 'Phone']) {
      const input = page.getByLabel(id, { exact: true })
      await expect(input).toHaveAttribute('aria-required', 'true')
      await expect(input, id).toHaveAccessibleDescription(/Required/)
    }
  })

  test('A11Y-009 reduced motion: no running animations when opening dialogs', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/menu')
    await openItem(page, 'Cheese Sticks')
    const running = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length)
    expect(running).toBe(0)
  })

  test('A11Y-010 every image has an alt attribute', async ({ page }) => {
    for (const path of PUBLIC) {
      await page.goto(path)
      const missing = await page.locator('img:not([alt])').count()
      expect(missing, path).toBe(0)
    }
  })

  test('A11Y-011 reflows at 320 px without horizontal scroll', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 })
    for (const path of PUBLIC) {
      await page.goto(path)
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      expect(overflow, path).toBeLessThanOrEqual(0)
    }
  })

  test('A11Y-012 accessibility statement with contact', async ({ page }) => {
    await page.goto('/accessibility')
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/accessibility/i)
    await expect(page.getByRole('main').locator('a[href^="tel:"], a[href^="mailto:"]').first()).toBeVisible()
    await expect(page.getByRole('main')).toContainText('WCAG 2.2')
  })

  test('A11Y-003 status is not conveyed by colour alone (sold out has text)', async ({ page, app }) => {
    await app.updateItem('soda', { available: false })
    await page.goto('/menu')
    await expect(page.getByTestId('menu-item-soda')).toContainText('Sold out today')
  })
})
