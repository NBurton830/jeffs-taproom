import type { CollectionConfig } from 'payload'
import { anyone, managers } from '../access'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: { group: 'Site' },
  access: { read: anyone, create: managers, update: managers, delete: managers },
  fields: [
    // A11Y-010: alt text is required. Use "" only for purely decorative images.
    { name: 'alt', type: 'text', required: true },
    { name: 'placeholder', type: 'checkbox', label: 'Placeholder image (replace with a real photo)' },
  ],
  upload: {
    staticDir: process.env.MEDIA_DIR || 'media',
    mimeTypes: ['image/*'],
    imageSizes: [
      { name: 'card', width: 640, height: 480 },
      { name: 'hero', width: 1600 },
    ],
  },
}
