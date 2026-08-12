import request from '@/utils/request'
import type { Id, PageView } from '@/types/common'
import type { AppealDetail, AppealSummary, AfterSaleAppealDecision, AfterSaleAppealStatus, AfterSaleAppealTriggerType } from '@/types/admin'

export interface AfterSaleAppealQuery {
  status?: AfterSaleAppealStatus
  triggerType?: AfterSaleAppealTriggerType
  shopId?: Id
  afterSaleNo?: string
  createdFrom?: string
  createdTo?: string
  page?: number
  pageSize?: number
}

export interface DecideAfterSaleAppealRequest {
  decision: AfterSaleAppealDecision
  approvedQuantity?: number
  approvedAmount?: string
  reviewComment: string
  version: number
}

export function listAfterSaleAppeals(query: AfterSaleAppealQuery = {}) {
  return request.get<PageView<AppealSummary>>('/platform/after-sale-appeals', {
    params: {
      status: query.status || undefined,
      triggerType: query.triggerType || undefined,
      shopId: query.shopId || undefined,
      afterSaleNo: query.afterSaleNo?.trim() || undefined,
      createdFrom: query.createdFrom || undefined,
      createdTo: query.createdTo || undefined,
      page: query.page,
      pageSize: query.pageSize
    }
  }) as unknown as Promise<PageView<AppealSummary>>
}

export function getAfterSaleAppealDetail(appealId: Id) {
  return request.get<AppealDetail>(`/platform/after-sale-appeals/${appealId}`) as unknown as Promise<AppealDetail>
}

export function decideAfterSaleAppeal(appealId: Id, body: DecideAfterSaleAppealRequest, idempotencyKey: string) {
  return request.post<AppealDetail>(`/platform/after-sale-appeals/${appealId}/decide`, body, {
    headers: { 'Idempotency-Key': idempotencyKey }
  }) as unknown as Promise<AppealDetail>
}
