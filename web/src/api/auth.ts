import request from '@/utils/request'
import { SHOP_PERMISSION } from '@/constants/merchant'
import type { Id, Timestamp } from '@/types/common'
import type { CurrentUserView, ShopStatus } from '@/types/merchant'

interface UserSummaryView {
  id: Id
  username: string
  nickname: string
  avatarUrl: string | null
  status: 'ACTIVE' | 'DISABLED' | 'LOCKED'
}

interface ShopContextView {
  shop: {
    id: Id
    shopNo: string
    shopName: string
    logoUrl: string | null
    status: ShopStatus
  }
  roleCode: string
  permissions: string[]
}

export interface LoginView {
  tokenName: 'satoken'
  tokenValue: string
  expiresInSeconds: number
  activeTimeoutSeconds: number
  user: UserSummaryView
}

export interface BackendCurrentUserView {
  user: UserSummaryView
  phone: string | null
  email: string | null
  platformRoles: string[]
  platformPermissions: string[]
  shops: ShopContextView[]
}

export interface RegisterRequest {
  username: string
  password: string
  nickname: string
  phone?: string
  email?: string
}

export interface UpdateProfileRequest {
  nickname?: string | null
  phone?: string | null
  email?: string | null
  avatarUrl?: string | null
}

const SHOP_PERMISSION_BY_BACKEND: Record<string, string> = {
  'shop:product:manage': SHOP_PERMISSION.ProductManage,
  'shop:inventory:manage': SHOP_PERMISSION.InventoryManage,
  'shop:order:read': SHOP_PERMISSION.OrderRead,
  'shop:order:ship': SHOP_PERMISSION.OrderShip,
  'shop:after-sale:manage': SHOP_PERMISSION.AfterSaleManage,
  'shop:member:manage': SHOP_PERMISSION.MemberManage
}

function toShopPermissions(permissions: string[]) {
  return Array.from(new Set(permissions.map((permission) => SHOP_PERMISSION_BY_BACKEND[permission] || permission)))
}

function toCurrentUser(data: BackendCurrentUserView): CurrentUserView {
  return {
    id: data.user.id,
    username: data.user.username,
    displayName: data.user.nickname || data.user.username,
    roles: data.platformRoles,
    platformPermissions: data.platformPermissions,
    shops: data.shops.map((item) => ({
      id: item.shop.id,
      name: item.shop.shopName,
      code: item.shop.shopNo,
      status: item.shop.status,
      roleCode: item.roleCode as CurrentUserView['shops'][number]['roleCode'],
      permissions: toShopPermissions(item.permissions)
    }))
  }
}

export async function login(username: string, password: string) {
  return await request.post<LoginView>('/auth/login', { username, password }) as unknown as LoginView
}

export async function register(data: RegisterRequest) {
  return await request.post<UserSummaryView>('/auth/register', data) as unknown as UserSummaryView
}

export async function logout(token?: string) {
  await request.post('/auth/logout', undefined, token ? { headers: { satoken: token } } : undefined)
}

export async function getCurrentUser(token?: string) {
  const data = await request.get<BackendCurrentUserView>('/auth/me', token ? { headers: { satoken: token } } : undefined) as unknown as BackendCurrentUserView
  return toCurrentUser(data)
}

export async function updateCurrentUser(data: UpdateProfileRequest) {
  const current = await request.patch<BackendCurrentUserView>('/users/me', data) as unknown as BackendCurrentUserView
  return toCurrentUser(current)
}

export type { Timestamp }
