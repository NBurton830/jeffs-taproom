import { CartPanel } from '@/components/site/CartDrawer'
import { MenuView } from '@/components/site/MenuView'
import { loadMenu, loadOrderingStatus } from '@/lib/data'
import { pageMeta } from '@/lib/seo'

export const metadata = pageMeta(
  '/order',
  'Order Pickup',
  'Order wings, burgers and seafood online for pickup at Jeff’s Taproom & Grill in Bridgeville. Pay at pickup — save 3% with cash.',
)

export default async function OrderPage() {
  const [menu, status] = await Promise.all([loadMenu(), loadOrderingStatus()])
  const tone = status.state === 'open' ? 'bg-green text-white' : status.state === 'before_open' ? 'bg-gold text-charcoal' : 'bg-red text-white'
  return (
    <>
      <h1 className="mb-3 text-4xl font-bold uppercase">Order Pickup</h1>
      <p data-testid="ordering-status" role="status" className={`mb-4 rounded-lg px-4 py-3 font-semibold ${tone}`}>
        {status.message}
      </p>
      <div className="lg:grid lg:grid-cols-[1fr_22rem] lg:gap-8">
        <MenuView menu={menu} />
        <div>
          <CartPanel />
        </div>
      </div>
    </>
  )
}
