import request from '@/utils/request'
import type { Id, PageView } from '@/types/common'
import type {
  BatchCouponGrantView, CouponActivity, CouponActivityQuery, CouponActivityScheduleView, CouponActivityStatus, CouponCodeBatchCreatedView, CouponCodeBatchSummaryView,
  CouponFundingParticipation, CouponRedemptionQuery, CouponRedemptionRecord, CouponTemplateDetail, CouponTemplateQuery, CouponTemplateScopeRequest,
  CouponRecurrenceType, CouponTemplateSummary, CouponUserQuery, CouponUserRecord, CreateActivityRequest, CreateCouponTemplateRequest, CreateRecurringCouponActivityRequest,
  CreateRedeemCodeBatchRequest, CopyCouponTemplateRequest, GrantCouponsRequest, ReasonVersionRequest, SendFundingInvitationRequest,
  UpdateActivityRequest, UpdateCouponActivityScheduleRequest, UpdateCouponPresentationRequest, UpdateCouponTemplateRequest, VersionRequest
} from '@/types/coupon'

export type {
  BatchCouponGrantView, CouponActivity, CouponActivityQuery, CouponActivityScheduleView, CouponActivityStatus, CouponCodeBatchCreatedView, CouponCodeBatchSummaryView,
  CouponFundingParticipation, CouponRedemptionQuery, CouponRedemptionRecord, CouponTemplateDetail as CouponTemplate, CouponTemplateQuery,
  CouponRecurrenceType, CouponTemplateScopeRequest, CouponTemplateSummary, CouponUserQuery, CouponUserRecord, CreateActivityRequest, CreateCouponTemplateRequest,
  CreateRecurringCouponActivityRequest, CreateRedeemCodeBatchRequest, CopyCouponTemplateRequest, GrantCouponsRequest, ReasonVersionRequest,
  SendFundingInvitationRequest, UpdateActivityRequest, UpdateCouponActivityScheduleRequest, UpdateCouponPresentationRequest, UpdateCouponTemplateRequest,
  VersionRequest
}

const idempotency = () => ({ headers: { 'Idempotency-Key': crypto.randomUUID() } })

export function listCouponActivities(params: CouponActivityQuery = {}) { return request.get<PageView<CouponActivity>>('/platform/coupon-operations/activities', { params }) as unknown as Promise<PageView<CouponActivity>> }
export function listCouponTemplates(params: CouponTemplateQuery = {}) { return request.get<PageView<CouponTemplateSummary>>('/platform/coupon-operations/templates', { params }) as unknown as Promise<PageView<CouponTemplateSummary>> }
export function getCouponActivity(id: Id) { return request.get<CouponActivity>(`/platform/coupon-activities/${id}`) as unknown as Promise<CouponActivity> }
export function getCouponTemplate(id: Id) { return request.get<CouponTemplateDetail>(`/platform/coupon-templates/${id}`) as unknown as Promise<CouponTemplateDetail> }
export function createCouponActivity(payload: CreateActivityRequest) { return request.post<CouponActivity>('/platform/coupon-activities', payload, idempotency()) as unknown as Promise<CouponActivity> }
export function createRecurringCouponActivity(payload: CreateRecurringCouponActivityRequest) { return request.post<CouponActivity>('/platform/coupon-activities/recurring', payload, idempotency()) as unknown as Promise<CouponActivity> }
export function updateCouponActivity(id: Id, payload: UpdateActivityRequest) { return request.put<CouponActivity>(`/platform/coupon-activities/${id}`, payload) as unknown as Promise<CouponActivity> }
export function getCouponActivitySchedule(id: Id) { return request.get<CouponActivityScheduleView>(`/platform/coupon-activities/${id}/schedule`) as unknown as Promise<CouponActivityScheduleView> }
export function updateCouponActivitySchedule(id: Id, payload: UpdateCouponActivityScheduleRequest) { return request.put<CouponActivityScheduleView>(`/platform/coupon-activities/${id}/schedule`, payload) as unknown as Promise<CouponActivityScheduleView> }
export function couponActivityAction(id: Id, action: 'publish' | 'pause' | 'resume' | 'end' | 'cancel', payload: VersionRequest | ReasonVersionRequest) { return request.post<CouponActivity>(`/platform/coupon-activities/${id}/${action}`, payload, idempotency()) as unknown as Promise<CouponActivity> }
export function governCouponActivity(id: Id, action: 'pause' | 'resume', payload: VersionRequest | ReasonVersionRequest) { return request.post<CouponActivity>(`/platform/coupon-governance/activities/${id}/${action}`, payload, idempotency()) as unknown as Promise<CouponActivity> }

export function createCouponTemplate(payload: CreateCouponTemplateRequest) { return request.post<CouponTemplateDetail>('/platform/coupon-templates', payload, idempotency()) as unknown as Promise<CouponTemplateDetail> }
export function updateCouponTemplate(id: Id, payload: UpdateCouponTemplateRequest) { return request.put<CouponTemplateDetail>(`/platform/coupon-templates/${id}`, payload) as unknown as Promise<CouponTemplateDetail> }
export function updateCouponTemplateScope(id: Id, payload: CouponTemplateScopeRequest) { return request.put<CouponTemplateDetail>(`/platform/coupon-templates/${id}/scope`, payload) as unknown as Promise<CouponTemplateDetail> }
export function updateCouponTemplatePresentation(id: Id, payload: UpdateCouponPresentationRequest) { return request.patch<CouponTemplateDetail>(`/platform/coupon-templates/${id}/presentation`, payload) as unknown as Promise<CouponTemplateDetail> }
export function activateCouponTemplate(id: Id, payload: VersionRequest) { return request.post<CouponTemplateDetail>(`/platform/coupon-templates/${id}/activate`, payload, idempotency()) as unknown as Promise<CouponTemplateDetail> }
export function resumeCouponTemplate(id: Id, payload: VersionRequest) { return request.post<CouponTemplateDetail>(`/platform/coupon-templates/${id}/resume`, payload, idempotency()) as unknown as Promise<CouponTemplateDetail> }
export function pauseCouponTemplate(id: Id, payload: ReasonVersionRequest) { return request.post<CouponTemplateDetail>(`/platform/coupon-templates/${id}/pause`, payload, idempotency()) as unknown as Promise<CouponTemplateDetail> }
export function archiveCouponTemplate(id: Id, payload: ReasonVersionRequest) { return request.post<CouponTemplateDetail>(`/platform/coupon-templates/${id}/archive`, payload, idempotency()) as unknown as Promise<CouponTemplateDetail> }
export function endCouponTemplate(id: Id, payload: ReasonVersionRequest) { return request.post<CouponTemplateDetail>(`/platform/coupon-templates/${id}/end`, payload, idempotency()) as unknown as Promise<CouponTemplateDetail> }
export function copyCouponTemplate(id: Id, payload: CopyCouponTemplateRequest) { return request.post<CouponTemplateDetail>(`/platform/coupon-templates/${id}/copy`, payload, idempotency()) as unknown as Promise<CouponTemplateDetail> }
export function inviteCouponFunding(id: Id, payload: SendFundingInvitationRequest) { return request.post<CouponFundingParticipation[]>(`/platform/coupon-templates/${id}/funding-invitations`, payload, idempotency()) as unknown as Promise<CouponFundingParticipation[]> }
export function grantCoupons(id: Id, payload: GrantCouponsRequest) { return request.post<BatchCouponGrantView>(`/platform/coupon-templates/${id}/grants`, payload, idempotency()) as unknown as Promise<BatchCouponGrantView> }
export function createRedeemCodeBatch(id: Id, payload: CreateRedeemCodeBatchRequest) { return request.post<CouponCodeBatchCreatedView>(`/platform/coupon-templates/${id}/redeem-code-batches`, payload, idempotency()) as unknown as Promise<CouponCodeBatchCreatedView> }
export function listRedeemCodeBatches(params: { templateId?: Id; batchNo?: string; status?: string; page?: number; pageSize?: number } = {}) { return request.get<PageView<CouponCodeBatchSummaryView>>('/platform/coupon-code-batches', { params }) as unknown as Promise<PageView<CouponCodeBatchSummaryView>> }
export function listCouponUsers(params: CouponUserQuery = {}) { return request.get<PageView<CouponUserRecord>>('/platform/coupon-operations/user-coupons', { params }) as unknown as Promise<PageView<CouponUserRecord>> }
export function listCouponRedemptions(params: CouponRedemptionQuery = {}) { return request.get<PageView<CouponRedemptionRecord>>('/platform/coupon-operations/redemptions', { params }) as unknown as Promise<PageView<CouponRedemptionRecord>> }
export function revokeUserCoupon(id: Id, payload: ReasonVersionRequest) { return request.post(`/platform/coupon-governance/user-coupons/${id}/revoke`, payload, idempotency()) }
