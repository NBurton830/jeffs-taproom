import { publish } from '@/lib/bus'
import { apiError, json, readJson } from '@/lib/http'
import { requireStaff } from '@/lib/kitchenApi'
import { getPayloadClient } from '@/lib/payload'

export const dynamic = 'force-dynamic'

// KDS-014
export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const user = await requireStaff(req)
  if (user instanceof Response) return user
  const body = await readJson(req)
  if (typeof body?.available !== 'boolean') return apiError(422, 'VALIDATION', 'available must be a boolean')
  const { slug } = await params
  const payload = await getPayloadClient()
  const res = await payload.update({ collection: 'menu-items', where: { slug: { equals: slug } }, overrideAccess: true, data: { available: body.available } })
  if (!res.docs.length) return apiError(404, 'NOT_FOUND', `Unknown item ${slug}`)
  publish('settings.updated', { item: slug, available: body.available })
  return json({ slug, available: body.available })
}
