import { ADDRESS_LINE1, ADDRESS_LINE2, PHONE_DISPLAY, PHONE_TEL, VENUE } from '@/lib/money'
import { DAY_SHORT, type Ymd, WEEK, addDays, dayOf } from '@/lib/time'
import type { HoursData, SettingsData } from '@/lib/types'
import { dayHoursText } from '@/lib/hours'
import { DirectionsLink } from './DirectionsLink'
import Link from 'next/link'

// SHELL-007
export function Footer({ hours, settings, today, year }: { hours: HoursData; settings: SettingsData; today: Ymd; year: number }) {
  // The coming week starting today, listed Monday-first
  const week = Array.from({ length: 7 }, (_, i) => addDays(today, i))
  const ordered = WEEK.map((d) => week.find((w) => dayOf(w) === d)!)
  return (
    <footer className="on-dark mt-16 bg-charcoal text-cream">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-3">
        <div>
          <h2 className="mb-2 text-xl font-bold uppercase">{VENUE}</h2>
          <address className="not-italic">
            {ADDRESS_LINE1}
            <br />
            {ADDRESS_LINE2}
          </address>
          <p className="mt-2">
            <a href={PHONE_TEL} className="underline">
              {PHONE_DISPLAY}
            </a>
          </p>
          <p className="mt-2">
            <DirectionsLink className="underline">Get directions</DirectionsLink>
          </p>
        </div>
        <div>
          <h2 className="mb-2 text-xl font-bold uppercase">Hours</h2>
          <p className="mb-2 font-semibold">Today: {dayHoursText(hours, today)}</p>
          <dl className="grid grid-cols-[3rem_1fr] gap-x-2 text-sm">
            {ordered.map((d) => (
              <div key={dayOf(d)} className="contents">
                <dt className="font-semibold">{DAY_SHORT[dayOf(d)]}</dt>
                <dd>{dayHoursText(hours, d)}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div>
          <h2 className="mb-2 text-xl font-bold uppercase">More</h2>
          <ul className="space-y-1">
            <li>
              <Link href="/private-events" className="underline">
                Private events &amp; catering
              </Link>
            </li>
            <li>
              <Link href="/accessibility" className="underline">
                Accessibility
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="underline">
                Privacy
              </Link>
            </li>
            {settings.socialLinks.map((l) => (
              <li key={l.url}>
                <a href={l.url} className="underline" rel="noopener noreferrer" target="_blank">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="border-t border-white/10 py-4 text-center text-sm">
        © {year} {VENUE}
      </p>
    </footer>
  )
}
