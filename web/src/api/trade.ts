import request from '@/utils/request'
import type { Id, Money, Timestamp } from '@/types/common'
import type { AddressSnapshot, OrderStatus, OrderPaymentStatus, ShopBrief } from '@/types/merchant'

export type TradeStatus = 'PENDING_PAYMENT' | 'PAID' | 'CANCELLED' | 'CLOSED' | 'COMPLETED'

export interface OrderSummaryView {
  id: Id
  orderNo: string
  tradeId: Id
  tradeNo: string
  shop: ShopBrief
  orderStatus: OrderStatus
  paymentStatus: OrderPaymentStatus
  payableAmount: Money
  refundAmount: Money
  itemSummary: Array<{ productName: string; skuName: string; imageUrl: string | null; quantity: number }>
  itemKinds: number
  totalQuantity: number
  createdAt: Timestamp
  availableActions: string[]
}

export interface TradeDetailView {
  id: Id
  tradeNo: string
  tradeStatus: TradeStatus
  payableAmount: Money
  address: AddressSnapshot
  payExpireAt: Timestamp | null
  paidAt: Timestamp | null
  cancelledAt: Timestamp | null
  orders: OrderSummaryView[]
  availableActions: string[]
}

export interface CreateTradeRequest {
  cartItemIds: Id[]
  addressId: Id
  shopRemarks?: Record<Id, string>
}

function idempotencyKey() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`
}

export function createTrade(data: CreateTradeRequest, key = idempotencyKey()) {
  return request.post<TradeDetailView>('/trades', data, { headers: { 'Idempotency-Key': key } }) as unknown as Promise<TradeDetailView>
}

export function getTradeDetail(tradeId: Id) {
  return request.get<TradeDetailView>(`/trades/${tradeId}`) as unknown as Promise<TradeDetailView>
}

export function cancelTrade(tradeId: Id, reason: string) {
  return request.post<TradeDetailView>(`/trades/${tradeId}/cancel`, { reason }) as unknown as Promise<TradeDetailView>
}
