import { redirect } from 'next/navigation'
import { KitchenBoard } from '@/components/kds/KitchenBoard'
import { getStaff } from '@/lib/auth'
import { now } from '@/lib/clock'
import { loadMenu, loadSettings } from '@/lib/data'
import { listCompletedToday, listKitchenOrders } from '@/lib/orders'

export const metadata = { title: 'Kitchen' }

export default async function KitchenPage() {
  const user = await getStaff()
  if (!user) redirect('/kitchen/login')
  const [orders, completed, settings, menu] = await Promise.all([
    listKitchenOrders(['new', 'accepted', 'ready']),
    listCompletedToday(),
    loadSettings(),
    loadMenu(),
  ])
  const t = now()
  const paused = !!settings.orderingPausedUntil && new Date(settings.orderingPausedUntil) > t
  return (
    <KitchenBoard
      initial={{ now: t.toISOString(), orders, completed, paused }}
      items={menu.categories.flatMap((c) => c.items.map((i) => ({ slug: i.slug, name: i.name, available: i.available })))}
      userEmail={user.email}
    />
  )
}
