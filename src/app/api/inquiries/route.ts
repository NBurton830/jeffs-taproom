import { INQUIRY_TYPES } from '@/collections/Inquiries'
import { now } from '@/lib/clock'
import { loadSettings } from '@/lib/data'
import { apiError, json, readJson } from '@/lib/http'
import { sendMail } from '@/lib/mail'
import { normalizePhone } from '@/lib/money'
import { getPayloadClient } from '@/lib/payload'
import { payloadDELETE, payloadGET, payloadPATCH } from '@/lib/payloadRest'
import { clientIp, rateLimit } from '@/lib/ratelimit'
import { ymdKey, zoned } from '@/lib/time'
import { validateInquiry } from '@/lib/inquiries'

export const dynamic = 'force-dynamic'

// VIS-021/022
export async function POST(req: Request) {
  const rl = await rateLimit(`inquiries:${clientIp(req)}`, 3, 10 * 60_000)
  if (!rl.ok) return json({ error: { code: 'RATE_LIMITED', message: 'Too many requests — please call us.' } }, 429, { 'Retry-After': String(rl.retryAfterSeconds) })
  const b = await readJson(req)
  if (!b) return apiError(422, 'VALIDATION', 'Invalid JSON body')
  if (typeof b.website === 'string' && b.website.trim() !== '') return json({ ok: true }, 201) // SEC-004
  const today = ymdKey(zoned(now()))
  const errors = validateInquiry(b, today)
  if (Object.keys(errors).length) return apiError(422, 'VALIDATION', 'Please fix the highlighted fields', { fields: errors })

  const payload = await getPayloadClient()
  const data = {
    name: String(b.name).trim(),
    email: String(b.email).trim(),
    phone: normalizePhone(String(b.phone))!,
    date: String(b.date),
    guests: Number(b.guests),
    type: b.type as (typeof INQUIRY_TYPES)[number],
    message: String(b.message ?? '').trim(),
    status: 'new' as const,
  }
  await payload.create({ collection: 'inquiries', overrideAccess: true, data })
  const settings = await loadSettings()
  if (settings.orderNotificationEmail) {
    await sendMail({
      to: settings.orderNotificationEmail,
      subject: `Private event inquiry: ${data.type} on ${data.date}`,
      text: `${data.name}\n${data.email}\n${data.phone}\n\n${data.type} · ${data.date} · ${data.guests} guests\n\n${data.message}`,
    })
  }
  return json({ ok: true }, 201)
}

export const GET = payloadGET('inquiries')
export const PATCH = payloadPATCH('inquiries')
export const DELETE = payloadDELETE('inquiries')
