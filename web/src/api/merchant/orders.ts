import request from '@/utils/request'
import type { Id, PageView } from '../../types/common'
import type {
  OrderDetailView,
  OrderPaymentStatus,
  OrderStatus,
  ShipOrderRequest,
  ShopOrderSummaryView
} from '../../types/merchant'

export interface MerchantOrderQuery {
  page?: number
  pageSize?: number
  orderStatus?: OrderStatus | ''
  paymentStatus?: OrderPaymentStatus | ''
  keyword?: string
  createdFrom?: string
  createdTo?: string
}

function toParams(query: MerchantOrderQuery) {
  return {
    ...query,
    orderStatus: query.orderStatus || undefined,
    paymentStatus: query.paymentStatus || undefined
  }
}

export function getMerchantOrders(shopId: Id, query: MerchantOrderQuery = {}) {
  return request.get<PageView<ShopOrderSummaryView>>(`/shops/${shopId}/orders`, { params: toParams(query) }) as unknown as Promise<PageView<ShopOrderSummaryView>>
}

export function getMerchantOrderDetail(shopId: Id, orderId: Id) {
  return request.get<OrderDetailView>(`/shops/${shopId}/orders/${orderId}`) as unknown as Promise<OrderDetailView>
}

export function shipMerchantOrder(shopId: Id, orderId: Id, data: ShipOrderRequest) {
  return request.post<OrderDetailView>(`/shops/${shopId}/orders/${orderId}/ship`, data) as unknown as Promise<OrderDetailView>
}
