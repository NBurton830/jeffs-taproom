# 13 — Item Customisation & Cart

## Item dialog

- **ORD-001 (P0)** Clicking `Add {name}` opens a modal `role="dialog"` whose accessible name is the item name. Focus
  moves into the dialog and is trapped there. Escape or the "Close" button closes it and returns focus to the Add
  button that opened it. On mobile it renders as a bottom sheet.
- **ORD-002 (P0)** Items with **one variant and no modifier groups** still open the dialog (for quantity and notes).
  This keeps behaviour consistent.
- **ORD-003 (P0)** Variants render as a radio group `<fieldset>` with the legend **"Size"** (for the wings category, **"How many?"**).
  Each option label is `{variant label} — {price}`, e.g. `Small — $4.50`, `16 wings — $23.95`, `Dozen — MKT` (a MKT option without a price is disabled). The first variant is preselected.
- **ORD-004 (P0)** Each modifier group renders as a `<fieldset>` whose legend is the group name. Required groups show
  "Required" in the legend. Optional groups show "Optional" (with "Choose up to N" when max > 1).
  - max = 1: radios (an optional radio group includes a "None" option, preselected)
  - max > 1: checkboxes. Once max is reached, the remaining unchecked boxes are disabled, and the text "Choose up to N"
    is shown.
  - Option labels with a price delta append it: `Krinkle-cut fries (+$3.50)`.
  - Options flagged `default` start selected (e.g. Side: Chips).
- **ORD-005 (P0)** Variant-dependent limits: for `bone-in-wings` "16 wings" and `boneless-wings` "20 wings", the Sauce group allows
  up to 2 choices. Changing back to the smaller variant trims the selection to the first selected sauce.
- **ORD-006 (P0)** **Special instructions** textarea (label "Special instructions (optional)", max 140 chars with a live
  counter `{n}/140`, `data-testid="notes-counter"`). Helper text: "No substitutions beyond the options above may be possible."
- **ORD-007 (P0)** Quantity stepper (label "Quantity", buttons "Decrease quantity" / "Increase quantity", range 1–20).
- **ORD-008 (P0)** The submit button reads `Add to order · $X.XX`, and the price updates live:
  `(variant price + Σ modifier deltas) × quantity`.
- **ORD-009 (P0)** Submitting with an unmet required group does not add the item. Focus moves to the first invalid
  fieldset, which shows the error text "Please choose a {group name}" (`role="alert"`).
- **ORD-010 (P0)** On a successful add, the dialog closes, the cart count updates, and a polite live region announces
  "Added {qty} × {name} to your order". A toast (`data-testid="toast"`) offers a **View order** button.
- **ORD-011 (P0)** Adding an identical configuration (same item, variant, modifiers and notes) merges it into the
  existing line by increasing the quantity, capped at 20.

## Cart

- **ORD-020 (P0)** The cart opens from the cart button as a drawer `role="dialog"` named **"Your order"**. On desktop
  `/order`, it is also shown inline as a sidebar (`data-testid="cart-panel"`).
- **ORD-021 (P0)** Each line (`data-testid="cart-line"`) shows the quantity (`data-testid="line-quantity"`), the item name,
  the variant label (if any), the selected modifiers as a comma-separated list in group order (selection order within a group)
  (`data-testid="line-modifiers"`, e.g. `Hot, Old Bay, Ranch, Extra celery`; default-only choices such as "Chips" are
  listed too), the notes in quotes, and the line total (`data-testid="line-total"`).
- **ORD-022 (P0)** Each line has:
  - a quantity stepper (1–20) whose buttons are named "Decrease quantity" and "Increase quantity" (scoped within the line).
    At 1, "Decrease quantity" is disabled.
  - **Edit {name}**: reopens the item dialog pre-filled, with the submit button reading `Update order · $X.XX`. Saving
    replaces the line.
  - **Remove {name}**: removes the line and shows an **Undo** toast (5 s) that restores it in place.
- **ORD-023 (P0)** The cart footer shows the **Subtotal** (`data-testid="cart-subtotal"`), the text "Discounts and tip at
  checkout", and a **Checkout** link → `/order/checkout`. When checkout is blocked (ORD-025, ORD-027, ORD-041), the
  link is replaced by a disabled `<button>` named "Checkout", with the reason shown right above it
  (`data-testid="checkout-blocked-reason"`).
- **ORD-024 (P0)** The empty cart shows "Your order is empty" and a "Browse the menu" link. The Checkout control is
  absent.
- **ORD-025 (P0)** The cart persists in `localStorage` (`jt-cart-v1`) across reloads and tabs. On load, every line is
  revalidated against `GET /api/menu`. Lines whose item is now unavailable, unorderable or re-priced are flagged in
  the cart: "Sold out — please remove" (which blocks checkout) or "Price updated to $X" (which updates the line).
- **ORD-026 (P1)** "Add a side?" suggestion in the cart: when the cart has no fries, suggest Krinkle-Cut French Fries and
  Sweet Potato Fries (one tap opens their dialog). It shows at most 2 suggestions and is easy to dismiss.
- **ORD-027 (P0)** If the subtotal exceeds `maxOnlineSubtotalCents` ($500), checkout is disabled with the message
  "For orders over $500, please call (302) 337-8602".

## Ordering status bar

- **ORD-040 (P0)** On `/order` the status bar (`data-testid="ordering-status"`) shows one of:
  - open: `Pickup · Ready in about 20 min` (lead time from settings)
  - before opening today: `Online ordering opens at 11:00 AM — schedule for later today`
  - closed for the day (or no pickup slots left): `Online ordering is closed. We open {day} at {time}.` where `{day}` is the
    short weekday (`Fri`), as in SHELL-005
  - paused: `settings.pauseMessage`
  - disabled (`onlineOrderingEnabled: false`): "Online ordering is currently unavailable. Call (302) 337-8602."
- **ORD-041 (P0)** When ordering is closed, paused or disabled, the Add buttons stay usable (people can still build an
  order to review), but checkout is blocked with the same message. Before-opening is **not** blocked, but only
  scheduled pickup is possible.
