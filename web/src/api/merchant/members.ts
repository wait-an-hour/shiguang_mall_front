import request from '@/utils/request'
import type { Id, PageView } from '@/types/common'
import type { MerchantMemberQuery, MerchantMemberStatus, MerchantMemberView } from '@/types/merchant'

export interface AddMerchantMemberRequest {
  username: string
  roleId: Id
}

export interface ChangeMerchantMemberRoleRequest {
  roleId: Id
}

export interface ChangeMerchantMemberStatusRequest {
  targetStatus: MerchantMemberStatus
}

interface BackendMemberView {
  shopId: Id
  user: { id: Id; username: string; nickname: string; phone?: string | null }
  role: { id: Id; roleCode: MerchantMemberRole; roleName: string }
  status: MerchantMemberStatus
  createdAt: string
}

type MerchantMemberRole = 'SHOP_ADMIN' | 'SHOP_MEMBER'

function toMemberView(item: BackendMemberView): MerchantMemberView {
  return {
    id: item.user.id,
    username: item.user.username,
    nickname: item.user.nickname,
    roleId: item.role.id,
    roleCode: item.role.roleCode,
    roleName: item.role.roleName,
    status: item.status,
    phone: item.user.phone ?? null,
    createdAt: item.createdAt
  }
}

export async function listShopMembers(shopId: Id, query: MerchantMemberQuery = {}) {
  const data = await request.get<PageView<BackendMemberView>>(`/shops/${shopId}/members`, { params: query }) as unknown as PageView<BackendMemberView>
  return { ...data, items: data.items.map(toMemberView) }
}

export async function addShopMember(shopId: Id, data: AddMerchantMemberRequest) {
  const result = await request.post<BackendMemberView>(`/shops/${shopId}/members`, data) as unknown as BackendMemberView
  return toMemberView(result)
}

export async function changeShopMemberRole(shopId: Id, userId: Id, data: ChangeMerchantMemberRoleRequest) {
  const result = await request.put<BackendMemberView>(`/shops/${shopId}/members/${userId}/role`, data) as unknown as BackendMemberView
  return toMemberView(result)
}

export async function changeShopMemberStatus(shopId: Id, userId: Id, data: ChangeMerchantMemberStatusRequest) {
  const result = await request.post<BackendMemberView>(`/shops/${shopId}/members/${userId}/status`, data) as unknown as BackendMemberView
  return toMemberView(result)
}
