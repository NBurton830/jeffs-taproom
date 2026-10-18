'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

// ADM-007: bulk reset at the start of the day
export function MarkAllAvailable() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  return (
    <div style={{ margin: '0 0 16px' }}>
      <button
        type="button"
        className="btn btn--style-secondary btn--size-medium"
        disabled={busy}
        onClick={async () => {
          setBusy(true)
          await fetch('/api/menu-items?where[available][equals]=false&limit=500', {
            method: 'PATCH',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ available: true }),
          })
          setBusy(false)
          router.refresh()
        }}
      >
        Mark all available
      </button>
    </div>
  )
}
