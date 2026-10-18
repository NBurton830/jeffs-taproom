import type { GlobalConfig } from 'payload'
import { anyone, managers } from '../access'

// CMS-022
export const Home: GlobalConfig = {
  slug: 'home',
  admin: { group: 'Site' },
  access: { read: anyone, update: managers },
  fields: [
    { name: 'heroHeadline', type: 'text', defaultValue: "Beer. Wings. Bridgeville's Taproom." },
    {
      name: 'heroSubhead',
      type: 'text',
      defaultValue: 'Famous wings, fresh-ground burgers and cold drafts on Market Street. Order ahead for pickup.',
    },
    { name: 'heroImage', type: 'upload', relationTo: 'media' },
    { name: 'featuredItemSlugs', type: 'text', hasMany: true, admin: { description: 'Menu item slugs for "Fan favourites" (3–6)' } },
  ],
}
