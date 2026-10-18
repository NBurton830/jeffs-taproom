import type { GlobalConfig } from 'payload'
import { managers, staff } from '../access'

// CMS-020
export const Settings: GlobalConfig = {
  slug: 'settings',
  admin: { group: 'Site' },
  access: { read: staff, update: managers },
  fields: [
    {
      type: 'collapsible',
      label: 'Online ordering',
      fields: [
        { name: 'onlineOrderingEnabled', type: 'checkbox', defaultValue: true },
        { name: 'orderingPausedUntil', type: 'date', admin: { date: { pickerAppearance: 'dayAndTime' }, description: 'Set by the kitchen "Pause" switch' } },
        { name: 'pauseMessage', type: 'text', defaultValue: 'Online ordering is paused — please call (302) 337-8602.' },
        { name: 'prepLeadMinutes', type: 'number', defaultValue: 20, min: 0 },
        { name: 'slotIntervalMinutes', type: 'number', defaultValue: 15, min: 5 },
        { name: 'lastOrderMinutesBeforeClose', type: 'number', defaultValue: 30, min: 0 },
        { name: 'cashDiscountPercent', type: 'number', defaultValue: 3, min: 0 },
        { name: 'taxRatePercent', type: 'number', defaultValue: 0, min: 0, admin: { description: 'Delaware has no sales tax' } },
        { name: 'tipPresetsPercent', type: 'number', hasMany: true, defaultValue: [0, 10, 15, 20] },
        { name: 'maxOnlineSubtotalCents', type: 'number', defaultValue: 50000 },
        { name: 'orderNotificationEmail', type: 'email' },
      ],
    },
    {
      type: 'collapsible',
      label: 'Contact',
      fields: [
        { name: 'phone', type: 'text', defaultValue: '(302) 337-8602' },
        { name: 'address', type: 'text', defaultValue: '416 Market Street, Bridgeville, DE 19933' },
        {
          name: 'geo',
          type: 'group',
          fields: [
            { name: 'lat', type: 'number', defaultValue: 38.7426 },
            { name: 'lng', type: 'number', defaultValue: -75.6044 },
          ],
        },
        {
          name: 'socialLinks',
          type: 'array',
          fields: [
            { name: 'label', type: 'text', required: true },
            { name: 'url', type: 'text', required: true },
          ],
        },
      ],
    },
    {
      name: 'announcement',
      type: 'group',
      fields: [
        { name: 'enabled', type: 'checkbox', defaultValue: false },
        { name: 'text', type: 'text' },
        { name: 'link', type: 'text' },
      ],
    },
  ],
}
