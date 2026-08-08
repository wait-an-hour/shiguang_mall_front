import request from '@/utils/request'
import type { AdminRole, PermissionCode, PlatformUser } from '@/types/admin'
import type { Id } from '@/types/common'

interface UserSummary {
  id: Id
  username: string
  nickname: string
  avatarUrl: string | null
  status: 'ACTIVE' | 'DISABLED' | 'LOCKED'
}

interface LoginView {
  tokenName: 'satoken'
  tokenValue: string
  expiresInSeconds: number
  activeTimeoutSeconds: number
  user: UserSummary
}

interface CurrentUserView {
  user: UserSummary
  phone: string | null
  email: string | null
  platformRoles: string[]
  platformPermissions: string[]
  shops: Array<{
    shop: { id: Id; shopNo: string; shopName: string; logoUrl: string | null; status: string }
    roleCode: string
    permissions: string[]
  }>
}

const ADMIN_PERMISSION_BY_BACKEND: Record<string, PermissionCode> = {
  'platform:rbac:manage': 'admin:rbac:role',
  'platform:catalog:manage': 'admin:catalog:category',
  'platform:product:audit': 'admin:product:audit',
  'platform:operation:read': 'admin:order:view'
}

const SUPER_ADMIN_PERMISSIONS: PermissionCode[] = [
  'admin:dashboard:view',
  'admin:rbac:role',
  'admin:rbac:account',
  'admin:catalog:category',
  'admin:catalog:brand',
  'admin:shop:manage',
  'admin:product:view',
  'admin:product:audit',
  'admin:inventory:view',
  'admin:order:view',
  'admin:after-sale:audit'
]

function toAdminRole(roles: string[], shops: CurrentUserView['shops']): AdminRole {
  if (roles.includes('SUPER_ADMIN')) return 'SUPER_ADMIN'
  if (roles.some((role) => role.includes('AUDIT'))) return 'AUDIT_ADMIN'
  if (shops.length > 0) return 'MERCHANT'
  return 'OPERATION_ADMIN'
}

function toPermissions(current: CurrentUserView): PermissionCode[] {
  if (current.platformRoles.includes('SUPER_ADMIN')) return SUPER_ADMIN_PERMISSIONS

  const mapped = current.platformPermissions.flatMap((permission) => {
    const matched = ADMIN_PERMISSION_BY_BACKEND[permission]
    return matched ? [matched] : []
  })

  if (mapped.includes('admin:catalog:category')) mapped.push('admin:catalog:brand')
  if (mapped.includes('admin:shop:manage')) mapped.push('admin:dashboard:view')
  if (mapped.includes('admin:product:audit')) mapped.push('admin:product:view')
  if (mapped.includes('admin:order:view')) mapped.push('admin:dashboard:view', 'admin:inventory:view')

  return Array.from(new Set(mapped))
}

function toPlatformUser(current: CurrentUserView): PlatformUser {
  return {
    id: current.user.id,
    username: current.user.username,
    displayName: current.user.nickname || current.user.username,
    role: toAdminRole(current.platformRoles, current.shops),
    permissions: toPermissions(current),
    status: current.user.status
  }
}

export async function loginAdmin(username: string, password: string) {
  const login = await request.post<LoginView>('/auth/login', { username, password }) as unknown as LoginView
  const current = await request.get<CurrentUserView>('/auth/me', { headers: { satoken: login.tokenValue } }) as unknown as CurrentUserView
  const user = toPlatformUser(current)

  if (user.permissions.length === 0 || user.role === 'MERCHANT') {
    throw new Error('当前账号不是平台管理员账号')
  }

  return {
    token: login.tokenValue,
    user
  }
}
