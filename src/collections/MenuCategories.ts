import type { CollectionConfig } from 'payload'
import { anyone, managers } from '../access'

export const MenuCategories: CollectionConfig = {
  slug: 'menu-categories',
  labels: { singular: 'Category', plural: 'Categories' },
  admin: { group: 'Menu', useAsTitle: 'name', defaultColumns: ['name', 'sortOrder'] },
  defaultSort: 'sortOrder',
  access: { read: anyone, create: managers, update: managers, delete: managers },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'note', type: 'text', admin: { description: 'Short note shown under the heading' } },
    { name: 'description', type: 'textarea' },
    { name: 'sortOrder', type: 'number', defaultValue: 0 },
  ],
}
