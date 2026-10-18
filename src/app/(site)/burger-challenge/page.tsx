import { getPayloadClient } from '@/lib/payload'
import { PHONE_TEL } from '@/lib/money'
import { pageMeta } from '@/lib/seo'

export const metadata = pageMeta(
  '/burger-challenge',
  'Burger Challenge',
  "Jeff's Big Burger Challenge: three cheeseburgers, two bacon grilled cheeses, onion petals and a pound of fries. Finish in 30 minutes and it's free.",
)

type Entry = { id: string | number; name: string; date: string; timeSeconds?: number | null; result: 'won' | 'attempted' }
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

// BBC-001..006
export default async function ChallengePage() {
  const payload = await getPayloadClient()
  const [entries, page] = await Promise.all([
    payload.find({ collection: 'challenge-entries', overrideAccess: true, depth: 0, limit: 200, where: { approved: { equals: true } } }),
    payload.findGlobal({ slug: 'challenge', overrideAccess: true, depth: 0 }),
  ])
  const all = entries.docs as unknown as Entry[]
  const winners = all
    .filter((e) => e.result === 'won')
    .sort((a, b) => (a.timeSeconds ?? Infinity) - (b.timeSeconds ?? Infinity) || new Date(b.date).getTime() - new Date(a.date).getTime())
  const attempts = all.filter((e) => e.result === 'attempted').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  const rules = ((page as { rules?: { text: string }[] }).rules ?? []).map((r) => r.text)

  return (
    <>
      <section aria-labelledby="bbc-title" className="on-dark -mx-4 -mt-6 bg-charcoal px-4 py-10 text-cream md:rounded-b-2xl md:px-10">
        <h1 id="bbc-title" className="text-4xl font-bold uppercase md:text-6xl">
          Jeff&apos;s Big Burger Challenge
        </h1>
        <p className="mt-3 font-display text-5xl font-bold text-gold">$35.99</p>
        <p className="mt-2 text-xl">Finish it in 30 minutes and it&apos;s free.</p>
        <a href={PHONE_TEL} className="btn btn-primary mt-6 text-lg">
          Call to schedule your attempt
        </a>
      </section>

      <div className="mt-10 grid gap-8 md:grid-cols-2">
        <section aria-labelledby="whats-in" className="card p-6">
          <h2 id="whats-in" className="mb-3 text-3xl font-bold uppercase">
            What&apos;s in it
          </h2>
          <ul className="list-disc space-y-1 pl-6 text-lg">
            <li>3 cheeseburgers</li>
            <li>2 Bacon Grilled Cheese Sandwiches</li>
            <li>1/2 lb fried onion petals</li>
            <li>pickles, lettuce, tomato and ketchup</li>
            <li>1 lb krinkle-cut fries</li>
          </ul>
        </section>
        <section aria-labelledby="rules" className="card p-6">
          <h2 id="rules" className="mb-3 text-3xl font-bold uppercase">
            Rules
          </h2>
          <ol className="list-decimal space-y-1 pl-6 text-lg">
            {rules.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ol>
        </section>
      </div>

      <section aria-labelledby="share" className="mt-8 rounded-2xl bg-red p-6 text-white">
        <h2 id="share" className="text-3xl font-bold uppercase">
          Share the Challenge Burger
        </h2>
        <p className="mt-2 text-lg">
          The full challenge burger, built for sharing — <strong>$49.99</strong>. In-house only.
        </p>
      </section>

      <div className="mt-8 grid gap-8 md:grid-cols-2">
        <section aria-labelledby="hof">
          <h2 id="hof" className="mb-3 text-3xl font-bold uppercase">
            Hall of Fame
          </h2>
          {winners.length ? (
            <ol data-testid="hall-of-fame" className="space-y-2">
              {winners.map((w) => (
                <li key={w.id} className="card flex justify-between p-3 text-lg">
                  <span className="font-semibold">{w.name}</span>
                  {w.timeSeconds != null && <span className="font-display">{mmss(w.timeSeconds)}</span>}
                </li>
              ))}
            </ol>
          ) : (
            <p data-testid="hall-of-fame">No champions yet. Will you be the first?</p>
          )}
        </section>
        <section aria-labelledby="valiant">
          <h2 id="valiant" className="mb-3 text-3xl font-bold uppercase">
            Wall of Valiant Attempts
          </h2>
          <ul data-testid="valiant-attempts" className="flex flex-wrap gap-2">
            {attempts.map((a) => (
              <li key={a.id} className="badge text-base">
                {a.name}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  )
}
