import { test, expect, addWorkedExample, fillCustomer, openCart, STAFF } from './fixtures/app'

// Full journey: guest orders → kitchen fulfils → guest sees each step (specs 13–16)

test('JOURNEY guest orders for pickup, kitchen fulfils, guest sees ready', async ({ page, browser, baseURL }) => {
  // Guest
  await page.goto('/')
  await page.getByRole('main').getByRole('link', { name: 'Order Pickup' }).first().click()
  await addWorkedExample(page)
  const drawer = await openCart(page)
  await expect(drawer.getByTestId('cart-subtotal')).toHaveText('$41.90')
  await drawer.getByRole('link', { name: 'Checkout' }).click()
  await fillCustomer(page)
  await page.getByRole('radio', { name: 'Pay with cash at pickup — save 3%' }).check()
  await page.getByRole('radio', { name: '15% ($6.29)' }).check()
  await page.getByRole('button', { name: 'Place order · $46.93' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Thanks, Pat! Your order is in.')
  await expect(page.getByTestId('order-number')).toHaveText('#1001')
  const current = page.getByTestId('order-status').locator('[aria-current="step"]')
  await expect(current).toHaveText('Received')

  // Kitchen, on its own tablet
  const kitchenCtx = await browser.newContext({ baseURL, viewport: { width: 1280, height: 800 } })
  const kds = await kitchenCtx.newPage()
  await kds.goto('/kitchen')
  await kds.getByLabel('Email').fill(STAFF.kitchen.email)
  await kds.getByLabel('Password').fill(STAFF.kitchen.password)
  await kds.getByRole('button', { name: 'Sign in' }).click()
  const t = kds.getByTestId('kds-column-new').getByTestId('kds-ticket-1001')
  await expect(t).toBeVisible()
  await expect(t).toContainText('CASH — collect $46.93')
  await t.getByRole('button', { name: 'Accept' }).click()
  await expect(current).toHaveText('Accepted', { timeout: 10_000 })

  await kds.getByTestId('kds-ticket-1001').getByRole('button', { name: 'Mark ready' }).click()
  await expect(page.getByText('Your order is ready! Head to the bar to pick up.')).toBeVisible({ timeout: 10_000 })

  await kds.getByTestId('kds-ticket-1001').getByRole('button', { name: 'Picked up' }).click()
  await expect(current).toHaveText('Picked up', { timeout: 10_000 })
  await kitchenCtx.close()
})

test('JOURNEY item 86d by the kitchen mid-order is caught at checkout', async ({ page, browser, baseURL }) => {
  await page.goto('/order')
  await addWorkedExample(page)
  await page.goto('/order/checkout')
  await fillCustomer(page)

  const kitchenCtx = await browser.newContext({ baseURL })
  const kds = await kitchenCtx.newPage()
  await kds.request.post('/api/users/login', { data: STAFF.kitchen })
  await kds.goto('/kitchen')
  await kds.getByRole('button', { name: '86 items' }).click()
  await kds.getByRole('dialog', { name: 'Item availability' }).getByRole('switch', { name: 'Bone-In Wings', exact: true }).click()
  await kitchenCtx.close()

  await page.getByRole('button', { name: /^Place order/ }).click()
  await expect(page.getByRole('alert').filter({ hasText: /sold out|unavailable/i })).toBeVisible()
  await expect(page.getByText('Sold out — please remove')).toBeVisible()
})
