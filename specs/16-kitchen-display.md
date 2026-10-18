# 16 — Kitchen Display System `/kitchen`

The "back end" staff actually look at: a tablet at the kitchen pass or behind the bar. It is touch-first, readable
from about 1.5 m away, and supports a dark theme.

## Access

- **KDS-001 (P0)** `/kitchen` requires a logged-in user with the role `kitchen`, `manager` or `admin`. Unauthenticated
  visitors are redirected to `/kitchen/login`. That page has a form with **Email**, **Password** and a **Sign in**
  button, backed by Payload auth with a cookie session. A wrong password shows "Invalid email or password".
- **KDS-002 (P0)** Every kitchen API (`/api/kitchen/*`) returns 401 without a staff session.

## Board

- **KDS-003 (P0)** There are three columns, each a `<section>` with a heading and a count (`data-testid="kds-count"`):
  **New** (`kds-column-new`), **In progress** (`kds-column-in-progress`, status `accepted`) and **Ready**
  (`kds-column-ready`). A new order appears in **New** within 5 s via SSE, with a polling fallback.
- **KDS-004 (P0)** A ticket is `<article data-testid="kds-ticket-{number}">`. It shows:
  - the order number (`#1001`), the customer's first name and last initial, and the phone (tap-to-call)
  - the pickup time: `ASAP · 5:20 PM` or `Scheduled · 6:30 PM`
  - the elapsed time since it was placed (`data-testid="ticket-age"`, e.g. `4 min`)
  - each line: `2 × Bone-In Wings (16 wings)`, with modifiers indented below and notes highlighted
  - the order notes
  - the payment: `CASH — collect $46.93` or `CARD at pickup — $41.90`
- **KDS-005 (P0)** Tickets are sorted by `promisedAt` ascending, so scheduled orders surface when they are due.
  Scheduled orders whose pickup time is more than 45 min away show a "Later" chip and sit dimmed at the bottom of New.
- **KDS-006 (P0)** Tickets that are past `promisedAt` and not yet ready get a red "LATE" badge
  (`data-testid="ticket-late"`).

## Actions

- **KDS-007 (P0)** A New ticket has **Accept** and **Cancel order** buttons. Accept → status `accepted`. The ticket
  moves to In progress.
- **KDS-008 (P1)** Next to Accept, staff can adjust the prep time: the buttons **+5 min** and **+10 min** push
  `promisedAt` back, and the customer page shows the new time.
- **KDS-009 (P0)** An In progress ticket has **Mark ready** → status `ready`, and the ticket moves to the Ready column.
- **KDS-010 (P0)** A Ready ticket has **Picked up** → status `completed`. The ticket leaves the board and appears in
  **Today's completed** (a collapsible list with the last 50, `data-testid="kds-completed"`).
- **KDS-011 (P0)** **Cancel order** opens a confirm dialog named "Cancel order #{number}" with a select labelled "Reason" (`Out of an item`, `Kitchen closed`,
  `Customer request`, `Other`) and a **Confirm cancel** button. The status becomes `cancelled` with that `cancelReason`.
- **KDS-012 (P0)** **Pause online ordering** switch in the header (`role="switch"`, name "Pause online ordering"). When
  it is turned on, a dialog "Pause online ordering" offers the radios 15 min, 30 min, 60 min and "Until I turn it back on",
  and a **Pause** button. This sets
  `settings.orderingPausedUntil`, and the public site responds with ORDERING_PAUSED within 1 request.
- **KDS-013 (P1)** **Bump** with **Undo**: every status change shows a 5-second toast with an **Undo** button, which reverts to the previous
  status.
- **KDS-014 (P0)** The **Item availability** panel (button "86 items" opens a dialog named "Item availability") lists every menu item with a switch named after
  the item (on = available). Turning one off sets `available: false` immediately.
- **KDS-015 (P0)** A new order plays a chime (switch "Sound", default on; the audio unlocks on the first tap) and
  flashes the New column header. A browser notification fires if permitted. Chime and notification are _(manual)_.
- **KDS-016 (P1)** **Print ticket** opens a print-optimised 80 mm-width ticket view (`/kitchen/ticket/{number}`) suited
  to thermal printers through the OS print dialog. Automatic ESC/POS printing is P2 (Q-004).
- **KDS-017 (P0)** Every status change appends to `statusHistory` with the user and a timestamp.
- **KDS-018 (P1)** The board survives network blips. It shows a "Reconnecting…" banner (`data-testid="kds-offline"`),
  and actions made while offline are queued or else clearly rejected (never silently lost).

## Kitchen API (P0)

- `GET /api/kitchen/orders?status=new,accepted,ready`
- `POST /api/kitchen/orders/{number}/status` with `{ status, cancelReason? }` (`cancelReason` is required for `cancelled`, else `422`). Allowed transitions are
  new→accepted, new→cancelled, accepted→ready, accepted→cancelled, ready→completed, plus the undo of the last
  transition within 60 s. Any other transition → `409 INVALID_TRANSITION`.
- `POST /api/kitchen/orders/{number}/delay` with `{ minutes: 5|10 }`
- `POST /api/kitchen/pause` with `{ minutes: number|null }` (null = indefinitely). `DELETE /api/kitchen/pause` resumes.
- `POST /api/kitchen/items/{slug}/availability` with `{ available: boolean }`
- `GET /api/kitchen/stream`: an SSE stream of `order.created`, `order.updated` and `settings.updated` events. Order event `data` is
  the ticket JSON (including `number` and `status`)
