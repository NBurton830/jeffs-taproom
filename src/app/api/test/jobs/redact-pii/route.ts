import { json, notFound, testApiEnabled } from '@/lib/http'
import { redactOldPii } from '@/lib/orders'

export const dynamic = 'force-dynamic'

export async function POST() {
  if (!testApiEnabled()) return notFound()
  return json({ redacted: await redactOldPii() })
}
