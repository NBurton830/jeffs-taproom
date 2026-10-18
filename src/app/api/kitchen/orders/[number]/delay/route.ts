import { apiError, json, readJson } from '@/lib/http'
import { requireStaff } from '@/lib/kitchenApi'
import { delayOrder } from '@/lib/orders'

export const dynamic = 'force-dynamic'

export async function POST(req: Request, { params }: { params: Promise<{ number: string }> }) {
  const user = await requireStaff(req)
  if (user instanceof Response) return user
  const body = await readJson(req)
  const r = await delayOrder(Number((await params).number), Number(body?.minutes))
  if (!r.ok) return apiError(r.error.status, r.error.code, r.error.message)
  return json(r.value)
}
