import { loadEvent } from '@/lib/data'
import { ADDRESS, VENUE } from '@/lib/money'
import { siteUrl } from '@/lib/seo'
import { zoned } from '@/lib/time'

export const dynamic = 'force-dynamic'

const pad = (n: number) => String(n).padStart(2, '0')
const local = (d: Date) => {
  const z = zoned(d)
  return `${z.y}${pad(z.m)}${pad(z.d)}T${pad(z.hour)}${pad(z.minute)}${pad(z.second)}`
}
const utc = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')

// EVT-003
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const ev = await loadEvent((await params).slug)
  if (!ev) return new Response('Not found', { status: 404 })
  const start = new Date(ev.startsAt)
  const end = ev.endsAt ? new Date(ev.endsAt) : new Date(start.getTime() + 2 * 3600_000)
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    "PRODID:-//Jeff's Taproom & Grill//Events//EN",
    'CALSCALE:GREGORIAN',
    'BEGIN:VTIMEZONE',
    'TZID:America/New_York',
    'BEGIN:DAYLIGHT',
    'TZOFFSETFROM:-0500',
    'TZOFFSETTO:-0400',
    'TZNAME:EDT',
    'DTSTART:19700308T020000',
    'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU',
    'END:DAYLIGHT',
    'BEGIN:STANDARD',
    'TZOFFSETFROM:-0400',
    'TZOFFSETTO:-0500',
    'TZNAME:EST',
    'DTSTART:19701101T020000',
    'RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU',
    'END:STANDARD',
    'END:VTIMEZONE',
    'BEGIN:VEVENT',
    `UID:${ev.slug}@jeffstaproom`,
    `DTSTAMP:${utc(new Date())}`,
    `DTSTART;TZID=America/New_York:${local(start)}`,
    `DTEND;TZID=America/New_York:${local(end)}`,
    `SUMMARY:${esc(ev.title)}`,
    `LOCATION:${esc(`${ADDRESS}`)}`,
    `DESCRIPTION:${esc(`${ev.description ?? ''}\n${VENUE}`)}`,
    `URL:${siteUrl()}/events/${ev.slug}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
  return new Response(ics + '\r\n', {
    headers: { 'Content-Type': 'text/calendar; charset=utf-8', 'Content-Disposition': `attachment; filename="${ev.slug}.ics"` },
  })
}
