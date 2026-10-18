# 03 — Canonical Menu Data

This file is the source of truth for the seed (`src/seed/menu.ts`) and for test fixtures (`tests/fixtures/menu.ts`).
Prices are in dollars here and stored as cents. **MKT** = market price (`isMarketPrice: true`, `priceCents: null`).

## MENU-DATA-001 Modifier groups (P0)

| Key | Customer-facing name | min | max | Options (price delta) |
|---|---|---|---|---|
| `basket` | Make it a basket | 0 | 1 | Krinkle-cut fries (+$3.50), Sweet potato fries (+$4.95) |
| `sampler-add` | Add-ons | 0 | 1 | Add sweet potato fries (+$3.00) |
| `add-chicken-nachos` | Add-ons | 0 | 1 | Add chicken (+$3.50) |
| `add-chicken-quesadilla` | Add-ons | 0 | 1 | Add chicken (+$4.50) |
| `add-cheese-sauce` | Add-ons | 0 | 1 | Add cheese sauce (+$2.00) |
| `tender-sauce` | Dipping sauce | 1 | 1 | BBQ, Honey mustard |
| `clam-style` | Style | 1 | 1 | Regular, Buffalo |
| `wing-sauce` | Sauce | 1 | 1 (2 for the "16 wings" and "20 wings" variants) | Hot, Mild, Old Bay, BBQ, Chesapeake, Sweet Teriyaki, Sriracha, Eagle Wingz Chesapeake Sauce, Lemon Pepper, Thai Chili, Nashville Hot |
| `wing-dressing` | Dressing | 1 | 1 | Bleu cheese, Ranch |
| `wing-extras` | Extras | 0 | 2 | Extra celery (+$0.50), Extra dressing (+$0.50) |
| `burger-cheese` | Cheese | 1 | 1 | American, Swiss, Pepperjack, Provolone |
| `side-swap` | Side | 1 | 1 | Chips (default, +$0), Krinkle-cut fries (+$3.50), Sweet potato fries (+$4.95) |
| `bread-upgrade` | Bread | 0 | 1 | Pretzel roll (+$2.00), Texas toast (+$2.00) |
| `steak-protein` | Steak | 1 | 1 | Beef, Chicken |
| `reuben-protein` | Meat | 1 | 1 | Corned beef, Turkey |
| `salad-protein` | Add protein | 0 | 1 | Chicken tenders (+$4.95), Beef steak (+$4.95), Chicken steak (+$4.95), Fajita chicken (+$5.95) |

## MENU-DATA-002 Categories & items (P0)

### `starting-line-up`: Starting Line Up
Category note: _"Make any appetizer a basket by adding Krinkle-cut fries ($3.50) or Sweet potato fries ($4.95)."_

| slug | Name | Price | Modifier groups | Description |
|---|---|---|---|---|
| `jalapeno-poppers` | Jalapeño Poppers | $9.25 | basket | Stuffed with cream cheese and served with raspberry sauce. |
| `sweet-potato-fries` | Sweet Potato Fries | $5.95 | — | Sprinkled with a touch of vanilla and sugary sweetness. |
| `krinkle-cut-fries` | Krinkle-Cut French Fries | Small $4.50 / Large $6.50 | — | |
| `onion-petals` | Onion Petals | $5.95 | basket | Crispy battered onion petals served with spicy dipping sauce. |
| `appetizer-sampler` | Appetizer Sampler | $14.95 | sampler-add | 3 broccoli bites, 3 cheese sticks, 3 jalapeño poppers, onion petals, and krinkle-cut fries. |
| `loaded-nachos` | Loaded Nachos | $8.95 | add-chicken-nachos, basket | Creamy nacho cheese layered with taco beef, black olives, lettuce, cherry tomatoes, jalapeños, sour cream, and salsa. |
| `cheese-sticks` | Cheese Sticks | $8.50 | basket | Served with marinara sauce. |
| `cheese-quesadilla` | Cheese Quesadilla | $6.50 | add-chicken-quesadilla, basket | Served with salsa and sour cream. |
| `chicken-tenders` | Chicken Tenders | $9.95 | tender-sauce, basket | Served with BBQ or honey mustard. |
| `broccoli-cheddar-bites` | Broccoli Cheddar Bites | $7.95 | basket | Served with ranch dressing. |
| `pretzel-sticks` | Pretzel Sticks | $7.95 | add-cheese-sauce, basket | Served with honey mustard. |

### `seafood-starters`: Seafood Starters
| slug | Name | Price | Modifier groups | Description |
|---|---|---|---|---|
| `crab-balls` | Crab-Balls | Half dozen MKT / Dozen MKT | — | Jumbo lump crab meat. |
| `rockfish-and-chips` | Rockfish & Chips | $14.95 | — | 4 pieces of beer-battered rockfish served with fries. |
| `steamed-shrimp` | Steamed Shrimp | Half pound $12.50 / Pound $21.95 | — | Peel & eat Gulf shrimp seasoned with Old Bay. |
| `shrimp-jammers` | Shrimp Jammers | $11.50 | — | Butterflied shrimp filled with cheddar cheese. |
| `bacon-wrapped-scallops` | Bacon Wrapped Scallops | $13.75 | — | Tender scallop medallions wrapped in bacon. |
| `seafood-sampler` | Seafood Sampler | $17.95 | — | 3 crab-balls, 3 shrimp jammers, 3 oz clam strips, and French fries. |
| `super-clam-strips` | Super Clam Strips | $11.50 | clam-style | Half pound of breaded clam strips served regular or buffalo style. |

### `wings`: Taproom Famous Wings
Category note: _"Served with bleu cheese or ranch dressing and celery (extra celery or dressing +$0.50)."_

| slug | Name | Price | Modifier groups | Description |
|---|---|---|---|---|
| `bone-in-wings` | Bone-In Wings | 8 wings $12.95 / 16 wings $23.95 | wing-sauce, wing-dressing, wing-extras | |
| `boneless-wings` | Boneless Wings | 10 wings $10.50 / 20 wings $19.95 | wing-sauce, wing-dressing, wing-extras | |
| `eastern-shore-wing-combo` | Eastern Shore Wing Combo | $16.95 | wing-sauce, wing-dressing, wing-extras | 5 wings paired with 3 crab-balls. |

Variant labels are exactly `8 wings`, `16 wings`, `10 wings` and `20 wings`. The label is used verbatim in the menu, the dialog, the API and the KDS.
For all other items, variant labels are exactly as shown (`Small`, `Large`, `Half dozen`, `Dozen`, `Half pound`, `Pound`, `Cup`, `Bowl`). A single-price item has one variant with label `""`.

### `burgers`: Burgers
Category note: _"Fresh ground chuck steak burgers served with chips. Sub Krinkle-cut Fries ($3.50) or Sweet Potato Fries ($4.95). Add Pretzel Roll or Texas Toast ($2.00)."_
All items use **side-swap** and **bread-upgrade**, except `grilled-cheeseburger` (no bread-upgrade, since it is already on Texas toast).
**Group order** (for burgers and sandwiches): item-specific groups first, then `side-swap`, then `bread-upgrade`.

| slug | Name | Price | Extra groups | Description |
|---|---|---|---|---|
| `jeffs-famous-cheeseburger` | Jeff's Famous Cheeseburger | $13.95 | burger-cheese | Choice of American, Swiss, pepperjack, or provolone on a corn-dusted Kaiser roll. |
| `bacon-cheeseburger` | Bacon Cheeseburger | $14.95 | burger-cheese | Jeff's famous cheeseburger topped with bacon. |
| `mushroom-swiss-burger` | Mushroom Swiss Burger | $14.95 | — | Smothered with sautéed mushrooms and Swiss cheese. |
| `grilled-cheeseburger` | Grilled Cheeseburger | $14.95 | — | Two pieces of Texas toast and cheese make this an overstuffed grilled cheese burger. |
| `bleu-burger` | Bleu Burger | $14.95 | — | Topped with chunky bleu cheese dressing. |
| `jalapeno-burger` | Jalapeño Burger | $14.95 | — | Pepperjack cheese, jalapeños, and grilled onions. |
| `biker-burger` | Biker Burger | $15.25 | — | Grilled onions, mushrooms, bacon, and pepperjack cheese. |
| `smash-burger` | Smash Burger | $10.00 | — | Two melt-in-your-mouth patties with American cheese, ketchup, mustard, and pickles. |

### `slider-baskets`: Slider Baskets
Category note: _"Served with fries."_
| slug | Name | Price |
|---|---|---|
| `mini-cheeseburger-sliders` | Mini Cheeseburger | $8.25 |
| `philly-cheesesteak-sliders` | Philly Cheesesteak | $9.50 |
| `chicken-mini-sliders` | Chicken MINI Sliders | $9.50 |

### `big-burger-challenge`: Jeff's Big Burger Challenge
Both items are `onlineOrderable: false`, with `orderingNote: "In-house only"`.
| slug | Name | Price | Description |
|---|---|---|---|
| `big-burger-challenge` | Jeff's Big Burger Challenge | $35.99 | 3 cheeseburgers stacked between 2 Bacon Grilled Cheese Sandwiches, covered in 1/2 lb of fried onion petals, pickles, lettuce, tomato, and ketchup. Served with 1 lb of krinkle-cut fries. Eat all food (and keep it down) in 30 minutes to get the burger free. |
| `share-the-challenge` | Share the Challenge Burger | $49.99 | The full challenge burger, built for sharing. In-house only. |

### `sandwiches`: Jeff's Sandwiches
Category note: _"All served with chips. Sub Krinkle-cut Fries ($3.50) or Sweet Potato Fries ($4.95)."_ All items use **side-swap**.
| slug | Name | Price | Extra groups | Description |
|---|---|---|---|---|
| `cheese-steak` | Cheese Steak | Small $10.75 / Large $13.75 | steak-protein | Beef or chicken steak meat and melted cheese on an Italian roll. |
| `gs-ham-sub` | G's Ham Sub | $12.50 | — | 12" Milano roll stuffed with ham, lettuce, tomato, onion, and provolone cheese. |
| `big-ass-fish-sandwich` | Big-Ass Fish Sandwich | $14.95 | — | 10 oz portion of battered haddock on a sub roll. |
| `italian-sausage` | Italian Sausage | $10.95 | — | Sweet Italian sausage with grilled peppers and onions on an Italian roll. |
| `chicken-fajita-wrap` | Chicken Fajita Wrap | $10.95 | — | Seasoned grilled chicken breast in a honey wheat wrap. |
| `reuben` | Reuben | $10.95 | reuben-protein | Corned beef or turkey on rye. |
| `prime-rib-french-dip` | Prime Rib French Dip | $14.95 | — | Served on a kaiser roll. |

### `soups-salads`: Fresh Soups & Salads
| slug | Name | Price | Groups | Description |
|---|---|---|---|---|
| `suzies-specialty-salad` | Suzie's Specialty Salad | Small $5.95 / Large $9.95 | salad-protein | Lettuce, cucumber, tomato. |
| `french-onion-soup` | French Onion Soup | $8.95 | — | Crock-full of onion broth and Italian bread topped with provolone cheese. |
| `soup-of-the-day` | Soup of the Day | Cup $3.95 / Bowl $5.95 | — | Ask about today's soup. _(Staff may edit the description daily.)_ |
| `cream-of-crab` | Cream of Crab | Cup MKT / Bowl MKT | — | |

### `drinks`: Drinks
| slug | Name | Price | Description |
|---|---|---|---|
| `soda` | Soda | $3.00 | One refill included (dine-in). |

## MENU-DATA-003 Market price rules (P0)

- A variant with `isMarketPrice: true` and `priceCents: null` displays **"MKT"** with the helper text "Market price — call for
  today's price". It **cannot be added to the cart online**. The item dialog shows "Call (302) 337-8602 for today's price".
- When staff enter today's price, set `priceCents` and keep `isMarketPrice: true`. The menu then shows the price with a
  "Market price" badge, and the item is orderable.
- In the test seed, every MKT variant has `priceCents: null`.

## MENU-DATA-004 Footer notes shown on the menu (P0)

- "Sodas: $3.00 (one refill included)"
- "3% discount applied when paying with cash."

## MENU-DATA-006 Seed tags (P0)

| Tag | Items |
|---|---|
| `popular` | bone-in-wings, jeffs-famous-cheeseburger, rockfish-and-chips, loaded-nachos |
| `spicy` | jalapeno-poppers, jalapeno-burger, onion-petals (spicy dipping sauce) |
| `seafood` | all 7 Seafood Starters, eastern-shore-wing-combo, big-ass-fish-sandwich, cream-of-crab |
| `vegetarian` | sweet-potato-fries, krinkle-cut-fries, onion-petals, cheese-sticks, cheese-quesadilla, broccoli-cheddar-bites, pretzel-sticks, suzies-specialty-salad |

Badge text is the capitalised tag: `Popular`, `Spicy`, `Seafood`, `Vegetarian`, `New`.

## MENU-DATA-005 Test checksum (P0)

The seed contains **9 categories** and **46 items**: Starting Line Up 11, Seafood Starters 7, Wings 3, Burgers 8,
Slider Baskets 3, Big Burger Challenge 2, Sandwiches 7, Soups & Salads 4, Drinks 1. Tests assert these numbers.
