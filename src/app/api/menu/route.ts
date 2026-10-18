import { loadMenu } from '@/lib/data'
import { json } from '@/lib/http'

export const dynamic = 'force-dynamic'

export async function GET() {
  return json(await loadMenu())
}
