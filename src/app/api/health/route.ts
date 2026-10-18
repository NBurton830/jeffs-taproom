import { getPayloadClient } from '@/lib/payload'

export const dynamic = 'force-dynamic'

// TEST-003: always available; also warms Payload so the first test doesn't pay for it.
export async function GET() {
  await getPayloadClient()
  return Response.json({ ok: true })
}
