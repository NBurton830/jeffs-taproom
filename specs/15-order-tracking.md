# 15 — Confirmation & Live Order Status

Route: `/order/confirmation/{publicId}`. The unguessable `publicId` is the only credential, and the page works without
an account.

- **TRK-001 (P0)** The heading is "Thanks, {first name}! Your order is in." The order number is shown in
  `data-testid="order-number"` (`#1001`).
- **TRK-002 (P0)** The status tracker (`data-testid="order-status"`) is an ordered list of steps: **Received →
  Accepted → Ready for pickup → Picked up**. The current step has `aria-current="step"`, and its text is announced via
  `aria-live="polite"` when it changes.
- **TRK-003 (P0)** The page polls `GET /api/orders/{publicId}/status` every 5 s (pausing while the tab is hidden) and
  updates within 10 s of a KDS change. Polling stops at `completed` or `cancelled`.
- **TRK-004 (P0)** It shows the promised pickup time ("Ready around 5:20 PM"), the payment method (with the reminder "Pay
  with cash at pickup — $XX.XX after your 3% discount" when cash), every line, the totals and the address with directions.
- **TRK-005 (P0)** When the status is `ready`, a prominent banner reads "Your order is ready! Head to the bar to pick up."
- **TRK-006 (P0)** When the status is `cancelled`, the page shows "This order was cancelled" plus `cancelReason`, and
  "Questions? Call (302) 337-8602".
- **TRK-007 (P0)** `GET /api/orders/{publicId}/status` returns only `{ number, status, promisedAt, updatedAt,
  cancelReason? }`. It never returns phone or email (SEC-006). An unknown publicId → 404, and the page shows "We couldn't
  find that order."
- **TRK-008 (P1)** If an email was given, a receipt email is sent on creation (subject `Jeff's Taproom order #1001`)
  with the status link. A "ready" email (subject `Your order #1001 is ready`) is sent on the `ready` transition.
  When `settings.orderNotificationEmail` is set, the restaurant gets `New online order #1001` on creation (ARCH-003).
- **TRK-009 (P1)** "Add to calendar" is not needed. "Call us" and "Directions" buttons are shown.
