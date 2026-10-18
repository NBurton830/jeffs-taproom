# 17 — Admin / CMS `/admin`

Payload's generated admin UI, configured for non-technical staff.

- **ADM-001 (P0)** `/admin` requires login. Roles:
  | Role | Can |
  |---|---|
  | `kitchen` | KDS only. In admin, can only toggle `menu-items.available` and read orders |
  | `manager` | Everything content-related: menu, prices, events, specials, taps, hours, settings, challenge entries, inquiries |
  | `admin` | Everything plus users |

Non-admin staff can read and update only their own user record (password changes). Only admins list or create users.
- **ADM-002 (P0)** A manager edits a menu item's price in admin, and the public menu shows the new price on the next
  page load (no rebuild). This works through on-demand revalidation (`revalidatePath('/menu')`) in an `afterChange` hook.
- **ADM-003 (P0)** Admin groups in the sidebar: **Menu** (Categories, Items, Modifier Groups), **Orders**, **What's On**
  (Events, Specials, Taps), **Burger Challenge**, **Inquiries**, **Site** (Settings, Hours, Home, Media), **Staff** (Users).
- **ADM-004 (P1)** Orders list default columns: Number, Status, Customer, Pickup, Total, Payment, Created. It filters by
  status and date. CSV export _(manual)_.
- **ADM-005 (P1)** Hours global: a holiday exception for a date overrides the weekly hours everywhere (status badge,
  ordering, footer).
- **ADM-006 (P1)** _(manual)_ Live preview of Home and Menu while editing (Payload live preview).
- **ADM-007 (P1)** Menu-item list shows an inline `role="switch"` per row (named after the item) for `available`, plus a bulk **"Mark all available"** button
  for the start of the day.
- **ADM-008 (P2)** A daily sales summary dashboard widget (orders, revenue, top items).
- **ADM-009 (P0)** _(manual)_ **Seed staff user** from env on first boot. Default role `admin`.
