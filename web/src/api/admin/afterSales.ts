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
  order: { orderNo: string }
  shop: { shopName: string }
  item: { productName: string; skuName: string }
  quantity: number
  requestedAmount: string
  approvedAmount: string
  reasonCode: string
  reasonDescription: string
  createdAt: string
  updatedAt: string
  buyer: { nickname?: string; username?: string }
}

function toPlatform(item: OperationAfterSaleView): PlatformAfterSale {
  return {
    id: item.id,
    serviceNo: item.afterSaleNo,
    orderNo: item.order.orderNo,
    shopName: item.shop.shopName,
    buyerName: item.buyer.nickname || item.buyer.username || '-',
    requestedAmount: item.requestedAmount,
    reason: item.reasonDescription ? `${item.reasonCode}：${item.reasonDescription}` : item.reasonCode,
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

export function auditAfterSale() {
  throw new Error('平台售后单不支持直接审核，请使用售后申诉裁决')
}
