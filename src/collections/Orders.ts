import type { CollectionConfig } from 'payload'
import { admins, nobody, staff } from '../access'

// CMS-004. Created only by POST /api/orders (server-side pricing, CHK-050).
export const Orders: CollectionConfig = {
  slug: 'orders',
  admin: {
    group: 'Orders',
    useAsTitle: 'numberLabel',
    defaultColumns: ['number', 'status', 'customerDisplay', 'pickupDisplay', 'totalCents', 'paymentMethod', 'createdAt'],
    listSearchableFields: ['customerDisplay', 'numberLabel'],
  },
  defaultSort: '-number',
  access: { read: staff, create: nobody, update: staff, delete: admins },
  fields: [
    { name: 'number', type: 'number', required: true, unique: true, index: true },
    { name: 'numberLabel', type: 'text', admin: { hidden: true } },
    { name: 'publicId', type: 'text', required: true, unique: true, index: true, admin: { readOnly: true } },
    // CHK-053: a retry with the same key returns the original order
    { name: 'idempotencyKey', type: 'text', unique: true, index: true, admin: { hidden: true } },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'new',
      index: true,
      options: ['new', 'accepted', 'ready', 'completed', 'cancelled'].map((v) => ({ label: v[0].toUpperCase() + v.slice(1), value: v })),
    },
    { name: 'customerDisplay', type: 'text', label: 'Customer', admin: { readOnly: true } },
    { name: 'pickupDisplay', type: 'text', label: 'Pickup', admin: { readOnly: true } },
    {
      name: 'lines',
      type: 'array',
      admin: { readOnly: true },
      fields: [
        { name: 'itemSlug', type: 'text' },
        { name: 'itemName', type: 'text' },
        { name: 'variantLabel', type: 'text' },
        { name: 'unitPriceCents', type: 'number' },
        { name: 'quantity', type: 'number' },
        {
          name: 'modifiers',
          type: 'array',
          fields: [
            { name: 'group', type: 'text' },
            { name: 'label', type: 'text' },
            { name: 'priceDeltaCents', type: 'number' },
          ],
        },
        { name: 'notes', type: 'text' },
        { name: 'lineTotalCents', type: 'number' },
      ],
    },
    {
      name: 'customer',
      type: 'group',
      fields: [
        { name: 'name', type: 'text' },
        { name: 'phone', type: 'text' },
        { name: 'email', type: 'text' },
      ],
    },
    {
      name: 'pickup',
      type: 'group',
      fields: [
        { name: 'mode', type: 'select', options: ['asap', 'scheduled'] },
        { name: 'requestedAt', type: 'date', admin: { date: { pickerAppearance: 'dayAndTime' } } },
        { name: 'promisedAt', type: 'date', index: true, admin: { date: { pickerAppearance: 'dayAndTime' } } },
      ],
    },
    {
      name: 'paymentMethod',
      type: 'select',
      label: 'Payment',
      options: [
        { label: 'Cash', value: 'cash' },
        { label: 'Card at pickup', value: 'card_at_pickup' },
        { label: 'Online card', value: 'online_card' },
      ],
    },
    { name: 'paymentStatus', type: 'select', defaultValue: 'unpaid', options: ['unpaid', 'paid'] },
    { name: 'subtotalCents', type: 'number' },
    { name: 'cashDiscountCents', type: 'number' },
    { name: 'taxCents', type: 'number' },
    { name: 'tipCents', type: 'number' },
    { name: 'totalCents', type: 'number', label: 'Total (cents)' },
    { name: 'orderNotes', type: 'textarea' },
    { name: 'cancelReason', type: 'text' },
    { name: 'placedAt', type: 'date', index: true, admin: { date: { pickerAppearance: 'dayAndTime' } } },
    { name: 'statusChangedAt', type: 'date' },
    { name: 'piiRedacted', type: 'checkbox', defaultValue: false, admin: { readOnly: true } },
    {
      name: 'statusHistory',
      type: 'array',
      admin: { readOnly: true },
      fields: [
        { name: 'status', type: 'text' },
        { name: 'at', type: 'date' },
        { name: 'byUser', type: 'relationship', relationTo: 'users' },
      ],
    },
  ],
}
