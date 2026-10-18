'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { DIRECTIONS_APPLE, DIRECTIONS_GOOGLE } from '@/lib/money'

// VIS-003: Google Maps works everywhere; Apple devices get Apple Maps after hydration.
export function DirectionsLink({ children, className, newTab = true }: { children: ReactNode; className?: string; newTab?: boolean }) {
  const [href, setHref] = useState(DIRECTIONS_GOOGLE)
  useEffect(() => {
    if (/iPhone|iPad|iPod|Macintosh|Mac OS X/.test(navigator.userAgent)) setHref(DIRECTIONS_APPLE)
  }, [])
  return (
    <a href={href} className={className} {...(newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
      {children}
    </a>
  )
}
