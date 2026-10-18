# 12 — Menu Browsing `/menu` and `/order`

`/menu` and `/order` render the same menu component. `/menu` is browse-first. `/order` is order-first: it shows the
ordering status bar (ORD-040) at the top and a persistent cart summary on desktop. The "Add" buttons work on both.

- **MENU-001 (P0)** The menu is real HTML text (no PDFs, no images of text). Each category is a `<section id="{category-slug}">`
  whose **direct child** `<h2>` holds the category name. Only category sections inside `<main>` have an `id` plus a direct-child `<h2>`.
- **MENU-002 (P0)** Categories render in this order: Starting Line Up, Seafood Starters, Taproom Famous Wings, Burgers,
  Slider Baskets, Jeff's Big Burger Challenge, Jeff's Sandwiches, Fresh Soups & Salads, Drinks.
- **MENU-003 (P0)** **Category jump bar** (`<nav aria-label="Menu categories">`): a horizontally scrollable list of
  links, one per category, that is sticky under the header. Scrolling updates the active link (`aria-current="true"`).
  Clicking a link scrolls to the section and moves focus to its heading.
- **MENU-004 (P0)** Each item renders as an `<article data-testid="menu-item-{slug}">` with:
  - the name as `<h3>`
  - the description
  - its price(s) in `data-testid="item-price"`: a single price (`$9.25`), or variant prices joined with ` | ` and
    labelled (`Small $4.50 | Large $6.50`, `8 wings $12.95 | 16 wings $23.95`, `Half dozen MKT | Dozen MKT`)
  - tag badges (`Popular`, `Spicy`, etc.)
  - an **Add** button with the accessible name `Add {name}`, when orderable (MENU-006)
- **MENU-005 (P0)** The category note (03-menu-data) renders under the heading (`data-testid="category-note"`).
- **MENU-006 (P0)** Items that are not orderable show **no Add button** and show the reason in
  `data-testid="item-unavailable-reason"`:
  - `onlineOrderable: false` → the `orderingNote` text (for example "In-house only")
  - all variants MKT without a price → "Market price — call (302) 337-8602"
- **MENU-007 (P0)** **Search** (`role="searchbox"`, label "Search the menu"): it filters items by name or description,
  case- and accent-insensitive (so "jalapeno" matches "Jalapeño"). It hides empty categories and shows a result count
  (`data-testid="menu-result-count"`, e.g. `3 items`). With no results it shows "No items match "{q}"" and a Clear button.
- **MENU-008 (P0)** Items marked `available: false` ("86'd") stay listed, de-emphasised, with the badge **"Sold out
  today"** and no Add button. They are never hidden, because regulars look for them.
- **MENU-009 (P1)** Filter chips are toggle buttons (`aria-pressed`) named `Seafood`, `Spicy`, `Vegetarian` and `Popular`, using the tags in MENU-DATA-006.
  Multiple chips combine with OR logic. Chips combine with search using AND logic.
- **MENU-010 (P0)** Menu footer notes (MENU-DATA-004) are visible at the bottom of the menu.
- **MENU-011 (P1)** Images use lazy loading with explicit dimensions (no layout shift). An item without an image
  renders as a text card with no placeholder image.
- **MENU-012 (P1)** A deep link `/menu#wings` scrolls to the Wings category on load.
