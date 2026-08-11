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
  'platform:shop:manage': 'admin:shop:manage',
  'platform:shop:member:manage': 'admin:shop:member:manage',
  'platform:product:audit': 'admin:product:audit',
  'platform:operation:read': 'admin:operation:read',
  'platform:after-sale:manage': 'admin:after-sale:audit'
}

const PLATFORM_ROLE_PERMISSION_MAP: Partial<Record<AdminRole, PermissionCode[]>> = {
  SUPER_ADMIN: [
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
    'admin:after-sale:audit',
    'admin:operation:read'
  ],
  PLATFORM_SHOP_ADMIN: ['admin:shop:manage', 'admin:rbac:account'],
  PLATFORM_PRODUCT_AUDITOR: ['admin:product:view', 'admin:product:audit'],
  SHOP_ADMIN: ['admin:dashboard:view'],
  SHOP_PRODUCT_OPERATOR: ['admin:product:view'],
  SHOP_ORDER_OPERATOR: ['admin:order:view', 'admin:inventory:view'],
  SHOP_INVENTORY_OPERATOR: ['admin:inventory:view'],
  CUSTOMER: []
}

function toAdminRole(roles: string[], shops: CurrentUserView['shops']): AdminRole {
  // 后端登录态里同一个账号可能只给出平台角色编码或店铺角色编码，因此这里要把它们统一翻译成前端可识别的角色。
  // 平台店铺管理员、平台商品审核员、各类店铺角色都要能被正确识别，这样后面的跳转和菜单权限才不会落到“无权访问”。
  if (roles.includes('SUPER_ADMIN')) return 'SUPER_ADMIN'
  if (roles.includes('PLATFORM_SHOP_ADMIN')) return 'PLATFORM_SHOP_ADMIN'
  if (roles.includes('PLATFORM_PRODUCT_AUDITOR')) return 'PLATFORM_PRODUCT_AUDITOR'
  if (roles.includes('SHOP_ADMIN')) return 'SHOP_ADMIN'
  if (roles.includes('SHOP_PRODUCT_OPERATOR')) return 'SHOP_PRODUCT_OPERATOR'
  if (roles.includes('SHOP_ORDER_OPERATOR')) return 'SHOP_ORDER_OPERATOR'
  if (roles.includes('SHOP_INVENTORY_OPERATOR')) return 'SHOP_INVENTORY_OPERATOR'
  if (roles.includes('CUSTOMER')) return 'CUSTOMER'
  if (roles.some((role) => role.includes('AUDIT'))) return 'AUDIT_ADMIN'
  if (shops.length > 0) return 'MERCHANT'
  return 'OPERATION_ADMIN'
}

function toPermissions(current: CurrentUserView): PermissionCode[] {
  const primaryRole = toAdminRole(current.platformRoles, current.shops)
  const mappedByRole = PLATFORM_ROLE_PERMISSION_MAP[primaryRole] ?? []

  if (primaryRole === 'SUPER_ADMIN') {
    return mappedByRole
  }

  const mappedByBackend = current.platformPermissions.flatMap((permission) => {
    const matched = ADMIN_PERMISSION_BY_BACKEND[permission]
    return matched ? [matched] : []
  })

  const mapped = [...mappedByRole, ...mappedByBackend]

  if (mapped.includes('admin:catalog:category')) mapped.push('admin:catalog:brand')
  if (mapped.includes('admin:shop:manage')) mapped.push('admin:dashboard:view')
  if (mapped.includes('admin:product:audit')) mapped.push('admin:product:view')
  if (mapped.includes('admin:operation:read')) mapped.push('admin:dashboard:view', 'admin:order:view', 'admin:inventory:view')
  if (mapped.includes('admin:order:view')) mapped.push('admin:dashboard:view', 'admin:inventory:view')

  return Array.from(new Set(mapped))
}

function toPlatformUser(current: CurrentUserView): PlatformUser {
  const role = toAdminRole(current.platformRoles, current.shops)
  return {
    id: current.user.id,
    username: current.user.username,
    displayName: current.user.nickname || current.user.username,
    role,
    permissions: toPermissions(current),
    status: current.user.status
  }
}

export async function loginAdmin(username: string, password: string) {
  const login = await request.post<LoginView>('/auth/login', { username, password }) as unknown as LoginView
  const current = await request.get<CurrentUserView>('/auth/me', { headers: { satoken: login.tokenValue } }) as unknown as CurrentUserView
  const user = toPlatformUser(current)

  if (user.role === 'MERCHANT') {
    throw new Error('当前账号不是平台管理员账号')
  }

  if (user.permissions.length === 0) {
    throw new Error('当前账号没有可用的后台权限')
  }

  return {
    token: login.tokenValue,
    user
  }
}
