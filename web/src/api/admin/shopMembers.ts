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

export function listShopMembers(shopId: Id, query: ShopMemberQuery = {}) {
  return request.get<PageView<ShopMemberView>>(`/platform/shops/${shopId}/members`, {
    params: {
      keyword: query.keyword?.trim() || undefined,
      roleId: query.roleId || undefined,
      status: query.status || undefined,
      page: query.page,
      pageSize: query.pageSize
    }
  }) as unknown as Promise<PageView<ShopMemberView>>
}

export function addShopMember(shopId: Id, data: AddShopMemberRequest) {
  return request.post<ShopMemberView>(`/platform/shops/${shopId}/members`, data) as unknown as Promise<ShopMemberView>
}

export function changeShopMemberRole(shopId: Id, userId: Id, data: ChangeShopMemberRoleRequest) {
  return request.put<ShopMemberView>(`/platform/shops/${shopId}/members/${userId}/role`, data) as unknown as Promise<ShopMemberView>
}

export function changeShopMemberStatus(shopId: Id, userId: Id, data: ChangeShopMemberStatusRequest) {
  return request.post<ShopMemberView>(`/platform/shops/${shopId}/members/${userId}/status`, data) as unknown as Promise<ShopMemberView>
}

export function removeShopMember(shopId: Id, userId: Id) {
  return request.delete<void>(`/platform/shops/${shopId}/members/${userId}`) as unknown as Promise<void>
}
