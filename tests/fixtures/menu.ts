// Canonical menu expectations — mirrors specs/03-menu-data.md. Change the spec first.

export const CATEGORY_ORDER = [
  { slug: 'starting-line-up', name: 'Starting Line Up' },
  { slug: 'seafood-starters', name: 'Seafood Starters' },
  { slug: 'wings', name: 'Taproom Famous Wings' },
  { slug: 'burgers', name: 'Burgers' },
  { slug: 'slider-baskets', name: 'Slider Baskets' },
  { slug: 'big-burger-challenge', name: "Jeff's Big Burger Challenge" },
  { slug: 'sandwiches', name: "Jeff's Sandwiches" },
  { slug: 'soups-salads', name: 'Fresh Soups & Salads' },
  { slug: 'drinks', name: 'Drinks' },
] as const

export type ItemExpectation = {
  slug: string
  name: string
  category: (typeof CATEGORY_ORDER)[number]['slug']
  /** Exact text of data-testid="item-price" (MENU-004) */
  price: string
  orderable: boolean
}

export const ITEMS: ItemExpectation[] = [
  // Starting Line Up (11)
  { slug: 'jalapeno-poppers', name: 'Jalapeño Poppers', category: 'starting-line-up', price: '$9.25', orderable: true },
  { slug: 'sweet-potato-fries', name: 'Sweet Potato Fries', category: 'starting-line-up', price: '$5.95', orderable: true },
  { slug: 'krinkle-cut-fries', name: 'Krinkle-Cut French Fries', category: 'starting-line-up', price: 'Small $4.50 | Large $6.50', orderable: true },
  { slug: 'onion-petals', name: 'Onion Petals', category: 'starting-line-up', price: '$5.95', orderable: true },
  { slug: 'appetizer-sampler', name: 'Appetizer Sampler', category: 'starting-line-up', price: '$14.95', orderable: true },
  { slug: 'loaded-nachos', name: 'Loaded Nachos', category: 'starting-line-up', price: '$8.95', orderable: true },
  { slug: 'cheese-sticks', name: 'Cheese Sticks', category: 'starting-line-up', price: '$8.50', orderable: true },
  { slug: 'cheese-quesadilla', name: 'Cheese Quesadilla', category: 'starting-line-up', price: '$6.50', orderable: true },
  { slug: 'chicken-tenders', name: 'Chicken Tenders', category: 'starting-line-up', price: '$9.95', orderable: true },
  { slug: 'broccoli-cheddar-bites', name: 'Broccoli Cheddar Bites', category: 'starting-line-up', price: '$7.95', orderable: true },
  { slug: 'pretzel-sticks', name: 'Pretzel Sticks', category: 'starting-line-up', price: '$7.95', orderable: true },
  // Seafood Starters (7)
  { slug: 'crab-balls', name: 'Crab-Balls', category: 'seafood-starters', price: 'Half dozen MKT | Dozen MKT', orderable: false },
  { slug: 'rockfish-and-chips', name: 'Rockfish & Chips', category: 'seafood-starters', price: '$14.95', orderable: true },
  { slug: 'steamed-shrimp', name: 'Steamed Shrimp', category: 'seafood-starters', price: 'Half pound $12.50 | Pound $21.95', orderable: true },
  { slug: 'shrimp-jammers', name: 'Shrimp Jammers', category: 'seafood-starters', price: '$11.50', orderable: true },
  { slug: 'bacon-wrapped-scallops', name: 'Bacon Wrapped Scallops', category: 'seafood-starters', price: '$13.75', orderable: true },
  { slug: 'seafood-sampler', name: 'Seafood Sampler', category: 'seafood-starters', price: '$17.95', orderable: true },
  { slug: 'super-clam-strips', name: 'Super Clam Strips', category: 'seafood-starters', price: '$11.50', orderable: true },
  // Wings (3)
  { slug: 'bone-in-wings', name: 'Bone-In Wings', category: 'wings', price: '8 wings $12.95 | 16 wings $23.95', orderable: true },
  { slug: 'boneless-wings', name: 'Boneless Wings', category: 'wings', price: '10 wings $10.50 | 20 wings $19.95', orderable: true },
  { slug: 'eastern-shore-wing-combo', name: 'Eastern Shore Wing Combo', category: 'wings', price: '$16.95', orderable: true },
  // Burgers (8)
  { slug: 'jeffs-famous-cheeseburger', name: "Jeff's Famous Cheeseburger", category: 'burgers', price: '$13.95', orderable: true },
  { slug: 'bacon-cheeseburger', name: 'Bacon Cheeseburger', category: 'burgers', price: '$14.95', orderable: true },
  { slug: 'mushroom-swiss-burger', name: 'Mushroom Swiss Burger', category: 'burgers', price: '$14.95', orderable: true },
  { slug: 'grilled-cheeseburger', name: 'Grilled Cheeseburger', category: 'burgers', price: '$14.95', orderable: true },
  { slug: 'bleu-burger', name: 'Bleu Burger', category: 'burgers', price: '$14.95', orderable: true },
  { slug: 'jalapeno-burger', name: 'Jalapeño Burger', category: 'burgers', price: '$14.95', orderable: true },
  { slug: 'biker-burger', name: 'Biker Burger', category: 'burgers', price: '$15.25', orderable: true },
  { slug: 'smash-burger', name: 'Smash Burger', category: 'burgers', price: '$10.00', orderable: true },
  // Slider Baskets (3)
  { slug: 'mini-cheeseburger-sliders', name: 'Mini Cheeseburger', category: 'slider-baskets', price: '$8.25', orderable: true },
  { slug: 'philly-cheesesteak-sliders', name: 'Philly Cheesesteak', category: 'slider-baskets', price: '$9.50', orderable: true },
  { slug: 'chicken-mini-sliders', name: 'Chicken MINI Sliders', category: 'slider-baskets', price: '$9.50', orderable: true },
  // Big Burger Challenge (2)
  { slug: 'big-burger-challenge', name: "Jeff's Big Burger Challenge", category: 'big-burger-challenge', price: '$35.99', orderable: false },
  { slug: 'share-the-challenge', name: 'Share the Challenge Burger', category: 'big-burger-challenge', price: '$49.99', orderable: false },
  // Sandwiches (7)
  { slug: 'cheese-steak', name: 'Cheese Steak', category: 'sandwiches', price: 'Small $10.75 | Large $13.75', orderable: true },
  { slug: 'gs-ham-sub', name: "G's Ham Sub", category: 'sandwiches', price: '$12.50', orderable: true },
  { slug: 'big-ass-fish-sandwich', name: 'Big-Ass Fish Sandwich', category: 'sandwiches', price: '$14.95', orderable: true },
  { slug: 'italian-sausage', name: 'Italian Sausage', category: 'sandwiches', price: '$10.95', orderable: true },
  { slug: 'chicken-fajita-wrap', name: 'Chicken Fajita Wrap', category: 'sandwiches', price: '$10.95', orderable: true },
  { slug: 'reuben', name: 'Reuben', category: 'sandwiches', price: '$10.95', orderable: true },
  { slug: 'prime-rib-french-dip', name: 'Prime Rib French Dip', category: 'sandwiches', price: '$14.95', orderable: true },
  // Soups & Salads (4)
  { slug: 'suzies-specialty-salad', name: "Suzie's Specialty Salad", category: 'soups-salads', price: 'Small $5.95 | Large $9.95', orderable: true },
  { slug: 'french-onion-soup', name: 'French Onion Soup', category: 'soups-salads', price: '$8.95', orderable: true },
  { slug: 'soup-of-the-day', name: 'Soup of the Day', category: 'soups-salads', price: 'Cup $3.95 | Bowl $5.95', orderable: true },
  { slug: 'cream-of-crab', name: 'Cream of Crab', category: 'soups-salads', price: 'Cup MKT | Bowl MKT', orderable: false },
  // Drinks (1)
  { slug: 'soda', name: 'Soda', category: 'drinks', price: '$3.00', orderable: true },
]

export const WING_SAUCES = [
  'Hot', 'Mild', 'Old Bay', 'BBQ', 'Chesapeake', 'Sweet Teriyaki', 'Sriracha',
  'Eagle Wingz Chesapeake Sauce', 'Lemon Pepper', 'Thai Chili', 'Nashville Hot',
]

export const CATEGORY_NOTES: Record<string, string> = {
  'starting-line-up': 'Make any appetizer a basket by adding Krinkle-cut fries ($3.50) or Sweet potato fries ($4.95).',
  wings: 'Served with bleu cheese or ranch dressing and celery (extra celery or dressing +$0.50).',
  burgers:
    'Fresh ground chuck steak burgers served with chips. Sub Krinkle-cut Fries ($3.50) or Sweet Potato Fries ($4.95). Add Pretzel Roll or Texas Toast ($2.00).',
  'slider-baskets': 'Served with fries.',
  sandwiches: 'All served with chips. Sub Krinkle-cut Fries ($3.50) or Sweet Potato Fries ($4.95).',
}

export const PHONE_DISPLAY = '(302) 337-8602'
export const PHONE_TEL = 'tel:+13023378602'
export const ADDRESS = '416 Market Street, Bridgeville, DE 19933'

type GroupExpectation = { name: string; min: number; max: number; options: [label: string, priceDeltaCents: number][] }
const free = (...labels: string[]) => labels.map((l) => [l, 0] as [string, number])

/** MENU-DATA-001 */
export const MODIFIER_GROUPS: Record<string, GroupExpectation> = {
  basket: { name: 'Make it a basket', min: 0, max: 1, options: [['Krinkle-cut fries', 350], ['Sweet potato fries', 495]] },
  'sampler-add': { name: 'Add-ons', min: 0, max: 1, options: [['Add sweet potato fries', 300]] },
  'add-chicken-nachos': { name: 'Add-ons', min: 0, max: 1, options: [['Add chicken', 350]] },
  'add-chicken-quesadilla': { name: 'Add-ons', min: 0, max: 1, options: [['Add chicken', 450]] },
  'add-cheese-sauce': { name: 'Add-ons', min: 0, max: 1, options: [['Add cheese sauce', 200]] },
  'tender-sauce': { name: 'Dipping sauce', min: 1, max: 1, options: free('BBQ', 'Honey mustard') },
  'clam-style': { name: 'Style', min: 1, max: 1, options: free('Regular', 'Buffalo') },
  'wing-sauce': { name: 'Sauce', min: 1, max: 1, options: free(...WING_SAUCES) },
  'wing-dressing': { name: 'Dressing', min: 1, max: 1, options: free('Bleu cheese', 'Ranch') },
  'wing-extras': { name: 'Extras', min: 0, max: 2, options: [['Extra celery', 50], ['Extra dressing', 50]] },
  'burger-cheese': { name: 'Cheese', min: 1, max: 1, options: free('American', 'Swiss', 'Pepperjack', 'Provolone') },
  'side-swap': { name: 'Side', min: 1, max: 1, options: [['Chips', 0], ['Krinkle-cut fries', 350], ['Sweet potato fries', 495]] },
  'bread-upgrade': { name: 'Bread', min: 0, max: 1, options: [['Pretzel roll', 200], ['Texas toast', 200]] },
  'steak-protein': { name: 'Steak', min: 1, max: 1, options: free('Beef', 'Chicken') },
  'reuben-protein': { name: 'Meat', min: 1, max: 1, options: free('Corned beef', 'Turkey') },
  'salad-protein': {
    name: 'Add protein',
    min: 0,
    max: 1,
    options: [['Chicken tenders', 495], ['Beef steak', 495], ['Chicken steak', 495], ['Fajita chicken', 595]],
  },
}

const WINGS = ['wing-sauce', 'wing-dressing', 'wing-extras']
const BURGER = ['side-swap', 'bread-upgrade']

/** MENU-DATA-002: modifier group keys per item, in display order. Items not listed have none. */
export const ITEM_GROUPS: Record<string, string[]> = {
  'jalapeno-poppers': ['basket'],
  'onion-petals': ['basket'],
  'appetizer-sampler': ['sampler-add'],
  'loaded-nachos': ['add-chicken-nachos', 'basket'],
  'cheese-sticks': ['basket'],
  'cheese-quesadilla': ['add-chicken-quesadilla', 'basket'],
  'chicken-tenders': ['tender-sauce', 'basket'],
  'broccoli-cheddar-bites': ['basket'],
  'pretzel-sticks': ['add-cheese-sauce', 'basket'],
  'super-clam-strips': ['clam-style'],
  'bone-in-wings': WINGS,
  'boneless-wings': WINGS,
  'eastern-shore-wing-combo': WINGS,
  'jeffs-famous-cheeseburger': ['burger-cheese', ...BURGER],
  'bacon-cheeseburger': ['burger-cheese', ...BURGER],
  'mushroom-swiss-burger': BURGER,
  'grilled-cheeseburger': ['side-swap'],
  'bleu-burger': BURGER,
  'jalapeno-burger': BURGER,
  'biker-burger': BURGER,
  'smash-burger': BURGER,
  'cheese-steak': ['steak-protein', 'side-swap'],
  'gs-ham-sub': ['side-swap'],
  'big-ass-fish-sandwich': ['side-swap'],
  'italian-sausage': ['side-swap'],
  'chicken-fajita-wrap': ['side-swap'],
  reuben: ['reuben-protein', 'side-swap'],
  'prime-rib-french-dip': ['side-swap'],
  'suzies-specialty-salad': ['salad-protein'],
}
