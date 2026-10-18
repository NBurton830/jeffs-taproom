import { json, notFound, readJson, testApiEnabled } from '@/lib/http'
import { resetForTests } from '@/lib/testing'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  if (!testApiEnabled()) return notFound()
  const body = (await readJson(req)) ?? {}
  await resetForTests(typeof body.now === 'string' ? body.now : null)
  return json({ ok: true })
}
