import type { CollectionConfig } from 'payload'
import { anyone, managers } from '../access'

export const ModifierGroups: CollectionConfig = {
  slug: 'modifier-groups',
  labels: { singular: 'Modifier Group', plural: 'Modifier Groups' },
  admin: { group: 'Menu', useAsTitle: 'adminName', defaultColumns: ['adminName', 'key', 'minSelect', 'maxSelect'] },
  access: { read: anyone, create: managers, update: managers, delete: managers },
  fields: [
    { name: 'key', type: 'text', required: true, unique: true, index: true, admin: { description: 'Stable id used by the order API. Do not change.' } },
    { name: 'name', type: 'text', required: true, admin: { description: 'Shown to customers, e.g. "Sauce"' } },
    { name: 'adminName', type: 'text', required: true },
    { name: 'minSelect', type: 'number', required: true, defaultValue: 0, min: 0 },
    { name: 'maxSelect', type: 'number', required: true, defaultValue: 1, min: 1 },
    { name: 'maxSelectByVariant', type: 'json', admin: { description: 'Optional, e.g. {"16 wings": 2}' } },
    {
      name: 'options',
      type: 'array',
      required: true,
      minRows: 1,
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'priceDeltaCents', type: 'number', required: true, defaultValue: 0, admin: { description: 'In cents, e.g. 350 = $3.50' } },
        { name: 'default', type: 'checkbox', defaultValue: false },
      ],
    },
  ],
}
