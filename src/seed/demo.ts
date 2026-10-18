// Dev/test-only content (specs/40-testing.md TEST-005). Never seeded in production.
export const EVENTS = [
  { slug: 'halloween-bash', title: 'Halloween Bash', startsAt: '2026-10-31T20:00:00-04:00', category: 'party', description: 'Costume contest, spooky specials and a DJ till close.' },
  { slug: 'karaoke-night', title: 'Karaoke Night', startsAt: '2026-11-06T21:00:00-05:00', category: 'other', description: 'Grab the mic — sign-ups at the bar from 8:30 PM.' },
  { slug: 'sunday-football', title: 'Sunday Football Watch Party', startsAt: '2026-11-08T13:00:00-05:00', category: 'sports', description: 'Every game on every screen, plus wing specials at kickoff.' },
  { slug: 'trivia-night', title: 'Trivia Night', startsAt: '2026-11-11T19:00:00-05:00', category: 'trivia', description: 'Teams of up to six. Bar tab prizes for the top three.' },
  { slug: 'live-music-saturday', title: 'Live Music Saturday', startsAt: '2026-11-14T20:00:00-05:00', category: 'music', description: 'Local bands on the corner stage. No cover.' },
]

export const SPECIALS = [
  { title: 'Happy Hour', priceText: '$1 off drafts', days: ['mon', 'tue', 'wed', 'thu', 'fri'], startTime: '16:00', endTime: '19:00', active: true, description: 'Every weekday at the bar.' },
  { title: 'Fish Fry Friday', priceText: 'Rockfish & Chips $12.95', days: ['fri'], active: true, description: 'Beer-battered rockfish, all day Friday.' },
  { title: 'Wing Wednesday', priceText: 'Bone-in wings 8 for $10', days: ['wed'], active: true, description: 'Any sauce, all day.' },
  { title: 'Burger Tuesday', priceText: '$2 off any burger', days: ['tue'], active: true, description: 'Fresh ground chuck, every Tuesday.' },
  { title: 'Retired Special', priceText: '', days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'], active: false, description: 'No longer offered.' },
]

export const TAPS = [
  { name: 'Dogfish Head 60 Minute IPA', brewery: 'Dogfish Head', style: 'IPA', abv: 6.0, status: 'on' },
  { name: 'Miller Lite', brewery: 'Miller', style: 'Light Lager', abv: 4.2, status: 'on' },
  { name: 'Yuengling Lager', brewery: 'Yuengling', style: 'Lager', abv: 4.5, status: 'on' },
  { name: 'Guinness', brewery: 'Guinness', style: 'Stout', abv: 4.2, status: 'on' },
  { name: 'Seasonal Pumpkin Ale', brewery: 'Local', style: 'Pumpkin Ale', abv: 5.5, status: 'coming-soon' },
  { name: 'Old Kicked Keg', brewery: 'Test', style: 'Pilsner', abv: 5.0, status: 'kicked' },
]

export const CHALLENGE_ENTRIES = [
  { name: 'Big Mike', date: '2026-09-12T19:00:00-04:00', timeSeconds: 24 * 60 + 13, result: 'won', approved: true },
  { name: 'Sarah K.', date: '2026-10-03T19:00:00-04:00', timeSeconds: 28 * 60 + 40, result: 'won', approved: true },
  { name: 'Tony R.', date: '2026-10-10T19:00:00-04:00', result: 'attempted', approved: true },
  { name: 'Hidden Hank', date: '2026-10-17T19:00:00-04:00', timeSeconds: 20 * 60, result: 'won', approved: false },
]

export const TEST_USERS = [
  { email: 'admin@jeffstaproom.test', password: 'Taproom!test1', role: 'admin' },
  { email: 'manager@jeffstaproom.test', password: 'Manager!test1', role: 'manager' },
  { email: 'kitchen@jeffstaproom.test', password: 'Kitchen!test1', role: 'kitchen' },
]
