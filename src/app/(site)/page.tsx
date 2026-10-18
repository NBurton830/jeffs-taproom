import Link from 'next/link'
import { AddButton } from '@/components/site/AddButton'
import { DirectionsLink } from '@/components/site/DirectionsLink'
import { VenueMap } from '@/components/site/VenueMap'
import { EVENT_CATEGORIES } from '@/collections/Events'
import { now } from '@/lib/clock'
import { loadHome, loadHours, loadMenu, loadSettings, loadSpecials, loadUpcomingEvents } from '@/lib/data'
import { dayHoursText, getOpenStatus, openStatusText } from '@/lib/hours'
import { isOrderable, priceText } from '@/lib/menuDisplay'
import { ADDRESS, ADDRESS_LINE1, ADDRESS_LINE2, PHONE_DISPLAY, PHONE_TEL, VENUE } from '@/lib/money'
import { jsonLdScript, pageMeta, siteUrl } from '@/lib/seo'
import { addDays, DAY_LONG, dayOf, formatEventDate, formatWindow, WEEK, ymdKey, zoned } from '@/lib/time'
import { WING_SAUCES } from '@/seed/menu'

export const metadata = pageMeta(
  '/',
  null,
  "Bridgeville's neighbourhood taproom: famous wings, fresh-ground burgers, seafood and cold drafts. Order pickup online or visit us on Market Street.",
)

export default async function HomePage() {
  const [home, menu, hours, settings, specials, events] = await Promise.all([
    loadHome(),
    loadMenu(),
    loadHours(),
    loadSettings(),
    loadSpecials(),
    loadUpcomingEvents(20),
  ])
  const t = now()
  const today = zoned(t)
  const todayKey = ymdKey(today)
  const statusText = openStatusText(getOpenStatus(hours, t), t)
  const items = menu.categories.flatMap((c) => c.items)
  const featured = (home.featuredItemSlugs ?? []).map((s) => items.find((i) => i.slug === s)).filter((i) => !!i).slice(0, 6)
  const todaysSpecials = specials.filter((s) => s.days?.includes(today.day))
  const todaysEvents = events.filter((e) => ymdKey(zoned(new Date(e.startsAt))) === todayKey)
  const challenge = items.find((i) => i.slug === 'big-burger-challenge')

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': ['BarOrPub', 'Restaurant'],
    name: VENUE,
    url: siteUrl(),
    telephone: '+1-302-337-8602',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '416 Market Street',
      addressLocality: 'Bridgeville',
      addressRegion: 'DE',
      postalCode: '19933',
      addressCountry: 'US',
    },
    geo: { '@type': 'GeoCoordinates', latitude: settings.geo.lat, longitude: settings.geo.lng },
    openingHoursSpecification: hours.weekly
      .filter((w) => !w.closed)
      .map((w) => ({ '@type': 'OpeningHoursSpecification', dayOfWeek: `https://schema.org/${DAY_LONG[w.day]}`, opens: w.open, closes: w.close })),
    servesCuisine: ['American', 'Bar food', 'Seafood', 'Wings'],
    menu: `${siteUrl()}/menu`,
    acceptsReservations: false,
    priceRange: '$$',
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(jsonLd)} />

      <section aria-labelledby="hero-title" className="on-dark -mx-4 -mt-6 bg-red px-4 py-10 text-white md:rounded-b-2xl md:px-10 md:py-14">
        <p className="mb-2 inline-block rounded bg-charcoal px-3 py-1 font-display text-sm tracking-widest">BEER • WINGS</p>
        <h1 id="hero-title" className="max-w-3xl text-4xl leading-tight font-bold uppercase md:text-6xl">
          {home.heroHeadline || "Beer. Wings. Bridgeville's Taproom."}
        </h1>
        <p className="mt-3 max-w-2xl text-lg">{home.heroSubhead}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/order" className="btn bg-white text-lg text-red hover:bg-cream">
            Order Pickup
          </Link>
          <Link href="/menu" className="btn border-white text-lg text-white hover:bg-white/10">
            View Menu
          </Link>
        </div>
        <ul className="mt-6 space-y-1 text-base">
          <li className="font-semibold">{statusText}</li>
          <li>
            <DirectionsLink className="underline">{ADDRESS}</DirectionsLink>
          </li>
          <li>
            <a href={PHONE_TEL} className="underline">
              {PHONE_DISPLAY}
            </a>
          </li>
        </ul>
      </section>

      <section aria-labelledby="today-title" data-testid="home-today" className="mt-10">
        <h2 id="today-title" className="mb-4 text-3xl font-bold uppercase">
          Today at Jeff&apos;s
        </h2>
        {todaysSpecials.length === 0 && todaysEvents.length === 0 ? (
          <p className="card p-4">
            Open today {dayHoursText(hours, today)}. Come by for wings and a cold one.
          </p>
        ) : (
          <ul className="grid gap-3 md:grid-cols-3">
            {todaysSpecials.map((s) => (
              <li key={`s-${s.id}`} className="card p-4">
                <h3 className="text-xl font-bold">{s.title}</h3>
                {s.priceText && <p className="font-semibold text-red">{s.priceText}</p>}
                {s.startTime && s.endTime && <p className="text-muted">{formatWindow(s.startTime, s.endTime)}</p>}
              </li>
            ))}
            {todaysEvents.map((e) => (
              <li key={`e-${e.slug}`} className="card p-4">
                <h3 className="text-xl font-bold">
                  <Link href={`/events/${e.slug}`}>{e.title}</Link>
                </h3>
                <p className="text-muted">{formatEventDate(e.startsAt)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {featured.length > 0 && (
        <section aria-labelledby="fav-title" className="mt-10">
          <h2 id="fav-title" className="mb-4 text-3xl font-bold uppercase">
            Fan favourites
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((i) => (
              <div key={i.slug} className="card flex flex-col gap-2 p-4">
                <h3 className="text-xl font-bold">{i.name}</h3>
                <p className="font-semibold">{priceText(i)}</p>
                {i.description && <p className="text-sm text-muted">{i.description}</p>}
                {isOrderable(i) && <AddButton item={i} className="btn btn-primary mt-auto" />}
              </div>
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="events-title" className="mt-10">
        <h2 id="events-title" className="mb-4 text-3xl font-bold uppercase">
          Upcoming events
        </h2>
        {events.length === 0 ? (
          <p>No events on the calendar right now — follow us for updates.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {events.slice(0, 3).map((e) => (
              <article key={e.slug} className="card p-4">
                <span className="badge">{EVENT_CATEGORIES[e.category as keyof typeof EVENT_CATEGORIES] ?? 'Other'}</span>
                <h3 className="mt-2 text-xl font-bold">
                  <Link href={`/events/${e.slug}`}>{e.title}</Link>
                </h3>
                <p className="text-muted">{formatEventDate(e.startsAt)}</p>
              </article>
            ))}
          </div>
        )}
        <p className="mt-4">
          <Link href="/events" className="font-semibold underline">
            See all events
          </Link>
        </p>
      </section>

      <section aria-labelledby="bbc-title" className="on-dark mt-10 rounded-2xl bg-charcoal p-6 text-cream md:p-10">
        <h2 id="bbc-title" className="text-3xl font-bold uppercase">
          Big Burger Challenge
        </h2>
        <p className="mt-2 max-w-2xl text-lg">
          Three cheeseburgers, two bacon grilled cheeses, onion petals and a pound of fries for {challenge ? priceText(challenge) : '$35.99'}. Finish it in 30
          minutes and it&apos;s free.
        </p>
        <Link href="/burger-challenge" className="btn btn-primary mt-4">
          Take the challenge
        </Link>
      </section>

      <section aria-labelledby="sauce-title" className="mt-10">
        <h2 id="sauce-title" className="mb-4 text-3xl font-bold uppercase">
          Wing sauces
        </h2>
        <ul className="flex flex-wrap gap-2">
          {WING_SAUCES.map((s) => (
            <li key={s} className="rounded-full border-2 border-red px-4 py-1.5 font-semibold text-red-dark">
              {s}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="visit-title" className="mt-10 grid gap-6 md:grid-cols-2">
        <div>
          <h2 id="visit-title" className="mb-4 text-3xl font-bold uppercase">
            Visit us
          </h2>
          <address className="text-lg not-italic">
            {ADDRESS_LINE1}
            <br />
            {ADDRESS_LINE2}
          </address>
          <p className="mt-2">
            <a href={PHONE_TEL} className="underline">
              {PHONE_DISPLAY}
            </a>
          </p>
          <dl className="mt-4 grid grid-cols-[6rem_1fr] gap-x-2">
            {WEEK.map((d) => {
              const ymd = Array.from({ length: 7 }, (_, i) => addDays(today, i)).find((x) => dayOf(x) === d)!
              return (
                <div key={d} className="contents">
                  <dt className="font-semibold">{DAY_LONG[d]}</dt>
                  <dd>{dayHoursText(hours, ymd)}</dd>
                </div>
              )
            })}
          </dl>
          <DirectionsLink className="btn btn-secondary mt-4">Get directions</DirectionsLink>
        </div>
        <VenueMap lat={settings.geo.lat} lng={settings.geo.lng} label={VENUE} />
      </section>
    </>
  )
}
