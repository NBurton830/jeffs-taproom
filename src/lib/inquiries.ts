import { INQUIRY_TYPES } from '../collections/Inquiries'
import { normalizePhone } from './money'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type InquiryErrors = Partial<Record<'name' | 'email' | 'phone' | 'date' | 'guests' | 'type' | 'message', string>>

export function validateInquiry(b: Record<string, unknown>, today: string): InquiryErrors {
  const e: InquiryErrors = {}
  const name = String(b.name ?? '').trim()
  if (name.length < 2 || name.length > 60) e.name = 'Enter your name (2–60 characters)'
  if (!EMAIL.test(String(b.email ?? '').trim())) e.email = 'Enter a valid email address'
  if (!normalizePhone(String(b.phone ?? ''))) e.phone = 'Enter a 10-digit US phone number'
  const date = String(b.date ?? '')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) e.date = 'Choose an event date'
  else if (date <= today) e.date = 'Choose a date from tomorrow onwards'
  const guests = Number(b.guests)
  if (!Number.isInteger(guests) || guests < 1 || guests > 200) e.guests = 'Guests must be between 1 and 200'
  if (!INQUIRY_TYPES.includes(b.type as (typeof INQUIRY_TYPES)[number])) e.type = 'Choose an event type'
  if (String(b.message ?? '').length > 2000) e.message = 'Message must be at most 2000 characters'
  return e
}

