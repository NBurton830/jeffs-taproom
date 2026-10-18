import { json, apiError } from '@/lib/http'
import { findOrderByPublicId } from '@/lib/orders'

export const dynamic = 'force-dynamic'

// TRK-007 / SEC-006: public projection only — never PII.
export async function GET(_req: Request, { params }: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await params
  const order = /^[A-Za-z0-9_-]{21}$/.test(publicId) ? await findOrderByPublicId(publicId) : null
  if (!order) return apiError(404, 'NOT_FOUND', "We couldn't find that order.")
  const body: Record<string, unknown> = {
    number: order.number,
    status: order.status,
    promisedAt: order.pickup.promisedAt,
    updatedAt: order.statusChangedAt,
  }
  if (order.status === 'cancelled' && order.cancelReason) body.cancelReason = order.cancelReason
  return json(body)
}
