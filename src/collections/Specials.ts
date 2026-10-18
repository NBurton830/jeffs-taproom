import type { CollectionConfig } from 'payload'
import { anyone, managers } from '../access'

export const Specials: CollectionConfig = {
  slug: 'specials',
  admin: { group: "What's On", useAsTitle: 'title', defaultColumns: ['title', 'days', 'active'] },
  access: { read: anyone, create: managers, update: managers, delete: managers },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'description', type: 'textarea' },
    { name: 'priceText', type: 'text' },
    {
      name: 'days',
      type: 'select',
      hasMany: true,
      required: true,
      options: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((d) => ({ value: d, label: d[0].toUpperCase() + d.slice(1) })),
    },
    { name: 'startTime', type: 'text', admin: { description: '24h, e.g. 16:00' } },
    { name: 'endTime', type: 'text', admin: { description: '24h, e.g. 19:00' } },
    { name: 'active', type: 'checkbox', defaultValue: true },
  ],
}
