import type { CollectionConfig } from 'payload'
import { anyone, managers } from '../access'

export const Taps: CollectionConfig = {
  slug: 'taps',
  admin: { group: "What's On", useAsTitle: 'name', defaultColumns: ['name', 'brewery', 'status'] },
  defaultSort: 'sortOrder',
  access: { read: anyone, create: managers, update: managers, delete: managers },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'brewery', type: 'text' },
    { name: 'style', type: 'text' },
    { name: 'abv', type: 'number' },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'on',
      options: [
        { label: 'On tap', value: 'on' },
        { label: 'Coming soon', value: 'coming-soon' },
        { label: 'Kicked', value: 'kicked' },
      ],
    },
    { name: 'sortOrder', type: 'number', defaultValue: 0 },
  ],
}
