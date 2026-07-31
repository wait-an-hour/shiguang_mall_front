import { mockAdmin } from '@/mock/adminData'
import type { Id, ListQuery, PlatformAccount, RoleRecord } from '@/types/admin'

export function listRoles() { return mockAdmin.listRoles() }
export function saveRole(record: RoleRecord) { return mockAdmin.saveRole(record) }
export function deleteRole(id: Id) { return mockAdmin.deleteRole(id) }
export function listAccounts(query: ListQuery) { return mockAdmin.listAccounts(query) }
export function saveAccount(record: PlatformAccount) { return mockAdmin.saveAccount(record) }
export function setAccountStatus(id: Id, status: 'ACTIVE' | 'FROZEN') { return mockAdmin.setAccountStatus(id, status) }
export function resetAccountPassword() { return Promise.resolve(true) }
