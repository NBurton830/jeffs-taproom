# 02 — Content Model (Payload)

Everything a staff member might change is CMS-editable. Code changes are needed only for new features.

## Collections

### CMS-001 `menu-categories` (P0)
`name`, `slug` (unique), `description` (rich text, optional), `sortOrder` (int), `note` (short text shown under the heading,
e.g. "Make any appetizer a basket…").

### CMS-002 `menu-items` (P0)
| Field | Type | Notes |
|---|---|---|
| `name` | text, required | exact menu copy |
| `slug` | text, unique | used in URLs and test ids |
| `category` | relation → menu-categories | |
| `description` | textarea | |
| `image` | upload → media | optional |
| `variants` | array `{ label, priceCents \| null, isMarketPrice }` | at least 1. A single-price item has one variant with an empty label |
| `modifierGroups` | relation[] → modifier-groups | in display order |
| `available` | checkbox, default true | "86" toggle |
| `onlineOrderable` | checkbox, default true | false = shown on menu, not orderable online |
| `orderingNote` | text | shown when not orderable, e.g. "In-house only" |
| `tags` | select[]: `popular`, `spicy`, `seafood`, `vegetarian`, `new` | badges |
| `sortOrder` | int | |

### CMS-003 `modifier-groups` (P0)
`key` (unique, stable, e.g. `wing-sauce`, used by the API), `name` (legend shown to the customer), `adminName`, `minSelect`, `maxSelect`, `options[] { label, priceDeltaCents, default }`.
- `minSelect ≥ 1` means required.
- `maxSelect = 1` renders as radios. `maxSelect > 1` renders as checkboxes.
- Variant-specific limits are allowed with `maxSelectByVariant: { [variantLabel]: n }` (wings: `{"16 wings": 2, "20 wings": 2}`).

### CMS-004 `orders` (P0)
| Field | Type |
|---|---|
| `number` | int, auto-increment from 1001, shown as `#1001` |
| `publicId` | 21-char nanoid, unguessable, used in the customer status URL |
| `status` | `new` → `accepted` → `ready` → `completed`. Also `cancelled` |
| `lines[]` | `{ itemSlug, itemName, variantLabel, unitPriceCents, quantity, modifiers[{group, label, priceDeltaCents}], notes, lineTotalCents }` (snapshot, not a relation, so later price edits do not change history) |
| `customer` | `{ name, phone, email? }` |
| `pickup` | `{ mode: 'asap' \| 'scheduled', requestedAt, promisedAt }` |
| `paymentMethod` | `cash` \| `card_at_pickup` \| (P2) `online_card` |
| `paymentStatus` | `unpaid` \| `paid` |
| `subtotalCents`, `cashDiscountCents`, `taxCents`, `tipCents`, `totalCents` | int |
| `orderNotes` | text |
| `cancelReason` | text |
| `statusHistory[]` | `{ status, at, byUser }` |
| `createdAt` | auto |

Access: create only through `POST /api/orders` (which recomputes prices). Read and update are limited to staff.
Customers read a limited projection via `publicId`.

### CMS-005 `events` (P0)
`title`, `slug`, `startsAt`, `endsAt?`, `description`, `image?`, `category` (`trivia` | `music` | `sports` | `party` | `other`),
`featured` (bool).

### CMS-006 `specials` (P0)
`title`, `description`, `priceText?` (free text, e.g. "$0.75 wings"), `days[]` (Mon..Sun), `startTime?`, `endTime?`, `active`.

### CMS-007 `taps` (P1)
`name`, `brewery`, `style`, `abv` (number), `status` (`on` | `coming-soon` | `kicked`), `sortOrder`.

### CMS-008 `challenge-entries` (P1)
`name`, `date`, `timeSeconds?`, `result` (`won` | `attempted`), `photo?`, `approved` (bool, default false). Only
approved entries are public.

### CMS-009 `inquiries` (P1)
Private event and catering form submissions: `name`, `email`, `phone`, `date`, `guests`, `type`, `message`, `status`
(`new` | `contacted` | `closed`).

### CMS-010 `media` (P0)
Payload upload collection with required `alt` text (A11Y-010).

### CMS-011 `users` (P0)
Payload auth. Has a `role` of `admin` | `manager` | `kitchen`.

## Globals

### CMS-020 `settings` (P0)
| Field | Default |
|---|---|
| `onlineOrderingEnabled` | true |
| `orderingPausedUntil` | null (KDS pause) |
| `pauseMessage` | "Online ordering is paused — please call (302) 337-8602." |
| `prepLeadMinutes` | 20 |
| `slotIntervalMinutes` | 15 |
| `lastOrderMinutesBeforeClose` | 30 |
| `cashDiscountPercent` | 3 |
| `taxRatePercent` | 0 (Delaware has no sales tax) |
| `tipPresetsPercent` | [0, 10, 15, 20] |
| `maxOnlineSubtotalCents` | 50000 |
| `orderNotificationEmail` | null |
| `phone` | "(302) 337-8602" |
| `address` | 416 Market Street, Bridgeville, DE 19933 |
| `geo` | 38.7426, -75.6044 (verify) |
| `socialLinks[]` | [] |
| `announcement` | `{ enabled, text, link? }` for the site-wide banner |

### CMS-021 `hours` (P0)
`weekly[7] { day, open: "11:00", close: "22:00", closed: bool }` plus `exceptions[] { date, closed, open?, close?, note }`
for holidays. A close time ≤ open time means the venue closes after midnight.

### CMS-023 `challenge` (P1)
`rules[] { text }` for the Burger Challenge page (BBC-003).

### CMS-022 `home` (P1)
`heroHeadline`, `heroSubhead`, `heroImage`, `featuredItemSlugs[]`.
