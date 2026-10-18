import type { Metadata } from 'next'
import { Inter, Oswald } from 'next/font/google'
import '../(site)/globals.css'

const oswald = Oswald({ subsets: ['latin'], variable: '--font-oswald', display: 'swap', weight: ['500', '700'] })
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: { default: "Kitchen | Jeff's Taproom & Grill", template: "%s | Jeff's Taproom & Grill" },
  robots: { index: false, follow: false }, // SEO-006
}

export default function KdsLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${oswald.variable} ${inter.variable}`}>
      <body className="on-dark min-h-screen bg-[#141210] text-cream">{children}</body>
    </html>
  )
}
