import request from '@/utils/request'
import type { Id, PageView } from '../../types/common'
import type {
  AfterSaleStatus,
  AfterSaleType,
  ApproveAfterSaleRequest,
  ConfirmReturnReceivedRequest,
  RefundStatus,
  RejectAfterSaleRequest,
  RetryRefundRequest,
  ShopAfterSaleDetailView,
  ShopAfterSaleSummaryView
} from '../../types/merchant'

export interface MerchantAfterSaleQuery {
  page?: number
  pageSize?: number
  status?: AfterSaleStatus | ''
  refundStatus?: RefundStatus | ''
  requestType?: AfterSaleType | ''
  keyword?: string
  createdFrom?: string
  createdTo?: string
}

export async function getMerchantAfterSales(shopId: Id, query: MerchantAfterSaleQuery = {}) {
  return await request.get<PageView<ShopAfterSaleSummaryView>>(`/shops/${shopId}/after-sales`, { params: query }) as unknown as Promise<PageView<ShopAfterSaleSummaryView>>
}

export async function getMerchantAfterSaleDetail(shopId: Id, afterSaleId: Id) {
  return await request.get<ShopAfterSaleDetailView>(`/shops/${shopId}/after-sales/${afterSaleId}`) as unknown as Promise<ShopAfterSaleDetailView>
}

export async function approveMerchantAfterSale(shopId: Id, afterSaleId: Id, requestBody: ApproveAfterSaleRequest) {
  return await request.post<ShopAfterSaleDetailView>(`/shops/${shopId}/after-sales/${afterSaleId}/approve`, requestBody, { headers: { 'Idempotency-Key': crypto.randomUUID() } }) as unknown as Promise<ShopAfterSaleDetailView>
}

export async function rejectMerchantAfterSale(shopId: Id, afterSaleId: Id, requestBody: RejectAfterSaleRequest) {
  return await request.post<ShopAfterSaleDetailView>(`/shops/${shopId}/after-sales/${afterSaleId}/reject`, requestBody) as unknown as Promise<ShopAfterSaleDetailView>
}

export async function confirmMerchantReturnReceived(shopId: Id, afterSaleId: Id, requestBody: ConfirmReturnReceivedRequest) {
  return await request.post<ShopAfterSaleDetailView>(`/shops/${shopId}/after-sales/${afterSaleId}/confirm-return-received`, requestBody, { headers: { 'Idempotency-Key': crypto.randomUUID() } }) as unknown as Promise<ShopAfterSaleDetailView>
}

export async function retryMerchantRefund(shopId: Id, afterSaleId: Id, requestBody: RetryRefundRequest) {
  return await request.post<ShopAfterSaleDetailView>(`/shops/${shopId}/after-sales/${afterSaleId}/refund/retry`, requestBody, { headers: { 'Idempotency-Key': crypto.randomUUID() } }) as unknown as Promise<ShopAfterSaleDetailView>
}
