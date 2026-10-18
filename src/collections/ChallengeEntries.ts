import type { CollectionConfig } from 'payload'
import { isStaffUser, managers } from '../access'

export const ChallengeEntries: CollectionConfig = {
  slug: 'challenge-entries',
  labels: { singular: 'Challenge Entry', plural: 'Hall of Fame' },
  admin: { group: 'Burger Challenge', useAsTitle: 'name', defaultColumns: ['name', 'date', 'result', 'timeSeconds', 'approved'] },
  access: {
    // CMS-008: only approved entries are public
    read: ({ req }) => (isStaffUser(req.user as { role?: 'admin' }) ? true : { approved: { equals: true } }),
    create: managers,
    update: managers,
    delete: managers,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'date', type: 'date', required: true },
    { name: 'timeSeconds', type: 'number', admin: { description: 'Finishing time in seconds (winners)' } },
    { name: 'result', type: 'select', required: true, options: ['won', 'attempted'] },
    { name: 'photo', type: 'upload', relationTo: 'media' },
    { name: 'approved', type: 'checkbox', defaultValue: false },
  ],
}
