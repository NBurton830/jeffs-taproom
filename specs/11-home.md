# 11 — Home Page `/`

Goal: within one mobile viewport, answer **open? / what? / where? / order**.

- **HOME-001 (P0)** The hero has an `<h1>` (CMS `heroHeadline`, default "Beer. Wings. Bridgeville's Taproom.") and a
  subhead.
- **HOME-002 (P0)** The hero shows a primary CTA link **"Order Pickup"** → `/order` and a secondary link **"View Menu"** →
  `/menu`. On a 390×844 viewport, both are visible without scrolling.
- **HOME-003 (P0)** The hero shows the open-status line (the same text as SHELL-005), the address linked to directions,
  and the phone linked with `tel:`.
- **HOME-004 (P0)** **Today at Jeff's** section (`data-testid="home-today"`) lists the specials that are active today
  (SPC-002) and any events today. When there are none, the section shows today's hours instead of an empty state.
- **HOME-005 (P1)** **Fan favourites**: 3–6 item cards from `home.featuredItemSlugs` (in the test seed:
  `bone-in-wings`, `jeffs-famous-cheeseburger`, `rockfish-and-chips`, `loaded-nachos`). Each card shows its name and
  price and has an "Add" button that opens the item dialog (ORD-001) in place.
- **HOME-006 (P1)** **Upcoming events**: the next 3 events (EVT-001), with a "See all events" link.
- **HOME-007 (P1)** **Burger Challenge teaser** with the price, the 30-minute rule and a link to `/burger-challenge`.
- **HOME-008 (P1)** **Wing sauces strip** lists all 11 sauces (a visual list and a conversation starter).
- **HOME-009 (P0)** **Visit block**: OSM map (VIS-004), weekly hours, address, phone and directions.
- **HOME-010 (P0)** No modal or interstitial appears on load.
- **HOME-011 (P0)** Each home section is a `<section aria-labelledby>` (role region) whose `<h2>` names it: "Today at Jeff's",
  "Fan favourites", "Upcoming events", "Big Burger Challenge", "Wing sauces" and "Visit us". The hero is the first `<section>` in `<main>`.
