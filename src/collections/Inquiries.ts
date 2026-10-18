import type { CollectionConfig } from 'payload'
import { managers, nobody } from '../access'

export const INQUIRY_TYPES = ['Birthday', 'Team party', 'Watch party', 'Catering', 'Other'] as const

// Created only through POST /api/inquiries (rate limited, honeypot — SEC-003/004)
export const Inquiries: CollectionConfig = {
  slug: 'inquiries',
  admin: { group: 'Inquiries', useAsTitle: 'name', defaultColumns: ['name', 'date', 'guests', 'type', 'status', 'createdAt'] },
  access: { read: managers, create: nobody, update: managers, delete: managers },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'email', type: 'email', required: true },
    { name: 'phone', type: 'text', required: true },
    { name: 'date', type: 'text', required: true },
    { name: 'guests', type: 'number', required: true },
    { name: 'type', type: 'select', required: true, options: INQUIRY_TYPES.map((t) => ({ label: t, value: t })) },
    { name: 'message', type: 'textarea' },
    { name: 'status', type: 'select', defaultValue: 'new', options: ['new', 'contacted', 'closed'] },
  ],
}
