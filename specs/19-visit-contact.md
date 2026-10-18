# 19 — Visit, Hours, Private Events

## Visit `/visit`

- **VIS-001 (P0)** Shows the address as `<address>`, "416 Market Street, Bridgeville, DE 19933", and the phone as
  `<a href="tel:+13023378602">(302) 337-8602</a>`.
- **VIS-002 (P0)** Weekly hours table (`<table>` with caption "Hours") with today's row highlighted (`aria-current="date"`).
  Each row reads e.g. `Mon` / `11:00 AM – 10:00 PM` (en dash with spaces). A close time after midnight renders as `12:00 AM`. Holiday exceptions in the next 14 days are listed beneath it.
- **VIS-003 (P0)** **Get directions** link. The server renders
  `https://www.google.com/maps/dir/?api=1&destination=416+Market+Street,+Bridgeville,+DE+19933` (it works on every
  platform). On Apple devices (iOS/macOS user agent), the client swaps it for
  `https://maps.apple.com/?daddr=416+Market+Street,+Bridgeville,+DE+19933`. It opens in a new tab with `rel="noopener"`.
- **VIS-004 (P0)** OpenStreetMap map (Leaflet, OSM tiles, attribution visible), with a marker at the venue. The map container is `data-testid="map"`. The map
  does not trap scrolling (scroll-zoom off, checked manually) and has an accessible text alternative (the address above it).
- **VIS-005 (P1)** _(manual)_ Parking and accessibility notes (CMS text, Q-007).

## Hours logic `src/lib/hours.ts` (P0)

- **VIS-010 (P0)** `getOpenStatus(now)` returns `{ state: 'open'|'closing_soon'|'closed', closesAt?, opensAt? }` and
  honours exceptions and past-midnight closes.
- **VIS-011 (P0)** Test-seed hours (placeholder until the owner confirms, Q-003):
  | Day | Hours |
  |---|---|
  | Mon–Thu | 11:00 AM – 10:00 PM |
  | Fri–Sat | 11:00 AM – 12:00 AM |
  | Sun | 11:00 AM – 9:00 PM |

## Private events & catering `/private-events`

- **VIS-020 (P1)** The page offers a form with these fields: **Name**, **Email**, **Phone**, **Event date** (date ≥
  tomorrow), **Number of guests** (1–200), **Event type** (Birthday, Team party, Watch party, Catering, Other) and
  **Message**, plus a submit button **Send inquiry**.
- **VIS-021 (P1)** On success, it shows "Thanks! We'll get back to you within 2 business days." The form posts to `POST /api/inquiries`
  `{ name, email, phone, date, guests, type, message, website }`. It creates an
  `inquiries` document and emails `orderNotificationEmail` when set.
- **VIS-022 (P1)** Validation matches CHK-017 (inline errors and an error summary). It has a honeypot plus rate limiting
  (SEC-003, SEC-004).
