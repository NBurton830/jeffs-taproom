import { publish } from '@/lib/bus'
import { json, notFound, readJson, testApiEnabled } from '@/lib/http'
import { getPayloadClient } from '@/lib/payload'

export const dynamic = 'force-dynamic'

export async function PATCH(req: Request) {
  if (!testApiEnabled()) return notFound()
  const patch = (await readJson(req)) ?? {}
  const payload = await getPayloadClient()
  const current = (await payload.findGlobal({ slug: 'settings', overrideAccess: true, depth: 0 })) as unknown as Record<string, unknown>
  const merged: Record<string, unknown> = { ...patch }
  for (const [k, v] of Object.entries(patch)) {
    const cur = current[k]
    if (v && typeof v === 'object' && !Array.isArray(v) && cur && typeof cur === 'object') merged[k] = { ...(cur as object), ...v }
  }
  const doc = await payload.updateGlobal({ slug: 'settings', overrideAccess: true, data: merged })
  publish('settings.updated', patch)
  return json(doc)
}
