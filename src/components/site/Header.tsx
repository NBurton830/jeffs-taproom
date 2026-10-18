'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { useCart } from './CartProvider'

export const NAV = [
  ['Menu', '/menu'],
  ['Order Pickup', '/order'],
  ['Specials', '/specials'],
  ['Events', '/events'],
  ['On Tap', '/on-tap'],
  ['Burger Challenge', '/burger-challenge'],
  ['Private Events', '/private-events'],
  ['Visit', '/visit'],
] as const

// SHELL-003..005, SHELL-009
export function Header({ openStatus }: { openStatus: string }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const cart = useCart()

  useEffect(() => setOpen(false), [pathname])
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        toggleRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const isCurrent = (href: string) => pathname === href || (href !== '/' && pathname.startsWith(`${href}/`) && href !== '/order')
  const statusTone = openStatus.startsWith('Open') ? 'bg-green' : openStatus.startsWith('Closing') ? 'bg-gold text-charcoal' : 'bg-red'

  return (
    <header className="on-dark sticky top-0 z-40 bg-charcoal text-cream shadow-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2">
        <Link href="/" className="mr-auto flex min-h-11 items-center gap-2 no-underline">
          <span aria-hidden="true" className="rounded bg-red px-2 py-1 font-display text-lg font-bold text-white">
            JEFF&apos;S
          </span>
          <span className="font-display text-lg leading-tight font-bold uppercase">
            Taproom <span className="hidden sm:inline">&amp; Grill</span>
            <span className="sr-only"> — Jeff&apos;s Taproom &amp; Grill home</span>
          </span>
        </Link>
        <span data-testid="open-status" className={`order-last w-full rounded-full px-3 py-1 text-center text-xs font-bold text-white sm:order-none sm:w-auto sm:text-sm ${statusTone}`}>
          {openStatus}
        </span>
        {cart.ready && cart.count > 0 && (
          <button
            type="button"
            data-testid="cart-button"
            aria-label={`Cart, ${cart.count} ${cart.count === 1 ? 'item' : 'items'}`}
            className="btn bg-red text-white"
            onClick={cart.openCart}
          >
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6h15l-1.5 9h-12z M6 6 5 3H2 M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm9 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
            </svg>
            <span data-testid="cart-count">{cart.count}</span>
          </button>
        )}
        <button
          ref={toggleRef}
          type="button"
          className="btn btn-ghost md:hidden"
          aria-expanded={open}
          aria-controls="primary-nav"
          onClick={() => setOpen((o) => !o)}
        >
          Menu
        </button>
      </div>
      <nav id="primary-nav" aria-label="Primary" className={`${open ? 'block' : 'hidden'} border-t border-white/10 md:block`}>
        <ul className="mx-auto flex max-w-6xl flex-col px-2 pb-2 md:flex-row md:flex-wrap md:pb-0">
          {NAV.map(([label, href]) => (
            <li key={href}>
              <Link
                href={href}
                aria-current={isCurrent(href) ? 'page' : undefined}
                className="block min-h-11 rounded px-3 py-2.5 font-semibold no-underline hover:bg-white/10 aria-[current=page]:text-gold aria-[current=page]:underline"
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}
