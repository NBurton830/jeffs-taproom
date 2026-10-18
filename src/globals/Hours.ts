import type { GlobalConfig } from 'payload'
import { anyone, managers } from '../access'

const time = { type: 'text' as const, admin: { description: '24h, e.g. 11:00. A close at or before the open time means after midnight.' } }

// CMS-021
export const Hours: GlobalConfig = {
  slug: 'hours',
  admin: { group: 'Site' },
  access: { read: anyone, update: managers },
  fields: [
    {
      name: 'weekly',
      type: 'array',
      minRows: 7,
      maxRows: 7,
      fields: [
        {
          name: 'day',
          type: 'select',
          required: true,
          options: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((d) => ({ value: d, label: d[0].toUpperCase() + d.slice(1) })),
        },
        { name: 'open', ...time, required: true },
        { name: 'close', ...time, required: true },
        { name: 'closed', type: 'checkbox', defaultValue: false },
      ],
    },
    {
      name: 'exceptions',
      type: 'array',
      admin: { description: 'Holidays and special hours (override the weekly hours everywhere)' },
      fields: [
        {
          name: 'date',
          type: 'text',
          required: true,
          admin: { description: 'YYYY-MM-DD' },
          validate: (v: unknown) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) || 'Use YYYY-MM-DD',
        },
        { name: 'closed', type: 'checkbox', defaultValue: true },
        { name: 'open', ...time },
        { name: 'close', ...time },
        { name: 'note', type: 'text' },
      ],
    },
  ],
}
