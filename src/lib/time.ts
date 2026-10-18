// Wall-clock helpers for America/New_York. Safe on server and client.
export const TZ = 'America/New_York'

export type Ymd = { y: number; m: number; d: number }
export const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const
export type DayKey = (typeof DAY_KEYS)[number]
export const DAY_SHORT: Record<DayKey, string> = { sun: 'Sun', mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat' }
export const DAY_LONG: Record<DayKey, string> = {
  sun: 'Sunday', mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday',
}
/** Monday-first order used for display. */
export const WEEK: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

const partsFmt = new Intl.DateTimeFormat('en-US', {
  timeZone: TZ,
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
})

export function zoned(date: Date) {
  const p: Record<string, number> = {}
  for (const part of partsFmt.formatToParts(date)) if (part.type !== 'literal') p[part.type] = Number(part.value)
  const ymd = { y: p.year, m: p.month, d: p.day }
  return { ...ymd, hour: p.hour, minute: p.minute, second: p.second, day: dayOf(ymd) }
}

export function dayOf({ y, m, d }: Ymd): DayKey {
  return DAY_KEYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]
}

export function addDays({ y, m, d }: Ymd, n: number): Ymd {
  const t = new Date(Date.UTC(y, m - 1, d + n))
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() }
}

export function ymdKey({ y, m, d }: Ymd) {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

export function parseYmd(s: string): Ymd {
  const [y, m, d] = s.split('-').map(Number)
  return { y, m, d }
}

/** The instant at which the New York wall clock reads y-m-d h:min (minutes may exceed 24h). */
export function fromZoned({ y, m, d }: Ymd, minutes: number): Date {
  const guess = Date.UTC(y, m - 1, d, 0, minutes)
  let t = guess
  for (let i = 0; i < 2; i++) {
    const z = zoned(new Date(t))
    const asUtc = Date.UTC(z.y, z.m - 1, z.d, z.hour, z.minute)
    t += guess - asUtc
  }
  return new Date(t)
}

export function startOfDay(date: Date): Date {
  return fromZoned(zoned(date), 0)
}

export function hhmmToMinutes(s: string) {
  const [h, m] = s.split(':').map(Number)
  return h * 60 + (m || 0)
}

const timeFmt = new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour: 'numeric', minute: '2-digit', hour12: true })
/** "5:20 PM" */
export function formatTime(date: Date | string) {
  return timeFmt.format(new Date(date)).replace(/ /g, ' ')
}

/** "16:00" → "4:00 PM" */
export function formatHHMM(s: string) {
  const mins = hhmmToMinutes(s) % (24 * 60)
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`
}

/** "4–7 PM", "11:30 AM–2 PM" */
export function formatWindow(start: string, end: string) {
  const part = (s: string) => {
    const mins = hhmmToMinutes(s) % (24 * 60)
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return { text: `${h % 12 || 12}${m ? `:${String(m).padStart(2, '0')}` : ''}`, ap: h < 12 ? 'AM' : 'PM' }
  }
  const a = part(start)
  const b = part(end)
  return a.ap === b.ap ? `${a.text}–${b.text} ${b.ap}` : `${a.text} ${a.ap}–${b.text} ${b.ap}`
}

const eventFmt = new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'short', month: 'short', day: 'numeric' })
/** "Wed, Nov 11 · 7:00 PM" */
export function formatEventDate(date: Date | string) {
  return `${eventFmt.format(new Date(date))} · ${formatTime(date)}`
}

export function shortDay(date: Date) {
  return DAY_SHORT[zoned(date).day]
}
