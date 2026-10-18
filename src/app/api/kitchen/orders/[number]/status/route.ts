import { apiError, json, readJson } from '@/lib/http'
import { requireStaff } from '@/lib/kitchenApi'
import { changeStatus } from '@/lib/orders'

export const dynamic = 'force-dynamic'

export async function POST(req: Request, { params }: { params: Promise<{ number: string }> }) {
  const user = await requireStaff(req)
  if (user instanceof Response) return user
  const body = await readJson(req)
  const status = body?.status
  if (typeof status !== 'string') return apiError(422, 'VALIDATION', 'status is required')
  const reason = typeof body?.cancelReason === 'string' && body.cancelReason ? body.cancelReason : undefined
  const r = await changeStatus(Number((await params).number), status, user.id, reason)
  if (!r.ok) return apiError(r.error.status, r.error.code, r.error.message)
  return json(r.value)
}
