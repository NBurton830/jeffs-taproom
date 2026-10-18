'use client'

import { useEffect, useState } from 'react'
import { OFFLINE_TEXT } from '@/lib/offline'


// SHELL-012
export function OfflineBanner() {
  const [offline, setOffline] = useState(false)
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine)
    update()
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }, [])
  if (!offline) return null
  return (
    <div role="status" className="fixed inset-x-0 top-0 z-[70] bg-gold px-4 py-2 text-center font-semibold text-charcoal">
      {OFFLINE_TEXT}
    </div>
  )
}

export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {})
  }, [])
  return null
}
