# 00 — UX Research & Rationale

Research date: 2026-10-18. Sources are listed at the bottom. Most industry sources are vendor blogs (Chowly,
DoorDash, POS vendors), so their percentages are directional. Baymard Institute's food-delivery and takeout usability
research is the most rigorous source.

## Who visits a neighbourhood bar & grill site, and why

| Visitor intent | What they need in < 5 seconds | Where we answer it |
|---|---|---|
| "Are they open right now?" | Open/closed badge + today's hours | Header badge, Home hero, Visit page |
| "What's on the menu / how much?" | Fast, scannable, mobile menu, real prices | `/menu` |
| "Order food for pickup" | One tap to an order flow they own (no marketplace commission) | "Order Pickup" CTA everywhere |
| "Call / get directions" | Tap-to-call, tap-for-directions | Sticky mobile action bar |
| "What's happening tonight?" | Specials, events, game nights, what's on tap | Home sections, `/events`, `/specials`, `/on-tap` |
| "Can I book a party / do the challenge?" | Clear form or phone CTA | `/private-events`, `/burger-challenge` |

## Findings → design decisions

1. **Answer the core questions immediately.** Visitors should see what you serve, where you are and how to order within
   seconds of landing. → The hero holds the Order CTA, the open status, the address and the phone number (HOME-001..004).
2. **Mobile first, one-handed.** Fast mobile loads, large tap targets, and menus readable without zooming. → 44×44 px
   minimum targets (A11Y-007), a sticky bottom action bar on mobile (SHELL-006), and an HTML menu instead of a PDF (MENU-001).
3. **Own the ordering channel.** Marketplace links send high-intent customers through commissions, and many consumers prefer
   ordering direct. → First-party ordering into our own back end (13–16). Third-party links are optional and secondary.
4. **Accurate, live menu.** Sold-out items frustrate customers. → Staff can "86" an item instantly from the KDS or CMS,
   and the site reflects it on the next request (KDS-014, MENU-008).
5. **Modifiers mirror the counter.** Too many options cause abandonment, and too few send people to the phone. → Only the
   choices the printed menu offers (sauce, dressing, cheese, side swap, add-ons), plus special instructions (03-menu-data).
6. **Editable cart.** Baymard highlights per-line "Edit" in the cart, because a cart without it leads to abandonment at
   checkout. → Every cart line has Edit / quantity / Remove (ORD-020..024).
7. **Clear fulfilment timing.** Baymard's 2026 benchmark found fulfilment timing and tipping were shown without enough
   detail to commit, and that sites lacked orientation and back paths. A taproom using Square reported that guests could
   not find where to schedule pickup. → Pickup time is an explicit, early checkout step. ASAP shows the actual estimated
   time ("Ready around 6:20 PM"). Tip choices show dollar amounts as well as percentages. A clear back path to the menu
   exists at every step (CHK-010..014, CHK-030).
8. **An order is more than a cart.** Kitchen orders need instructions and timing. Capacity and pause controls protect the
   kitchen. → Per-line notes, order notes, a configurable lead time, and a "Pause online ordering" switch (KDS-012).
9. **Bars sell the experience.** Taproom sites lead with what's on tap, happy hour, trivia and live music, and stale
   event listings hurt trust. → CMS-managed events with automatic hiding of past events (EVT-002), weekday-aware specials
   (SPC-002), and a tap list (TAP-*).
10. **Accessibility is a legal and UX baseline.** ADA web-accessibility claims against restaurants are common. → WCAG 2.2
    AA, enforced by automated axe scans in CI on every public page (A11Y-001).
11. **"The app" = an installable PWA.** It installs to the home screen and works without the App Store, review delays or
    fees. The menu works offline. → SHELL-010..012. Native apps are out of scope (see Q-008).

## Local / legal context that shapes the spec

- **Delaware has no sales tax.** The tax rate setting defaults to 0% but stays configurable (CHK-022).
- **Cash discount (3%).** The printed menu offers a 3% discount for cash. A true cash discount (a lower price for cash) is
  generally permitted, but card surcharges are a different regime. → We list menu prices and show the discount as a
  separate negative line only when "Pay with cash" is chosen. We never add a card fee (CHK-020). _Owner should confirm
  with their processor._
- **To-go alcohol** is permanent in Delaware (HB 290, 2022). It needs a sealed container, at least $10 of food, and
  quantity limits. → Alcohol is **not** sold online in v1 because of age verification, and the tap list is display-only.
  Revisit in Q-005.

## Patterns explicitly rejected

- PDF menus (not accessible, not indexable, poor on mobile).
- Auto-playing hero video with sound, and carousels for critical information.
- Pop-ups on landing (newsletter interstitials).
- Fake scarcity or fake reviews.

## Sources

- Chowly, "Restaurant Website Design: 7 Elements of a High-Converting Restaurant Website" — https://chowly.com/resources/blogs/restaurant-website-design-7-elements-of-a-high-converting-restaurant-website/
- Chowly, "Restaurant Websites That Don't Convert: 5 Fixes" — https://chowly.com/resources/blogs/why-many-restaurant-websites-dont-convert-hungry-searchers-and-what-you-can-fix-this-week/
- DoorDash Merchants, "How to Build a Restaurant Website That Converts in 2026" — https://merchants.doordash.com/en-us/blog/building-restaurant-website
- Baymard Institute, Food Delivery & Takeout UX research — https://baymard.com/blog/food-delivery-takeout-launch
- Baymard Institute, Food Delivery & Takeout UX Benchmark 2026 — https://baymard.com/research-articles/food-delivery-and-takeout-ux-benchmark-2026
- Dripos, "Online ordering best practices" — https://www.dripos.com/counter-talk/online-ordering-best-practices
- Slerp developer docs, front-end order flow — https://developers.slerp.com/docs/Documentation/frontend/front-end-order
- Square Community, taproom pickup-scheduling thread — https://community.squareup.com/t5/Online-Store/Square-Online-Checkout/td-p/248594
- Delaware Live, HB 290 to-go alcohol — https://delawarelive.com/tag/hb-290/
- Toast, "Can you take alcohol to go from a restaurant" — https://pos.toasttab.com/vi-us/blog/on-the-line/can-you-take-alcohol-to-go-from-a-restaurant
- NCSL, credit/debit card surcharge statutes — https://ncsl.org/financial-services/credit-or-debit-card-surcharges-statutes
- CardFellow, cash discount programs — https://www.cardfellow.com/blog/cash-discount-eliminate-processing-fees
- UniLink, "Link in Bio for Breweries" (tap-list placement) — https://www.unilink.us/blog/link-in-bio-for-breweries
- Avery Brewing taproom events (event-page pattern) — https://www.averybrewing.com/taproom-events
- Payload CMS e-commerce guide — https://dev.to/payloadcms/how-to-build-an-e-commerce-site-with-nextjs-383g
- Example Payload food-ordering app — https://github.com/ethsdev/food-delivery-payload
