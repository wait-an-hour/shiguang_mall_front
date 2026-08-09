import request from '@/utils/request'
import type { Id, PageView } from '@/types/common'
import type { ShopMemberQuery, ShopMemberStatus, ShopMemberView } from '@/types/admin'

export interface AddShopMemberRequest {
  username: string
  roleId: Id
}

export interface ChangeShopMemberRoleRequest {
  roleId: Id
}

export interface ChangeShopMemberStatusRequest {
  targetStatus: ShopMemberStatus
}

interface PlatformShopMemberView {
  shopId: Id
  user: { id: Id; username: string; nickname: string; avatarUrl: string | null; status: string; phone?: string | null }
  role: { id: Id; roleCode: string; roleName: string; scopeType: 'PLATFORM' | 'SHOP'; description: string; status: 'ACTIVE' | 'DISABLED'; createdAt: string; updatedAt: string }
  status: ShopMemberStatus
  createdAt: string
  updatedAt: string
}

function toShopMemberView(item: PlatformShopMemberView): ShopMemberView {
  return {
    id: item.user.id,
    username: item.user.username,
    nickname: item.user.nickname,
    roleCode: item.role.roleCode as ShopMemberView['roleCode'],
    roleName: item.role.roleName,
    status: item.status,
    phone: item.user.phone ?? null,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  }
}

export async function listShopMembers(shopId: Id, query: ShopMemberQuery = {}) {
  const data = await request.get<PageView<PlatformShopMemberView>>(`/platform/shops/${shopId}/members`, { params: query }) as unknown as PageView<PlatformShopMemberView>
  return { ...data, items: data.items.map(toShopMemberView) }
}

export async function addShopMember(shopId: Id, data: AddShopMemberRequest) {
  const result = await request.post<PlatformShopMemberView>(`/platform/shops/${shopId}/members`, data) as unknown as PlatformShopMemberView
  return toShopMemberView(result)
}

export async function changeShopMemberRole(shopId: Id, userId: Id, data: ChangeShopMemberRoleRequest) {
  const result = await request.put<PlatformShopMemberView>(`/platform/shops/${shopId}/members/${userId}/role`, data) as unknown as PlatformShopMemberView
  return toShopMemberView(result)
}

export async function changeShopMemberStatus(shopId: Id, userId: Id, data: ChangeShopMemberStatusRequest) {
  const result = await request.post<PlatformShopMemberView>(`/platform/shops/${shopId}/members/${userId}/status`, data) as unknown as PlatformShopMemberView
  return toShopMemberView(result)
}
