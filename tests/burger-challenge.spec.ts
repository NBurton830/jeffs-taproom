import { test, expect } from './fixtures/app'
import { PHONE_TEL } from './fixtures/menu'

// specs/20-burger-challenge.md

test.describe('Big Burger Challenge', () => {
  test('BBC-001 hero', async ({ page }) => {
    await page.goto('/burger-challenge')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText("Jeff's Big Burger Challenge")
    await expect(page.getByRole('main')).toContainText('$35.99')
    await expect(page.getByRole('main')).toContainText("Finish it in 30 minutes and it's free.")
  })

  test("BBC-002 what's in it", async ({ page }) => {
    await page.goto('/burger-challenge')
    const list = page.getByRole('region', { name: "What's in it" })
    for (const part of [
      '3 cheeseburgers',
      '2 Bacon Grilled Cheese Sandwiches',
      '1/2 lb fried onion petals',
      'pickles',
      'lettuce',
      'tomato',
      'ketchup',
      '1 lb krinkle-cut fries',
    ]) {
      await expect(list).toContainText(part)
    }
  })

  test('BBC-003 rules as an ordered list', async ({ page }) => {
    await page.goto('/burger-challenge')
    const rules = page.getByRole('region', { name: 'Rules' }).locator('ol > li')
    await expect(rules).toHaveCount(4)
    await expect(rules.nth(2)).toContainText('30 minutes')
    await expect(rules.nth(3)).toContainText(/dine-in/i)
  })

  test('BBC-004 Share the Challenge callout', async ({ page }) => {
    await page.goto('/burger-challenge')
    await expect(page.getByRole('main')).toContainText('Share the Challenge Burger')
    await expect(page.getByRole('main')).toContainText('$49.99')
    await expect(page.getByRole('main')).toContainText('In-house only')
  })

  test('BBC-005 Hall of Fame: approved winners fastest first', async ({ page }) => {
    await page.goto('/burger-challenge')
    const hall = page.getByTestId('hall-of-fame').locator('li')
    await expect(hall).toHaveCount(2)
    await expect(hall.nth(0)).toContainText('Big Mike')
    await expect(hall.nth(0)).toContainText('24:13')
    await expect(hall.nth(1)).toContainText('Sarah K.')
    await expect(hall.nth(1)).toContainText('28:40')
    await expect(page.getByRole('main')).not.toContainText('Hidden Hank')
  })

  test('BBC-005 Wall of Valiant Attempts', async ({ page }) => {
    await page.goto('/burger-challenge')
    const wall = page.getByTestId('valiant-attempts').locator('li')
    await expect(wall).toHaveCount(1)
    await expect(wall).toContainText('Tony R.')
  })

  test('BBC-006 call CTA, no online ordering', async ({ page }) => {
    await page.goto('/burger-challenge')
    await expect(page.getByRole('link', { name: 'Call to schedule your attempt' })).toHaveAttribute('href', PHONE_TEL)
    await expect(page.getByRole('button', { name: /^Add / })).toHaveCount(0)
  })
})
