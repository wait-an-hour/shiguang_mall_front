import request from '@/utils/request'
import type { Id } from '@/types/common'
import type { MerchantSettlementPage, MerchantWalletPage, MerchantWalletTransactionPage, MerchantWithdrawalPage } from '@/types/merchantWallet'

export interface PlatformMerchantWalletQuery {
  shopId?: Id
  page?: number
  pageSize?: number
}

export function getPlatformMerchantWallets(params: PlatformMerchantWalletQuery = {}) {
  return request.get<MerchantWalletPage>('/platform/operations/merchant-wallets', { params }) as unknown as Promise<MerchantWalletPage>
}

export function getPlatformMerchantWalletTransactions(params: PlatformMerchantWalletQuery = {}) {
  return request.get<MerchantWalletTransactionPage>('/platform/operations/merchant-wallet-transactions', { params }) as unknown as Promise<MerchantWalletTransactionPage>
}

export function getPlatformMerchantSettlements(params: PlatformMerchantWalletQuery = {}) {
  return request.get<MerchantSettlementPage>('/platform/operations/settlements', { params }) as unknown as Promise<MerchantSettlementPage>
}

export function getPlatformMerchantWithdrawals(params: PlatformMerchantWalletQuery = {}) {
  return request.get<MerchantWithdrawalPage>('/platform/operations/withdrawals', { params }) as unknown as Promise<MerchantWithdrawalPage>
}
