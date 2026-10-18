import { CheckoutForm } from '@/components/site/CheckoutForm'
import { loadOrderingStatus, loadSettings } from '@/lib/data'
import { pageMeta } from '@/lib/seo'

export const metadata = { ...pageMeta('/order/checkout', 'Checkout', 'Choose a pickup time, add your details and place your pickup order at Jeff’s Taproom & Grill.'), robots: { index: false } }

export default async function CheckoutPage() {
  const [status, settings] = await Promise.all([loadOrderingStatus(), loadSettings()])
  return (
    <>
      <h1 className="mb-2 text-4xl font-bold uppercase">Checkout</h1>
      <CheckoutForm
        status={status}
        settings={{
          cashDiscountPercent: settings.cashDiscountPercent,
          taxRatePercent: settings.taxRatePercent,
          tipPresetsPercent: settings.tipPresetsPercent,
          maxOnlineSubtotalCents: settings.maxOnlineSubtotalCents,
          phone: settings.phone,
        }}
      />
    </>
  )
}
