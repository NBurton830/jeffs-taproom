import { json, notFound, testApiEnabled } from '@/lib/http'
import { store } from '@/lib/store'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!testApiEnabled()) return notFound()
  return json(store().outbox)
}
