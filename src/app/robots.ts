import type { MetadataRoute } from 'next'
import { siteUrl } from '@/lib/seo'

// SEO-005
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/kitchen', '/api', '/order/confirmation'] }],
    sitemap: `${siteUrl()}/sitemap.xml`,
  }
}
