# 99 — Open Questions for the Owner

Each question has a **default** we will build if there is no answer. Defaults are reflected in the specs.

| ID | Question | Default until answered |
|---|---|---|
| **Q-001** | Which POS do you use (Toast, Square, Clover, other, none)? Should online orders also appear in it? | Orders live in our system and the Kitchen Display. POS adapter is P2 |
| **Q-002** | Do you want customers to **prepay online** by card? If so, which processor (Stripe, Square, your current one)? | Pay at pickup only (cash −3% or card) |
| **Q-003** | Exact hours for the bar and kitchen, and do they differ? Holiday closures? | VIS-011 placeholder hours. Ordering ends 30 min before close |
| **Q-004** | Is there a kitchen ticket printer (model)? Should it print automatically? | Browser print of an 80 mm ticket (KDS-016) |
| **Q-005** | Sell beer or cocktails to-go online? (DE requires a sealed container, ≥ $10 food, limits, and an ID check at pickup) | No alcohol online. Tap list is display only |
| **Q-006** | Delivery (in-house drivers or DoorDash Drive)? Third-party marketplace links on the site? | Pickup only. No marketplace links |
| **Q-007** | Parking, accessibility, patio or outdoor seating, TVs and sports packages to mention? | Omit until provided |
| **Q-008** | Is an installable web app OK, or do you want App Store / Play Store apps? | PWA only |
| **Q-009** | How long should prep take on a busy Friday? Max online orders per 15 minutes? | 20 min lead. No throttle (staff use Pause) |
| **Q-010** | Wings: can 16 / 20 orders be split across 2 sauces? Any more sauces? | Yes, up to 2 sauces for the large sizes |
| **Q-011** | Which sodas (brands/flavours)? | Customer types it in special instructions |
| **Q-012** | Tips on pickup orders, yes or no? Who receives them? | Tip offered, default "No tip" |
| **Q-013** | Real photos, logo files, social accounts (Facebook/Instagram), and the domain name? | Placeholders, flagged in the CMS |
| **Q-014** | Gift cards, loyalty or a rewards program? | Out of scope for v1 |
| **Q-015** | Do listed menu prices assume card payment, so cash gets 3% off? Has your processor approved this? | Yes, shown as a cash discount line |
| **Q-016** | Should the Burger Challenge be bookable online? | Phone only |
| **Q-017** | Who manages the site day to day, and how many staff logins are needed? | 1 admin, 1 manager, 1 kitchen |
| **Q-018** | Soup of the Day and market prices (crab): update daily in the CMS? | Yes. MKT items are not orderable until a price is set |
