import request from '@/utils/request'
import type { Id, PageView } from '@/types/common'
import type { MerchantMemberQuery, MerchantMemberRole, MerchantMemberStatus, MerchantMemberView } from '@/types/merchant'

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

export interface MerchantMemberRoleOption {
  id: Id
  code: MerchantMemberRole
  name: string
  description: string | null
}

interface BackendRoleView {
  id: Id
  roleCode: MerchantMemberRole
  roleName: string
  scopeType: 'SHOP'
  description: string | null
  status: 'ACTIVE'
}

interface BackendMemberView {
  shopId: Id
  user: { id: Id; username: string; nickname: string; phone?: string | null }
  role: { id: Id; roleCode: MerchantMemberRole; roleName: string }
  status: MerchantMemberStatus
  createdAt: string
}

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

export async function listShopMemberRoles(shopId: Id) {
  const pageSize = 100
  const firstPage = await request.get<PageView<BackendRoleView>>(`/shops/${shopId}/members/roles`, {
    params: { page: 1, pageSize }
  }) as unknown as PageView<BackendRoleView>
  const items = [...firstPage.items]
  const pageCount = Math.ceil(firstPage.total / pageSize)
  for (let page = 2; page <= pageCount; page += 1) {
    const data = await request.get<PageView<BackendRoleView>>(`/shops/${shopId}/members/roles`, {
      params: { page, pageSize }
    }) as unknown as PageView<BackendRoleView>
    items.push(...data.items)
  }
  return items.map((role): MerchantMemberRoleOption => ({
    id: role.id,
    code: role.roleCode,
    name: role.roleName,
    description: role.description
  }))
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
