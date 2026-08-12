import request from '@/utils/request'
import type { Id, PageView } from '@/types/common'
import type { CreateShopRequest, PlatformShopQuery, PlatformShopView, ShopStatus, UpdateShopRequest } from '@/types/admin'

export type { CreateShopRequest, PlatformShopQuery, PlatformShopSort, PlatformShopView, UpdateShopRequest } from '@/types/admin'

export function getPlatformShops(params: PlatformShopQuery = {}) {
  return request.get<PageView<PlatformShopView>>('/platform/shops', {
    params: {
      status: params.status || undefined,
      keyword: params.keyword?.trim() || undefined,
      page: params.page,
      pageSize: params.pageSize,
      sort: params.sort
    }
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

