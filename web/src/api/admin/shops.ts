import request from '@/utils/request'
import type { Id, Money, PageView, Timestamp } from '@/types/common'
import type { ShopStatus } from '@/types/merchant'

export interface PlatformShopView {
  shop: {
    id: Id
    shopNo: string
    shopName: string
    logoUrl: string | null
    status: ShopStatus
  }
  description: string | null
  contactName: string | null
  contactPhone: string | null
  membersCount: number
  activeMembersCount: number
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface PlatformShopQuery {
  status?: ShopStatus | ''
  keyword?: string
  page?: number
  pageSize?: number
  sort?: string
}

export interface CreateShopRequest {
  shopName: string
  logoUrl?: string
  description?: string
  contactName?: string
  contactPhone?: string
  adminUsername: string
}

export interface UpdateShopRequest {
  shopName: string
  logoUrl?: string
  description?: string
  contactName?: string
  contactPhone?: string
}

export function getPlatformShops(params: PlatformShopQuery = {}) {
  return request.get<PageView<PlatformShopView>>('/platform/shops', {
    params: { ...params, status: params.status || undefined }
  }) as unknown as Promise<PageView<PlatformShopView>>
}

export function createPlatformShop(data: CreateShopRequest) {
  return request.post<PlatformShopView>('/platform/shops', data) as unknown as Promise<PlatformShopView>
}

export function getPlatformShopDetail(shopId: Id) {
  return request.get<PlatformShopView>(`/platform/shops/${shopId}`) as unknown as Promise<PlatformShopView>
}

export function updatePlatformShop(shopId: Id, data: UpdateShopRequest) {
  return request.put<PlatformShopView>(`/platform/shops/${shopId}`, data) as unknown as Promise<PlatformShopView>
}

export function setPlatformShopStatus(shopId: Id, targetStatus: ShopStatus, reason: string) {
  return request.post<PlatformShopView>(`/platform/shops/${shopId}/status`, { targetStatus, reason }) as unknown as Promise<PlatformShopView>
}

export type { Money }
