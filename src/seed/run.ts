// `pnpm seed:menu` — idempotent production seed (menu, hours, settings). No demo content.
import { getPayload } from 'payload'
import config from '@payload-config'
import { seedMenu, seedSite } from './index'

const payload = await getPayload({ config })
await seedMenu(payload)
const hours = await payload.findGlobal({ slug: 'hours' })
if (!hours.weekly?.length) await seedSite(payload)
payload.logger.info('Menu seed complete')
process.exit(0)
