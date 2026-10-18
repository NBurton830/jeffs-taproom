import type { GlobalConfig } from 'payload'
import { anyone, managers } from '../access'

// BBC-003: rules are CMS-editable
export const Challenge: GlobalConfig = {
  slug: 'challenge',
  label: 'Challenge Page',
  admin: { group: 'Burger Challenge' },
  access: { read: anyone, update: managers },
  fields: [
    {
      name: 'rules',
      type: 'array',
      fields: [{ name: 'text', type: 'text', required: true }],
    },
  ],
}
