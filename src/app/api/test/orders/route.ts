import { notFound, testApiEnabled } from '@/lib/http'
import { handleOrder } from '@/lib/orderRoute'

export const dynamic = 'force-dynamic'

// Same as POST /api/orders without the rate limit (TEST-003).
export async function POST(req: Request) {
  if (!testApiEnabled()) return notFound()
  return handleOrder(req)
}
