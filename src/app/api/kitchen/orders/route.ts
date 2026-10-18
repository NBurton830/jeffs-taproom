import { now } from '@/lib/clock'
import { json } from '@/lib/http'
import { requireStaff } from '@/lib/kitchenApi'
import { loadSettings } from '@/lib/data'
import { listCompletedToday, listKitchenOrders } from '@/lib/orders'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const user = await requireStaff(req)
  if (user instanceof Response) return user
  const url = new URL(req.url)
  const statuses = (url.searchParams.get('status') || 'new,accepted,ready').split(',').filter(Boolean)
  const [orders, completed, settings] = await Promise.all([
    listKitchenOrders(statuses),
    url.searchParams.get('completed') ? listCompletedToday() : null,
    loadSettings(),
  ])
  const t = now()
  const paused = !!settings.orderingPausedUntil && new Date(settings.orderingPausedUntil) > t
  return json({ now: t.toISOString(), orders, paused, ...(completed ? { completed } : {}) })
}
