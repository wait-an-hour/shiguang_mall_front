import request from '@/utils/request'
import type { Id, PageView } from '@/types/common'
import type { AccountStatus, PermissionCode, PlatformAccount, RoleRecord } from '@/types/admin'

export interface PlatformUserQuery {
  keyword?: string
  status?: AccountStatus | ''
  roleCode?: string
  scopeType?: 'PLATFORM' | 'SHOP' | ''
  page?: number
  pageSize?: number
}

export interface PlatformUserView {
  id: Id
  username: string
  nickname: string
  phoneMasked: string
  emailMasked: string
  avatarUrl: string | null
  status: AccountStatus
  platformRoles: Array<{
    id: Id
    roleCode: string
    roleName: string
    scopeType: 'PLATFORM' | 'SHOP'
    description: string
    status: 'ACTIVE' | 'DISABLED'
    createdAt: string
    updatedAt: string
  }>
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
}

export interface PlatformUserDetailView extends PlatformUserView {}

export interface ChangeUserStatusRequest {
  targetStatus: AccountStatus
  reason: string
}

export interface AssignPlatformRolesRequest {
  roleIds: Id[]
}

export interface RoleQuery {
  scopeType?: 'PLATFORM' | 'SHOP' | ''
  status?: 'ACTIVE' | 'DISABLED' | ''
  keyword?: string
  page?: number
  pageSize?: number
}

export interface PermissionView {
  id: Id
  permissionCode: PermissionCode | string
  permissionName: string
  scopeType: 'PLATFORM' | 'SHOP'
  resource: string
  httpMethod: string | null
  status: 'ACTIVE' | 'DISABLED'
}

export interface RoleDetailView extends Omit<RoleRecord, 'permissions'> {
  status: 'ACTIVE' | 'DISABLED'
  permissions: PermissionView[]
  updatedAt?: string
}

export interface CreateRoleRequest {
  roleCode: string
  roleName: string
  scopeType: 'PLATFORM' | 'SHOP'
  description?: string
  permissionIds: Id[]
}

export interface UpdateRoleRequest {
  roleName?: string
  description?: string
}

export interface AssignPermissionsRequest {
  permissionIds: Id[]
}

function normalizeRoleView(role: any): RoleRecord {
  return {
    id: role.id,
    name: role.roleName ?? role.name,
    code: (role.roleCode ?? role.code) as RoleRecord['code'],
    description: role.description,
    permissions: role.permissions ?? [],
    permissionIds: role.permissionIds ?? [],
    createdAt: role.createdAt
  }
}

export function listPlatformUsers(query: PlatformUserQuery) {
  return request.get<PageView<PlatformUserView>>('/platform/rbac/users', { params: query }) as unknown as Promise<PageView<PlatformUserView>>
}

export function getPlatformUser(userId: Id) {
  return request.get<PlatformUserDetailView>(`/platform/rbac/users/${userId}`) as unknown as Promise<PlatformUserDetailView>
}

export function changePlatformUserStatus(userId: Id, data: ChangeUserStatusRequest) {
  return request.post<PlatformUserDetailView>(`/platform/rbac/users/${userId}/status`, data) as unknown as Promise<PlatformUserDetailView>
}

export function assignPlatformRoles(userId: Id, data: AssignPlatformRolesRequest) {
  return request.put<PlatformUserDetailView>(`/platform/rbac/users/${userId}/roles`, data) as unknown as Promise<PlatformUserDetailView>
}

export function kickoutPlatformUser(userId: Id, reason: string) {
  return request.post<void>(`/platform/rbac/users/${userId}/kickout`, { reason }) as unknown as Promise<void>
}

export async function listRoles(query: RoleQuery = {}) {
  const data = await request.get<PageView<RoleDetailView>>('/platform/rbac/roles', { params: query }) as unknown as PageView<RoleDetailView>
  return {
    ...data,
    items: data.items.map(normalizeRoleView)
  }
}

export async function saveRole(record: RoleRecord) {
  if (record.id) {
    await request.put(`/platform/rbac/roles/${record.id}`, { roleName: record.name, description: record.description })
    await request.put(`/platform/rbac/roles/${record.id}/permissions`, { permissionIds: record.permissionIds ?? [] })
    return true
  }
  await request.post('/platform/rbac/roles', {
    roleCode: record.code,
    roleName: record.name,
    scopeType: 'PLATFORM',
    description: record.description,
    permissionIds: record.permissionIds ?? []
  })
  return true
}

export function deleteRole(roleId: Id) {
  return request.post(`/platform/rbac/roles/${roleId}/status`, { targetStatus: 'DISABLED' })
}

export function listAccounts(query: PlatformUserQuery) {
  return request.get<PageView<PlatformAccount>>('/platform/rbac/users', { params: query }) as unknown as Promise<PageView<PlatformAccount>>
}

export async function saveAccount(record: PlatformAccount) {
  if (record.id) {
    await request.put(`/platform/rbac/users/${record.id}`, {
      username: record.username,
      nickname: record.displayName,
      phone: record.phone,
      roleCode: record.role,
      permissions: record.permissions
    })
    return true
  }
  await request.post('/platform/rbac/users', {
    username: record.username,
    nickname: record.displayName,
    phone: record.phone,
    roleCode: record.role,
    permissions: record.permissions
  })
  return true
}

export function setAccountStatus(id: Id, status: AccountStatus) {
  return request.post(`/platform/rbac/users/${id}/status`, { targetStatus: status, reason: '管理端操作' })
}

export function resetAccountPassword() {
  return request.post('/platform/rbac/users/reset-password', {})
}

export function getRoleDetailView(role: RoleDetailView) {
  return normalizeRoleView(role)
}

export function getRoleDetail(roleId: Id) {
  return request.get<RoleDetailView>(`/platform/rbac/roles/${roleId}`) as unknown as Promise<RoleDetailView>
}

export function listPermissions(query: RoleQuery = {}) {
  return request.get<PageView<PermissionView>>('/platform/rbac/permissions', { params: query }) as unknown as Promise<PageView<PermissionView>>
}
