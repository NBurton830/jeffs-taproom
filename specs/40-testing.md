# 40 — Testing Strategy & Harness Contract

## TEST-001 Tooling (P0)
- Playwright (`@playwright/test`) with `@axe-core/playwright`.
- Projects: **desktop-chromium** (1280×800) and **mobile-chromium** (Pixel 7 emulation). Tests tagged `@mobile` run
  only on mobile, tests tagged `@desktop` only on desktop, and untagged tests run on both. Tests tagged `@kds` run on
  desktop only.
- `webServer`: `pnpm build:e2e && pnpm start:e2e` on port **3100**, with `DATABASE_URI=file:./data/e2e.db`,
  `ENABLE_TEST_API=1` and `E2E=1`. Locally, `PW_REUSE_SERVER=1` reuses a running `pnpm dev:e2e`.
- `workers: 1`, `fullyParallel: false`. The DB is shared, so each test file resets in `beforeEach` with the `app`
  fixture.
- Commands: `pnpm test:e2e`, `pnpm test:e2e --grep ORD-` (by spec area), and `pnpm test:e2e:ui`.

## TEST-002 Traceability (P0)
Test titles start with the requirement ID(s): `test('CHK-031 worked example totals (cash + 15%)', …)`.
`pnpm spec:coverage` (a small script) lists P0/P1 IDs in `/specs` that have no matching test title. The launch gate
requires it to report 0 for P0. Structural IDs (`ARCH-*`, `CMS-*`, `TEST-*`) are exercised indirectly by every test and
are exempt.

## TEST-003 Test API (P0, only when enabled — SEC-008)
| Method & path | Body | Effect |
|---|---|---|
| `POST /api/test/reset` | `{ now?: ISO }` | Wipe the DB and load the **test seed** (TEST-005). Sets the clock to `now` or the default. Clears the outbox, rate limits and idempotency cache. Restarts order numbers at 1001 |
| `POST /api/test/clock` | `{ now: ISO \| null }` | Override the server clock (null = real time) |
| `PATCH /api/test/settings` | partial `settings` | Update the settings global |
| `PATCH /api/test/menu-items/{slug}` | partial item (e.g. `{available:false}`, `{variants:[…]}`) | Update an item |
| `POST /api/test/orders` | same body as `POST /api/orders` | Create an order bypassing rate limits (for KDS tests) |
| `GET /api/test/outbox` | — | `[{ to, subject, text }]` emails "sent" since the reset |
| `POST /api/test/jobs/redact-pii` | — | Run the SEC-007 redaction job now (uses the test clock) |

`GET /api/health` → `200 { ok: true }` is **always** available (not gated) and is used as the Playwright `webServer` readiness URL.

## TEST-004 Clock (P0)
`src/lib/clock.ts#now()` returns the override when set, else `new Date()`. **All** server-side time logic uses
`now()`. Pages that show time-dependent UI render on the server, or receive `serverNow` from the server, and never
trust the browser clock for business logic. Default test clock: **Friday 2026-11-06 17:00 America/New_York**
(`2026-11-06T17:00:00-05:00`), which is during opening hours.

Derived expectations at the default clock (with the VIS-011 hours, lead 20, slot 15, last order 30):
- Open status: `Open now · until 12:00 AM`
- ASAP: `ready around 5:20 PM`
- First slot `5:30 PM`, last slot `11:30 PM`

## TEST-005 Test seed (P0)
- Menu: exactly as in 03-menu-data.md (9 categories, 46 items). All MKT prices are null.
- Hours: VIS-011. No exceptions.
- Settings: defaults from CMS-020, plus `orderNotificationEmail: "orders@jeffstaproom.test"`.
- Home featured: `bone-in-wings`, `jeffs-famous-cheeseburger`, `rockfish-and-chips`, `loaded-nachos`.
- Users:
  | email | password | role |
  |---|---|---|
  | `admin@jeffstaproom.test` | `Taproom!test1` | admin |
  | `manager@jeffstaproom.test` | `Manager!test1` | manager |
  | `kitchen@jeffstaproom.test` | `Kitchen!test1` | kitchen |
- Event times are local Eastern wall-clock times. Halloween Bash is in EDT (−04:00), and everything from Nov 1 onward is in EST (−05:00).
- Events (dev/test only):
  | slug | title | startsAt (ET) | category |
  |---|---|---|---|
  | `halloween-bash` | Halloween Bash | 2026-10-31 20:00 | party (past, never shown) |
  | `karaoke-night` | Karaoke Night | 2026-11-06 21:00 | other (today) |
  | `sunday-football` | Sunday Football Watch Party | 2026-11-08 13:00 | sports |
  | `trivia-night` | Trivia Night | 2026-11-11 19:00 | trivia |
  | `live-music-saturday` | Live Music Saturday | 2026-11-14 20:00 | music |
- Specials (dev/test only):
  | title | days | time | priceText | active |
  |---|---|---|---|---|
  | Happy Hour | Mon–Fri | 16:00–19:00 | $1 off drafts | yes |
  | Fish Fry Friday | Fri | — | Rockfish & Chips $12.95 | yes |
  | Wing Wednesday | Wed | — | Bone-in wings 8 for $10 | yes |
  | Burger Tuesday | Tue | — | $2 off any burger | yes |
  | Retired Special | every day | — | — | **no** |
- Taps: `Dogfish Head 60 Minute IPA` (Dogfish Head, IPA, 6.0, on), `Miller Lite` (Miller, Light Lager, 4.2, on),
  `Yuengling Lager` (Yuengling, Lager, 4.5, on), `Guinness` (Guinness, Stout, 4.2, on),
  `Seasonal Pumpkin Ale` (Local, Pumpkin Ale, 5.5, coming-soon), `Old Kicked Keg` (Test, Pilsner, 5.0, kicked).
- Challenge entries: `Big Mike` won 24:13 (approved), `Sarah K.` won 28:40 (approved), `Tony R.` attempted (approved),
  `Hidden Hank` won 20:00 (**not approved**).

## TEST-006 Selector contract (P0)
Tests prefer roles, labels and visible text. `data-testid` is used only where these specs name it. Implementations
**must** keep the names and test ids from the specs verbatim. Renaming one is a spec change.

## TEST-007 File layout
```
tests/
  fixtures/app.ts        // test fixture: reset, clock, api helpers, staff login, cart helpers
  fixtures/menu.ts       // canonical menu data from 03-menu-data.md
  shell.spec.ts          // SHELL-*
  home.spec.ts           // HOME-*
  menu.spec.ts           // MENU-*, MENU-DATA-*, PERF-005
  ordering-cart.spec.ts  // ORD-*
  checkout.spec.ts       // CHK-* (UI)
  orders-api.spec.ts     // CHK-05x, SEC-001/003/004/006
  security.spec.ts       // SEC-002/005/007/009/010
  tracking.spec.ts       // TRK-*
  kitchen.spec.ts        // KDS-*
  admin.spec.ts          // ADM-*
  whats-on.spec.ts       // EVT-*, SPC-*, TAP-*
  visit.spec.ts          // VIS-*
  burger-challenge.spec.ts // BBC-*
  a11y.spec.ts           // A11Y-*
  seo.spec.ts            // SEO-*
  e2e-journeys.spec.ts   // full journeys: guest orders → kitchen fulfils → customer sees ready
```
