import type { CollectionConfig } from 'payload'
import { anyone, managers } from '../access'

export const EVENT_CATEGORIES = { trivia: 'Trivia', music: 'Live Music', sports: 'Sports', party: 'Party', other: 'Other' } as const

export const Events: CollectionConfig = {
  slug: 'events',
  admin: { group: "What's On", useAsTitle: 'title', defaultColumns: ['title', 'startsAt', 'category'] },
  defaultSort: 'startsAt',
  access: { read: anyone, create: managers, update: managers, delete: managers },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'startsAt', type: 'date', required: true, index: true, admin: { date: { pickerAppearance: 'dayAndTime' } } },
    { name: 'endsAt', type: 'date', admin: { date: { pickerAppearance: 'dayAndTime' } } },
    { name: 'description', type: 'textarea' },
    { name: 'image', type: 'upload', relationTo: 'media' },
    {
      name: 'category',
      type: 'select',
      required: true,
      defaultValue: 'other',
      options: Object.entries(EVENT_CATEGORIES).map(([value, label]) => ({ value, label })),
    },
    { name: 'featured', type: 'checkbox', defaultValue: false },
  ],
}
