'use client'

import { useEffect, useState } from 'react'

const KEY = 'jt-announcement-dismissed'

// SHELL-008: dismissal is remembered for the session
export function Announcement({ text, link }: { text: string; link?: string | null }) {
  const [hidden, setHidden] = useState(false)
  useEffect(() => {
    try {
      if (sessionStorage.getItem(KEY) === text) setHidden(true)
    } catch {}
  }, [text])
  if (hidden) return null
  return (
    <div data-testid="announcement" className="on-dark flex items-center justify-center gap-3 bg-red px-4 py-2 text-center text-white">
      <p>{link ? <a href={link} className="underline">{text}</a> : text}</p>
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        onClick={() => {
          try {
            sessionStorage.setItem(KEY, text)
          } catch {}
          setHidden(true)
        }}
      >
        <span aria-hidden="true">✕</span>
        <span className="sr-only">Dismiss announcement</span>
      </button>
    </div>
  )
}
