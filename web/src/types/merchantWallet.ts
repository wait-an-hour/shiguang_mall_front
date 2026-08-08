import type { Id, Money, PageView, Timestamp } from './common'

export type MerchantWalletStatus = 'ACTIVE' | 'FROZEN' | 'CLOSED'
export type MerchantWalletBucket = 'PENDING' | 'AVAILABLE' | 'FROZEN'
export type MerchantWalletTransactionType = 'ORDER_PENDING_CREDIT' | 'SETTLEMENT_RELEASE' | 'COMMISSION_DEBIT' | 'REFUND_DEBIT' | 'WITHDRAW_FREEZE' | 'WITHDRAW_SUCCESS' | 'WITHDRAW_FAILED' | 'WITHDRAW_REJECT' | 'PLATFORM_ADJUST'
export type MerchantTransactionDirection = 'CREDIT' | 'DEBIT' | 'TRANSFER'
export type MerchantWithdrawalStatus = 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'REJECTED'
export type WithdrawalDestinationType = 'VIRTUAL_ACCOUNT'
export type MerchantSettlementStatus = 'PENDING' | 'READY' | 'SETTLED' | 'REFUNDED' | 'RECOVERY_REQUIRED'

export interface MerchantWalletView { walletId: Id; shopId: Id; currency: string; status: MerchantWalletStatus; pendingBalance: Money; availableBalance: Money; frozenBalance: Money; lifetimeGrossIncome: Money; lifetimeCommission: Money; lifetimeRefund: Money; version: number; updatedAt: Timestamp }
export interface MerchantWalletTransactionView { id: Id; transactionNo: string; transactionType: MerchantWalletTransactionType; direction: MerchantTransactionDirection; sourceBucket: MerchantWalletBucket | null; targetBucket: MerchantWalletBucket | null; bucket: MerchantWalletBucket; amount: Money; pendingBefore: Money; pendingAfter: Money; availableBefore: Money; availableAfter: Money; frozenBefore: Money; frozenAfter: Money; businessType: string; businessNo: string; orderId: Id | null; orderNo: string | null; withdrawalId: Id | null; operator: string | null; remark: string | null; createdAt: Timestamp }
export interface MerchantSettlementView { settlementId: Id; shopId: Id; orderId: Id; orderNo: string; tradeId: Id; tradeNo: string; status: MerchantSettlementStatus; grossAmount: Money; commissionRate: string; commissionRefundable: boolean; commissionAmount: Money; buyerRefundAmount: Money; commissionRefundAmount: Money; merchantRefundAmount: Money; netAmount: Money; pendingAmount: Money; releasedAmount: Money; availableAt: Timestamp | null; settledAt: Timestamp | null; createdAt: Timestamp; updatedAt: Timestamp }
export interface MerchantWithdrawalView { withdrawalId: Id; withdrawalNo: string; shopId: Id; status: MerchantWithdrawalStatus; amount: Money; feeAmount: Money; netAmount: Money; destinationType: WithdrawalDestinationType; destinationAccountMasked: string; failureReason: string | null; requestedAt: Timestamp; completedAt: Timestamp | null }
export interface CreateMerchantWithdrawalRequest { amount: Money; destinationType: WithdrawalDestinationType; destinationAccount: string; remark?: string }
export type MerchantWalletTransactionPage = PageView<MerchantWalletTransactionView>
export type MerchantSettlementPage = PageView<MerchantSettlementView>
export type MerchantWithdrawalPage = PageView<MerchantWithdrawalView>
