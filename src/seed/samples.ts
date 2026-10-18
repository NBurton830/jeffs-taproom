import type { Payload } from 'payload'
import { addDays, fromZoned, zoned, type Ymd } from '../lib/time'

// Demo-only sample content (SEED_DEMO=1). Every record is labeled "Sample" so it's obvious on the
// public site and easy to find and delete in /admin before launch. Dates are relative to today so
// events always look upcoming.
const SAMPLE = 'Sample — edit or delete in /admin.'
const ctx = { context: { seeding: true }, overrideAccess: true } as const

function nextWeekday(from: Ymd, weekday: number) {
  const d = new Date(Date.UTC(from.y, from.m - 1, from.d)).getUTCDay()
  return addDays(from, (weekday - d + 7) % 7 || 7)
}

export async function seedSamples(payload: Payload) {
  const { totalDocs } = await payload.count({ collection: 'events', overrideAccess: true })
  if (totalDocs > 0) return
  const today = zoned(new Date())
  const at = (ymd: Ymd, hh: number) => fromZoned(ymd, hh * 60).toISOString()

  const events = [
    { slug: 'sample-trivia-night', title: 'Trivia Night (sample)', startsAt: at(nextWeekday(today, 3), 19), category: 'trivia', description: `Teams of up to six. ${SAMPLE}` },
    { slug: 'sample-football-watch-party', title: 'Football Watch Party (sample)', startsAt: at(nextWeekday(today, 0), 13), category: 'sports', description: `Every game on every screen. ${SAMPLE}` },
    { slug: 'sample-karaoke-night', title: 'Karaoke Night (sample)', startsAt: at(nextWeekday(today, 5), 21), category: 'other', description: `Sign-ups at the bar. ${SAMPLE}` },
    { slug: 'sample-live-music', title: 'Live Music Saturday (sample)', startsAt: at(nextWeekday(today, 6), 20), category: 'music', description: `Local bands, no cover. ${SAMPLE}` },
  ]
  for (const e of events) await payload.create({ collection: 'events', ...ctx, data: e as never })

  const specials = [
    { title: 'Happy Hour (sample)', priceText: '$1 off drafts', days: ['mon', 'tue', 'wed', 'thu', 'fri'], startTime: '16:00', endTime: '19:00', active: true, description: SAMPLE },
    { title: 'Wing Wednesday (sample)', priceText: 'Bone-in wings 8 for $10', days: ['wed'], active: true, description: SAMPLE },
    { title: 'Fish Fry Friday (sample)', priceText: 'Rockfish & Chips $12.95', days: ['fri'], active: true, description: SAMPLE },
  ]
  for (const s of specials) await payload.create({ collection: 'specials', ...ctx, data: s as never })

  const taps = [
    { name: 'Sample IPA', brewery: 'Sample Brewing', style: 'IPA', abv: 6.0, status: 'on' },
    { name: 'Sample Light Lager', brewery: 'Sample Brewing', style: 'Light Lager', abv: 4.2, status: 'on' },
    { name: 'Sample Stout', brewery: 'Sample Brewing', style: 'Stout', abv: 4.2, status: 'on' },
    { name: 'Sample Seasonal Ale', brewery: 'Sample Brewing', style: 'Pumpkin Ale', abv: 5.5, status: 'coming-soon' },
  ]
  let i = 0
  for (const t of taps) await payload.create({ collection: 'taps', ...ctx, data: { ...t, sortOrder: ++i } as never })

  const entries = [
    { name: 'Sample Champion', date: at(addDays(today, -20), 19), timeSeconds: 24 * 60 + 13, result: 'won', approved: true },
    { name: 'Sample Challenger', date: at(addDays(today, -10), 19), result: 'attempted', approved: true },
  ]
  for (const c of entries) await payload.create({ collection: 'challenge-entries', ...ctx, data: c as never })
  payload.logger.info('Seeded sample content (SEED_DEMO=1)')
}
