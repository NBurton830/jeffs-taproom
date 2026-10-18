import Link from 'next/link'
import { PHONE_TEL } from '@/lib/money'
import { DirectionsLink } from './DirectionsLink'

// SHELL-006
export function MobileActionBar() {
  const cls = 'flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-sm font-bold no-underline'
  return (
    <nav aria-label="Quick actions" data-testid="mobile-action-bar" className="on-dark fixed inset-x-0 bottom-0 z-40 flex border-t border-white/20 bg-charcoal text-cream md:hidden">
      <a href={PHONE_TEL} className={cls}>
        Call
      </a>
      <DirectionsLink className={`${cls} border-x border-white/20`} newTab={false}>
        Directions
      </DirectionsLink>
      <Link href="/order" className={`${cls} bg-red text-white`}>
        Order
      </Link>
    </nav>
  )
}
