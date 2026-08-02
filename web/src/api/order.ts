import request from '@/utils/request'
import type { Id, PageView } from '@/types/common'
import type { OrderDetailView, OrderPaymentStatus, OrderStatus, ShopOrderSummaryView } from '@/types/merchant'

export interface BuyerOrderQuery {
  page?: number
  pageSize?: number
  orderStatus?: OrderStatus | ''
  paymentStatus?: OrderPaymentStatus | ''
  keyword?: string
  createdFrom?: string
  createdTo?: string
}

function toParams(query: BuyerOrderQuery) {
  return {
    ...query,
    orderStatus: query.orderStatus || undefined,
    paymentStatus: query.paymentStatus || undefined
  }
}

export function getOrderList(query: BuyerOrderQuery = {}) {
  return request.get<PageView<Omit<ShopOrderSummaryView, 'buyer'>>>('/orders', { params: toParams(query) }) as unknown as Promise<PageView<Omit<ShopOrderSummaryView, 'buyer'>>>
}

export function getOrderDetail(orderId: Id) {
  return request.get<OrderDetailView>(`/orders/${orderId}`) as unknown as Promise<OrderDetailView>
}

export function completeOrder(orderId: Id) {
  return request.post<OrderDetailView>(`/orders/${orderId}/complete`) as unknown as Promise<OrderDetailView>
}
