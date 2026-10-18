# Jeff's Taproom & Grill — Website Rebuild Specs

416 Market Street, Bridgeville, DE 19933 · (302) 337-8602

## Process (spec → test → implement)

1. **Specs** (this folder) define every requirement with a stable ID (e.g. `ORD-012`).
2. **Playwright tests** (`/tests`) reference those IDs in their titles, e.g.
   `test('ORD-012 cart persists across reload', ...)`. Each P0/P1 requirement needs at least one test
   unless it is marked _(manual)_.
3. **Implementation** proceeds until `pnpm test:e2e` is green. A requirement is done when its tests pass.

Spec changes go first. If a test is wrong, fix the spec and then the test, never the other way around.

## Priorities

| Tag | Meaning |
|-----|---------|
| **P0** | Launch blocker |
| **P1** | Required for launch, can follow P0 by a few days |
| **P2** | Post-launch / pending owner decision. Specced but **not** covered by the launch test suite |

## Index

| File | Area | ID prefix |
|------|------|-----------|
| [00-research.md](00-research.md) | UX research & rationale | — |
| [01-architecture.md](01-architecture.md) | Stack, hosting, repo layout | ARCH |
| [02-content-model.md](02-content-model.md) | CMS collections & globals | CMS |
| [03-menu-data.md](03-menu-data.md) | Canonical menu, prices, modifiers | MENU-DATA |
| [10-site-shell.md](10-site-shell.md) | Layout, nav, footer, PWA | SHELL |
| [11-home.md](11-home.md) | Home page | HOME |
| [12-menu.md](12-menu.md) | Public menu browsing | MENU |
| [13-ordering-cart.md](13-ordering-cart.md) | Item customisation & cart | ORD |
| [14-checkout.md](14-checkout.md) | Checkout, pricing, payment | CHK |
| [15-order-tracking.md](15-order-tracking.md) | Confirmation & live status | TRK |
| [16-kitchen-display.md](16-kitchen-display.md) | Staff kitchen display (KDS) | KDS |
| [17-admin-cms.md](17-admin-cms.md) | Staff CMS / admin | ADM |
| [18-events-specials-taps.md](18-events-specials-taps.md) | Events, specials, tap list | EVT / SPC / TAP |
| [19-visit-contact.md](19-visit-contact.md) | Hours, location, inquiries | VIS |
| [20-burger-challenge.md](20-burger-challenge.md) | Big Burger Challenge & Hall of Fame | BBC |
| [30-accessibility.md](30-accessibility.md) | WCAG 2.2 AA | A11Y |
| [31-seo-performance.md](31-seo-performance.md) | SEO, structured data, perf | SEO / PERF |
| [32-security-privacy.md](32-security-privacy.md) | Security, privacy, abuse | SEC |
| [40-testing.md](40-testing.md) | Test harness, seed, selectors contract | TEST |
| [99-open-questions.md](99-open-questions.md) | Owner decisions needed | Q |

## Global conventions

- **Money** is stored and computed as integer **cents**. It is displayed as `$9.25`. There is no floating-point money anywhere.
- **Time zone** is always `America/New_York`. All "open now" / pickup-slot logic runs on the **server**
  clock (overridable in tests, see TEST-004).
- **Copy:** item names and descriptions appear exactly as on the printed menu (see 03-menu-data.md).
- **No fabricated content in production:** no fake reviews, no stock "testimonials". Demo events and specials
  exist only in the dev/test seed.
