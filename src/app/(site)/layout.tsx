import type { Metadata, Viewport } from 'next'
import { Inter, Oswald } from 'next/font/google'
import './globals.css'
import { Announcement } from '@/components/site/Announcement'
import { CartProvider } from '@/components/site/CartProvider'
import { Footer } from '@/components/site/Footer'
import { Header } from '@/components/site/Header'
import { MobileActionBar } from '@/components/site/MobileActionBar'
import { OfflineBanner, ServiceWorker } from '@/components/site/OfflineBanner'
import { now } from '@/lib/clock'
import { loadHours, loadSettings } from '@/lib/data'
import { getOpenStatus, getOrderingStatus, openStatusText } from '@/lib/hours'
import { zoned } from '@/lib/time'
import { siteUrl } from '@/lib/seo'

const oswald = Oswald({ subsets: ['latin'], variable: '--font-oswald', display: 'swap', weight: ['500', '700'] })
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "Jeff's Taproom & Grill | Bridgeville, DE", template: "%s | Jeff's Taproom & Grill" },
  applicationName: "Jeff's Taproom & Grill",
  appleWebApp: { capable: true, title: "Jeff's", statusBarStyle: 'black-translucent' },
  icons: { icon: '/icons/icon-192.png', apple: '/icons/icon-192.png' },
}

export const viewport: Viewport = { themeColor: '#b3201f', width: 'device-width', initialScale: 1 }

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [hours, settings] = await Promise.all([loadHours(), loadSettings()])
  const t = now()
  const status = getOrderingStatus(hours, settings, t)
  const openText = openStatusText(getOpenStatus(hours, t), t)
  const today = zoned(t)
  return (
    <html lang="en" className={`${oswald.variable} ${inter.variable}`}>
      <body className="has-action-bar">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        {settings.announcement.enabled && settings.announcement.text && <Announcement text={settings.announcement.text} link={settings.announcement.link} />}
        <CartProvider
          initialStatus={status}
          settings={{
            cashDiscountPercent: settings.cashDiscountPercent,
            taxRatePercent: settings.taxRatePercent,
            tipPresetsPercent: settings.tipPresetsPercent,
            maxOnlineSubtotalCents: settings.maxOnlineSubtotalCents,
            phone: settings.phone,
          }}
        >
          <Header openStatus={openText} />
          <main id="main" tabIndex={-1} className="mx-auto max-w-6xl px-4 pt-6 outline-none">
            {children}
          </main>
          <Footer hours={hours} settings={settings} today={today} year={today.y} />
          <MobileActionBar />
        </CartProvider>
        <OfflineBanner />
        <ServiceWorker />
      </body>
    </html>
  )
}
