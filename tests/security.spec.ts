import { test, expect, staffApi, STAFF } from './fixtures/app'

// specs/32-security-privacy.md (SEC-001/003/004/006 live in orders-api.spec.ts)

test.describe('Security & privacy', () => {
  test('SEC-002 public cannot read private collections', async ({ request }) => {
    for (const path of ['/api/orders', '/api/inquiries', '/api/users']) {
      const res = await request.get(path)
      expect([401, 403], path).toContain(res.status())
    }
  })

  test('SEC-002 public cannot write content', async ({ request }) => {
    expect([401, 403]).toContain((await request.post('/api/menu-items', { data: { name: 'Free Beer', slug: 'free-beer' } })).status())
    expect([401, 403]).toContain((await request.post('/api/globals/settings', { data: { onlineOrderingEnabled: false } })).status())
  })

  test('SEC-002 only approved challenge entries are public', async ({ request }) => {
    const res = await request.get('/api/challenge-entries?limit=100')
    expect(res.status()).toBe(200)
    const names = (await res.json()).docs.map((d: { name: string }) => d.name)
    expect(names).toEqual(expect.arrayContaining(['Big Mike', 'Sarah K.', 'Tony R.']))
    expect(names).not.toContain('Hidden Hank')
  })

  test('SEC-005 security headers', async ({ request }) => {
    const res = await request.get('/')
    const h = res.headers()
    expect(h['x-content-type-options']).toBe('nosniff')
    expect(h['referrer-policy']).toBe('strict-origin-when-cross-origin')
    expect(h['permissions-policy']).toMatch(/camera=\(\)/)
    expect(h['permissions-policy']).toMatch(/microphone=\(\)/)
    const csp = h['content-security-policy']
    expect(csp).toBeTruthy()
    expect(csp).toContain("frame-ancestors 'none'")
    expect(csp).toMatch(/img-src[^;]*tile\.openstreetmap\.org/)
  })

  test('SEC-007 PII older than 180 days is redacted', async ({ app, playwright, baseURL }) => {
    await app.createOrder({ lines: [{ itemSlug: 'soda' }], customer: { name: 'Old Order', phone: '3025550123', email: 'old@example.com' } })
    await app.setClock('2027-05-05T17:00:00-04:00') // 180 days later, still open
    await app.createOrder({ lines: [{ itemSlug: 'soda' }], customer: { name: 'New Order', phone: '3025550456', email: 'new@example.com' } })
    await app.setClock('2027-05-06T17:00:00-04:00')
    expect((await app.request.post('/api/test/jobs/redact-pii')).status()).toBe(200)
    const a = await staffApi(playwright, baseURL!, 'admin')
    const old = await a.findOrder(1001)
    const recent = await a.findOrder(1002)
    await a.dispose()
    expect(old.customer.phone).toBe('***-0123')
    expect(old.customer.email ?? null).toBeNull()
    expect(recent.customer.email).toBe('new@example.com')
  })

  test('SEC-007 privacy policy states the retention period', async ({ page }) => {
    await page.goto('/privacy')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('main')).toContainText('180 days')
  })

  test('SEC-009 session cookie is HttpOnly and SameSite=Lax', async ({ request }) => {
    const res = await request.post('/api/users/login', { data: STAFF.kitchen })
    expect(res.status()).toBe(200)
    const cookie = res.headersArray().filter((x) => x.name.toLowerCase() === 'set-cookie').map((x) => x.value).join('\n')
    expect(cookie).toMatch(/payload-token=/)
    expect(cookie).toMatch(/HttpOnly/i)
    expect(cookie).toMatch(/SameSite=Lax/i)
  })

  test('TEST-003 health endpoint is always available', async ({ request }) => {
    const res = await request.get('/api/health')
    expect(res.status()).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
  })
})
