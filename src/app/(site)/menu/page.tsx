import { MenuView } from '@/components/site/MenuView'
import { loadMenu } from '@/lib/data'
import { jsonLdScript, pageMeta, siteUrl } from '@/lib/seo'

export const metadata = pageMeta(
  '/menu',
  'Menu',
  'The full Jeff’s Taproom menu: wings in 11 sauces, fresh-ground chuck burgers, seafood starters, sandwiches, soups and salads, with prices.',
)

export default async function MenuPage() {
  const menu = await loadMenu()
  // SEO-003
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Menu',
    name: "Jeff's Taproom & Grill Menu",
    url: `${siteUrl()}/menu`,
    hasMenuSection: menu.categories.map((c) => ({
      '@type': 'MenuSection',
      name: c.name,
      hasMenuItem: c.items.map((i) => {
        const priced = i.variants.filter((v) => v.priceCents !== null)
        return {
          '@type': 'MenuItem',
          name: i.name,
          ...(i.description ? { description: i.description } : {}),
          ...(priced.length
            ? {
                offers: priced.map((v) => ({
                  '@type': 'Offer',
                  ...(v.label ? { name: v.label } : {}),
                  price: (v.priceCents! / 100).toFixed(2),
                  priceCurrency: 'USD',
                })),
              }
            : {}),
        }
      }),
    })),
  }
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(jsonLd)} />
      <h1 className="mb-2 text-4xl font-bold uppercase">Menu</h1>
      <MenuView menu={menu} />
    </>
  )
}
