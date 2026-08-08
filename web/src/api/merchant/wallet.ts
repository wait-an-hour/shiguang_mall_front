import request from '@/utils/request'
import type { Id } from '@/types/common'
import type { CreateMerchantWithdrawalRequest, MerchantSettlementPage, MerchantSettlementStatus, MerchantWalletBucket, MerchantWalletTransactionPage, MerchantWalletTransactionType, MerchantWalletView, MerchantWithdrawalPage, MerchantWithdrawalStatus, MerchantWithdrawalView } from '@/types/merchantWallet'

export function getMerchantWallet(shopId: Id) {
  return request.get<MerchantWalletView>(`/shops/${shopId}/merchant-wallet`) as unknown as Promise<MerchantWalletView>
}

export interface MerchantWalletTransactionQuery {
  transactionType?: MerchantWalletTransactionType | ''
  bucket?: MerchantWalletBucket | ''
  businessType?: string
  businessNo?: string
  createdFrom?: string
  createdTo?: string
  page?: number
  pageSize?: number
}

export interface MerchantSettlementQuery {
  orderNo?: string
  settlementStatus?: MerchantSettlementStatus | ''
  createdFrom?: string
  createdTo?: string
  page?: number
  pageSize?: number
}

export interface MerchantWithdrawalQuery {
  status?: MerchantWithdrawalStatus | ''
  createdFrom?: string
  createdTo?: string
  page?: number
  pageSize?: number
}

export function getMerchantWalletTransactions(shopId: Id, params: MerchantWalletTransactionQuery = {}) {
  return request.get<MerchantWalletTransactionPage>(`/shops/${shopId}/merchant-wallet/transactions`, { params }) as unknown as Promise<MerchantWalletTransactionPage>
}

export function getMerchantSettlements(shopId: Id, params: MerchantSettlementQuery = {}) {
  return request.get<MerchantSettlementPage>(`/shops/${shopId}/merchant-wallet/settlements`, { params }) as unknown as Promise<MerchantSettlementPage>
}

export function getMerchantWithdrawals(shopId: Id, params: MerchantWithdrawalQuery = {}) {
  return request.get<MerchantWithdrawalPage>(`/shops/${shopId}/merchant-wallet/withdrawals`, { params }) as unknown as Promise<MerchantWithdrawalPage>
}

export function createMerchantWithdrawal(shopId: Id, data: CreateMerchantWithdrawalRequest) {
  return request.post<MerchantWithdrawalView>(`/shops/${shopId}/merchant-wallet/withdrawals`, data, {
    headers: { 'Idempotency-Key': crypto.randomUUID() }
  })
}
