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
    page: query.page,
    pageSize: query.pageSize,
    orderStatus: query.orderStatus || undefined,
    paymentStatus: query.paymentStatus || undefined,
    keyword: query.keyword?.trim() || undefined,
    createdFrom: query.createdFrom || undefined,
    createdTo: query.createdTo || undefined
  }
}

export function getMerchantOrders(shopId: Id, query: MerchantOrderQuery = {}) {
  return request.get<PageView<ShopOrderSummaryView>>(`/shops/${shopId}/orders`, { params: toParams(query) }) as unknown as Promise<PageView<ShopOrderSummaryView>>
}

export async function getAllMerchantOrders(shopId: Id, query: Omit<MerchantOrderQuery, 'page' | 'pageSize' | 'keyword'> = {}) {
  const firstPage = await getMerchantOrders(shopId, { ...query, page: 1, pageSize: 100 })
  if (firstPage.totalPages <= 1) return firstPage.items

  const remainingPages = await Promise.all(
    Array.from({ length: firstPage.totalPages - 1 }, (_, index) =>
      getMerchantOrders(shopId, { ...query, page: index + 2, pageSize: 100 })
    )
  )
  return [firstPage, ...remainingPages].flatMap((page) => page.items)
}

export function getMerchantOrderDetail(shopId: Id, orderId: Id) {
  return request.get<OrderDetailView>(`/shops/${shopId}/orders/${orderId}`) as unknown as Promise<OrderDetailView>
}

export function shipMerchantOrder(shopId: Id, orderId: Id, data: ShipOrderRequest) {
  return request.post<OrderDetailView>(`/shops/${shopId}/orders/${orderId}/ship`, data) as unknown as Promise<OrderDetailView>
}
