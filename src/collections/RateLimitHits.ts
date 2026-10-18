import type { CollectionConfig } from 'payload'
import { nobody } from '../access'

// SEC-003: stored in the database so limits hold across serverless instances (Vercel).
export const RateLimitHits: CollectionConfig = {
  slug: 'rate-limit-hits',
  admin: { hidden: true },
  access: { read: nobody, create: nobody, update: nobody, delete: nobody },
  fields: [
    { name: 'key', type: 'text', required: true, index: true },
    { name: 'at', type: 'date', required: true, index: true },
  ],
}
