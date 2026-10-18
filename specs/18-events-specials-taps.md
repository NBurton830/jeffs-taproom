# 18 — Events, Specials, Tap List

## Events `/events`

- **EVT-001 (P0)** Lists upcoming events (`startsAt` ≥ the start of today, local time) ascending, each as
  `<article data-testid="event-{slug}">` with the title, a date like `Wed, Nov 11 · 7:00 PM`, the category badge and the
  description. Badge labels: `trivia` → Trivia, `music` → Live Music, `sports` → Sports, `party` → Party, `other` → Other.
- **EVT-002 (P0)** Past events are never shown (their detail URL returns 404). If there are no upcoming events, the page shows "No events on the calendar
  right now — follow us for updates" with social links.
- **EVT-003 (P0)** Event detail `/events/{slug}` with an **"Add to calendar"** link → `/events/{slug}/ics`, which serves
  a valid `text/calendar` file with `DTSTART;TZID=America/New_York:…`, a `UID`, `SUMMARY` and `LOCATION` (the venue address).
- **EVT-004 (P1)** Category filter chips (toggle buttons with `aria-pressed`: Trivia, Live Music, Sports, Party), OR logic like MENU-009.
- **EVT-005 (P1)** JSON-LD `Event` on the detail pages (SEO-004).

## Specials `/specials`

- **SPC-001 (P0)** The page shows a weekly grid of active specials, Monday–Sunday. Each day is a `data-testid="specials-day-{mon|tue|…|sun}"`
  element with the day name as a heading, and lists its specials with the title, `priceText` and time window ("4–7 PM").
- **SPC-002 (P0)** **Today** is highlighted (`aria-current="date"`) and listed first on mobile. The Home "Today at Jeff's"
  section uses the same selection (active, includes today's weekday).
- **SPC-003 (P1)** A special with a time window shows "Happening now" between `startTime` and `endTime`.

## On Tap `/on-tap`

- **TAP-001 (P1)** A region "On tap now" lists the taps with `status: on`, each showing its name, brewery, style and ABV ("6.5% ABV"). A
  region "Coming soon" follows.
- **TAP-002 (P1)** Kicked taps are not shown. The page shows "Updated {relative time}" based on the latest edit.
- **TAP-003 (P1)** A notice reads "Beer is available in-house. Ask your bartender about to-go options." Alcohol is not
  sold online in v1 (Q-005).
