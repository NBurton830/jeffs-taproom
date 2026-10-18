import { getPayloadClient } from '@/lib/payload'
import { pageMeta } from '@/lib/seo'

export const metadata = pageMeta(
  '/on-tap',
  'On Tap',
  'What’s pouring at Jeff’s Taproom & Grill right now: local and classic drafts with brewery, style and ABV, plus what’s coming soon.',
)

type Tap = { id: string | number; name: string; brewery?: string; style?: string; abv?: number; status: string; updatedAt: string }

function relative(date: Date) {
  const diff = (Date.now() - date.getTime()) / 1000
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  if (Math.abs(diff) < 60) return 'just now'
  if (Math.abs(diff) < 3600) return rtf.format(-Math.round(diff / 60), 'minute')
  if (Math.abs(diff) < 86400) return rtf.format(-Math.round(diff / 3600), 'hour')
  return rtf.format(-Math.round(diff / 86400), 'day')
}

function TapCard({ tap }: { tap: Tap }) {
  return (
    <li className="card p-4">
      <h3 className="text-xl font-bold">{tap.name}</h3>
      <p className="text-muted">
        {[tap.brewery, tap.style].filter(Boolean).join(' · ')}
        {typeof tap.abv === 'number' && <> · {tap.abv.toFixed(1)}% ABV</>}
      </p>
    </li>
  )
}

// TAP-001..003
export default async function OnTapPage() {
  const payload = await getPayloadClient()
  const res = await payload.find({ collection: 'taps', overrideAccess: true, depth: 0, limit: 100, sort: 'sortOrder' })
  const taps = res.docs as unknown as Tap[]
  const on = taps.filter((t) => t.status === 'on')
  const soon = taps.filter((t) => t.status === 'coming-soon')
  const latest = taps.reduce((m, t) => Math.max(m, new Date(t.updatedAt).getTime()), 0)
  return (
    <>
      <h1 className="mb-2 text-4xl font-bold uppercase">On Tap</h1>
      {latest > 0 && <p className="mb-2 text-muted">Updated {relative(new Date(latest))}</p>}
      <p className="mb-6 rounded-lg bg-cream-dark p-3 font-semibold">Beer is available in-house. Ask your bartender about to-go options.</p>
      <section aria-labelledby="on-now" className="mb-8">
        <h2 id="on-now" className="mb-3 text-3xl font-bold uppercase">
          On tap now
        </h2>
        <ul className="grid gap-3 md:grid-cols-2">
          {on.map((t) => (
            <TapCard key={t.id} tap={t} />
          ))}
        </ul>
      </section>
      {soon.length > 0 && (
        <section aria-labelledby="soon">
          <h2 id="soon" className="mb-3 text-3xl font-bold uppercase">
            Coming soon
          </h2>
          <ul className="grid gap-3 md:grid-cols-2">
            {soon.map((t) => (
              <TapCard key={t.id} tap={t} />
            ))}
          </ul>
        </section>
      )}
    </>
  )
}
