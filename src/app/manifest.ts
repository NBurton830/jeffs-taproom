import type { MetadataRoute } from 'next'

// SHELL-010
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Jeff's Taproom & Grill",
    short_name: "Jeff's",
    description: 'Menu, pickup ordering, specials and events at Jeff’s Taproom & Grill in Bridgeville, DE.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#fbf6ec',
    theme_color: '#b3201f',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
