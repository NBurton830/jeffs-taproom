# 01 — Architecture

## ARCH-001 Open-source stack (P0)

Every runtime dependency must use an OSI-approved licence.

| Concern | Choice | Licence |
|---|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript 6 | MIT / Apache-2.0 |
| CMS + API + admin | **Payload CMS 3.x** (runs inside the Next.js app) | MIT |
| Database | SQLite (`@payloadcms/db-sqlite`) for dev/test. PostgreSQL 16 (`@payloadcms/db-postgres`) for production | MIT / PostgreSQL |
| Styling | Tailwind CSS 4 | MIT |
| Images | `sharp` via Payload uploads, `next/image` | Apache-2.0 |
| Email | `nodemailer` over SMTP (any provider, or self-hosted) | MIT-0 |
| Maps | OpenStreetMap tiles + Leaflet (or an OSM embed) | ODbL / BSD-2 |
| E2E tests | Playwright + `@axe-core/playwright` | Apache-2.0 / MPL-2.0 |
| Hosting | Docker Compose (app + Postgres + Caddy) on any VPS. Coolify optional | Apache-2.0 |

Payment processors are not open source. They live behind an adapter (ARCH-004) so that none is required.

**Why Payload:** it is MIT-licensed and Next-native, so the CMS, REST/GraphQL API, auth, admin UI and our order API are
**one deployable**. It has code-first schemas (reviewable in git), field-level access control, and hooks for order
logic. Strapi and Directus were considered. Directus uses the BSL licence (not OSI), and Strapi needs a second service.

## ARCH-002 Single app, one repo (P0)

```
/app/(site)/...         public pages (server components)
/app/(site)/order/...   ordering flow
/app/kitchen/...        staff kitchen display (auth-gated)
/app/(payload)/admin    Payload admin UI (auto-generated)
/app/api/...            custom route handlers (orders, kitchen stream, test API)
/src/collections        Payload collections
/src/globals            Payload globals
/src/lib/pricing.ts     single source of truth for price math (shared client/server)
/src/lib/hours.ts       open-status & pickup slot logic
/src/lib/clock.ts       now() — overridable in test mode
/src/seed               seed data (menu from 03-menu-data.md)
/specs                  these documents
/tests                  Playwright suite
```

## ARCH-003 Orders reach the back end (P0)

"Back end" for v1 means the following:

1. The order is persisted in the Payload `orders` collection (source of truth).
2. It appears live on the **Kitchen Display** (`/kitchen`) within 5 s (KDS-003).
3. An optional email notification goes to the restaurant (`settings.orderNotificationEmail`).
4. **POS adapter** (P2): `src/lib/pos/` defines `interface PosAdapter { pushOrder(order): Promise<{externalId}> }`.
   The default is `NoopPosAdapter`. Toast, Square and Clover adapters wait on Q-001.

## ARCH-004 Payment adapter (P0 interface, P2 online card)

```ts
interface PaymentProvider {
  id: 'pay_at_pickup' | string
  createPayment(order): Promise<{ status: 'pending' | 'requires_action' | 'paid'; redirectUrl?: string }>
}
```

v1 ships `pay_at_pickup`, with the methods **cash** (3% discount) and **card at counter**. Online prepayment (Stripe,
Square, etc.) is a P2 adapter that waits on Q-002.

## ARCH-005 Realtime (P0)

The kitchen display receives new and changed orders over **Server-Sent Events** at `GET /api/kitchen/stream`, and falls
back to polling every 5 s. The customer status page polls `GET /api/orders/:publicId/status` every 5 s, with no
websockets server required.

## ARCH-006 Environments (P0)

| Env var | Purpose |
|---|---|
| `DATABASE_URI` | `file:./data/dev.db` (SQLite) or `postgres://…` |
| `PAYLOAD_SECRET` | Payload auth secret |
| `NEXT_PUBLIC_SITE_URL` | canonical URL |
| `SMTP_URL`, `MAIL_FROM` | email (optional. If unset, mail is logged to stdout) |
| `ENABLE_TEST_API` | `1` enables `/api/test/*` (TEST-003). **Must never be set in production** (SEC-008) |
| `SEED_STAFF_EMAIL`, `SEED_STAFF_PASSWORD` | initial admin user |

## ARCH-007 Deployment (P1) _(manual)_

- `docker compose up -d` brings up `app`, `postgres` and `caddy` (automatic HTTPS).
- Nightly `pg_dump` backup goes to a mounted volume, with 14-day retention.
- `pnpm seed:menu` is idempotent. It creates missing menu items and never overwrites prices staff have edited.
