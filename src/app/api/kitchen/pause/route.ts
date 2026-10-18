import { publish } from '@/lib/bus'
import { now } from '@/lib/clock'
import { apiError, json, readJson } from '@/lib/http'
import { requireStaff } from '@/lib/kitchenApi'
import { getPayloadClient } from '@/lib/payload'

export const dynamic = 'force-dynamic'

// "Until I turn it back on"
const INDEFINITE = '2999-12-31T00:00:00.000Z'

async function setPause(until: string | null) {
  const payload = await getPayloadClient()
  await payload.updateGlobal({ slug: 'settings', overrideAccess: true, data: { orderingPausedUntil: until } })
  publish('settings.updated', { orderingPausedUntil: until })
  return json({ orderingPausedUntil: until })
}

// KDS-012
export async function POST(req: Request) {
  const user = await requireStaff(req)
  if (user instanceof Response) return user
  const body = await readJson(req)
  const minutes = body?.minutes
  if (minutes === null) return setPause(INDEFINITE)
  if (typeof minutes !== 'number' || minutes <= 0 || minutes > 24 * 60) return apiError(422, 'VALIDATION', 'minutes must be a positive number or null')
  return setPause(new Date(now().getTime() + minutes * 60000).toISOString())
}

export async function DELETE(req: Request) {
  const user = await requireStaff(req)
  if (user instanceof Response) return user
  return setPause(null)
}
