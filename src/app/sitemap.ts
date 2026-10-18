import type { MetadataRoute } from 'next'
import { loadUpcomingEvents } from '@/lib/data'
import { siteUrl } from '@/lib/seo'

export const dynamic = 'force-dynamic'

const ROUTES = ['/', '/menu', '/order', '/specials', '/events', '/on-tap', '/burger-challenge', '/private-events', '/visit', '/accessibility', '/privacy']

// SEO-005
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl()
  const events = await loadUpcomingEvents()
  return [
    ...ROUTES.map((r) => ({ url: `${base}${r === '/' ? '' : r}` || base, changeFrequency: 'weekly' as const })),
    ...events.map((e) => ({ url: `${base}/events/${e.slug}`, changeFrequency: 'weekly' as const })),
  ]
}
