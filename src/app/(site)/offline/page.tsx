import Link from 'next/link'
import { OFFLINE_TEXT } from '@/lib/offline'

export const metadata = { title: 'Offline', robots: { index: false } }

// SHELL-011/012
export default function OfflinePage() {
  return (
    <div className="py-10">
      <h1 className="mb-3 text-4xl font-bold uppercase">You&apos;re offline</h1>
      <p className="text-lg">{OFFLINE_TEXT.replace("You're offline. ", '')}</p>
      <p className="mt-4">
        <Link href="/menu" className="btn btn-primary">
          View the menu
        </Link>
      </p>
    </div>
  )
}
