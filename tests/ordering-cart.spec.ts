import { test, expect, addItem, openItem, configureItem, fieldset, openCart, addWorkedExample } from './fixtures/app'

// specs/13-ordering-cart.md

test.describe('Item dialog', () => {
  test('ORD-001 dialog opens named after the item, traps focus, Escape restores focus', async ({ page }) => {
    await page.goto('/menu')
    const add = page.getByRole('button', { name: 'Add Cheese Sticks', exact: true })
    await add.click()
    const dialog = page.getByRole('dialog', { name: 'Cheese Sticks' })
    await expect(dialog).toBeVisible()
    await expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true)
    for (let i = 0; i < 25; i++) {
      await page.keyboard.press('Tab')
      expect(await dialog.evaluate((el) => el.contains(document.activeElement)), `tab ${i}`).toBe(true)
    }
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(add).toBeFocused()
  })

  test('ORD-001 Close button closes and restores focus', async ({ page }) => {
    await page.goto('/menu')
    const add = page.getByRole('button', { name: 'Add Cheese Sticks', exact: true })
    await add.click()
    await page.getByRole('dialog', { name: 'Cheese Sticks' }).getByRole('button', { name: 'Close' }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(add).toBeFocused()
  })

  test('ORD-002 single-price item with no modifiers still opens dialog with quantity and notes', async ({ page }) => {
    await page.goto('/menu')
    const dialog = await openItem(page, 'Sweet Potato Fries')
    await expect(dialog.getByLabel('Quantity')).toBeVisible()
    await expect(dialog.getByLabel('Special instructions (optional)')).toBeVisible()
    await expect(dialog.getByRole('radio')).toHaveCount(0)
    await expect(dialog.getByRole('button', { name: 'Add to order · $5.95' })).toBeVisible()
  })

  test('ORD-003 variants: Size legend, labelled prices, first preselected', async ({ page }) => {
    await page.goto('/menu')
    const dialog = await openItem(page, 'Krinkle-Cut French Fries')
    const size = fieldset(dialog, 'Size')
    await expect(size.getByRole('radio', { name: 'Small — $4.50' })).toBeChecked()
    await expect(size.getByRole('radio', { name: 'Large — $6.50' })).not.toBeChecked()
  })

  test('ORD-003 wings use "How many?" legend', async ({ page }) => {
    await page.goto('/menu')
    const dialog = await openItem(page, 'Bone-In Wings')
    const howMany = fieldset(dialog, 'How many?')
    await expect(howMany.getByRole('radio', { name: '8 wings — $12.95' })).toBeChecked()
    await expect(howMany.getByRole('radio', { name: '16 wings — $23.95' })).toBeVisible()
  })

  test('ORD-003 MKT variant without a price is disabled', async ({ page, app }) => {
    await app.updateItem('crab-balls', {
      variants: [
        { label: 'Half dozen', priceCents: 1895, isMarketPrice: true },
        { label: 'Dozen', priceCents: null, isMarketPrice: true },
      ],
    })
    await page.goto('/menu')
    const dialog = await openItem(page, 'Crab-Balls')
    await expect(dialog.getByRole('radio', { name: 'Half dozen — $18.95' })).toBeChecked()
    await expect(dialog.getByRole('radio', { name: 'Dozen — MKT' })).toBeDisabled()
  })

  test('ORD-004 required/optional legends, None option, price deltas, defaults', async ({ page }) => {
    await page.goto('/menu')
    const dialog = await openItem(page, "Jeff's Famous Cheeseburger")
    await expect(fieldset(dialog, 'Cheese')).toContainText('Required')
    const side = fieldset(dialog, 'Side')
    await expect(side.getByRole('radio', { name: 'Chips' })).toBeChecked()
    await expect(side.getByRole('radio', { name: 'Krinkle-cut fries (+$3.50)' })).toBeVisible()
    await expect(side.getByRole('radio', { name: 'Sweet potato fries (+$4.95)' })).toBeVisible()
    const bread = fieldset(dialog, 'Bread')
    await expect(bread).toContainText('Optional')
    await expect(bread.getByRole('radio', { name: 'None' })).toBeChecked()
    await expect(bread.getByRole('radio', { name: 'Pretzel roll (+$2.00)' })).not.toBeChecked()
  })

  test('ORD-004 checkbox group disables remaining options at max', async ({ page }) => {
    await page.goto('/menu')
    const dialog = await openItem(page, 'Bone-In Wings')
    const extras = fieldset(dialog, 'Extras')
    await expect(extras).toContainText('Optional')
    await expect(extras).toContainText('Choose up to 2')
    await expect(extras.getByRole('checkbox')).toHaveCount(2)
    await extras.getByRole('checkbox', { name: 'Extra celery (+$0.50)' }).check()
    await extras.getByRole('checkbox', { name: 'Extra dressing (+$0.50)' }).check()
    await expect(extras.getByRole('checkbox', { name: 'Extra celery (+$0.50)' })).toBeEnabled()
  })

  test('ORD-005 sauce limit follows variant: 2 for 16 wings, trimmed back on 8 wings', async ({ page }) => {
    await page.goto('/menu')
    const dialog = await openItem(page, 'Bone-In Wings')
    const sauce = fieldset(dialog, 'Sauce')
    // 8 wings: single choice → radios
    await expect(sauce.getByRole('radio', { name: 'Hot', exact: true })).toBeVisible()
    await configureItem(dialog, { variant: '16 wings' })
    await expect(sauce).toContainText('Choose up to 2')
    await sauce.getByRole('checkbox', { name: 'Hot', exact: true }).check()
    await sauce.getByRole('checkbox', { name: 'Old Bay' }).check()
    await expect(sauce.getByRole('checkbox', { name: 'Mild', exact: true })).toBeDisabled()
    await configureItem(dialog, { variant: '8 wings' })
    await expect(sauce.getByRole('radio', { name: 'Hot', exact: true })).toBeChecked()
    await expect(sauce.getByRole('radio', { name: 'Old Bay' })).not.toBeChecked()
  })

  test('ORD-005 boneless 20 wings also allows 2 sauces', async ({ page }) => {
    await page.goto('/menu')
    const dialog = await openItem(page, 'Boneless Wings')
    await configureItem(dialog, { variant: '20 wings' })
    await expect(fieldset(dialog, 'Sauce')).toContainText('Choose up to 2')
  })

  test('ORD-006 special instructions: 140 max, live counter, helper text', async ({ page }) => {
    await page.goto('/menu')
    const dialog = await openItem(page, 'Cheese Sticks')
    const notes = dialog.getByLabel('Special instructions (optional)')
    await expect(notes).toHaveAttribute('maxlength', '140')
    await expect(dialog.getByTestId('notes-counter')).toHaveText('0/140')
    await notes.fill('extra marinara')
    await expect(dialog.getByTestId('notes-counter')).toHaveText('14/140')
    await expect(dialog).toContainText('No substitutions beyond the options above may be possible.')
  })

  test('ORD-007 quantity stepper bounded 1–20', async ({ page }) => {
    await page.goto('/menu')
    const dialog = await openItem(page, 'Soda')
    const qty = dialog.getByLabel('Quantity')
    await expect(qty).toHaveValue('1')
    await expect(dialog.getByRole('button', { name: 'Decrease quantity' })).toBeDisabled()
    const inc = dialog.getByRole('button', { name: 'Increase quantity' })
    for (let i = 0; i < 22; i++) if (await inc.isEnabled()) await inc.click()
    await expect(qty).toHaveValue('20')
    await expect(inc).toBeDisabled()
    await expect(dialog.getByRole('button', { name: 'Add to order · $60.00' })).toBeVisible()
  })

  test('ORD-008 price updates live with modifiers and quantity', async ({ page }) => {
    await page.goto('/menu')
    const dialog = await openItem(page, "Jeff's Famous Cheeseburger")
    await expect(dialog.getByRole('button', { name: 'Add to order · $13.95' })).toBeVisible()
    await configureItem(dialog, { choices: { Side: ['Krinkle-cut fries'] } })
    await expect(dialog.getByRole('button', { name: 'Add to order · $17.45' })).toBeVisible()
    await configureItem(dialog, { quantity: 2 })
    await expect(dialog.getByRole('button', { name: 'Add to order · $34.90' })).toBeVisible()
  })

  test('ORD-009 unmet required group blocks add and focuses the fieldset', async ({ page }) => {
    await page.goto('/menu')
    const dialog = await openItem(page, "Jeff's Famous Cheeseburger")
    await dialog.getByRole('button', { name: /^Add to order/ }).click()
    await expect(dialog).toBeVisible()
    const cheese = fieldset(dialog, 'Cheese')
    await expect(cheese.getByRole('alert')).toHaveText('Please choose a Cheese')
    expect(await cheese.evaluate((el) => el === document.activeElement || el.contains(document.activeElement))).toBe(true)
    await expect(page.getByTestId('cart-button')).toHaveCount(0)
  })

  test('ORD-010 success closes dialog, announces, toast offers View order', async ({ page }) => {
    await page.goto('/menu')
    await addItem(page, 'Sweet Potato Fries', { quantity: 2 })
    await expect(page.locator('[aria-live="polite"]').filter({ hasText: 'Added 2 × Sweet Potato Fries to your order' }).first()).toBeAttached()
    const toast = page.getByTestId('toast')
    await expect(toast).toBeVisible()
    await toast.getByRole('button', { name: 'View order' }).click()
    await expect(page.getByRole('dialog', { name: 'Your order' })).toBeVisible()
  })

  test('ORD-011 identical configuration merges into one line, capped at 20', async ({ page }) => {
    await page.goto('/menu')
    await addItem(page, 'Cheese Sticks', { quantity: 15 })
    await addItem(page, 'Cheese Sticks', { quantity: 10 })
    await addItem(page, 'Cheese Sticks', { notes: 'well done' })
    const drawer = await openCart(page)
    await expect(drawer.getByTestId('cart-line')).toHaveCount(2)
    await expect(drawer.getByTestId('cart-line').first().getByTestId('line-quantity')).toHaveText('20')
  })
})

test.describe('Cart', () => {
  test('ORD-020 cart drawer named "Your order"', async ({ page }) => {
    await page.goto('/menu')
    await addItem(page, 'Soda')
    const drawer = await openCart(page)
    await expect(drawer.getByTestId('cart-line')).toHaveCount(1)
    await page.keyboard.press('Escape')
    await expect(drawer).toBeHidden()
  })

  test('ORD-020 desktop /order shows inline cart panel @desktop', async ({ page }) => {
    await page.goto('/order')
    await addItem(page, 'Soda')
    await expect(page.getByTestId('cart-panel').getByTestId('cart-line')).toHaveCount(1)
  })

  test('ORD-021 line shows quantity, name, variant, modifiers in order, notes and total', async ({ page }) => {
    await page.goto('/menu')
    await addItem(page, 'Bone-In Wings', {
      variant: '16 wings',
      choices: { Sauce: ['Hot', 'Old Bay'], Dressing: ['Ranch'], Extras: ['Extra celery'] },
      notes: 'extra crispy',
    })
    const line = (await openCart(page)).getByTestId('cart-line')
    await expect(line.getByTestId('line-quantity')).toHaveText('1')
    await expect(line).toContainText('Bone-In Wings')
    await expect(line).toContainText('16 wings')
    await expect(line.getByTestId('line-modifiers')).toHaveText('Hot, Old Bay, Ranch, Extra celery')
    await expect(line).toContainText('"extra crispy"')
    await expect(line.getByTestId('line-total')).toHaveText('$24.45')
  })

  test('ORD-021 default-only choices are listed', async ({ page }) => {
    await page.goto('/menu')
    await addItem(page, 'Smash Burger')
    const line = (await openCart(page)).getByTestId('cart-line')
    await expect(line.getByTestId('line-modifiers')).toHaveText('Chips')
  })

  test('ORD-022 line stepper updates totals; decrease disabled at 1', async ({ page }) => {
    await page.goto('/menu')
    await addItem(page, 'Cheese Sticks')
    const drawer = await openCart(page)
    const line = drawer.getByTestId('cart-line')
    await expect(line.getByRole('button', { name: 'Decrease quantity' })).toBeDisabled()
    await line.getByRole('button', { name: 'Increase quantity' }).click()
    await expect(line.getByTestId('line-quantity')).toHaveText('2')
    await expect(line.getByTestId('line-total')).toHaveText('$17.00')
    await expect(drawer.getByTestId('cart-subtotal')).toHaveText('$17.00')
    await expect(page.getByTestId('cart-count')).toHaveText('2')
  })

  test('ORD-022 Edit reopens prefilled dialog and replaces the line', async ({ page }) => {
    await page.goto('/menu')
    await addItem(page, "Jeff's Famous Cheeseburger", { choices: { Cheese: ['Swiss'] } })
    const drawer = await openCart(page)
    await drawer.getByRole('button', { name: "Edit Jeff's Famous Cheeseburger" }).click()
    const dialog = page.getByRole('dialog', { name: "Jeff's Famous Cheeseburger" })
    await expect(fieldset(dialog, 'Cheese').getByRole('radio', { name: 'Swiss' })).toBeChecked()
    await configureItem(dialog, { choices: { Side: ['Sweet potato fries'] } })
    await dialog.getByRole('button', { name: 'Update order · $18.90' }).click()
    const reopened = await openCart(page)
    await expect(reopened.getByTestId('cart-line')).toHaveCount(1)
    await expect(reopened.getByTestId('line-modifiers')).toHaveText('Swiss, Sweet potato fries')
    await expect(reopened.getByTestId('line-total')).toHaveText('$18.90')
  })

  test('ORD-022 Remove shows Undo toast that restores the line in place', async ({ page }) => {
    await page.goto('/menu')
    await addItem(page, 'Soda')
    await addItem(page, 'Cheese Sticks')
    await addItem(page, 'Reuben', { choices: { Meat: ['Turkey'] } })
    const drawer = await openCart(page)
    await drawer.getByRole('button', { name: 'Remove Cheese Sticks' }).click()
    await expect(drawer.getByTestId('cart-line')).toHaveCount(2)
    await page.getByTestId('toast').getByRole('button', { name: 'Undo' }).click()
    await expect(drawer.getByTestId('cart-line')).toHaveCount(3)
    await expect(drawer.getByTestId('cart-line').nth(1)).toContainText('Cheese Sticks')
  })

  test('ORD-023 footer: subtotal, note, Checkout link', async ({ page }) => {
    await page.goto('/menu')
    await addWorkedExample(page)
    const drawer = await openCart(page)
    await expect(drawer.getByTestId('cart-subtotal')).toHaveText('$41.90')
    await expect(drawer).toContainText('Discounts and tip at checkout')
    await expect(drawer.getByRole('link', { name: 'Checkout' })).toHaveAttribute('href', '/order/checkout')
  })

  test('ORD-024 empty cart state after removing last line', async ({ page }) => {
    await page.goto('/menu')
    await addItem(page, 'Soda')
    const drawer = await openCart(page)
    await drawer.getByRole('button', { name: 'Remove Soda' }).click()
    await expect(drawer).toContainText('Your order is empty')
    await expect(drawer.getByRole('link', { name: 'Browse the menu' })).toBeVisible()
    await expect(drawer.getByRole('link', { name: 'Checkout' })).toHaveCount(0)
    await expect(drawer.getByRole('button', { name: 'Checkout' })).toHaveCount(0)
  })

  test('ORD-025 cart persists across reload in localStorage jt-cart-v1', async ({ page }) => {
    await page.goto('/menu')
    await addItem(page, 'Cheese Sticks', { quantity: 3 })
    expect(await page.evaluate(() => localStorage.getItem('jt-cart-v1'))).toBeTruthy()
    await page.reload()
    await expect(page.getByTestId('cart-count')).toHaveText('3')
  })

  test('ORD-025 cart is shared across tabs', async ({ page, context }) => {
    await page.goto('/menu')
    await addItem(page, 'Soda')
    const other = await context.newPage()
    await other.goto('/visit')
    await expect(other.getByTestId('cart-count')).toHaveText('1')
  })

  test("ORD-025 86'd line is flagged on load and blocks checkout", async ({ page, app }) => {
    await page.goto('/menu')
    await addItem(page, 'Onion Petals')
    await app.updateItem('onion-petals', { available: false })
    await page.reload()
    const drawer = await openCart(page)
    await expect(drawer.getByTestId('cart-line')).toContainText('Sold out — please remove')
    await expect(drawer.getByRole('link', { name: 'Checkout' })).toHaveCount(0)
    await expect(drawer.getByRole('button', { name: 'Checkout' })).toBeDisabled()
    await expect(drawer.getByTestId('checkout-blocked-reason')).toBeVisible()
  })

  test('ORD-025 re-priced line is updated and flagged', async ({ page, app }) => {
    await page.goto('/menu')
    await addItem(page, 'Sweet Potato Fries')
    await app.updateItem('sweet-potato-fries', { variants: [{ label: '', priceCents: 650, isMarketPrice: false }] })
    await page.reload()
    const drawer = await openCart(page)
    await expect(drawer.getByTestId('cart-line')).toContainText('Price updated to $6.50')
    await expect(drawer.getByTestId('line-total')).toHaveText('$6.50')
    await expect(drawer.getByRole('link', { name: 'Checkout' })).toBeVisible()
  })

  test('ORD-026 suggests sides when no fries in cart, dismissible', async ({ page }) => {
    await page.goto('/menu')
    await addItem(page, 'Reuben', { choices: { Meat: ['Corned beef'] } })
    const drawer = await openCart(page)
    const suggest = drawer.getByRole('region', { name: 'Add a side?' })
    await expect(suggest.getByRole('button', { name: /^Add / })).toHaveCount(2)
    await suggest.getByRole('button', { name: 'Add Krinkle-Cut French Fries' }).click()
    await expect(page.getByRole('dialog', { name: 'Krinkle-Cut French Fries' })).toBeVisible()
    await page.keyboard.press('Escape')
    const drawer2 = await openCart(page)
    await drawer2.getByRole('region', { name: 'Add a side?' }).getByRole('button', { name: /dismiss/i }).click()
    await expect(drawer2.getByRole('region', { name: 'Add a side?' })).toHaveCount(0)
  })

  test('ORD-026 no side suggestion when fries are already in the cart', async ({ page }) => {
    await page.goto('/menu')
    await addItem(page, 'Sweet Potato Fries')
    const drawer = await openCart(page)
    await expect(drawer.getByRole('region', { name: 'Add a side?' })).toHaveCount(0)
  })

  test('ORD-027 subtotal over $500 blocks checkout', async ({ page }) => {
    await page.goto('/menu')
    await addItem(page, 'Steamed Shrimp', { variant: 'Pound', quantity: 20 }) // $439.00
    await addItem(page, 'Appetizer Sampler', { quantity: 5 }) // $74.75
    const drawer = await openCart(page)
    await expect(drawer.getByTestId('cart-subtotal')).toHaveText('$513.75')
    await expect(drawer.getByTestId('checkout-blocked-reason')).toHaveText('For orders over $500, please call (302) 337-8602')
    await expect(drawer.getByRole('button', { name: 'Checkout' })).toBeDisabled()
  })
})

test.describe('Ordering status bar', () => {
  test('ORD-040 open', async ({ page }) => {
    await page.goto('/order')
    await expect(page.getByTestId('ordering-status')).toHaveText('Pickup · Ready in about 20 min')
  })

  test('ORD-040 lead time comes from settings', async ({ page, app }) => {
    await app.settings({ prepLeadMinutes: 35 })
    await page.goto('/order')
    await expect(page.getByTestId('ordering-status')).toHaveText('Pickup · Ready in about 35 min')
  })

  test('ORD-040 ORD-041 before opening: message, checkout allowed', async ({ page, app }) => {
    await app.setClock('2026-11-06T09:00:00-05:00')
    await page.goto('/order')
    await expect(page.getByTestId('ordering-status')).toHaveText('Online ordering opens at 11:00 AM — schedule for later today')
    await addItem(page, 'Soda')
    const drawer = await openCart(page)
    await expect(drawer.getByRole('link', { name: 'Checkout' })).toBeVisible()
  })

  test('ORD-040 ORD-041 closed for the day blocks checkout', async ({ page, app }) => {
    await app.setClock('2026-11-05T22:30:00-05:00') // Thu after close
    await page.goto('/order')
    const msg = 'Online ordering is closed. We open Fri at 11:00 AM.'
    await expect(page.getByTestId('ordering-status')).toHaveText(msg)
    await addItem(page, 'Soda')
    const drawer = await openCart(page)
    await expect(drawer.getByTestId('checkout-blocked-reason')).toHaveText(msg)
    await expect(drawer.getByRole('button', { name: 'Checkout' })).toBeDisabled()
  })

  test('ORD-040 CHK-014 no slots left (Thu 9:45 PM) counts as closed', async ({ page, app }) => {
    await app.setClock('2026-11-05T21:45:00-05:00')
    await page.goto('/order')
    await expect(page.getByTestId('ordering-status')).toHaveText('Online ordering is closed. We open Fri at 11:00 AM.')
  })

  test('ORD-040 ORD-041 paused shows pause message and blocks checkout', async ({ page, app }) => {
    await app.settings({ orderingPausedUntil: '2026-11-06T18:00:00-05:00' })
    await page.goto('/order')
    const msg = 'Online ordering is paused — please call (302) 337-8602.'
    await expect(page.getByTestId('ordering-status')).toHaveText(msg)
    await addItem(page, 'Soda')
    const drawer = await openCart(page)
    await expect(drawer.getByTestId('checkout-blocked-reason')).toHaveText(msg)
  })

  test('ORD-040 pause expires on its own', async ({ page, app }) => {
    await app.settings({ orderingPausedUntil: '2026-11-06T16:30:00-05:00' })
    await page.goto('/order')
    await expect(page.getByTestId('ordering-status')).toHaveText('Pickup · Ready in about 20 min')
  })

  test('ORD-040 ORD-041 disabled', async ({ page, app }) => {
    await app.settings({ onlineOrderingEnabled: false })
    await page.goto('/order')
    const msg = 'Online ordering is currently unavailable. Call (302) 337-8602.'
    await expect(page.getByTestId('ordering-status')).toHaveText(msg)
    await addItem(page, 'Soda')
    const drawer = await openCart(page)
    await expect(drawer.getByTestId('checkout-blocked-reason')).toHaveText(msg)
  })
})
