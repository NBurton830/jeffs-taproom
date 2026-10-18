'use client'

import 'leaflet/dist/leaflet.css'
import { useEffect, useRef } from 'react'

// VIS-004: OpenStreetMap via Leaflet. No scroll-zoom trap; the address next to it is the text alternative.
export function VenueMap({ lat, lng, label }: { lat: number; lng: number; label: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let map: import('leaflet').Map | undefined
    let cancelled = false
    void import('leaflet').then((L) => {
      if (cancelled || !ref.current) return
      map = L.map(ref.current, { scrollWheelZoom: false, keyboard: false, attributionControl: true }).setView([lat, lng], 16)
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map)
      L.marker([lat, lng], {
        icon: L.divIcon({ className: 'venue-marker', iconSize: [22, 22] }),
        keyboard: false,
        title: label,
        alt: label,
      }).addTo(map)
    })
    return () => {
      cancelled = true
      map?.remove()
    }
  }, [lat, lng, label])
  return <div ref={ref} data-testid="map" className="h-72 w-full overflow-hidden rounded-lg border border-cream-dark bg-cream-dark" />
}
