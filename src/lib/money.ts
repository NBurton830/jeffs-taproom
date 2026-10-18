export function formatCents(cents: number) {
  const sign = cents < 0 ? '−' : ''
  const abs = Math.abs(Math.round(cents))
  return `${sign}$${Math.floor(abs / 100).toLocaleString('en-US')}.${String(abs % 100).padStart(2, '0')}`
}

/** Round half up for non-negative amounts, tolerant of float noise. */
export function roundHalfUp(x: number) {
  return Math.floor(x + 0.5 + 1e-9)
}

export const PHONE_DISPLAY = '(302) 337-8602'
export const PHONE_TEL = 'tel:+13023378602'
export const ADDRESS_LINE1 = '416 Market Street'
export const ADDRESS_LINE2 = 'Bridgeville, DE 19933'
export const ADDRESS = `${ADDRESS_LINE1}, ${ADDRESS_LINE2}`
export const VENUE = "Jeff's Taproom & Grill"
export const DIRECTIONS_GOOGLE = 'https://www.google.com/maps/dir/?api=1&destination=416+Market+Street,+Bridgeville,+DE+19933'
export const DIRECTIONS_APPLE = 'https://maps.apple.com/?daddr=416+Market+Street,+Bridgeville,+DE+19933'

/** Normalise a US phone number to "(302) 555-0123", or null if invalid. */
export function normalizePhone(input: string): string | null {
  let digits = (input ?? '').replace(/\D/g, '')
  if (digits.length === 11 && digits.startsWith('1')) digits = digits.slice(1)
  if (digits.length !== 10 || /^[01]/.test(digits)) return null
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
}

export function telHref(phone: string) {
  const digits = phone.replace(/\D/g, '')
  return `tel:+1${digits.slice(-10)}`
}
