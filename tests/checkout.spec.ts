import { test, expect, addItem, addWorkedExample, fillCustomer, type AppApi } from './fixtures/app'
import type { Page } from '@playwright/test'

// specs/14-checkout.md (UI). API contract: orders-api.spec.ts

async function toCheckout(page: Page) {
  await page.goto('/order')
  await addWorkedExample(page)
  await page.goto('/order/checkout')
}

const pickup = (page: Page) => page.getByRole('radiogroup', { name: 'Pickup time' })
const slotSelect = (page: Page) => page.getByRole('combobox', { name: 'Pickup time' })
const summary = (page: Page) => page.getByTestId('order-summary')
const placeOrder = (page: Page) => page.getByRole('button', { name: /^Place order · \$/ })

test.describe('Checkout', () => {
  test('CHK-030 back-to-menu link and summary are visible', async ({ page }) => {
    await toCheckout(page)
    await expect(page.getByRole('link', { name: '← Back to menu' })).toHaveAttribute('href', '/order')
    await expect(summary(page)).toBeVisible()
    for (const s of ['Pickup time', 'Your details', 'Payment & tip', 'Review']) {
      await expect(page.getByRole('heading', { name: new RegExp(s) })).toBeVisible()
    }
  })

  test('CHK-010 CHK-011 ASAP is default and shows the estimate', async ({ page }) => {
    await toCheckout(page)
    const asap = pickup(page).getByRole('radio', { name: 'ASAP — ready around 5:20 PM' })
    await expect(asap).toBeChecked()
    await expect(pickup(page).getByRole('radio', { name: 'Schedule for later' })).not.toBeChecked()
    await expect(slotSelect(page)).toBeHidden()
  })

  test('CHK-011 estimate rounds up to the next 5 minutes', async ({ page, app }) => {
    await app.setClock('2026-11-06T17:03:00-05:00')
    await toCheckout(page)
    await expect(pickup(page).getByRole('radio', { name: 'ASAP — ready around 5:25 PM' })).toBeVisible()
  })

  test('CHK-012 scheduled slots on a 15-minute grid from now+lead to close−30', async ({ page }) => {
    await toCheckout(page)
    await pickup(page).getByRole('radio', { name: 'Schedule for later' }).check()
    const options = slotSelect(page).locator('option:not([value=""])')
    await expect(options.first()).toHaveText('5:30 PM')
    await expect(options.last()).toHaveText('11:30 PM')
    await expect(options).toHaveCount(25)
  })

  test('CHK-013 before opening: ASAP disabled, schedule preselected, first slot 11:30 AM', async ({ page, app }) => {
    await app.setClock('2026-11-06T09:00:00-05:00')
    await toCheckout(page)
    await expect(pickup(page).getByRole('radio', { name: /^ASAP/ })).toBeDisabled()
    await expect(pickup(page)).toContainText('ASAP available once we open at 11:00 AM')
    await expect(pickup(page).getByRole('radio', { name: 'Schedule for later' })).toBeChecked()
    await expect(slotSelect(page).locator('option:not([value=""])').first()).toHaveText('11:30 AM')
  })

  test('CHK-014 no slots left: place order disabled with reason', async ({ page, app }) => {
    await page.goto('/order')
    await addItem(page, 'Soda')
    await app.setClock('2026-11-05T21:45:00-05:00') // Thu, last order 9:30 PM
    await page.goto('/order/checkout')
    await expect(page.getByTestId('checkout-blocked-reason')).toHaveText('Online ordering is closed. We open Fri at 11:00 AM.')
    await expect(page.getByRole('button', { name: /^Place order/ })).toBeDisabled()
  })

  test('CHK-016 phone is normalised on blur', async ({ page }) => {
    await toCheckout(page)
    const phone = page.getByLabel('Phone', { exact: true })
    await phone.fill('3025550123')
    await phone.blur()
    await expect(phone).toHaveValue('(302) 555-0123')
  })

  test('CHK-016 honeypot field is not visible to people', async ({ page }) => {
    await toCheckout(page)
    const hp = page.locator('input[name="website"]')
    await expect(hp).toHaveCount(1)
    await expect(hp).toBeHidden()
  })

  test('CHK-017 blur validation links error to input', async ({ page }) => {
    await toCheckout(page)
    const name = page.getByLabel('Name', { exact: true })
    await name.fill('P')
    await name.blur()
    await expect(name).toHaveAttribute('aria-invalid', 'true')
    const errId = await name.getAttribute('aria-describedby')
    expect(errId).toBeTruthy()
    await expect(page.locator(`[id="${errId!.split(' ')[0]}"]`)).toBeVisible()
    await name.fill('Pat Doe')
    await name.blur()
    await expect(name).not.toHaveAttribute('aria-invalid', 'true')
  })

  test('CHK-017 submit with errors focuses an error summary with links', async ({ page }) => {
    await toCheckout(page)
    await page.getByLabel('Phone', { exact: true }).fill('123')
    await placeOrder(page).click()
    const summaryBox = page.getByRole('alert').filter({ has: page.getByRole('link') })
    await expect(summaryBox).toBeFocused()
    await expect(summaryBox.getByRole('link')).toHaveCount(2) // Name, Phone
    await summaryBox.getByRole('link').first().click()
    await expect(page.getByLabel('Name', { exact: true })).toBeFocused()
    await expect(page).toHaveURL(/\/order\/checkout/)
  })

  test('CHK-018 details are remembered (only name, phone, email)', async ({ page }) => {
    await toCheckout(page)
    await expect(page.getByRole('checkbox', { name: 'Remember my details' })).toBeChecked()
    await fillCustomer(page, { name: 'Pat Doe', phone: '302-555-0123', email: 'pat@example.com' })
    await page.getByLabel('Order notes (optional)').fill('call when here')
    await placeOrder(page).click()
    await expect(page).toHaveURL(/\/order\/confirmation\//)
    const stored = JSON.parse((await page.evaluate(() => localStorage.getItem('jt-customer-v1')))!)
    expect(Object.keys(stored).sort()).toEqual(['email', 'name', 'phone'])
    await toCheckout(page)
    await expect(page.getByLabel('Name', { exact: true })).toHaveValue('Pat Doe')
    await expect(page.getByLabel('Phone', { exact: true })).toHaveValue('(302) 555-0123')
    await expect(page.getByLabel('Email (optional)')).toHaveValue('pat@example.com')
    await expect(page.getByLabel('Order notes (optional)')).toHaveValue('')
  })

  test('CHK-018 unchecking Remember stores nothing', async ({ page }) => {
    await toCheckout(page)
    await page.getByRole('checkbox', { name: 'Remember my details' }).uncheck()
    await fillCustomer(page)
    await placeOrder(page).click()
    await expect(page).toHaveURL(/\/order\/confirmation\//)
    expect(await page.evaluate(() => localStorage.getItem('jt-customer-v1'))).toBeNull()
  })

  test('CHK-020 payment options, card preselected, no surcharge', async ({ page }) => {
    await toCheckout(page)
    const pay = page.getByRole('radiogroup', { name: 'Payment' })
    await expect(pay.getByRole('radio', { name: 'Pay with card at pickup' })).toBeChecked()
    await expect(pay.getByRole('radio', { name: 'Pay with cash at pickup — save 3%' })).toHaveAttribute('value', 'cash')
    await expect(pay.getByRole('radio', { name: 'Pay with card at pickup' })).toHaveAttribute('value', 'card_at_pickup')
    await expect(pay.getByRole('radio')).toHaveCount(2)
    await expect(page.getByText(/surcharge|card fee/i)).toHaveCount(0)
  })

  test('CHK-021 tip options show dollar amounts on subtotal; default No tip', async ({ page }) => {
    await toCheckout(page)
    const tip = page.getByRole('radiogroup', { name: 'Tip for the kitchen' })
    await expect(tip.getByRole('radio', { name: 'No tip' })).toBeChecked()
    await expect(tip.getByRole('radio', { name: '10% ($4.19)' })).toBeVisible()
    await expect(tip.getByRole('radio', { name: '15% ($6.29)' })).toBeVisible()
    await expect(tip.getByRole('radio', { name: '20% ($8.38)' })).toBeVisible()
    // percentages are on the subtotal, before the cash discount
    await page.getByRole('radio', { name: 'Pay with cash at pickup — save 3%' }).check()
    await expect(tip.getByRole('radio', { name: '15% ($6.29)' })).toBeVisible()
  })

  test('CHK-021 custom tip input', async ({ page }) => {
    await toCheckout(page)
    const tip = page.getByRole('radiogroup', { name: 'Tip for the kitchen' })
    await expect(page.getByLabel('Custom tip amount')).toBeHidden()
    await tip.getByRole('radio', { name: 'Custom' }).check()
    await page.getByLabel('Custom tip amount').fill('5')
    await expect(summary(page).getByTestId('summary-tip')).toHaveText('$5.00')
    await expect(summary(page).getByTestId('summary-total')).toHaveText('$46.90')
    await page.getByLabel('Custom tip amount').fill('250')
    await page.getByLabel('Custom tip amount').blur()
    await expect(page.getByLabel('Custom tip amount')).toHaveAttribute('aria-invalid', 'true')
  })

  test('CHK-022 no tax row by default (Delaware)', async ({ page }) => {
    await toCheckout(page)
    await expect(summary(page).getByTestId('summary-tax')).toHaveCount(0)
  })

  test('CHK-022 tax row when a rate is configured, computed after cash discount', async ({ page, app }) => {
    await app.settings({ taxRatePercent: 6 })
    await toCheckout(page)
    await expect(summary(page).getByTestId('summary-tax')).toHaveText('$2.51')
    await page.getByRole('radio', { name: 'Pay with cash at pickup — save 3%' }).check()
    await expect(summary(page).getByTestId('summary-tax')).toHaveText('$2.44')
  })

  test('CHK-030 CHK-031 worked example: card + no tip', async ({ page }) => {
    await toCheckout(page)
    await expect(summary(page).getByTestId('summary-subtotal')).toHaveText('$41.90')
    await expect(summary(page).getByTestId('summary-cash-discount')).toHaveCount(0)
    await expect(summary(page).getByTestId('summary-tip')).toHaveText('$0.00')
    await expect(summary(page).getByTestId('summary-total')).toHaveText('$41.90')
    await expect(placeOrder(page)).toHaveText('Place order · $41.90')
  })

  test('CHK-030 CHK-031 worked example: cash + 15%', async ({ page }) => {
    await toCheckout(page)
    await page.getByRole('radio', { name: 'Pay with cash at pickup — save 3%' }).check()
    await page.getByRole('radio', { name: '15% ($6.29)' }).check()
    const discount = summary(page).getByTestId('summary-cash-discount')
    await expect(discount).toHaveText('−$1.26')
    await expect(summary(page).getByText('Cash discount (3%)')).toBeVisible()
    await expect(summary(page).getByTestId('summary-tip')).toHaveText('$6.29')
    await expect(summary(page).getByTestId('summary-total')).toHaveText('$46.93')
    await expect(placeOrder(page)).toHaveText('Place order · $46.93')
  })

  test('CHK-040 submitting disables the button and sends exactly one request', async ({ page }) => {
    await toCheckout(page)
    await fillCustomer(page)
    let posts = 0
    await page.route('**/api/orders', async (route) => {
      if (route.request().method() === 'POST') {
        posts++
        expect(route.request().postDataJSON().idempotencyKey).toMatch(/^[0-9a-f-]{36}$/)
        await new Promise((r) => setTimeout(r, 1500))
      }
      await route.continue()
    })
    await placeOrder(page).click()
    const busy = page.getByRole('button', { name: 'Placing order…' })
    await expect(busy).toBeDisabled()
    await busy.click({ force: true }).catch(() => {})
    await expect(page).toHaveURL(/\/order\/confirmation\//)
    expect(posts).toBe(1)
  })

  test('CHK-041 success redirects to confirmation and clears the cart', async ({ page }) => {
    await toCheckout(page)
    await fillCustomer(page)
    await placeOrder(page).click()
    await expect(page).toHaveURL(/\/order\/confirmation\/[A-Za-z0-9_-]{21}$/)
    await expect(page.getByTestId('cart-button')).toHaveCount(0)
    await page.reload()
    await expect(page.getByTestId('cart-button')).toHaveCount(0)
  })

  test('CHK-041 scheduled pickup is sent and confirmed', async ({ page }) => {
    await toCheckout(page)
    await fillCustomer(page)
    await pickup(page).getByRole('radio', { name: 'Schedule for later' }).check()
    await slotSelect(page).selectOption({ label: '6:30 PM' })
    await placeOrder(page).click()
    await expect(page.getByText('Ready around 6:30 PM')).toBeVisible()
  })

  async function expectServerRejection(page: Page, app: AppApi, mutate: () => Promise<void>, alertText: RegExp | string) {
    await toCheckout(page)
    await fillCustomer(page)
    await page.getByLabel('Order notes (optional)').fill('keep me')
    await mutate()
    await placeOrder(page).click()
    await expect(page.getByRole('alert').filter({ hasText: alertText })).toBeVisible()
    await expect(page).toHaveURL(/\/order\/checkout$/)
    await expect(page.getByLabel('Name', { exact: true })).toHaveValue('Pat Doe')
    await expect(page.getByLabel('Order notes (optional)')).toHaveValue('keep me')
  }

  test('CHK-042 PRICE_CHANGED keeps inputs and shows new total', async ({ page, app }) => {
    await expectServerRejection(
      page,
      app,
      () => app.updateItem('jeffs-famous-cheeseburger', { variants: [{ label: '', priceCents: 1495, isMarketPrice: false }] }),
      /price/i,
    )
    await expect(summary(page).getByTestId('summary-total')).toHaveText('$42.90')
  })

  test('CHK-042 ITEM_UNAVAILABLE flags the affected line', async ({ page, app }) => {
    await expectServerRejection(page, app, () => app.updateItem('bone-in-wings', { available: false }), /sold out|unavailable/i)
    await expect(summary(page).getByText('Sold out — please remove')).toBeVisible()
  })

  test('CHK-042 ORDERING_PAUSED shows the pause message', async ({ page, app }) => {
    await expectServerRejection(
      page,
      app,
      () => app.settings({ orderingPausedUntil: '2026-11-06T18:00:00-05:00' }),
      'Online ordering is paused — please call (302) 337-8602.',
    )
  })

  test('CHK-042 ORDERING_CLOSED', async ({ page, app }) => {
    await expectServerRejection(page, app, () => app.setClock('2026-11-06T23:59:00-05:00'), /closed/i)
  })

  test('CHK-042 INVALID_SLOT when the chosen slot has passed', async ({ page, app }) => {
    await toCheckout(page)
    await fillCustomer(page)
    await pickup(page).getByRole('radio', { name: 'Schedule for later' }).check()
    await slotSelect(page).selectOption({ label: '5:30 PM' })
    await app.setClock('2026-11-06T17:20:00-05:00')
    await placeOrder(page).click()
    await expect(page.getByRole('alert').filter({ hasText: /pickup time/i })).toBeVisible()
    await expect(page).toHaveURL(/\/order\/checkout$/)
  })

  test('CHK-043 empty cart on checkout links back to the menu', async ({ page }) => {
    await page.goto('/order/checkout')
    await expect(page.getByText('Your order is empty')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Browse the menu' })).toHaveAttribute('href', '/order')
  })
})
