import { PHONE_DISPLAY, PHONE_TEL } from '@/lib/money'
import { pageMeta } from '@/lib/seo'

export const metadata = pageMeta('/privacy', 'Privacy', 'How Jeff’s Taproom & Grill uses the name, phone and email you give us when you order pickup or send an inquiry.')

// SEC-007
export default function PrivacyPage() {
  return (
    <div className="max-w-3xl space-y-4 text-lg">
      <h1 className="text-4xl font-bold uppercase">Privacy</h1>
      <p>When you order pickup we ask for your name, phone number and (optionally) your email. We use them only to prepare your order, contact you about it and send your receipt.</p>
      <p>We don&apos;t sell or share your details. We don&apos;t use advertising trackers.</p>
      <p>Your phone number and email are removed from our order records after 180 days. We keep the order itself (items and totals) for our books.</p>
      <p>
        Questions? Call{' '}
        <a href={PHONE_TEL} className="underline">
          {PHONE_DISPLAY}
        </a>
        .
      </p>
    </div>
  )
}
