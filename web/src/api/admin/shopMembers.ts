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

export async function listShopMembers(shopId: Id, query: ShopMemberQuery = {}) {
  const data = await request.get<PageView<ShopMemberView>>(`/shops/${shopId}/members`, { params: query }) as unknown as PageView<ShopMemberView>
  return data
}

export function addShopMember(shopId: Id, data: AddShopMemberRequest) {
  return request.post<ShopMemberView>(`/shops/${shopId}/members`, data) as unknown as Promise<ShopMemberView>
}

export function changeShopMemberRole(shopId: Id, userId: Id, data: ChangeShopMemberRoleRequest) {
  return request.put<ShopMemberView>(`/shops/${shopId}/members/${userId}/role`, data) as unknown as Promise<ShopMemberView>
}

export function changeShopMemberStatus(shopId: Id, userId: Id, data: ChangeShopMemberStatusRequest) {
  return request.post<ShopMemberView>(`/shops/${shopId}/members/${userId}/status`, data) as unknown as Promise<ShopMemberView>
}
