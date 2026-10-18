// Source of truth: specs/03-menu-data.md. Prices in cents. null = market price (MKT).

type Opt = [label: string, priceDeltaCents: number, isDefault?: boolean]
export type GroupSeed = { key: string; name: string; adminName: string; min: number; max: number; byVariant?: Record<string, number>; options: Opt[] }
const free = (...l: string[]): Opt[] => l.map((x) => [x, 0])

export const WING_SAUCES = [
  'Hot', 'Mild', 'Old Bay', 'BBQ', 'Chesapeake', 'Sweet Teriyaki', 'Sriracha',
  'Eagle Wingz Chesapeake Sauce', 'Lemon Pepper', 'Thai Chili', 'Nashville Hot',
]

export const GROUPS: GroupSeed[] = [
  { key: 'basket', name: 'Make it a basket', adminName: 'Basket (fries)', min: 0, max: 1, options: [['Krinkle-cut fries', 350], ['Sweet potato fries', 495]] },
  { key: 'sampler-add', name: 'Add-ons', adminName: 'Sampler add-ons', min: 0, max: 1, options: [['Add sweet potato fries', 300]] },
  { key: 'add-chicken-nachos', name: 'Add-ons', adminName: 'Nachos: add chicken', min: 0, max: 1, options: [['Add chicken', 350]] },
  { key: 'add-chicken-quesadilla', name: 'Add-ons', adminName: 'Quesadilla: add chicken', min: 0, max: 1, options: [['Add chicken', 450]] },
  { key: 'add-cheese-sauce', name: 'Add-ons', adminName: 'Pretzel: cheese sauce', min: 0, max: 1, options: [['Add cheese sauce', 200]] },
  { key: 'tender-sauce', name: 'Dipping sauce', adminName: 'Tender dipping sauce', min: 1, max: 1, options: free('BBQ', 'Honey mustard') },
  { key: 'clam-style', name: 'Style', adminName: 'Clam strip style', min: 1, max: 1, options: free('Regular', 'Buffalo') },
  { key: 'wing-sauce', name: 'Sauce', adminName: 'Wing sauce', min: 1, max: 1, byVariant: { '16 wings': 2, '20 wings': 2 }, options: free(...WING_SAUCES) },
  { key: 'wing-dressing', name: 'Dressing', adminName: 'Wing dressing', min: 1, max: 1, options: free('Bleu cheese', 'Ranch') },
  { key: 'wing-extras', name: 'Extras', adminName: 'Wing extras', min: 0, max: 2, options: [['Extra celery', 50], ['Extra dressing', 50]] },
  { key: 'burger-cheese', name: 'Cheese', adminName: 'Burger cheese', min: 1, max: 1, options: free('American', 'Swiss', 'Pepperjack', 'Provolone') },
  { key: 'side-swap', name: 'Side', adminName: 'Side swap', min: 1, max: 1, options: [['Chips', 0, true], ['Krinkle-cut fries', 350], ['Sweet potato fries', 495]] },
  { key: 'bread-upgrade', name: 'Bread', adminName: 'Bread upgrade', min: 0, max: 1, options: [['Pretzel roll', 200], ['Texas toast', 200]] },
  { key: 'steak-protein', name: 'Steak', adminName: 'Cheese steak protein', min: 1, max: 1, options: free('Beef', 'Chicken') },
  { key: 'reuben-protein', name: 'Meat', adminName: 'Reuben meat', min: 1, max: 1, options: free('Corned beef', 'Turkey') },
  { key: 'salad-protein', name: 'Add protein', adminName: 'Salad protein', min: 0, max: 1, options: [['Chicken tenders', 495], ['Beef steak', 495], ['Chicken steak', 495], ['Fajita chicken', 595]] },
]

type V = [label: string, priceCents: number | null]
export type ItemSeed = {
  slug: string
  name: string
  price: number | V[]
  groups?: string[]
  description?: string
  tags?: string[]
  onlineOrderable?: boolean
  orderingNote?: string
}
export type CategorySeed = { slug: string; name: string; note?: string; items: ItemSeed[] }

const BURGER = ['side-swap', 'bread-upgrade']
const WINGS = ['wing-sauce', 'wing-dressing', 'wing-extras']

export const MENU: CategorySeed[] = [
  {
    slug: 'starting-line-up',
    name: 'Starting Line Up',
    note: 'Make any appetizer a basket by adding Krinkle-cut fries ($3.50) or Sweet potato fries ($4.95).',
    items: [
      { slug: 'jalapeno-poppers', name: 'Jalapeño Poppers', price: 925, groups: ['basket'], description: 'Stuffed with cream cheese and served with raspberry sauce.', tags: ['spicy'] },
      { slug: 'sweet-potato-fries', name: 'Sweet Potato Fries', price: 595, description: 'Sprinkled with a touch of vanilla and sugary sweetness.', tags: ['vegetarian'] },
      { slug: 'krinkle-cut-fries', name: 'Krinkle-Cut French Fries', price: [['Small', 450], ['Large', 650]], tags: ['vegetarian'] },
      { slug: 'onion-petals', name: 'Onion Petals', price: 595, groups: ['basket'], description: 'Crispy battered onion petals served with spicy dipping sauce.', tags: ['spicy', 'vegetarian'] },
      { slug: 'appetizer-sampler', name: 'Appetizer Sampler', price: 1495, groups: ['sampler-add'], description: '3 broccoli bites, 3 cheese sticks, 3 jalapeño poppers, onion petals, and krinkle-cut fries.' },
      { slug: 'loaded-nachos', name: 'Loaded Nachos', price: 895, groups: ['add-chicken-nachos', 'basket'], description: 'Creamy nacho cheese layered with taco beef, black olives, lettuce, cherry tomatoes, jalapeños, sour cream, and salsa.', tags: ['popular'] },
      { slug: 'cheese-sticks', name: 'Cheese Sticks', price: 850, groups: ['basket'], description: 'Served with marinara sauce.', tags: ['vegetarian'] },
      { slug: 'cheese-quesadilla', name: 'Cheese Quesadilla', price: 650, groups: ['add-chicken-quesadilla', 'basket'], description: 'Served with salsa and sour cream.', tags: ['vegetarian'] },
      { slug: 'chicken-tenders', name: 'Chicken Tenders', price: 995, groups: ['tender-sauce', 'basket'], description: 'Served with BBQ or honey mustard.' },
      { slug: 'broccoli-cheddar-bites', name: 'Broccoli Cheddar Bites', price: 795, groups: ['basket'], description: 'Served with ranch dressing.', tags: ['vegetarian'] },
      { slug: 'pretzel-sticks', name: 'Pretzel Sticks', price: 795, groups: ['add-cheese-sauce', 'basket'], description: 'Served with honey mustard.', tags: ['vegetarian'] },
    ],
  },
  {
    slug: 'seafood-starters',
    name: 'Seafood Starters',
    items: [
      { slug: 'crab-balls', name: 'Crab-Balls', price: [['Half dozen', null], ['Dozen', null]], description: 'Jumbo lump crab meat.', tags: ['seafood'] },
      { slug: 'rockfish-and-chips', name: 'Rockfish & Chips', price: 1495, description: '4 pieces of beer-battered rockfish served with fries.', tags: ['popular', 'seafood'] },
      { slug: 'steamed-shrimp', name: 'Steamed Shrimp', price: [['Half pound', 1250], ['Pound', 2195]], description: 'Peel & eat Gulf shrimp seasoned with Old Bay.', tags: ['seafood'] },
      { slug: 'shrimp-jammers', name: 'Shrimp Jammers', price: 1150, description: 'Butterflied shrimp filled with cheddar cheese.', tags: ['seafood'] },
      { slug: 'bacon-wrapped-scallops', name: 'Bacon Wrapped Scallops', price: 1375, description: 'Tender scallop medallions wrapped in bacon.', tags: ['seafood'] },
      { slug: 'seafood-sampler', name: 'Seafood Sampler', price: 1795, description: '3 crab-balls, 3 shrimp jammers, 3 oz clam strips, and French fries.', tags: ['seafood'] },
      { slug: 'super-clam-strips', name: 'Super Clam Strips', price: 1150, groups: ['clam-style'], description: 'Half pound of breaded clam strips served regular or buffalo style.', tags: ['seafood'] },
    ],
  },
  {
    slug: 'wings',
    name: 'Taproom Famous Wings',
    note: 'Served with bleu cheese or ranch dressing and celery (extra celery or dressing +$0.50).',
    items: [
      { slug: 'bone-in-wings', name: 'Bone-In Wings', price: [['8 wings', 1295], ['16 wings', 2395]], groups: WINGS, tags: ['popular'] },
      { slug: 'boneless-wings', name: 'Boneless Wings', price: [['10 wings', 1050], ['20 wings', 1995]], groups: WINGS },
      { slug: 'eastern-shore-wing-combo', name: 'Eastern Shore Wing Combo', price: 1695, groups: WINGS, description: '5 wings paired with 3 crab-balls.', tags: ['seafood'] },
    ],
  },
  {
    slug: 'burgers',
    name: 'Burgers',
    note: 'Fresh ground chuck steak burgers served with chips. Sub Krinkle-cut Fries ($3.50) or Sweet Potato Fries ($4.95). Add Pretzel Roll or Texas Toast ($2.00).',
    items: [
      { slug: 'jeffs-famous-cheeseburger', name: "Jeff's Famous Cheeseburger", price: 1395, groups: ['burger-cheese', ...BURGER], description: 'Choice of American, Swiss, pepperjack, or provolone on a corn-dusted Kaiser roll.', tags: ['popular'] },
      { slug: 'bacon-cheeseburger', name: 'Bacon Cheeseburger', price: 1495, groups: ['burger-cheese', ...BURGER], description: "Jeff's famous cheeseburger topped with bacon." },
      { slug: 'mushroom-swiss-burger', name: 'Mushroom Swiss Burger', price: 1495, groups: BURGER, description: 'Smothered with sautéed mushrooms and Swiss cheese.' },
      { slug: 'grilled-cheeseburger', name: 'Grilled Cheeseburger', price: 1495, groups: ['side-swap'], description: 'Two pieces of Texas toast and cheese make this an overstuffed grilled cheese burger.' },
      { slug: 'bleu-burger', name: 'Bleu Burger', price: 1495, groups: BURGER, description: 'Topped with chunky bleu cheese dressing.' },
      { slug: 'jalapeno-burger', name: 'Jalapeño Burger', price: 1495, groups: BURGER, description: 'Pepperjack cheese, jalapeños, and grilled onions.', tags: ['spicy'] },
      { slug: 'biker-burger', name: 'Biker Burger', price: 1525, groups: BURGER, description: 'Grilled onions, mushrooms, bacon, and pepperjack cheese.' },
      { slug: 'smash-burger', name: 'Smash Burger', price: 1000, groups: BURGER, description: 'Two melt-in-your-mouth patties with American cheese, ketchup, mustard, and pickles.' },
    ],
  },
  {
    slug: 'slider-baskets',
    name: 'Slider Baskets',
    note: 'Served with fries.',
    items: [
      { slug: 'mini-cheeseburger-sliders', name: 'Mini Cheeseburger', price: 825 },
      { slug: 'philly-cheesesteak-sliders', name: 'Philly Cheesesteak', price: 950 },
      { slug: 'chicken-mini-sliders', name: 'Chicken MINI Sliders', price: 950 },
    ],
  },
  {
    slug: 'big-burger-challenge',
    name: "Jeff's Big Burger Challenge",
    items: [
      {
        slug: 'big-burger-challenge',
        name: "Jeff's Big Burger Challenge",
        price: 3599,
        description:
          '3 cheeseburgers stacked between 2 Bacon Grilled Cheese Sandwiches, covered in 1/2 lb of fried onion petals, pickles, lettuce, tomato, and ketchup. Served with 1 lb of krinkle-cut fries. Eat all food (and keep it down) in 30 minutes to get the burger free.',
        onlineOrderable: false,
        orderingNote: 'In-house only',
      },
      { slug: 'share-the-challenge', name: 'Share the Challenge Burger', price: 4999, description: 'The full challenge burger, built for sharing. In-house only.', onlineOrderable: false, orderingNote: 'In-house only' },
    ],
  },
  {
    slug: 'sandwiches',
    name: "Jeff's Sandwiches",
    note: 'All served with chips. Sub Krinkle-cut Fries ($3.50) or Sweet Potato Fries ($4.95).',
    items: [
      { slug: 'cheese-steak', name: 'Cheese Steak', price: [['Small', 1075], ['Large', 1375]], groups: ['steak-protein', 'side-swap'], description: 'Beef or chicken steak meat and melted cheese on an Italian roll.' },
      { slug: 'gs-ham-sub', name: "G's Ham Sub", price: 1250, groups: ['side-swap'], description: '12" Milano roll stuffed with ham, lettuce, tomato, onion, and provolone cheese.' },
      { slug: 'big-ass-fish-sandwich', name: 'Big-Ass Fish Sandwich', price: 1495, groups: ['side-swap'], description: '10 oz portion of battered haddock on a sub roll.', tags: ['seafood'] },
      { slug: 'italian-sausage', name: 'Italian Sausage', price: 1095, groups: ['side-swap'], description: 'Sweet Italian sausage with grilled peppers and onions on an Italian roll.' },
      { slug: 'chicken-fajita-wrap', name: 'Chicken Fajita Wrap', price: 1095, groups: ['side-swap'], description: 'Seasoned grilled chicken breast in a honey wheat wrap.' },
      { slug: 'reuben', name: 'Reuben', price: 1095, groups: ['reuben-protein', 'side-swap'], description: 'Corned beef or turkey on rye.' },
      { slug: 'prime-rib-french-dip', name: 'Prime Rib French Dip', price: 1495, groups: ['side-swap'], description: 'Served on a kaiser roll.' },
    ],
  },
  {
    slug: 'soups-salads',
    name: 'Fresh Soups & Salads',
    items: [
      { slug: 'suzies-specialty-salad', name: "Suzie's Specialty Salad", price: [['Small', 595], ['Large', 995]], groups: ['salad-protein'], description: 'Lettuce, cucumber, tomato.', tags: ['vegetarian'] },
      { slug: 'french-onion-soup', name: 'French Onion Soup', price: 895, description: 'Crock-full of onion broth and Italian bread topped with provolone cheese.' },
      { slug: 'soup-of-the-day', name: 'Soup of the Day', price: [['Cup', 395], ['Bowl', 595]], description: "Ask about today's soup." },
      { slug: 'cream-of-crab', name: 'Cream of Crab', price: [['Cup', null], ['Bowl', null]], tags: ['seafood'] },
    ],
  },
  {
    slug: 'drinks',
    name: 'Drinks',
    items: [{ slug: 'soda', name: 'Soda', price: 300, description: 'One refill included (dine-in).' }],
  },
]

export const FEATURED = ['bone-in-wings', 'jeffs-famous-cheeseburger', 'rockfish-and-chips', 'loaded-nachos']

export const WEEKLY_HOURS = [
  { day: 'mon', open: '11:00', close: '22:00', closed: false },
  { day: 'tue', open: '11:00', close: '22:00', closed: false },
  { day: 'wed', open: '11:00', close: '22:00', closed: false },
  { day: 'thu', open: '11:00', close: '22:00', closed: false },
  { day: 'fri', open: '11:00', close: '00:00', closed: false },
  { day: 'sat', open: '11:00', close: '00:00', closed: false },
  { day: 'sun', open: '11:00', close: '21:00', closed: false },
] as const

export const CHALLENGE_RULES = [
  'Eat all of the food — the burger, the onion petals and the fries.',
  'Keep it all down.',
  'Finish everything within 30 minutes.',
  'Dine-in only. One challenger per burger, no sharing.',
]
