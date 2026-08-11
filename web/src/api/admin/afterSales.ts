import request from '@/utils/request'
import type { Id, PageView } from '@/types/common'
import type { AfterSaleStatus } from '@/types/admin'
import type { AfterSaleType, RefundStatus } from '@/types/merchant'

export interface PlatformAfterSaleQuery {
  afterSaleNo?: string
  shopId?: Id
  userId?: Id
  status?: AfterSaleStatus | ''
  refundStatus?: RefundStatus | ''
  page?: number
  pageSize?: number
}

export interface OperationAfterSaleView {
  id: Id
  afterSaleNo: string
  requestType: AfterSaleType
  status: AfterSaleStatus
  refundStatus: RefundStatus
  order: { orderNo: string }
  shop: { id: Id; shopNo: string; shopName: string }
  item: { productName: string; skuName: string } | null
  quantity: number
  requestedAmount: string
  approvedAmount: string
  createdAt: string
  updatedAt: string
  buyer: { id: Id; nickname?: string; username?: string }
}

export function listAfterSales(query: PlatformAfterSaleQuery = {}) {
  const params = {
    afterSaleNo: query.afterSaleNo?.trim() || undefined,
    shopId: query.shopId || undefined,
    userId: query.userId || undefined,
    status: query.status || undefined,
    refundStatus: query.refundStatus || undefined,
    page: query.page,
    pageSize: query.pageSize
  }
  return request.get<PageView<OperationAfterSaleView>>('/platform/operations/after-sales', { params }) as unknown as Promise<PageView<OperationAfterSaleView>>
}
