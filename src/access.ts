import type { Access, FieldAccess, PayloadRequest } from 'payload'

// ADM-001 roles: kitchen < manager < admin
export type Role = 'admin' | 'manager' | 'kitchen'
type U = { role?: Role } | null | undefined

export const roleOf = (req: PayloadRequest) => (req.user as U)?.role
export const isStaffUser = (u: U) => !!u?.role
export const isManagerUser = (u: U) => u?.role === 'manager' || u?.role === 'admin'

export const anyone: Access = () => true
export const nobody: Access = () => false
export const staff: Access = ({ req }) => isStaffUser(req.user as U)
export const managers: Access = ({ req }) => isManagerUser(req.user as U)
export const admins: Access = ({ req }) => roleOf(req) === 'admin'
export const managerField: FieldAccess = ({ req }) => isManagerUser(req.user as U)
export const adminField: FieldAccess = ({ req }) => roleOf(req) === 'admin'
