# 14 — Checkout `/order/checkout`, Pricing & Order API

Checkout is a single page with clearly numbered sections: **1 Pickup time · 2 Your details · 3 Payment & tip · Review**.
A "← Back to menu" link (→ `/order`) is always visible, and the order summary stays visible (sticky on desktop, collapsible on mobile).

## Pickup time

- **CHK-010 (P0)** A radio group labelled "Pickup time" has the options **"ASAP"** and **"Schedule for later"**.
- **CHK-011 (P0)** The ASAP label shows the estimate: `ASAP — ready around 5:20 PM`. Estimate = server now +
  `prepLeadMinutes`, rounded **up** to the next 5 minutes.
- **CHK-012 (P0)** "Schedule for later" reveals a `<select>` labelled "Pickup time" with today's slots on a
  `slotIntervalMinutes` grid. The first slot is the first grid time ≥ now + lead. The last slot is
  `close − lastOrderMinutesBeforeClose`. Option text uses the format `5:30 PM`.
- **CHK-013 (P0)** Before opening (same day), ASAP is disabled with the text "ASAP available once we open at 11:00 AM",
  and "Schedule for later" is preselected. The first slot is the first grid time ≥ open + lead (`11:30 AM` with the seed hours).
- **CHK-014 (P0)** If no slots remain, checkout is blocked (ORD-040 closed message). On the checkout page the Place order
  button is disabled and the message is shown in `data-testid="checkout-blocked-reason"`.
- **CHK-015 (P2)** Future-day scheduling (up to 3 days ahead).

## Your details

- **CHK-016 (P0)** Fields: **Name** (required, 2–60 chars), **Phone** (required, a US number, normalised to `(302) 555-0123`),
  **Email (optional)** (sends a receipt when provided), **Order notes (optional)** (max 280), and a hidden honeypot field
  `website` (SEC-004).
- **CHK-017 (P0)** Validation runs on blur and on submit. Errors are linked to their inputs with `aria-describedby`
  and the input gets `aria-invalid="true"`. On submit, focus moves to an error summary (`role="alert"`) that lists
  links to each invalid field. Activating a link focuses that field.
- **CHK-018 (P1)** Details are remembered on the device ("Remember my details" checkbox, default on). Only name,
  phone and email are stored in `localStorage` (`jt-customer-v1`).

## Payment & tip

- **CHK-020 (P0)** A payment radio group labelled "Payment" offers:
  - **"Pay with cash at pickup — save 3%"** (`value=cash`)
  - **"Pay with card at pickup"** (`value=card_at_pickup`), preselected
  - (P2) "Pay online now" (when an online provider is configured)
  We never add a card surcharge.
- **CHK-021 (P0)** Tip radio group labelled "Tip for the kitchen" offering `No tip`, `10% ($X.XX)`, `15% ($X.XX)`,
  `20% ($X.XX)` and `Custom`. Custom reveals a currency input labelled "Custom tip amount" (0–$200). The default is
  **No tip**. The percentage is calculated on the **subtotal** (before the cash discount).
- **CHK-022 (P0)** The tax line shows only when `taxRatePercent > 0` (Delaware default 0).

## Pricing rules — `src/lib/pricing.ts` (P0, shared by client and server)

```
lineUnit        = variant.priceCents + Σ selected option.priceDeltaCents
lineTotal       = lineUnit × quantity
subtotal        = Σ lineTotal
cashDiscount    = paymentMethod == 'cash' ? roundHalfUp(subtotal × cashDiscountPercent / 100) : 0
tax             = roundHalfUp((subtotal − cashDiscount) × taxRatePercent / 100)
tip             = percent ? roundHalfUp(subtotal × pct / 100) : customCents
total           = subtotal − cashDiscount + tax + tip
```

- **CHK-030 (P0)** The order summary (`data-testid="order-summary"`) shows these rows:
  `summary-subtotal`, `summary-cash-discount` (only when cash is chosen, shown negative: `−$1.26`, label "Cash discount (3%)"),
  `summary-tax` (only when > 0), `summary-tip`, and `summary-total`. Values update instantly when the payment or tip changes.
- **CHK-031 (P0)** **Worked example** (also a test fixture):
  - Jeff's Famous Cheeseburger, American, Side: Krinkle-cut fries → $13.95 + $3.50 = **$17.45**
  - Bone-In Wings, 16 wings, Sauce: Hot + Old Bay, Dressing: Ranch, Extras: Extra celery → $23.95 + $0.50 = **$24.45**
  - Subtotal **$41.90**. Cash discount 3% = 125.7¢ → **−$1.26**. Tip 15% = 628.5¢ → **$6.29**.
  - Total (cash + 15%) = 4190 − 126 + 629 = **$46.93**. Total (card + no tip) = **$41.90**.

## Place order

- **CHK-040 (P0)** The **"Place order · $X.XX"** button submits `POST /api/orders`. While submitting, it is disabled
  with the label "Placing order…", which prevents a double submit. A client-generated `idempotencyKey` (UUID) makes a
  retry return the same order.
- **CHK-041 (P0)** Success redirects to `/order/confirmation/{publicId}`, and the cart is cleared.
- **CHK-043 (P0)** Opening checkout with an empty cart shows "Your order is empty" and a "Browse the menu" link → `/order`.
- **CHK-042 (P0)** If the server rejects with `PRICE_CHANGED` / `ITEM_UNAVAILABLE` / `ORDERING_CLOSED` / `ORDERING_PAUSED`
  / `INVALID_SLOT`, the page stays, shows a clear error (`role="alert"`) and keeps all inputs. For item problems, the
  affected cart lines are flagged (ORD-025).

## Order API contract (P0)

`POST /api/orders`
```jsonc
{
  "idempotencyKey": "uuid",
  "lines": [{ "itemSlug": "bone-in-wings", "variantLabel": "16 wings", "quantity": 1,
              "modifiers": [{ "group": "wing-sauce", "option": "Hot" }, { "group": "wing-sauce", "option": "Old Bay" },
                            { "group": "wing-dressing", "option": "Ranch" }, { "group": "wing-extras", "option": "Extra celery" }],
              "notes": "extra crispy" }],
  "customer": { "name": "Pat Doe", "phone": "3025550123", "email": "pat@example.com" },
  "pickup": { "mode": "asap" } /* or { "mode": "scheduled", "slot": "2026-11-06T18:30:00-05:00" } */,
  "paymentMethod": "cash",
  "tip": { "type": "percent", "value": 15 },   /* or { "type": "amount", "cents": 500 } or { "type": "none" } */
  "orderNotes": "",
  "expectedTotalCents": 4693,                  /* optional; mismatch → 409 PRICE_CHANGED */
  "website": ""                                /* honeypot */
}
```

- **CHK-050 (P0)** The server **recomputes every price** from the database. Client prices are ignored, except
  `expectedTotalCents`, which is checked only to detect a price change.
- **CHK-051 (P0)** Responses:
  - `201 { number, publicId, status: "new", totalCents, promisedAt, statusUrl }`
  - `409 { error: { code: "PRICE_CHANGED", totalCents } }`
  - `422 { error: { code, message, path? } }`, where the code is one of `VALIDATION`, `ITEM_NOT_FOUND`, `ITEM_UNAVAILABLE`,
    `NOT_ORDERABLE`, `MARKET_PRICE`, `INVALID_MODIFIERS`, `INVALID_SLOT`, `SUBTOTAL_LIMIT`.
    An unknown `variantLabel` is `VALIDATION`. A slot that is off-grid, too soon, after the last order, or on another day
    is `INVALID_SLOT`, and so is ASAP before opening
  - `503 { error: { code: "ORDERING_CLOSED" | "ORDERING_PAUSED" | "ORDERING_DISABLED", message } }`
  - `429` when rate limited (SEC-003)
- **CHK-052 (P0)** Modifier validation: unknown group or option → `INVALID_MODIFIERS`. Count below `minSelect` or above
  the effective `maxSelect` → `INVALID_MODIFIERS`. Group not attached to the item → `INVALID_MODIFIERS`.
- **CHK-053 (P0)** The same `idempotencyKey` within 24 h returns the original `201` body and creates no new order.
- **CHK-054 (P0)** A filled honeypot returns a fake `201`-looking response but does **not** create an order (SEC-004).
- **CHK-055 (P0)** `GET /api/menu` returns the public menu JSON `{ categories: [{ slug, name, note, items: [{ slug, name,
  description, available, onlineOrderable, orderingNote, tags, variants: [{label, priceCents, isMarketPrice}],
  modifierGroups: [{ key, name, minSelect, maxSelect, maxSelectByVariant, options: [{label, priceDeltaCents, default}] }] }] }] }`.
- **CHK-056 (P0)** `GET /api/ordering-status` returns
  `{ state: "open"|"before_open"|"closed"|"paused"|"disabled", message, asapAt|null, slots: ISO[] }`.
