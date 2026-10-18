import config from '@payload-config'
import { REST_DELETE, REST_GET, REST_PATCH, REST_PUT } from '@payloadcms/next/routes'

// Some collections have a custom POST at the collection root (e.g. /api/orders). Next.js prefers the
// static route over Payload's catch-all, so the other methods are delegated back to Payload here.
const wrap =
  (factory: typeof REST_GET) =>
  (slug: string) => {
    const handler = factory(config)
    return (req: Request) => handler(req, { params: Promise.resolve({ slug: [slug] }) })
  }

export const payloadGET = wrap(REST_GET)
export const payloadPATCH = wrap(REST_PATCH as typeof REST_GET)
export const payloadPUT = wrap(REST_PUT as typeof REST_GET)
export const payloadDELETE = wrap(REST_DELETE as typeof REST_GET)
