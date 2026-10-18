import 'server-only'
import { getStaff, type StaffUser } from './auth'
import { apiError } from './http'

/** KDS-002: 401 without a staff session. */
export async function requireStaff(req: Request): Promise<StaffUser | Response> {
  const user = await getStaff(req.headers)
  return user ?? apiError(401, 'UNAUTHORIZED', 'Staff sign-in required')
}
