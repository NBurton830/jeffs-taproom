import type { CollectionConfig, Field } from 'payload'
import { anyone, managerField, managers, staff } from '../access'

// Kitchen staff may only flip `available` (ADM-001); every other field needs a manager.
const managerOnly = (fields: Field[]): Field[] =>
  fields.map((f) => ('name' in f && f.name !== 'available' ? ({ ...f, access: { ...(f as { access?: object }).access, update: managerField } } as Field) : f))

export const MenuItems: CollectionConfig = {
  slug: 'menu-items',
  labels: { singular: 'Menu Item', plural: 'Items' },
  admin: {
    group: 'Menu',
    useAsTitle: 'name',
    defaultColumns: ['name', 'category', 'available', 'onlineOrderable'],
    listSearchableFields: ['name', 'slug'],
    pagination: { defaultLimit: 100 },
    components: { beforeListTable: ['/components/admin/MarkAllAvailable#MarkAllAvailable'] },
  },
  defaultSort: 'sortOrder',
  access: { read: anyone, create: managers, update: staff, delete: managers },
  fields: managerOnly([
    { name: 'name', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'category', type: 'relationship', relationTo: 'menu-categories', required: true },
    { name: 'description', type: 'textarea' },
    { name: 'image', type: 'upload', relationTo: 'media' },
    {
      name: 'variants',
      type: 'array',
      required: true,
      minRows: 1,
      admin: { description: 'One row with an empty label for single-price items. Leave price empty for market price (MKT).' },
      fields: [
        { name: 'label', type: 'text' },
        { name: 'priceCents', type: 'number', admin: { description: 'In cents, e.g. 1295 = $12.95' } },
        { name: 'isMarketPrice', type: 'checkbox', defaultValue: false },
      ],
    },
    { name: 'modifierGroups', type: 'relationship', relationTo: 'modifier-groups', hasMany: true },
    {
      name: 'available',
      type: 'checkbox',
      defaultValue: true,
      label: 'Available today',
      admin: { description: 'Untick to "86" the item', components: { Cell: '/components/admin/AvailableCell#AvailableCell' } },
    },
    { name: 'onlineOrderable', type: 'checkbox', defaultValue: true },
    { name: 'orderingNote', type: 'text', admin: { description: 'Shown when not orderable online, e.g. "In-house only"' } },
    {
      name: 'tags',
      type: 'select',
      hasMany: true,
      options: [
        { label: 'Popular', value: 'popular' },
        { label: 'Spicy', value: 'spicy' },
        { label: 'Seafood', value: 'seafood' },
        { label: 'Vegetarian', value: 'vegetarian' },
        { label: 'New', value: 'new' },
      ],
    },
    { name: 'sortOrder', type: 'number', defaultValue: 0 },
  ]),
}
