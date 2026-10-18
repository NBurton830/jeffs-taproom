# 10 — Site Shell, Navigation, PWA

## Layout

- **SHELL-001 (P0)** Every public page renders a `<header>` (banner), a `<main id="main">` and a `<footer>` (contentinfo).
- **SHELL-002 (P0)** A "Skip to content" link is the first focusable element and moves focus to `#main`.
- **SHELL-003 (P0)** The primary nav (`<nav aria-label="Primary">`) has links: **Menu** `/menu`, **Order Pickup** `/order`,
  **Specials** `/specials`, **Events** `/events`, **On Tap** `/on-tap`, **Burger Challenge** `/burger-challenge`,
  **Private Events** `/private-events`, **Visit** `/visit`. The current page's link has `aria-current="page"`.
- **SHELL-004 (P0)** Below 768 px, the nav collapses behind a button with the accessible name "Menu" (`aria-expanded`
  reflects its state). Escape closes the menu and returns focus to the button.
- **SHELL-005 (P0)** The header shows the **open status badge** (`data-testid="open-status"`), with text matching one of:
  - `Open now · until 12:00 AM`
  - `Closed · opens 11:00 AM` (later today) or `Closed · opens Sat 11:00 AM`
  - `Closing soon · until 10:00 PM` (≤ 60 min before close)
- **SHELL-006 (P0)** Mobile (< 768 px) shows a sticky bottom action bar (`data-testid="mobile-action-bar"`) with three
  links: **Call** (`tel:+13023378602`), **Directions** (maps URL, see VIS-003) and **Order** (`/order`).
- **SHELL-007 (P0)** The footer contains the address, a tap-to-call phone link, today's hours, the weekly hours, social
  links (when configured) and "© {year} Jeff's Taproom & Grill".
- **SHELL-008 (P1)** Site-wide announcement banner (`data-testid="announcement"`) when `settings.announcement.enabled`.
  The visitor can dismiss it, and the dismissal is remembered for the session.
- **SHELL-009 (P0)** A cart button (`data-testid="cart-button"`, accessible name `Cart, N items`) is visible in the
  header on every page once the cart has ≥ 1 item. Its count badge is `data-testid="cart-count"`.

## Visual identity (P1) _(manual review)_

- The palette comes from the real storefront: awning **red** (#B3201F), **cream** and **charcoal**, and a "BEER • WINGS"
  sign motif. A display face for headings (e.g. "Oswald", OFL) and a readable sans for body text (e.g. "Inter", OFL),
  both self-hosted.
- The look is a warm, casual, neighbourhood sports bar. Photography is real (owner-supplied). Placeholder images are
  clearly marked in the CMS.
- Dark surfaces stay readable (contrast is enforced by A11Y-003). `prefers-reduced-motion` disables all non-essential
  animation.

## PWA ("the app")

- **SHELL-010 (P0)** Serve `/manifest.webmanifest` with `name` "Jeff's Taproom & Grill", `short_name` "Jeff's",
  `start_url` "/", `display` "standalone", a theme colour, and icons at 192 and 512 px (plus a maskable icon).
- **SHELL-011 (P1)** A service worker registers on production builds. It precaches the shell, serves `/menu` (and other
  content pages) network-first with the cached copy as the offline fallback, and serves `/offline` for navigations that
  fail while offline. Ordering pages are **never** served from cache. (Network-first rather than stale-while-revalidate,
  so an 86'd item or a price change is never shown stale while online.)
- **SHELL-012 (P1)** On `/offline` (and on cached pages while offline), a banner reads "You're offline. Menu prices may
  be out of date. Ordering requires a connection."
- **SHELL-013 (P2)** Offer "Add to Home Screen" after the first completed order (`beforeinstallprompt`).

## Errors

- **SHELL-020 (P0)** Unknown routes render a branded 404 with links to Menu and Home, and an HTTP 404 status.
