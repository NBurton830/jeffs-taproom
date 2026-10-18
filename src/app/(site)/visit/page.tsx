import { DirectionsLink } from '@/components/site/DirectionsLink'
import { VenueMap } from '@/components/site/VenueMap'
import { now } from '@/lib/clock'
import { loadHours, loadSettings } from '@/lib/data'
import { dayHoursText } from '@/lib/hours'
import { ADDRESS, PHONE_DISPLAY, PHONE_TEL, VENUE } from '@/lib/money'
import { pageMeta } from '@/lib/seo'
import { addDays, DAY_SHORT, dayOf, parseYmd, WEEK, ymdKey, zoned } from '@/lib/time'

export const metadata = pageMeta(
  '/visit',
  'Visit',
  'Hours, directions and contact for Jeff’s Taproom & Grill at 416 Market Street, Bridgeville, Delaware. Call (302) 337-8602.',
)

const longDate = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' })

// VIS-001..004
export default async function VisitPage() {
  const [hours, settings] = await Promise.all([loadHours(), loadSettings()])
  const today = zoned(now())
  const week = Array.from({ length: 7 }, (_, i) => addDays(today, i))
  const todayKey = ymdKey(today)
  const horizon = ymdKey(addDays(today, 14))
  const upcoming = hours.exceptions.filter((e) => e.date >= todayKey && e.date <= horizon).sort((a, b) => a.date.localeCompare(b.date))
  return (
    <>
      <h1 className="mb-6 text-4xl font-bold uppercase">Visit</h1>
      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-6">
          <section aria-labelledby="find-us">
            <h2 id="find-us" className="mb-2 text-2xl font-bold uppercase">
              Find us
            </h2>
            <address className="text-lg not-italic">{ADDRESS}</address>
            <p className="mt-2 text-lg">
              <a href={PHONE_TEL} className="underline">
                {PHONE_DISPLAY}
              </a>
            </p>
            <DirectionsLink className="btn btn-primary mt-3">Get directions</DirectionsLink>
          </section>
          <section aria-labelledby="hours-h">
            <h2 id="hours-h" className="mb-2 text-2xl font-bold uppercase">
              Opening hours
            </h2>
            <table className="w-full max-w-sm">
              <caption className="sr-only">Hours</caption>
              <thead className="sr-only">
                <tr>
                  <th scope="col">Day</th>
                  <th scope="col">Hours</th>
                </tr>
              </thead>
              <tbody>
                {WEEK.map((d) => {
                  const ymd = week.find((w) => dayOf(w) === d)!
                  const isToday = d === today.day
                  return (
                    <tr key={d} aria-current={isToday ? 'date' : undefined} className={isToday ? 'bg-white font-bold' : ''}>
                      <th scope="row" className="py-1.5 pr-4 text-left">
                        {DAY_SHORT[d]}
                      </th>
                      <td className="py-1.5">{dayHoursText(hours, ymd)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {upcoming.length > 0 && (
              <div className="mt-4">
                <h3 className="font-bold">Holiday hours</h3>
                <ul className="mt-1 space-y-1">
                  {upcoming.map((e) => (
                    <li key={e.date}>
                      {longDate.format(new Date(`${e.date}T12:00:00Z`))}: {e.closed ? 'Closed' : dayHoursText(hours, parseYmd(e.date))}
                      {e.note ? ` — ${e.note}` : ''}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        </div>
        <section aria-labelledby="map-h">
          <h2 id="map-h" className="mb-2 text-2xl font-bold uppercase">
            Map
          </h2>
          <VenueMap lat={settings.geo.lat} lng={settings.geo.lng} label={VENUE} />
        </section>
      </div>
    </>
  )
}
