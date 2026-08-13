import request from '@/utils/request'
import type { Id, Money, PageView, Timestamp } from '@/types/common'

export type CouponOwnerType = 'PLATFORM' | 'SHOP'
export type CouponActivityType = 'COUPON_CENTER' | 'FLASH_CLAIM' | 'NEW_USER_WELCOME' | 'TARGETED_CAMPAIGN'
export type CouponActivityStatus = 'DRAFT' | 'SCHEDULED' | 'RUNNING' | 'PAUSED' | 'ENDED' | 'CANCELLED'
export type CouponTemplateStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ENDED'
export type CouponType = 'PERCENTAGE' | 'THRESHOLD_REDUCTION' | 'CASH_RED_PACKET'
export type CouponFundingType = 'PLATFORM' | 'SHOP' | 'SHARED'
export type CouponDistributionType = 'PUBLIC_CLAIM' | 'FLASH_CLAIM' | 'REDEEM_CODE' | 'DIRECT_GRANT' | 'SYSTEM_GRANT'
export type CouponAudienceType = 'ALL_USERS' | 'NEW_USERS' | 'FIRST_ORDER_USERS' | 'SPECIFIED_USERS'
export type CouponRecurrenceType = 'DAILY' | 'WEEKLY' | 'MONTHLY'
export type CouponScheduleType = 'ONCE' | 'RECURRING'
export type CouponClaimWindowStatus = 'WAITING' | 'OPEN' | 'PAUSED' | 'ENDED'

export interface CouponShop { id: Id; shopName: string; shopNo?: string }
export interface CouponActivity {
  id: Id; activityNo: string; ownerType: CouponOwnerType; shop: CouponShop | null
  activityType: CouponActivityType; activityName: string; subtitle: string | null; bannerUrl: string | null
  startsAt: Timestamp; endsAt: Timestamp; status: CouponActivityStatus; pauseSource?: string | null; pauseReason?: string | null
  templateCount: number; issuedCount: number; consumedCount: number; couponDiscountAmount: Money
  version: number; createdAt: Timestamp; updatedAt: Timestamp; availableActions?: string[]
}
export interface CouponTemplate {
  id: Id; templateNo: string; activityId?: Id | null; activity: { id: Id; activityName: string } | null; ownerType: CouponOwnerType
  ownerShop: CouponShop | null; couponName: string; description: string | null; couponType: CouponType
  benefit: { thresholdAmount: Money | null; discountAmount: Money | null; percentageOff: string | null; maximumDiscountAmount: Money | null; displayText?: string }
  fundingType: CouponFundingType; platformShareRate: string; distributionType: CouponDistributionType; audienceType: CouponAudienceType
  claimStartsAt: Timestamp | null; claimEndsAt: Timestamp | null; totalIssueLimit: number; issuedCount: number; remainingIssueQuantity: number
  perUserLimit: number; budgetAmount: Money; budgetConsumedAmount: Money; status: CouponTemplateStatus; version: number
  scope?: CouponTemplateScopeRequest; validity?: CouponTemplateValidityRequest; newUserWithinDays?: number | null; stackMode?: 'EXCLUSIVE' | 'CROSS_OWNER'; refundRestorePolicy?: 'NEVER' | 'FULL_TRADE_ONLY'; sortOrder?: number
  createdAt: Timestamp; updatedAt: Timestamp; availableActions?: string[]
}
export interface CouponUserRecord {
  id: Id; couponNo: string; templateNo: string; couponName: string; userId: Id | null; username?: string | null
  status: string; validFrom: Timestamp; validTo: Timestamp; claimedAt: Timestamp; usedAt: Timestamp | null; version: number
}
export interface CouponRedemptionRecord {
  id: Id; redemptionNo: string; tradeNo: string; orderNo: string; shop: CouponShop | null; couponNo: string
  couponName: string; discountAmount: Money; redemptionStatus: string; createdAt: Timestamp
}

export interface CouponActivityQuery { ownerType?: CouponOwnerType; shopId?: Id; status?: CouponActivityStatus; keyword?: string; page?: number; pageSize?: number }
export interface CouponTemplateQuery { ownerType?: CouponOwnerType; shopId?: Id; status?: CouponTemplateStatus; couponType?: CouponType; keyword?: string; page?: number; pageSize?: number }
export interface CouponUserQuery { couponNo?: string; templateNo?: string; userId?: Id; status?: string; page?: number; pageSize?: number }
export interface CouponRedemptionQuery { redemptionNo?: string; tradeNo?: string; orderNo?: string; shopId?: Id; status?: string; page?: number; pageSize?: number }

export interface CreateActivityRequest { activityName: string; subtitle?: string | null; bannerUrl?: string | null; activityType: CouponActivityType; startsAt: string; endsAt: string }
export interface UpdateActivityRequest extends CreateActivityRequest { version: number }
export interface RecurringCouponSchedule {
  recurrenceType: CouponRecurrenceType
  weekdays: number[] | null
  monthDays: number[] | null
  dailyStartsAt: string
  windowDurationMinutes: number
  recurrenceStartsAt: string
  recurrenceEndsAt: string
  timezone: 'Asia/Shanghai'
}
export interface CreateRecurringCouponActivityRequest { activityName: string; subtitle?: string | null; bannerUrl?: string | null; recurrence: RecurringCouponSchedule }
export interface UpdateCouponActivityScheduleRequest { scheduleType: 'RECURRING'; recurrence: RecurringCouponSchedule; version: number }
export interface CouponActivityScheduleView {
  scheduleType: CouponScheduleType
  campaignStartsAt: Timestamp
  campaignEndsAt: Timestamp
  recurrence: RecurringCouponSchedule | null
  window: { status: CouponClaimWindowStatus; currentWindow: { startsAt: Timestamp; endsAt: Timestamp } | null; nextWindow: { startsAt: Timestamp; endsAt: Timestamp } | null }
  serverTime: Timestamp
  version: number
}
export interface CouponTemplateScopeRequest { version: number; scopeType: 'ALL' | 'SHOP' | 'CATEGORY' | 'SPU' | 'SKU'; shopIds: Id[] | null; categoryIds: Id[] | null; spuIds: Id[] | null; skuIds: Id[] | null }
export interface CouponTemplateValidityRequest { validityType: 'FIXED_RANGE' | 'RELATIVE_AFTER_CLAIM'; validFrom: string | null; validTo: string | null; effectiveDelayMinutes: number | null; validForHours: number | null }
export interface CreateCouponTemplateRequest {
  ownerType: 'PLATFORM'; activityId: Id | null; couponName: string; description: string | null; couponType: CouponType
  thresholdAmount: Money | null; discountAmount: Money | null; percentageOff: string | null; maximumDiscountAmount: Money | null
  fundingType: CouponFundingType; platformShareRate: string; scope: CouponTemplateScopeRequest; distributionType: CouponDistributionType; audienceType: CouponAudienceType
  newUserWithinDays: number | null; claimStartsAt: string | null; claimEndsAt: string | null; validity: CouponTemplateValidityRequest
  totalIssueLimit: number; perUserLimit: number; stackMode: 'EXCLUSIVE' | 'CROSS_OWNER'; refundRestorePolicy: 'NEVER' | 'FULL_TRADE_ONLY'; budgetAmount: Money; sortOrder: number
}
export interface UpdateCouponTemplateRequest extends CreateCouponTemplateRequest { version: number }
export interface VersionRequest { version: number }
export interface ReasonVersionRequest extends VersionRequest { reason: string }
export interface CopyCouponTemplateRequest { couponName: string; activityId: Id | null; copyScope: boolean; version: number }

export async function listCouponActivities(params: CouponActivityQuery = {}) { return request.get<PageView<CouponActivity>>('/platform/coupon-operations/activities', { params }) as unknown as Promise<PageView<CouponActivity>> }
export async function listCouponTemplates(params: CouponTemplateQuery = {}) { return request.get<PageView<CouponTemplate>>('/platform/coupon-operations/templates', { params }) as unknown as Promise<PageView<CouponTemplate>> }
export async function getCouponTemplate(id: Id) { return request.get<CouponTemplate>(`/platform/coupon-templates/${id}`) as unknown as Promise<CouponTemplate> }
export async function createCouponTemplate(payload: CreateCouponTemplateRequest) { return request.post<CouponTemplate>('/platform/coupon-templates', payload, { headers: { 'Idempotency-Key': crypto.randomUUID() } }) as unknown as Promise<CouponTemplate> }
export async function updateCouponTemplate(id: Id, payload: UpdateCouponTemplateRequest) { return request.put<CouponTemplate>(`/platform/coupon-templates/${id}`, payload) as unknown as Promise<CouponTemplate> }
export async function activateCouponTemplate(id: Id, payload: VersionRequest) { return request.post<CouponTemplate>(`/platform/coupon-templates/${id}/activate`, payload, { headers: { 'Idempotency-Key': crypto.randomUUID() } }) as unknown as Promise<CouponTemplate> }
export async function pauseCouponTemplate(id: Id, payload: ReasonVersionRequest) { return request.post<CouponTemplate>(`/platform/coupon-templates/${id}/pause`, payload, { headers: { 'Idempotency-Key': crypto.randomUUID() } }) as unknown as Promise<CouponTemplate> }
export async function copyCouponTemplate(id: Id, payload: CopyCouponTemplateRequest) { return request.post<CouponTemplate>(`/platform/coupon-templates/${id}/copy`, payload, { headers: { 'Idempotency-Key': crypto.randomUUID() } }) as unknown as Promise<CouponTemplate> }
export async function listCouponUsers(params: CouponUserQuery = {}) { return request.get<PageView<CouponUserRecord>>('/platform/coupon-operations/user-coupons', { params }) as unknown as Promise<PageView<CouponUserRecord>> }
export async function listCouponRedemptions(params: CouponRedemptionQuery = {}) { return request.get<PageView<CouponRedemptionRecord>>('/platform/coupon-operations/redemptions', { params }) as unknown as Promise<PageView<CouponRedemptionRecord>> }
export async function createCouponActivity(payload: CreateActivityRequest) { return request.post<CouponActivity>('/platform/coupon-activities', payload, { headers: { 'Idempotency-Key': crypto.randomUUID() } }) as unknown as Promise<CouponActivity> }
export async function createRecurringCouponActivity(payload: CreateRecurringCouponActivityRequest) { return request.post<CouponActivity>('/platform/coupon-activities/recurring', payload, { headers: { 'Idempotency-Key': crypto.randomUUID() } }) as unknown as Promise<CouponActivity> }
export async function getCouponActivitySchedule(id: Id) { return request.get<CouponActivityScheduleView>(`/platform/coupon-activities/${id}/schedule`) as unknown as Promise<CouponActivityScheduleView> }
export async function updateCouponActivitySchedule(id: Id, payload: UpdateCouponActivityScheduleRequest) { return request.put<CouponActivityScheduleView>(`/platform/coupon-activities/${id}/schedule`, payload, { headers: { 'Idempotency-Key': crypto.randomUUID() } }) as unknown as Promise<CouponActivityScheduleView> }
export async function updateCouponActivity(id: Id, payload: UpdateActivityRequest) { return request.put<CouponActivity>(`/platform/coupon-activities/${id}`, payload) as unknown as Promise<CouponActivity> }
export async function couponActivityAction(id: Id, action: 'publish' | 'pause' | 'resume' | 'end' | 'cancel', payload: VersionRequest | ReasonVersionRequest) { return request.post<CouponActivity>(`/platform/coupon-activities/${id}/${action}`, payload, { headers: { 'Idempotency-Key': crypto.randomUUID() } }) as unknown as Promise<CouponActivity> }
export async function governCouponActivity(id: Id, action: 'pause' | 'resume', payload: VersionRequest | ReasonVersionRequest) { return request.post<CouponActivity>(`/platform/coupon-governance/activities/${id}/${action}`, payload, { headers: { 'Idempotency-Key': crypto.randomUUID() } }) as unknown as Promise<CouponActivity> }
export async function revokeUserCoupon(id: Id, payload: ReasonVersionRequest) { return request.post(`/platform/coupon-governance/user-coupons/${id}/revoke`, payload, { headers: { 'Idempotency-Key': crypto.randomUUID() } }) }
