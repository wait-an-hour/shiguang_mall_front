import type { Id, Money, PageView, Timestamp } from './common'

export type CouponOwnerType = 'PLATFORM' | 'SHOP'
export type CouponActivityType = 'COUPON_CENTER' | 'FLASH_CLAIM' | 'NEW_USER_WELCOME' | 'TARGETED_CAMPAIGN'
export type CouponActivityStatus = 'DRAFT' | 'SCHEDULED' | 'RUNNING' | 'PAUSED' | 'ENDED' | 'CANCELLED'
export type CouponTemplateStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ENDED' | 'ARCHIVED'
export type CouponType = 'PERCENTAGE' | 'THRESHOLD_REDUCTION' | 'CASH_RED_PACKET'
export type CouponFundingType = 'PLATFORM' | 'SHOP' | 'SHARED'
export type CouponDistributionType = 'PUBLIC_CLAIM' | 'FLASH_CLAIM' | 'REDEEM_CODE' | 'DIRECT_GRANT' | 'SYSTEM_GRANT'
export type CouponAudienceType = 'ALL_USERS' | 'NEW_USERS' | 'FIRST_ORDER_USERS' | 'SPECIFIED_USERS'
export type CouponRecurrenceType = 'DAILY' | 'WEEKLY' | 'MONTHLY'
export type CouponScheduleType = 'ONCE' | 'RECURRING'
export type CouponClaimWindowStatus = 'WAITING' | 'OPEN' | 'PAUSED' | 'ENDED'
export type CouponFundingParticipationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED'
export type CouponFundingDecision = 'ACCEPT' | 'REJECT'
export type CouponRedeemCodeStatus = 'ACTIVE' | 'EXHAUSTED' | 'REVOKED' | 'EXPIRED'

export interface CouponShop { id: Id; shopName: string; shopNo?: string }

export interface CouponActivity {
  id: Id; activityNo: string; ownerType: CouponOwnerType; shop: CouponShop | null
  activityType: CouponActivityType; activityName: string; subtitle: string | null; bannerUrl: string | null
  startsAt: Timestamp; endsAt: Timestamp; status: CouponActivityStatus; pauseSource?: string | null; pauseReason?: string | null
  templateCount: number; issuedCount: number; consumedCount: number; couponDiscountAmount: Money
  version: number; createdAt: Timestamp; updatedAt: Timestamp; availableActions: string[]
}

export interface CouponTemplateSummary {
  id: Id; templateNo: string; couponName: string; ownerType: CouponOwnerType; ownerShop: CouponShop | null
  couponType: CouponType; distributionType: CouponDistributionType; status: CouponTemplateStatus
  issuedCount: number; totalIssueLimit: number; budgetAmount: Money; version: number
}

export interface CouponBenefit { thresholdAmount: Money | null; discountAmount: Money | null; percentageOff: string | null; maximumDiscountAmount: Money | null; displayText: string }
export interface CouponScopeTarget { scopeType: CouponTemplateScopeType; targetId: Id; targetNo?: string; targetName?: string; shopId?: Id }
export type CouponTemplateScopeType = 'ALL' | 'SHOP' | 'CATEGORY' | 'SPU' | 'SKU'
export interface CouponTemplateScope {
  scopeType: CouponTemplateScopeType
  summary?: string
  shopIds?: Id[] | null
  categoryIds?: Id[] | null
  spuIds?: Id[] | null
  skuIds?: Id[] | null
  targets?: CouponScopeTarget[]
  targetCount?: number
}
export interface CouponTemplateValidity { validityType: 'FIXED_RANGE' | 'RELATIVE_AFTER_CLAIM'; validFrom: Timestamp | null; validTo: Timestamp | null; effectiveDelayMinutes: number | null; validForHours: number | null; summary?: string }

export interface CouponTemplateDetail {
  id: Id; templateNo: string; activity: CouponActivity | null; ownerType: CouponOwnerType; ownerShop: CouponShop | null
  couponName: string; description: string | null; couponType: CouponType; benefit: CouponBenefit
  fundingType: CouponFundingType; platformShareRate: string; fundingParticipations?: CouponFundingParticipation[]
  scope: CouponTemplateScope; distributionType: CouponDistributionType; audienceType: CouponAudienceType
  newUserWithinDays: number | null; claimStartsAt: Timestamp | null; claimEndsAt: Timestamp | null; validity: CouponTemplateValidity
  totalIssueLimit: number; issuedCount: number; remainingIssueQuantity: number; perUserLimit: number
  stackMode: 'EXCLUSIVE' | 'CROSS_OWNER'; refundRestorePolicy: 'NEVER' | 'FULL_TRADE_ONLY'
  budgetAmount: Money; budgetReservedAmount?: Money; budgetConsumedAmount?: Money; budgetReversedAmount?: Money
  status: CouponTemplateStatus; firstIssuedAt?: Timestamp | null; sortOrder: number; version: number
  createdAt?: Timestamp; updatedAt?: Timestamp; availableActions: string[]
}

export interface CouponActivityQuery { ownerType?: CouponOwnerType; shopId?: Id; status?: CouponActivityStatus | ''; activityType?: CouponActivityType | ''; keyword?: string; page?: number; pageSize?: number; sort?: string }
export interface CouponTemplateQuery { ownerType?: CouponOwnerType; shopId?: Id; activityId?: Id; status?: CouponTemplateStatus | ''; couponType?: CouponType | ''; distributionType?: CouponDistributionType | ''; keyword?: string; page?: number; pageSize?: number; sort?: string }

export interface CreateActivityRequest { activityName: string; subtitle?: string | null; bannerUrl?: string | null; activityType: CouponActivityType; startsAt: string; endsAt: string }
export interface UpdateActivityRequest extends CreateActivityRequest { version: number }
export interface RecurringCouponSchedule { recurrenceType: CouponRecurrenceType; weekdays: number[] | null; monthDays: number[] | null; dailyStartsAt: string; windowDurationMinutes: number; recurrenceStartsAt: string; recurrenceEndsAt: string; timezone: 'Asia/Shanghai' }
export interface CreateRecurringCouponActivityRequest { activityName: string; subtitle?: string | null; bannerUrl?: string | null; recurrence: RecurringCouponSchedule }
export interface UpdateCouponActivityScheduleRequest { scheduleType: 'RECURRING'; recurrence: RecurringCouponSchedule; version: number }
export interface CouponActivityScheduleView { scheduleType: CouponScheduleType; campaignStartsAt: Timestamp; campaignEndsAt: Timestamp; recurrence: RecurringCouponSchedule | null; window: { status: CouponClaimWindowStatus; currentWindow: { startsAt: Timestamp; endsAt: Timestamp } | null; nextWindow: { startsAt: Timestamp; endsAt: Timestamp } | null }; serverTime: Timestamp; version: number }

export interface CreateCouponTemplateRequest {
  ownerType?: 'PLATFORM'; activityId: Id | null; couponName: string; description: string | null; couponType: CouponType
  thresholdAmount: Money | null; discountAmount: Money | null; percentageOff: string | null; maximumDiscountAmount: Money | null
  fundingType?: CouponFundingType; platformShareRate?: string; scope: CouponTemplateScopeRequest; distributionType: CouponDistributionType; audienceType: CouponAudienceType
  newUserWithinDays: number | null; claimStartsAt: string | null; claimEndsAt: string | null; validity: CouponTemplateValidityRequest
  totalIssueLimit: number; perUserLimit: number; stackMode: 'EXCLUSIVE' | 'CROSS_OWNER'; refundRestorePolicy: 'NEVER' | 'FULL_TRADE_ONLY'; budgetAmount: Money; sortOrder: number
}
export interface UpdateCouponTemplateRequest extends CreateCouponTemplateRequest { version: number }
export interface CouponTemplateScopeRequest { version: number; scopeType: CouponTemplateScopeType; shopIds: Id[] | null; categoryIds: Id[] | null; spuIds: Id[] | null; skuIds: Id[] | null }
export interface CouponTemplateValidityRequest { validityType: 'FIXED_RANGE' | 'RELATIVE_AFTER_CLAIM'; validFrom: string | null; validTo: string | null; effectiveDelayMinutes: number | null; validForHours: number | null }
export interface VersionRequest { version: number }
export interface ReasonVersionRequest extends VersionRequest { reason: string }
export interface CopyCouponTemplateRequest { couponName: string; activityId: Id | null; copyScope: boolean; version: number }
export interface UpdateCouponPresentationRequest { couponName?: string; description?: string | null; sortOrder?: number; version: number }

export interface CouponFundingParticipation { id: Id; templateId: Id; templateNo: string; shopId: Id; shop: CouponShop | null; platformShareRate: string; shopShareRate: string; status: CouponFundingParticipationStatus; invitedBy?: string; invitedAt?: Timestamp; decidedBy?: string; decidedAt?: Timestamp; decisionReason?: string | null; version: number; availableActions: string[] }
export interface SendFundingInvitationRequest { shopIds: Id[]; version: number }
export interface DecideCouponFundingRequest { decision: CouponFundingDecision; reason: string | null; version: number }
export interface GrantCouponsRequest { userIds: Id[]; reason: string; externalReference?: string | null }
export interface CouponGrantResult { userId: Id; success: boolean; userCouponId: Id | null; couponNo: string | null; errorCode: string | null }
export interface BatchCouponGrantView { templateId: Id; requested: number; succeeded: number; failed: number; results: CouponGrantResult[] }
export interface CreateRedeemCodeBatchRequest { quantity: number; codePrefix?: string; reason: string }
export interface CouponCodeBatchCreatedView { batchNo: string; templateId: Id; quantity: number; codes: string[] }
export interface CouponCodeBatchSummaryView { batchNo: string; templateId: Id; status: CouponRedeemCodeStatus; total: number; active: number; redeemed: number; revoked: number; createdAt: Timestamp }
export interface CouponUserRecord { id: Id; couponNo: string; templateNo: string; userId: Id; status: string; validTo: Timestamp }
export interface CouponRedemptionRecord { id: Id; redemptionNo: string; tradeId: Id; orderId: Id; shopId: Id | null; status: string; discountAmount: Money; platformFundedAmount?: Money; shopFundedAmount?: Money; createdAt: Timestamp }
export interface CouponUserQuery { couponNo?: string; templateNo?: string; userId?: Id; status?: string; page?: number; pageSize?: number }
export interface CouponRedemptionQuery { redemptionNo?: string; tradeNo?: string; orderNo?: string; shopId?: Id; status?: string; page?: number; pageSize?: number }
export type CouponPage<T> = PageView<T>
