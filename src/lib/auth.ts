import 'server-only'
import { headers as nextHeaders } from 'next/headers'
import { getPayloadClient } from './payload'

export type StaffUser = { id: string | number; email: string; role: 'admin' | 'manager' | 'kitchen' }

/** KDS-001/002: any staff role. */
export async function getStaff(headers?: Headers): Promise<StaffUser | null> {
  const payload = await getPayloadClient()
  const { user } = await payload.auth({ headers: headers ?? (await nextHeaders()) })
  const u = user as unknown as StaffUser | null
  return u && ['admin', 'manager', 'kitchen'].includes(u.role) ? u : null
}
