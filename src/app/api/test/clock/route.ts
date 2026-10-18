import { setClock, now } from '@/lib/clock'
import { json, notFound, readJson, testApiEnabled } from '@/lib/http'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  if (!testApiEnabled()) return notFound()
  const body = (await readJson(req)) ?? {}
  setClock(typeof body.now === 'string' ? body.now : null)
  return json({ now: now().toISOString() })
}
