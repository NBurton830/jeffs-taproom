import { test, expect, staffApi, WORKED_EXAMPLE_LINES } from './fixtures/app'
import { PHONE_TEL } from './fixtures/menu'

// specs/15-order-tracking.md

const steps = ['Received', 'Accepted', 'Ready for pickup', 'Picked up']

test.describe('Order confirmation & status', () => {
  test('TRK-001 heading and order number', async ({ page, app }) => {
    const order = await app.createOrder({ lines: WORKED_EXAMPLE_LINES })
    await page.goto(order.statusUrl)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Thanks, Pat! Your order is in.')
    await expect(page.getByTestId('order-number')).toHaveText('#1001')
  })

  test('TRK-002 tracker steps with aria-current on Received', async ({ page, app }) => {
    const order = await app.createOrder({ lines: WORKED_EXAMPLE_LINES })
    await page.goto(order.statusUrl)
    const tracker = page.getByTestId('order-status')
    await expect(tracker.locator('ol > li')).toHaveText(steps)
    await expect(tracker.locator('[aria-current="step"]')).toHaveText('Received')
    await expect(page.locator('[aria-live="polite"]').filter({ hasText: 'Received' }).first()).toBeAttached()
  })

  test('TRK-003 status updates within 10 s of a kitchen change', async ({ page, app, playwright, baseURL }) => {
    const order = await app.createOrder({ lines: WORKED_EXAMPLE_LINES })
    await page.goto(order.statusUrl)
    const kitchen = await staffApi(playwright, baseURL!, 'kitchen')
    await kitchen.setStatus(order.number, 'accepted')
    await expect(page.getByTestId('order-status').locator('[aria-current="step"]')).toHaveText('Accepted', { timeout: 10_000 })
    await kitchen.dispose()
  })

  test('TRK-003 polling stops once completed', async ({ page, app, playwright, baseURL }) => {
    const order = await app.createOrder({ lines: [{ itemSlug: 'soda' }] })
    const kitchen = await staffApi(playwright, baseURL!, 'kitchen')
    for (const s of ['accepted', 'ready', 'completed']) await kitchen.setStatus(order.number, s)
    await kitchen.dispose()
    let polls = 0
    page.on('request', (r) => {
      if (r.url().includes(`/api/orders/${order.publicId}/status`)) polls++
    })
    await page.goto(order.statusUrl)
    await expect(page.getByTestId('order-status').locator('[aria-current="step"]')).toHaveText('Picked up')
    const before = polls
    await page.waitForTimeout(11_000)
    expect(polls - before).toBe(0)
  })

  test('TRK-004 shows pickup time, cash reminder, lines, totals and address', async ({ page, app }) => {
    const order = await app.createOrder({ lines: WORKED_EXAMPLE_LINES, paymentMethod: 'cash', tip: { type: 'percent', value: 15 } })
    await page.goto(order.statusUrl)
    const main = page.getByRole('main')
    await expect(main).toContainText('Ready around 5:20 PM')
    await expect(main).toContainText('Pay with cash at pickup — $46.93 after your 3% discount')
    await expect(main).toContainText("Jeff's Famous Cheeseburger")
    await expect(main).toContainText('Bone-In Wings')
    await expect(main).toContainText('16 wings')
    await expect(main).toContainText('Hot, Old Bay, Ranch, Extra celery')
    await expect(main.getByTestId('summary-subtotal')).toHaveText('$41.90')
    await expect(main.getByTestId('summary-cash-discount')).toHaveText('−$1.26')
    await expect(main.getByTestId('summary-tip')).toHaveText('$6.29')
    await expect(main.getByTestId('summary-total')).toHaveText('$46.93')
    await expect(main).toContainText('416 Market Street')
  })

  test('TRK-004 card payment wording', async ({ page, app }) => {
    const order = await app.createOrder({ lines: WORKED_EXAMPLE_LINES })
    await page.goto(order.statusUrl)
    await expect(page.getByRole('main')).toContainText('Pay with card at pickup')
    await expect(page.getByRole('main')).not.toContainText('3% discount')
  })

  test('TRK-005 ready banner', async ({ page, app, playwright, baseURL }) => {
    const order = await app.createOrder({ lines: WORKED_EXAMPLE_LINES })
    const kitchen = await staffApi(playwright, baseURL!, 'kitchen')
    await kitchen.setStatus(order.number, 'accepted')
    await kitchen.setStatus(order.number, 'ready')
    await kitchen.dispose()
    await page.goto(order.statusUrl)
    await expect(page.getByText('Your order is ready! Head to the bar to pick up.')).toBeVisible()
    await expect(page.getByTestId('order-status').locator('[aria-current="step"]')).toHaveText('Ready for pickup')
  })

  test('TRK-006 cancelled order shows reason and phone', async ({ page, app, playwright, baseURL }) => {
    const order = await app.createOrder({ lines: WORKED_EXAMPLE_LINES })
    const kitchen = await staffApi(playwright, baseURL!, 'kitchen')
    await kitchen.setStatus(order.number, 'cancelled', 'Out of an item')
    await kitchen.dispose()
    await page.goto(order.statusUrl)
    await expect(page.getByText('This order was cancelled')).toBeVisible()
    await expect(page.getByRole('main')).toContainText('Out of an item')
    await expect(page.getByRole('main')).toContainText('Questions? Call (302) 337-8602')
  })

  test('TRK-007 unknown order page', async ({ page }) => {
    await page.goto('/order/confirmation/AAAAAAAAAAAAAAAAAAAAA')
    await expect(page.getByText("We couldn't find that order.")).toBeVisible()
  })

  test('TRK-008 receipt, restaurant notification and ready emails', async ({ app, playwright, baseURL }) => {
    const order = await app.createOrder({
      lines: WORKED_EXAMPLE_LINES,
      customer: { name: 'Pat Doe', phone: '3025550123', email: 'pat@example.com' },
    })
    let mail = await app.outbox()
    const receipt = mail.find((m) => m.to === 'pat@example.com')
    expect(receipt?.subject).toBe("Jeff's Taproom order #1001")
    expect(receipt?.text).toContain(`/order/confirmation/${order.publicId}`)
    expect(mail.find((m) => m.to === 'orders@jeffstaproom.test')?.subject).toBe('New online order #1001')

    const kitchen = await staffApi(playwright, baseURL!, 'kitchen')
    await kitchen.setStatus(order.number, 'accepted')
    await kitchen.setStatus(order.number, 'ready')
    await kitchen.dispose()
    mail = await app.outbox()
    expect(mail.filter((m) => m.to === 'pat@example.com').map((m) => m.subject)).toContain('Your order #1001 is ready')
  })

  test('TRK-008 no customer email when none was given', async ({ app }) => {
    await app.createOrder({ lines: WORKED_EXAMPLE_LINES })
    const mail = await app.outbox()
    expect(mail.map((m) => m.to)).toEqual(['orders@jeffstaproom.test'])
  })

  test('TRK-009 Call us and Directions', async ({ page, app }) => {
    const order = await app.createOrder({ lines: WORKED_EXAMPLE_LINES })
    await page.goto(order.statusUrl)
    await expect(page.getByRole('link', { name: 'Call us' })).toHaveAttribute('href', PHONE_TEL)
    await expect(page.getByRole('link', { name: 'Directions' }).first()).toHaveAttribute('href', /maps/)
  })

  test('SEC-010 customer text is rendered escaped', async ({ page, app }) => {
    const order = await app.createOrder({
      lines: [{ itemSlug: 'soda', notes: '<img src=x onerror="window.__xss=1">' }],
      customer: { name: '<b>Pat</b>', phone: '3025550123' },
    })
    await page.goto(order.statusUrl)
    await expect(page.getByRole('main')).toContainText('<img src=x onerror="window.__xss=1">')
    expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss)).toBeUndefined()
    await expect(page.locator('main b')).toHaveCount(0)
  })
})
