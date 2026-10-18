import { postgresAdapter } from '@payloadcms/db-postgres'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { ChallengeEntries } from './collections/ChallengeEntries'
import { Events } from './collections/Events'
import { Inquiries } from './collections/Inquiries'
import { Media } from './collections/Media'
import { MenuCategories } from './collections/MenuCategories'
import { MenuItems } from './collections/MenuItems'
import { ModifierGroups } from './collections/ModifierGroups'
import { Orders } from './collections/Orders'
import { RateLimitHits } from './collections/RateLimitHits'
import { Specials } from './collections/Specials'
import { Taps } from './collections/Taps'
import { Users } from './collections/Users'
import { Challenge } from './globals/Challenge'
import { Home } from './globals/Home'
import { Hours } from './globals/Hours'
import { Settings } from './globals/Settings'
import { seedMenu, seedSite, seedStaffFromEnv } from './seed'
import { seedSamples } from './seed/samples'
import { migrations } from './migrations'
import { siteUrl } from './lib/seo'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const databaseUri = process.env.DATABASE_URI || 'file:./data/dev.db'
const isE2E = process.env.E2E === '1'

// ARCH-001: SQLite for dev/test, PostgreSQL in production.
const db = databaseUri.startsWith('postgres')
  ? postgresAdapter({
      pool: { connectionString: databaseUri },
      migrationDir: path.resolve(dirname, 'migrations'),
      // Applied on start-up in production (Vercel has no separate release step)
      prodMigrations: migrations,
    })
  : sqliteAdapter({ client: { url: databaseUri }, migrationDir: path.resolve(dirname, 'migrations-sqlite') })

export default buildConfig({
  serverURL: siteUrl(),
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    meta: { titleSuffix: " | Jeff's Taproom Admin", robots: 'noindex, nofollow' },
  },
  collections: [MenuCategories, MenuItems, ModifierGroups, Orders, Events, Specials, Taps, ChallengeEntries, Inquiries, Media, Users, RateLimitHits],
  globals: [Settings, Hours, Home, Challenge],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  db,
  sharp,
  // Uploads go to Vercel Blob when a token is configured (Vercel's filesystem is not persistent)
  plugins: process.env.BLOB_READ_WRITE_TOKEN ? [vercelBlobStorage({ collections: { media: true }, token: process.env.BLOB_READ_WRITE_TOKEN })] : [],
  telemetry: false,
  onInit: async (payload) => {
    if (isE2E) {
      // `next start` runs in production mode, where Payload skips the dev schema push.
      // The e2e database is created fresh for every run (scripts/start-e2e.mjs).
      const { pushDevSchema } = await import('@payloadcms/drizzle')
      await pushDevSchema(payload.db as never)
      return // TEST-003: /api/test/reset seeds everything
    }
    await seedStaffFromEnv(payload)
    const { totalDocs } = await payload.count({ collection: 'menu-items', overrideAccess: true })
    if (totalDocs === 0) {
      await seedMenu(payload)
      await seedSite(payload)
    }
    if (process.env.SEED_DEMO === '1') await seedSamples(payload)
  },
})
