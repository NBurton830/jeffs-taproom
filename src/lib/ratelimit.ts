import 'server-only'
import { now } from './clock'
import { getPayloadClient } from './payload'

/** SEC-003: sliding window per key, stored in the database so it holds across server instances. */
export async function rateLimit(key: string, limit: number, windowMs: number): Promise<{ ok: true } | { ok: false; retryAfterSeconds: number }> {
  const payload = await getPayloadClient()
  const t = now().getTime()
  const since = new Date(t - windowMs).toISOString()
  const recent = await payload.find({
    collection: 'rate-limit-hits',
    overrideAccess: true,
    depth: 0,
    limit,
    sort: 'at',
    where: { and: [{ key: { equals: key } }, { at: { greater_than: since } }] },
  })
  if (recent.totalDocs >= limit) {
    const oldest = new Date(recent.docs[0].at as string).getTime()
    return { ok: false, retryAfterSeconds: Math.max(1, Math.ceil((oldest + windowMs - t) / 1000)) }
  }
  await payload.create({ collection: 'rate-limit-hits', overrideAccess: true, data: { key, at: new Date(t).toISOString() } })
  // Housekeeping: drop hits older than a day
  if (Math.random() < 0.05) {
    await payload.delete({ collection: 'rate-limit-hits', overrideAccess: true, where: { at: { less_than: new Date(t - 86_400_000).toISOString() } } })
  }
  return { ok: true }
}

export function clientIp(req: Request) {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() || req.headers.get('x-real-ip') || 'local'
}
