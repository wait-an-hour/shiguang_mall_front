import request from '@/utils/request'
import type { Id, PageView } from '@/types/common'
import type { AfterSaleStatus, PlatformAfterSale } from '@/types/admin'
import type { AfterSaleType, RefundStatus } from '@/types/merchant'

export interface PlatformAfterSaleQuery {
  status?: string
  refundStatus?: string
  requestType?: string
  keyword?: string
  createdFrom?: string
  createdTo?: string
  page?: number
  pageSize?: number
}

export interface OperationAfterSaleView {
  id: Id
  afterSaleNo: string
  requestType: AfterSaleType
  status: AfterSaleStatus
  refundStatus: RefundStatus
  orderNo: string
  shopName: string
  buyerName: string
  amount: string
  reason: string
  createdAt: string
}

function toPlatform(item: OperationAfterSaleView): PlatformAfterSale {
  return {
    id: item.id,
    serviceNo: item.afterSaleNo,
    orderNo: item.orderNo,
    shopName: item.shopName,
    buyerName: item.buyerName,
    amount: item.amount,
    reason: item.reason,
    status: item.status,
    auditRemark: '',
    createdAt: item.createdAt
  }
}

export async function listAfterSales(query: PlatformAfterSaleQuery = {}) {
  const data = await request.get<PageView<OperationAfterSaleView>>('/platform/operations/after-sales', { params: query }) as unknown as PageView<OperationAfterSaleView>
  return {
    ...data,
    items: data.items.map(toPlatform)
  }
}

export function auditAfterSale(id: Id, status: string, auditRemark: string) {
  return request.post(`/platform/operations/after-sales/${id}/${status === 'APPROVED' ? 'approve' : 'reject'}`, { reviewComment: auditRemark })
}
