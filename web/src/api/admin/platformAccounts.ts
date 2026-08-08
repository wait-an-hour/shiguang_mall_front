import type { Id, PageView } from '@/types/common'
import type { AccountStatus, PlatformAccount } from '@/types/admin'
import request from '@/utils/request'
import type { PlatformUserQuery, PlatformUserView, PlatformUserDetailView } from './rbac'

export type { PlatformUserQuery }

export function listAccounts(query: PlatformUserQuery) {
  return request.get<PageView<PlatformUserView>>('/platform/rbac/users', { params: query }) as unknown as Promise<PageView<PlatformUserView>>
}

export const listPlatformAccounts = listAccounts

export function getAccount(userId: Id) {
  return request.get<PlatformUserDetailView>(`/platform/rbac/users/${userId}`) as unknown as Promise<PlatformUserDetailView>
}

export function saveAccount(record: PlatformAccount) {
  if (record.id) {
    return request.put(`/platform/rbac/users/${record.id}`, {
      username: record.username,
      nickname: record.displayName,
      phone: record.phone,
      roleCode: record.role,
      permissions: record.permissions
    })
  }

  return request.post('/platform/rbac/users', {
    username: record.username,
    nickname: record.displayName,
    phone: record.phone,
    roleCode: record.role,
    permissions: record.permissions
  })
}

export function setAccountStatus(id: Id, status: AccountStatus) {
  return request.post(`/platform/rbac/users/${id}/status`, { targetStatus: status, reason: '管理端操作' })
}

export function resetAccountPassword() {
  return request.post('/platform/rbac/users/reset-password', {})
}
