import { test, expect, WORKED_EXAMPLE_LINES } from './fixtures/app'
import type { Page } from '@playwright/test'

// specs/31-seo-performance.md

const PUBLIC = ['/', '/menu', '/order', '/specials', '/events', '/on-tap', '/burger-challenge', '/private-events', '/visit', '/events/trivia-night']

async function jsonLd(page: Page) {
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents()
  return blocks.flatMap((b) => {
    const parsed = JSON.parse(b)
    return parsed['@graph'] ?? (Array.isArray(parsed) ? parsed : [parsed])
  }) as Record<string, any>[]
}

const isType = (node: Record<string, any>, t: string) => ([] as string[]).concat(node['@type']).includes(t)

test.describe('SEO', () => {
  test('SEO-001 description, canonical and Open Graph on every public page', async ({ page, baseURL }) => {
    const descriptions = new Set<string>()
    for (const path of PUBLIC) {
      await page.goto(path)
      const desc = await page.locator('meta[name="description"]').getAttribute('content')
      expect(desc, path).toBeTruthy()
      expect(desc!.length, `${path} description length`).toBeGreaterThanOrEqual(50)
      expect(desc!.length, `${path} description length`).toBeLessThanOrEqual(160)
      descriptions.add(desc!)
      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href')
      expect(canonical?.replace(/\/$/, ''), path).toBe(`${baseURL}${path}`.replace(/\/$/, ''))
      for (const p of ['og:title', 'og:description', 'og:image', 'og:url']) {
        await expect(page.locator(`meta[property="${p}"]`), `${path} ${p}`).toHaveAttribute('content', /.+/)
      }
    }
    expect(descriptions.size).toBe(PUBLIC.length)
  })

  test('SEO-002 home JSON-LD BarOrPub', async ({ page, baseURL }) => {
    await page.goto('/')
    const bar = (await jsonLd(page)).find((n) => isType(n, 'BarOrPub'))
    expect(bar).toBeTruthy()
    expect(bar!.name).toBe("Jeff's Taproom & Grill")
    expect(bar!.address).toMatchObject({
      '@type': 'PostalAddress',
      streetAddress: '416 Market Street',
      addressLocality: 'Bridgeville',
      addressRegion: 'DE',
      postalCode: '19933',
      addressCountry: 'US',
    })
    expect(bar!.telephone).toBe('+1-302-337-8602')
    expect(bar!.geo).toMatchObject({ '@type': 'GeoCoordinates' })
    expect(JSON.stringify(bar!.openingHoursSpecification)).toContain('Friday')
    expect(bar!.servesCuisine).toEqual(['American', 'Bar food', 'Seafood', 'Wings'])
    expect(bar!.menu).toBe(`${baseURL}/menu`)
    expect(bar!.acceptsReservations).toBe(false)
    expect(bar!.priceRange).toBe('$$')
  })

  test('SEO-003 menu JSON-LD with sections, prices and no offers for MKT', async ({ page }) => {
    await page.goto('/menu')
    const menu = (await jsonLd(page)).find((n) => isType(n, 'Menu'))
    expect(menu).toBeTruthy()
    expect(menu!.hasMenuSection).toHaveLength(9)
    const items = menu!.hasMenuSection.flatMap((s: { hasMenuItem: any[] }) => s.hasMenuItem)
    expect(items).toHaveLength(46)
    const reuben = items.find((i: { name: string }) => i.name === 'Reuben')
    const offer = [].concat(reuben.offers)[0] as { price: string | number; priceCurrency: string }
    expect(Number(offer.price)).toBe(10.95)
    expect(offer.priceCurrency).toBe('USD')
    const crab = items.find((i: { name: string }) => i.name === 'Crab-Balls')
    expect(crab.offers).toBeUndefined()
  })

  test('SEO-004 EVT-005 event detail JSON-LD', async ({ page }) => {
    await page.goto('/events/trivia-night')
    const ev = (await jsonLd(page)).find((n) => isType(n, 'Event'))
    expect(ev).toBeTruthy()
    expect(ev!.name).toBe('Trivia Night')
    expect(new Date(ev!.startDate).toISOString()).toBe(new Date('2026-11-11T19:00:00-05:00').toISOString())
    expect(JSON.stringify(ev!.location)).toContain('416 Market Street')
  })

  test('SEO-005 sitemap lists public routes and events', async ({ request, baseURL }) => {
    const res = await request.get('/sitemap.xml')
    expect(res.status()).toBe(200)
    const xml = await res.text()
    for (const path of ['/menu', '/order', '/specials', '/events', '/on-tap', '/burger-challenge', '/private-events', '/visit', '/events/trivia-night']) {
      expect(xml, path).toContain(`<loc>${baseURL}${path}</loc>`)
    }
    expect(xml).not.toContain('/kitchen')
    expect(xml).not.toContain('/admin')
  })

  test('SEO-005 robots.txt', async ({ request, baseURL }) => {
    const txt = await (await request.get('/robots.txt')).text()
    for (const p of ['/admin', '/kitchen', '/api', '/order/confirmation']) expect(txt).toMatch(new RegExp(`Disallow: ${p}\\b`))
    expect(txt).toContain(`Sitemap: ${baseURL}/sitemap.xml`)
  })

  test('SEO-006 noindex on confirmation, kitchen and admin', async ({ page, app }) => {
    const order = await app.createOrder({ lines: WORKED_EXAMPLE_LINES })
    for (const path of [new URL(order.statusUrl, 'http://x').pathname, '/kitchen/login', '/admin/login']) {
      const res = await page.goto(path)
      const header = res?.headers()['x-robots-tag'] ?? ''
      const meta = (await page.locator('meta[name="robots"]').getAttribute('content').catch(() => null)) ?? ''
      expect(`${header} ${meta}`, path).toContain('noindex')
    }
  })

  test('SEO-007 trailing slash redirects with 308', async ({ request }) => {
    const res = await request.get('/menu/', { maxRedirects: 0 })
    expect(res.status()).toBe(308)
    expect(res.headers()['location']).toMatch(/\/menu$/)
  })
})
