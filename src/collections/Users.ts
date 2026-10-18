import type { CollectionConfig } from 'payload'
import { adminField, admins } from '../access'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    group: 'Staff',
    defaultColumns: ['email', 'role'],
    hidden: ({ user }) => (user as { role?: string } | null)?.role !== 'admin',
  },
  auth: {
    maxLoginAttempts: 5, // SEC-009
    lockTime: 10 * 60 * 1000,
    cookies: { sameSite: 'Lax', secure: process.env.NODE_ENV === 'production' && !process.env.E2E },
  },
  access: {
    // Staff can read themselves; only admins see everyone (SEC-002)
    read: ({ req }) => {
      const user = req.user as { id: string | number; role?: string } | null
      if (!user) return false
      return user.role === 'admin' ? true : { id: { equals: user.id } }
    },
    create: admins,
    update: ({ req }) => {
      const user = req.user as { id: string | number; role?: string } | null
      if (!user) return false
      return user.role === 'admin' ? true : { id: { equals: user.id } }
    },
    delete: admins,
  },
  fields: [
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'kitchen',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Manager', value: 'manager' },
        { label: 'Kitchen', value: 'kitchen' },
      ],
      access: { update: adminField },
      saveToJWT: true,
    },
  ],
}
