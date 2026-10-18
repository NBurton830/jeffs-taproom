# 30 — Accessibility (WCAG 2.2 AA)

- **A11Y-001 (P0)** An automated axe scan (`@axe-core/playwright`, tags `wcag2a`, `wcag2aa`, `wcag21aa`, `wcag22aa`)
  reports **zero** violations of impact `serious` or `critical` on: `/`, `/menu`, `/order`, `/order/checkout` (with a
  cart), the confirmation page, `/events`, `/specials`, `/on-tap`, `/visit`, `/private-events`, `/burger-challenge`, 404,
  `/kitchen/login` and `/kitchen`. It also scans with the item dialog and the cart drawer open.
- **A11Y-002 (P0)** Every interactive element is reachable and operable by keyboard alone, with a visible focus ring
  (≥ 2 px, ≥ 3:1 contrast). The ring is a CSS `outline` (not `box-shadow`) so it survives Windows forced-colours mode. The full ordering flow (add item with modifiers → checkout → place order) is completable
  with the keyboard only.
- **A11Y-003 (P0)** Colour contrast: text ≥ 4.5:1 (large text ≥ 3:1), UI components ≥ 3:1. Status is never conveyed by
  colour alone (LATE has text, sold out has text).
- **A11Y-004 (P0)** Every page has exactly one `<h1>`, and heading levels never skip.
- **A11Y-005 (P0)** `<html lang="en">`, and a unique `<title>` per page in the format `{Page} | Jeff's Taproom & Grill`
  (Home is "Jeff's Taproom & Grill | Bridgeville, DE").
- **A11Y-006 (P0)** Dialogs follow the WAI-ARIA dialog pattern (ORD-001), and toasts use `aria-live="polite"`.
- **A11Y-007 (P0)** Touch targets ≥ 44×44 CSS px for primary actions (Add, steppers, Checkout, Place order, KDS
  buttons). This exceeds the WCAG 2.2 2.5.8 minimum of 24 px.
- **A11Y-008 (P0)** Form inputs have visible `<label>`s. Required fields are marked with the text "Required", not only an asterisk. The marker sits outside the `<label>`
  (so the accessible name stays e.g. "Name") and is linked with `aria-describedby`. Inputs also set `aria-required="true"`.
- **A11Y-009 (P0)** Respects `prefers-reduced-motion`, and no content flashes more than 3 times per second (the KDS
  flash is a single pulse).
- **A11Y-010 (P0)** All content images have alt text (required by the CMS). Decorative images use `alt=""`.
- **A11Y-011 (P1)** Pages zoom to 200% without loss of content and reflow at 320 px width with no horizontal scroll.
- **A11Y-012 (P1)** A public accessibility statement at `/accessibility`, with a contact for reporting issues.
