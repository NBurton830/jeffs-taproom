import { json } from '@/lib/http'
import { handleOrder } from '@/lib/orderRoute'
import { payloadDELETE, payloadGET, payloadPATCH } from '@/lib/payloadRest'
import { clientIp, rateLimit } from '@/lib/ratelimit'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const rl = await rateLimit(`orders:${clientIp(req)}`, 5, 10 * 60_000) // SEC-003
  if (!rl.ok) {
    return json({ error: { code: 'RATE_LIMITED', message: 'Too many orders — please wait a few minutes or call us.' } }, 429, {
      'Retry-After': String(rl.retryAfterSeconds),
    })
  }
  return handleOrder(req)
}

export const GET = payloadGET('orders')
export const PATCH = payloadPATCH('orders')
export const DELETE = payloadDELETE('orders')
