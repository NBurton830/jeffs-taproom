import { now } from '@/lib/clock'
import { loadSpecials } from '@/lib/data'
import { pageMeta } from '@/lib/seo'
import { DAY_KEYS, DAY_LONG, formatWindow, hhmmToMinutes, WEEK, zoned } from '@/lib/time'

export const metadata = pageMeta(
  '/specials',
  'Specials',
  'Weekly specials at Jeff’s Taproom & Grill: weekday happy hour, Fish Fry Friday, Wing Wednesday and Burger Tuesday in Bridgeville, DE.',
)

// SPC-001..003
export default async function SpecialsPage() {
  const specials = await loadSpecials()
  const t = zoned(now())
  const minutes = t.hour * 60 + t.minute
  // DOM order starts at today (listed first on mobile); CSS `order` lays the grid out Monday–Sunday on larger screens.
  const start = DAY_KEYS.indexOf(t.day)
  const days = Array.from({ length: 7 }, (_, i) => DAY_KEYS[(start + i) % 7])
  return (
    <>
      <h1 className="mb-4 text-4xl font-bold uppercase">Specials</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {days.map((d) => {
          const list = specials.filter((s) => s.days?.includes(d))
          const isToday = d === t.day
          return (
            <section
              key={d}
              data-testid={`specials-day-${d}`}
              aria-labelledby={`day-${d}`}
              aria-current={isToday ? 'date' : undefined}
              style={{ ['--o' as string]: WEEK.indexOf(d) }}
              className={`card p-4 md:[order:var(--o)] ${isToday ? 'border-2 border-red' : ''}`}
            >
              <h2 id={`day-${d}`} className="text-2xl font-bold uppercase">
                {DAY_LONG[d]}
                {isToday && <span className="badge badge-red ml-2 align-middle">Today</span>}
              </h2>
              {list.length === 0 ? (
                <p className="mt-2 text-muted">No specials — the full menu is always on.</p>
              ) : (
                <ul className="mt-2 space-y-3">
                  {list.map((s) => {
                    const live =
                      isToday && s.startTime && s.endTime && minutes >= hhmmToMinutes(s.startTime) && minutes < hhmmToMinutes(s.endTime)
                    return (
                      <li key={s.id}>
                        <h3 className="text-lg font-bold">
                          {s.title}
                          {live && <span className="badge badge-green ml-2 align-middle">Happening now</span>}
                        </h3>
                        {s.priceText && <p className="font-semibold text-red-dark">{s.priceText}</p>}
                        {s.startTime && s.endTime && <p className="text-sm">{formatWindow(s.startTime, s.endTime)}</p>}
                        {s.description && <p className="text-sm text-muted">{s.description}</p>}
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>
          )
        })}
      </div>
    </>
  )
}
