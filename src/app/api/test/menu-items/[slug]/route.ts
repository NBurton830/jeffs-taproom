import { json, notFound, readJson, testApiEnabled } from '@/lib/http'
import { getPayloadClient } from '@/lib/payload'

export const dynamic = 'force-dynamic'

export async function PATCH(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  if (!testApiEnabled()) return notFound()
  const { slug } = await params
  const patch = (await readJson(req)) ?? {}
  const payload = await getPayloadClient()
  const res = await payload.update({ collection: 'menu-items', where: { slug: { equals: slug } }, overrideAccess: true, data: patch })
  if (!res.docs.length) return json({ error: `no item ${slug}` }, 404)
  return json(res.docs[0])
}
