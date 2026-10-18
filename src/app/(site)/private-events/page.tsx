import { InquiryForm } from '@/components/site/InquiryForm'
import { now } from '@/lib/clock'
import { pageMeta } from '@/lib/seo'
import { addDays, ymdKey, zoned } from '@/lib/time'

export const metadata = pageMeta(
  '/private-events',
  'Private Events',
  'Book Jeff’s Taproom & Grill for birthdays, team parties and watch parties, or order catering. Send an inquiry and we’ll reply within 2 business days.',
)

export default function PrivateEventsPage() {
  const tomorrow = ymdKey(addDays(zoned(now()), 1))
  return (
    <div className="max-w-2xl">
      <h1 className="mb-2 text-4xl font-bold uppercase">Private Events &amp; Catering</h1>
      <p className="mb-6 text-lg">Birthdays, team parties, watch parties and catering trays. Tell us what you&apos;re planning.</p>
      <InquiryForm minDate={tomorrow} />
    </div>
  )
}
