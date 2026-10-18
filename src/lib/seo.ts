import type { Metadata } from 'next'

export const siteUrl = () =>
  (
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '') ||
    'http://localhost:3000'
  ).replace(/\/$/, '')

/** SEO-001: unique title + description, canonical, Open Graph. */
export function pageMeta(path: string, title: string | null, description: string): Metadata {
  const url = `${siteUrl()}${path === '/' ? '/' : path}`
  const ogTitle = title ? `${title} | Jeff's Taproom & Grill` : "Jeff's Taproom & Grill | Bridgeville, DE"
  return {
    ...(title ? { title } : {}),
    description,
    alternates: { canonical: url },
    openGraph: { title: ogTitle, description, url, siteName: "Jeff's Taproom & Grill", type: 'website', images: [{ url: '/og.png', width: 1200, height: 630 }] },
  }
}

export const jsonLdScript = (data: unknown) => ({ __html: JSON.stringify(data).replace(/</g, '\\u003c') })
