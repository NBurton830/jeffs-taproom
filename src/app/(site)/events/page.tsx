import { EventList } from '@/components/site/EventList'
import { EVENT_CATEGORIES } from '@/collections/Events'
import { loadSettings, loadUpcomingEvents } from '@/lib/data'
import { pageMeta } from '@/lib/seo'
import { formatEventDate } from '@/lib/time'

export const metadata = pageMeta(
  '/events',
  'Events',
  'Trivia, live music, karaoke and game-day watch parties at Jeff’s Taproom & Grill in Bridgeville. See what’s coming up.',
)

export default async function EventsPage() {
  const [events, settings] = await Promise.all([loadUpcomingEvents(), loadSettings()])
  return (
    <>
      <h1 className="mb-4 text-4xl font-bold uppercase">Events</h1>
      {events.length === 0 ? (
        <div className="card p-6">
          <p className="text-lg">No events on the calendar right now — follow us for updates</p>
          {settings.socialLinks.length > 0 && (
            <ul className="mt-3 flex gap-3">
              {settings.socialLinks.map((l) => (
                <li key={l.url}>
                  <a href={l.url} className="underline" target="_blank" rel="noopener noreferrer">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <EventList
          events={events.map((e) => ({
            slug: e.slug,
            title: e.title,
            when: formatEventDate(e.startsAt),
            category: e.category,
            categoryLabel: EVENT_CATEGORIES[e.category as keyof typeof EVENT_CATEGORIES] ?? 'Other',
            description: e.description ?? '',
          }))}
        />
      )}
    </>
  )
}
