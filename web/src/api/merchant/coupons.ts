import request from '@/utils/request'
import type { Id, PageView } from '@/types/common'
import type {
  BatchCouponGrantView, CouponActivity, CouponActivityQuery, CouponActivityScheduleView, CouponCodeBatchCreatedView, CouponCodeBatchSummaryView,
  CouponFundingParticipation, CouponTemplateDetail, CouponTemplateQuery, CouponTemplateSummary, CreateActivityRequest, CreateCouponTemplateRequest,
  CreateRecurringCouponActivityRequest, CreateRedeemCodeBatchRequest, CopyCouponTemplateRequest, DecideCouponFundingRequest, GrantCouponsRequest,
  ReasonVersionRequest, UpdateActivityRequest, UpdateCouponActivityScheduleRequest, UpdateCouponPresentationRequest,
  UpdateCouponTemplateRequest, VersionRequest
} from '@/types/coupon'

const idempotency = () => ({ headers: { 'Idempotency-Key': crypto.randomUUID() } })
const path = (shopId: Id, resource: string) => `/shops/${shopId}/${resource}`

export function listMerchantCouponActivities(shopId: Id, params: CouponActivityQuery = {}) { return request.get<PageView<CouponActivity>>(path(shopId, 'coupon-activities'), { params }) as unknown as Promise<PageView<CouponActivity>> }
export function getMerchantCouponActivity(shopId: Id, id: Id) { return request.get<CouponActivity>(path(shopId, `coupon-activities/${id}`)) as unknown as Promise<CouponActivity> }
export function createMerchantCouponActivity(shopId: Id, payload: CreateActivityRequest) { return request.post<CouponActivity>(path(shopId, 'coupon-activities'), payload, idempotency()) as unknown as Promise<CouponActivity> }
export function createMerchantRecurringCouponActivity(shopId: Id, payload: CreateRecurringCouponActivityRequest) { return request.post<CouponActivity>(path(shopId, 'coupon-activities/recurring'), payload, idempotency()) as unknown as Promise<CouponActivity> }
export function updateMerchantCouponActivity(shopId: Id, id: Id, payload: UpdateActivityRequest) { return request.put<CouponActivity>(path(shopId, `coupon-activities/${id}`), payload) as unknown as Promise<CouponActivity> }
export function getMerchantCouponActivitySchedule(shopId: Id, id: Id) { return request.get<CouponActivityScheduleView>(path(shopId, `coupon-activities/${id}/schedule`)) as unknown as Promise<CouponActivityScheduleView> }
export function updateMerchantCouponActivitySchedule(shopId: Id, id: Id, payload: UpdateCouponActivityScheduleRequest) { return request.put<CouponActivityScheduleView>(path(shopId, `coupon-activities/${id}/schedule`), payload) as unknown as Promise<CouponActivityScheduleView> }
export function merchantCouponActivityAction(shopId: Id, id: Id, action: 'publish' | 'pause' | 'resume' | 'end' | 'cancel', payload: VersionRequest | ReasonVersionRequest) { return request.post<CouponActivity>(path(shopId, `coupon-activities/${id}/${action}`), payload, idempotency()) as unknown as Promise<CouponActivity> }

export function listMerchantCouponTemplates(shopId: Id, params: CouponTemplateQuery = {}) { return request.get<PageView<CouponTemplateSummary>>(path(shopId, 'coupon-templates'), { params }) as unknown as Promise<PageView<CouponTemplateSummary>> }
export function getMerchantCouponTemplate(shopId: Id, id: Id) { return request.get<CouponTemplateDetail>(path(shopId, `coupon-templates/${id}`)) as unknown as Promise<CouponTemplateDetail> }
export function createMerchantCouponTemplate(shopId: Id, payload: CreateCouponTemplateRequest) {
  const { ownerType: _ownerType, fundingType: _fundingType, platformShareRate: _platformShareRate, ...shopPayload } = payload
  return request.post<CouponTemplateDetail>(path(shopId, 'coupon-templates'), shopPayload, idempotency()) as unknown as Promise<CouponTemplateDetail>
}
export function updateMerchantCouponTemplate(shopId: Id, id: Id, payload: UpdateCouponTemplateRequest) {
  const { ownerType: _ownerType, fundingType: _fundingType, platformShareRate: _platformShareRate, ...shopPayload } = payload
  return request.put<CouponTemplateDetail>(path(shopId, `coupon-templates/${id}`), shopPayload) as unknown as Promise<CouponTemplateDetail>
}
export function updateMerchantCouponTemplateScope(shopId: Id, id: Id, payload: Omit<UpdateCouponTemplateRequest['scope'], 'version'> & { version: number }) { return request.put<CouponTemplateDetail>(path(shopId, `coupon-templates/${id}/scope`), payload) as unknown as Promise<CouponTemplateDetail> }
export function updateMerchantCouponTemplatePresentation(shopId: Id, id: Id, payload: UpdateCouponPresentationRequest) { return request.patch<CouponTemplateDetail>(path(shopId, `coupon-templates/${id}/presentation`), payload) as unknown as Promise<CouponTemplateDetail> }
export function activateMerchantCouponTemplate(shopId: Id, id: Id, payload: VersionRequest) { return request.post<CouponTemplateDetail>(path(shopId, `coupon-templates/${id}/activate`), payload, idempotency()) as unknown as Promise<CouponTemplateDetail> }
export function resumeMerchantCouponTemplate(shopId: Id, id: Id, payload: VersionRequest) { return request.post<CouponTemplateDetail>(path(shopId, `coupon-templates/${id}/resume`), payload, idempotency()) as unknown as Promise<CouponTemplateDetail> }
export function pauseMerchantCouponTemplate(shopId: Id, id: Id, payload: ReasonVersionRequest) { return request.post<CouponTemplateDetail>(path(shopId, `coupon-templates/${id}/pause`), payload, idempotency()) as unknown as Promise<CouponTemplateDetail> }
export function endMerchantCouponTemplate(shopId: Id, id: Id, payload: ReasonVersionRequest) { return request.post<CouponTemplateDetail>(path(shopId, `coupon-templates/${id}/end`), payload, idempotency()) as unknown as Promise<CouponTemplateDetail> }
export function archiveMerchantCouponTemplate(shopId: Id, id: Id, payload: ReasonVersionRequest) { return request.post<CouponTemplateDetail>(path(shopId, `coupon-templates/${id}/archive`), payload, idempotency()) as unknown as Promise<CouponTemplateDetail> }
export function copyMerchantCouponTemplate(shopId: Id, id: Id, payload: CopyCouponTemplateRequest) { return request.post<CouponTemplateDetail>(path(shopId, `coupon-templates/${id}/copy`), payload, idempotency()) as unknown as Promise<CouponTemplateDetail> }
export function grantMerchantCoupons(shopId: Id, id: Id, payload: GrantCouponsRequest) { return request.post<BatchCouponGrantView>(path(shopId, `coupon-templates/${id}/grants`), payload, idempotency()) as unknown as Promise<BatchCouponGrantView> }
export function createMerchantRedeemCodeBatch(shopId: Id, id: Id, payload: CreateRedeemCodeBatchRequest) { return request.post<CouponCodeBatchCreatedView>(path(shopId, `coupon-templates/${id}/redeem-code-batches`), payload, idempotency()) as unknown as Promise<CouponCodeBatchCreatedView> }
export function listMerchantRedeemCodeBatches(shopId: Id, params: { templateId?: Id; batchNo?: string; status?: string; page?: number; pageSize?: number } = {}) { return request.get<PageView<CouponCodeBatchSummaryView>>(path(shopId, 'coupon-code-batches'), { params }) as unknown as Promise<PageView<CouponCodeBatchSummaryView>> }
export function listMerchantFundingInvitations(shopId: Id, params: { status?: string; page?: number; pageSize?: number } = {}) { return request.get<PageView<CouponFundingParticipation>>(path(shopId, 'coupon-funding-invitations'), { params }) as unknown as Promise<PageView<CouponFundingParticipation>> }
export function decideMerchantFundingInvitation(shopId: Id, id: Id, payload: DecideCouponFundingRequest) { return request.post<CouponFundingParticipation>(path(shopId, `coupon-funding-invitations/${id}/decide`), payload, idempotency()) as unknown as Promise<CouponFundingParticipation> }

export type { CouponActivityQuery, CouponTemplateQuery, CreateActivityRequest, CreateCouponTemplateRequest, CreateRecurringCouponActivityRequest, CreateRedeemCodeBatchRequest, CouponCodeBatchSummaryView, CouponFundingParticipation, CouponTemplateSummary, GrantCouponsRequest }
