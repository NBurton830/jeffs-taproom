# Jeff's Taproom & Grill

Website, online pickup ordering and kitchen display for Jeff's Taproom & Grill, 416 Market Street, Bridgeville, DE.

Everything is open source: Next.js 16, Payload CMS 3 (MIT), SQLite or PostgreSQL, Tailwind CSS, Leaflet and OpenStreetMap,
and Playwright.

- **Specs:** [`specs/`](specs/README.md). Every requirement has an ID such as `ORD-012`.
- **Tests:** [`tests/`](tests/). Playwright test titles start with the requirement IDs they cover.

## What's in it

| URL | What |
|---|---|
| `/` | Home: open status, today's specials and events, fan favourites, map |
| `/menu`, `/order` | Menu with search and filters. `/order` adds pickup status and the cart |
| `/order/checkout` | Pickup time, details, pay at pickup (3% off for cash), tip |
| `/order/confirmation/{id}` | Live order status for the customer |
| `/kitchen` | Kitchen display: accept, mark ready, delay, cancel, pause ordering, 86 items |
| `/admin` | Payload CMS for menu, prices, hours, events, specials, taps, Hall of Fame and staff |
| `/specials`, `/events`, `/on-tap`, `/burger-challenge`, `/private-events`, `/visit` | Content pages |

## Develop

```sh
pnpm install
cp .env.example .env          # set PAYLOAD_SECRET
pnpm dev                      # http://localhost:3000 (SQLite, schema auto-pushed, menu seeded on first boot)
```

Create the first admin user at `/admin`, or set `SEED_STAFF_EMAIL` and `SEED_STAFF_PASSWORD` before the first boot.

## Test

```sh
pnpm exec playwright install chromium
pnpm test:e2e                 # builds, starts on :3100 with a fresh SQLite DB, runs desktop + mobile
pnpm spec:coverage            # every P0/P1 requirement has a test
pnpm typecheck
```

For a faster loop, build once, run `./scripts/serve-e2e.sh` in one terminal, then run
`PW_REUSE_SERVER=1 pnpm test:e2e --grep ORD-` in another.

The e2e server exposes `/api/test/*` (reset, clock, settings) only when both `ENABLE_TEST_API=1` and `E2E=1` are set.
The production container refuses to start if either one is set.

## Deploy

```sh
cp .env.example .env          # set NEXT_PUBLIC_SITE_URL, SITE_DOMAIN, PAYLOAD_SECRET, POSTGRES_PASSWORD, SMTP_URL
docker compose up -d --build  # app + Postgres 16 + Caddy (HTTPS) + nightly backups
```

The container runs `payload migrate` on start (migrations live in `src/migrations`, Postgres). After changing a
collection, run `pnpm payload migrate:create <name>` with a Postgres `DATABASE_URI`.

## Open questions for the owner

[`specs/99-open-questions.md`](specs/99-open-questions.md). The site works on the defaults listed there: pay at pickup,
no POS sync, no online alcohol sales, and placeholder hours, photos and logo.
