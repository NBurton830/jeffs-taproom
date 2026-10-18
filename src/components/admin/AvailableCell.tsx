'use client'

import { useEffect, useState } from 'react'

// ADM-007: inline "86" switch in the menu-items list
export function AvailableCell({ cellData, rowData }: { cellData?: boolean; rowData?: { id: string | number; name?: string; available?: boolean } }) {
  const initial = cellData ?? rowData?.available ?? true
  const [on, setOn] = useState(initial)
  const [busy, setBusy] = useState(false)
  useEffect(() => setOn(initial), [initial])
  if (!rowData) return null
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={rowData.name ?? 'Available'}
      disabled={busy}
      onClick={async (e) => {
        e.preventDefault()
        e.stopPropagation()
        setBusy(true)
        const next = !on
        setOn(next)
        const res = await fetch(`/api/menu-items/${rowData.id}`, {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ available: next }),
        })
        if (!res.ok) setOn(!next)
        setBusy(false)
      }}
      style={{
        minWidth: 64,
        minHeight: 32,
        borderRadius: 999,
        border: '2px solid currentColor',
        background: on ? '#1d6b3a' : '#b3201f',
        color: '#fff',
        fontWeight: 700,
        cursor: 'pointer',
      }}
    >
      {on ? 'On' : "86'd"}
    </button>
  )
}
