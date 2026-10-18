import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { EVENT_CATEGORIES } from '@/collections/Events'
import { loadEvent } from '@/lib/data'
import { ADDRESS, VENUE } from '@/lib/money'
import { jsonLdScript, pageMeta, siteUrl } from '@/lib/seo'
import { formatEventDate } from '@/lib/time'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const ev = await loadEvent((await params).slug)
  if (!ev) return { title: 'Event not found' }
  const desc = `${ev.title} at Jeff's Taproom & Grill, ${formatEventDate(ev.startsAt)}. ${ev.description ?? ''}`.slice(0, 158)
  return pageMeta(`/events/${ev.slug}`, ev.title, desc.length >= 50 ? desc : `${desc} 416 Market Street, Bridgeville, DE.`)
}

export default async function EventPage({ params }: Props) {
  const ev = await loadEvent((await params).slug)
  if (!ev) notFound()
  const start = new Date(ev.startsAt)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: ev.title,
    startDate: start.toISOString(),
    ...(ev.endsAt ? { endDate: new Date(ev.endsAt).toISOString() } : {}),
    description: ev.description ?? '',
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    url: `${siteUrl()}/events/${ev.slug}`,
    location: {
      '@type': 'Place',
      name: VENUE,
      address: { '@type': 'PostalAddress', streetAddress: '416 Market Street', addressLocality: 'Bridgeville', addressRegion: 'DE', postalCode: '19933', addressCountry: 'US' },
    },
  }
  return (
    <article className="max-w-3xl">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(jsonLd)} />
      <p>
        <Link href="/events" className="underline">
          ← All events
        </Link>
      </p>
      <span className="badge mt-4">{EVENT_CATEGORIES[ev.category as keyof typeof EVENT_CATEGORIES] ?? 'Other'}</span>
      <h1 className="mt-2 text-4xl font-bold uppercase">{ev.title}</h1>
      <p className="mt-2 text-xl font-semibold text-red-dark">{formatEventDate(ev.startsAt)}</p>
      <p className="mt-1">{ADDRESS}</p>
      {ev.description && <p className="mt-4 text-lg">{ev.description}</p>}
      <a href={`/events/${ev.slug}/ics`} className="btn btn-primary mt-6">
        Add to calendar
      </a>
    </article>
  )
}
