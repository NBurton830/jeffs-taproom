import { test, expect } from './fixtures/app'
import { CATEGORY_ORDER, ITEMS, CATEGORY_NOTES, MODIFIER_GROUPS, ITEM_GROUPS } from './fixtures/menu'

// specs/12-menu.md, specs/03-menu-data.md, PERF-005

test.describe('Menu data (via GET /api/menu)', () => {
  async function menuJson(request: import('@playwright/test').APIRequestContext) {
    const { categories } = await (await request.get('/api/menu')).json()
    return categories.flatMap((c: { slug: string; items: any[] }) => c.items.map((i) => ({ ...i, category: c.slug }))) as any[]
  }

  test('MENU-DATA-001 modifier groups: names, limits and options', async ({ request }) => {
    const groups = new Map<string, any>()
    for (const item of await menuJson(request)) for (const g of item.modifierGroups) groups.set(g.key, g)
    expect([...groups.keys()].sort()).toEqual(Object.keys(MODIFIER_GROUPS).sort())
    for (const [key, exp] of Object.entries(MODIFIER_GROUPS)) {
      const g = groups.get(key)
      expect(g.name, key).toBe(exp.name)
      expect([g.minSelect, g.maxSelect], key).toEqual([exp.min, exp.max])
      expect(g.options.map((o: { label: string; priceDeltaCents: number }) => [o.label, o.priceDeltaCents]), key).toEqual(exp.options)
    }
    expect(groups.get('side-swap').options.find((o: { label: string }) => o.label === 'Chips').default).toBe(true)
    expect(groups.get('wing-sauce').maxSelectByVariant).toEqual({ '16 wings': 2, '20 wings': 2 })
  })

  test('MENU-DATA-002 items: category, prices and modifier groups in order', async ({ request }) => {
    const items = await menuJson(request)
    for (const exp of ITEMS) {
      const item = items.find((i) => i.slug === exp.slug)
      expect(item, exp.slug).toBeTruthy()
      expect(item.name).toBe(exp.name)
      expect(item.category, exp.slug).toBe(exp.category)
      expect(item.modifierGroups.map((g: { key: string }) => g.key), exp.slug).toEqual(ITEM_GROUPS[exp.slug] ?? [])
    }
    const challenge = items.find((i) => i.slug === 'big-burger-challenge')
    expect(challenge).toMatchObject({ onlineOrderable: false, orderingNote: 'In-house only' })
  })
})

test.describe('Menu', () => {
  test('MENU-DATA-005 9 categories and 46 items', async ({ page }) => {
    await page.goto('/menu')
    expect(ITEMS).toHaveLength(46)
    await expect(page.locator('main section[id] > h2')).toHaveCount(CATEGORY_ORDER.length)
    await expect(page.locator('[data-testid^="menu-item-"]')).toHaveCount(46)
  })

  test('MENU-001 MENU-002 categories are HTML sections with ids in canonical order', async ({ page }) => {
    await page.goto('/menu')
    const headings = page.locator('main section[id] > h2')
    await expect(headings).toHaveText(CATEGORY_ORDER.map((c) => c.name))
    for (const c of CATEGORY_ORDER) {
      await expect(page.locator(`section#${c.slug}`)).toHaveCount(1)
    }
  })

  test('MENU-004 every item shows name, exact price text, and Add button when orderable', async ({ page }) => {
    await page.goto('/menu')
    for (const item of ITEMS) {
      const card = page.getByTestId(`menu-item-${item.slug}`)
      await expect(card.getByRole('heading', { level: 3 }), item.slug).toHaveText(item.name)
      await expect(card.getByTestId('item-price'), item.slug).toHaveText(item.price)
      await expect(card.locator(`xpath=ancestor::section[@id="${item.category}"]`), item.slug).toHaveCount(1)
      const add = card.getByRole('button', { name: `Add ${item.name}`, exact: true })
      await expect(add, item.slug).toHaveCount(item.orderable ? 1 : 0)
    }
  })

  test('MENU-004 descriptions match printed menu', async ({ page }) => {
    await page.goto('/menu')
    await expect(page.getByTestId('menu-item-jalapeno-poppers')).toContainText(
      'Stuffed with cream cheese and served with raspberry sauce.',
    )
    await expect(page.getByTestId('menu-item-big-ass-fish-sandwich')).toContainText(
      '10 oz portion of battered haddock on a sub roll.',
    )
  })

  test('MENU-005 category notes', async ({ page }) => {
    await page.goto('/menu')
    for (const [slug, note] of Object.entries(CATEGORY_NOTES)) {
      await expect(page.locator(`section#${slug}`).getByTestId('category-note')).toHaveText(note)
    }
  })

  test('MENU-006 in-house only and market price reasons', async ({ page }) => {
    await page.goto('/menu')
    await expect(page.getByTestId('menu-item-big-burger-challenge').getByTestId('item-unavailable-reason')).toHaveText('In-house only')
    await expect(page.getByTestId('menu-item-share-the-challenge').getByTestId('item-unavailable-reason')).toHaveText('In-house only')
    await expect(page.getByTestId('menu-item-crab-balls').getByTestId('item-unavailable-reason')).toHaveText(
      'Market price — call (302) 337-8602',
    )
    await expect(page.getByTestId('menu-item-cream-of-crab').getByTestId('item-unavailable-reason')).toHaveText(
      'Market price — call (302) 337-8602',
    )
  })

  test('MENU-DATA-003 market price set by staff makes item orderable', async ({ page, app }) => {
    await app.updateItem('crab-balls', {
      variants: [
        { label: 'Half dozen', priceCents: 1895, isMarketPrice: true },
        { label: 'Dozen', priceCents: 3495, isMarketPrice: true },
      ],
    })
    await page.goto('/menu')
    const card = page.getByTestId('menu-item-crab-balls')
    await expect(card.getByTestId('item-price')).toHaveText('Half dozen $18.95 | Dozen $34.95')
    await expect(card.getByText('Market price', { exact: true })).toBeVisible()
    await expect(card.getByRole('button', { name: 'Add Crab-Balls' })).toBeVisible()
  })

  test('MENU-003 category jump bar links and focus', async ({ page }) => {
    await page.goto('/menu')
    const jump = page.getByRole('navigation', { name: 'Menu categories' })
    await expect(jump.getByRole('link')).toHaveCount(CATEGORY_ORDER.length)
    await jump.getByRole('link', { name: 'Burgers', exact: true }).click()
    await expect(page.getByRole('heading', { level: 2, name: 'Burgers' })).toBeFocused()
    await expect(page.getByRole('heading', { level: 2, name: 'Burgers' })).toBeInViewport()
    await expect(jump.getByRole('link', { name: 'Burgers', exact: true })).toHaveAttribute('aria-current', 'true')
  })

  test('MENU-003 jump bar stays visible while scrolling', async ({ page }) => {
    await page.goto('/menu')
    await page.locator('section#sandwiches').scrollIntoViewIfNeeded()
    await expect(page.getByRole('navigation', { name: 'Menu categories' })).toBeInViewport()
  })

  test('MENU-007 search is accent-insensitive and shows count', async ({ page }) => {
    await page.goto('/menu')
    await page.getByRole('searchbox', { name: 'Search the menu' }).fill('jalapeno')
    // Poppers, Burger, Nachos and Appetizer Sampler (the last two match on description)
    await expect(page.getByTestId('menu-result-count')).toHaveText('4 items')
    await expect(page.getByTestId('menu-item-jalapeno-poppers')).toBeVisible()
    await expect(page.getByTestId('menu-item-appetizer-sampler')).toBeVisible()
    await expect(page.getByTestId('menu-item-jalapeno-burger')).toBeVisible()
    await expect(page.getByTestId('menu-item-loaded-nachos')).toBeVisible()
    await expect(page.getByTestId('menu-item-reuben')).toBeHidden()
    await expect(page.locator('section#drinks')).toBeHidden()
  })

  test('MENU-007 search matches descriptions, case-insensitive', async ({ page }) => {
    await page.goto('/menu')
    await page.getByRole('searchbox', { name: 'Search the menu' }).fill('HADDOCK')
    await expect(page.getByTestId('menu-result-count')).toHaveText('1 item')
    await expect(page.getByTestId('menu-item-big-ass-fish-sandwich')).toBeVisible()
  })

  test('MENU-007 no results state with clear', async ({ page }) => {
    await page.goto('/menu')
    const search = page.getByRole('searchbox', { name: 'Search the menu' })
    await search.fill('sushi')
    await expect(page.getByText('No items match "sushi"')).toBeVisible()
    await page.getByRole('button', { name: 'Clear' }).click()
    await expect(search).toHaveValue('')
    await expect(page.locator('[data-testid^="menu-item-"]:visible')).toHaveCount(46)
  })

  test("MENU-008 86'd item shows Sold out today and no Add", async ({ page, app }) => {
    await app.updateItem('onion-petals', { available: false })
    await page.goto('/menu')
    const card = page.getByTestId('menu-item-onion-petals')
    await expect(card).toBeVisible()
    await expect(card.getByText('Sold out today')).toBeVisible()
    await expect(card.getByRole('button', { name: 'Add Onion Petals' })).toHaveCount(0)
  })

  test('MENU-009 filter chips combine with search', async ({ page }) => {
    await page.goto('/menu')
    await page.getByRole('button', { name: 'Seafood', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Seafood', exact: true })).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByTestId('menu-item-shrimp-jammers')).toBeVisible()
    await expect(page.getByTestId('menu-item-smash-burger')).toBeHidden()
    await page.getByRole('searchbox', { name: 'Search the menu' }).fill('shrimp')
    await expect(page.getByTestId('menu-item-shrimp-jammers')).toBeVisible()
    await expect(page.getByTestId('menu-item-rockfish-and-chips')).toBeHidden()
  })

  test('MENU-010 MENU-DATA-004 footer notes', async ({ page }) => {
    await page.goto('/menu')
    const main = page.getByRole('main')
    await expect(main).toContainText('Sodas: $3.00 (one refill included)')
    await expect(main).toContainText('3% discount applied when paying with cash.')
  })

  test('MENU-012 deep link scrolls to category', async ({ page }) => {
    await page.goto('/menu#wings')
    await expect(page.getByRole('heading', { level: 2, name: 'Taproom Famous Wings' })).toBeInViewport()
  })

  test('PERF-005 menu is server-rendered', async ({ request }) => {
    const html = await (await request.get('/menu')).text()
    const text = html
      .replace(/&amp;/g, '&')
      .replace(/&#x27;|&#39;|&apos;/g, "'")
      .replace(/&quot;/g, '"')
    for (const item of ITEMS) expect(text.includes(item.name), item.slug).toBe(true)
  })

  test('MENU-DATA-006 tag badges', async ({ page }) => {
    await page.goto('/menu')
    await expect(page.getByTestId('menu-item-bone-in-wings')).toContainText('Popular')
    await expect(page.getByTestId('menu-item-jalapeno-burger')).toContainText('Spicy')
    await expect(page.getByTestId('menu-item-shrimp-jammers')).toContainText('Seafood')
    await expect(page.getByTestId('menu-item-cheese-quesadilla')).toContainText('Vegetarian')
    await expect(page.getByTestId('menu-item-reuben')).not.toContainText(/Popular|Spicy|Seafood|Vegetarian/)
  })

  test('MENU-011 no placeholder images; any image is lazy with explicit size', async ({ page }) => {
    await page.goto('/menu')
    for (const img of await page.locator('[data-testid^="menu-item-"] img').all()) {
      await expect(img).toHaveAttribute('loading', 'lazy')
      await expect(img).toHaveAttribute('width', /\d+/)
      await expect(img).toHaveAttribute('height', /\d+/)
    }
    // the test seed has no item photos, so items render as text cards
    await expect(page.locator('[data-testid^="menu-item-"] img')).toHaveCount(0)
  })

  test('/order renders the same menu with ordering status', async ({ page }) => {
    await page.goto('/order')
    await expect(page.getByTestId('ordering-status')).toBeVisible()
    await expect(page.locator('[data-testid^="menu-item-"]')).toHaveCount(46)
  })
})
