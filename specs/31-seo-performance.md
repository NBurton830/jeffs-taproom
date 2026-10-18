# 31 — SEO & Performance

## SEO

- **SEO-001 (P0)** Every public page has a unique `<title>` (A11Y-005), a `<meta name="description">` of 50–160 chars,
  a canonical `<link rel="canonical">`, and Open Graph tags `og:title`, `og:description`, `og:image` and `og:url`.
- **SEO-002 (P0)** The home page includes JSON-LD of `@type: "BarOrPub"` (also a `Restaurant`) with the `name`, the
  `address` (PostalAddress: 416 Market Street, Bridgeville, DE, 19933, US), `telephone` "+1-302-337-8602", `geo`,
  `openingHoursSpecification` (from the hours global), `servesCuisine` ["American", "Bar food", "Seafood", "Wings"],
  `menu` (absolute URL to /menu), `acceptsReservations: false` and `priceRange: "$$"`.
- **SEO-003 (P0)** `/menu` includes JSON-LD of `@type: "Menu"` with a `hasMenuSection` per category and a `hasMenuItem`
  that has `offers.price` (dollars) and `priceCurrency: "USD"`. MKT items omit the offers.
- **SEO-004 (P1)** Event detail pages include JSON-LD `Event` (location = the venue).
- **SEO-005 (P0)** `/sitemap.xml` lists all public routes and event detail pages. `/robots.txt` allows everything
  except `/admin`, `/kitchen`, `/api` and `/order/confirmation`, and references the sitemap.
- **SEO-006 (P0)** Confirmation, kitchen and admin pages send `noindex`.
- **SEO-007 (P1)** Clean URLs, with no trailing-slash duplicates (redirect 308).

## Performance (P1) — measured with Lighthouse CI (`@lhci/cli`, Apache-2.0) on a Moto G Power emulation

- **PERF-001** Home and Menu: LCP ≤ 2.5 s, CLS ≤ 0.1, INP ≤ 200 ms, Lighthouse performance ≥ 90.
- **PERF-002** JS shipped to `/menu` ≤ 170 KB gzip (pages are server components, and only the cart and dialogs hydrate).
- **PERF-003** Images are served as AVIF/WebP with responsive `srcset`, and the hero image is preloaded.
- **PERF-004** Fonts are self-hosted with `font-display: swap`, and at most 2 families.
- **PERF-005 (P0, Playwright)** `/menu` HTML contains all 46 item names server-rendered (no client fetch needed to see
  the menu).
