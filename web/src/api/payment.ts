import request from '@/utils/request'
import type { Id, Money, PageView, Timestamp } from '@/types/common'
import type { TradeStatus } from '@/api/trade'

export type PaymentOrderStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'CLOSED'
export type WalletStatus = 'ACTIVE' | 'FROZEN' | 'CLOSED'
export type WalletTransactionType = 'RECHARGE' | 'PAYMENT' | 'REFUND'
export type TransactionDirection = 'IN' | 'OUT'

export interface PaymentView {
  id: Id
  paymentNo: string
  tradeId: Id
  amount: Money
  status: PaymentOrderStatus
  failureReason: string | null
  paidAt: Timestamp | null
  expiresAt: Timestamp
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface PaymentResultView {
  paymentId: Id
  paymentNo: string
  status: PaymentOrderStatus
  amount: Money
  paidAt: Timestamp | null
  tradeId: Id
  tradeStatus: TradeStatus
  walletBalance: Money
}

export interface WalletView {
  walletId: Id
  balance: Money
  status: WalletStatus
  version: number
  updatedAt: Timestamp
}

export interface WalletTransactionView {
  id: Id
  transactionNo: string
  transactionType: WalletTransactionType
  direction: TransactionDirection
  amount: Money
  balanceBefore: Money
  balanceAfter: Money
  businessType: string
  businessNo: string
  remark: string | null
  createdAt: Timestamp
}

export interface WalletOperationView {
  transactionNo: string
  transactionType: WalletTransactionType
  direction: TransactionDirection
  amount: Money
  balanceBefore: Money
  balanceAfter: Money
  createdAt: Timestamp
}

function idempotencyKey() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`
}

export function createPayment(tradeId: Id, key = idempotencyKey()) {
  return request.post<PaymentView>(`/trades/${tradeId}/payments`, { paymentMethod: 'WALLET' }, { headers: { 'Idempotency-Key': key } }) as unknown as Promise<PaymentView>
}

export function confirmPayment(paymentId: Id, key = idempotencyKey()) {
  return request.post<PaymentResultView>(`/payments/${paymentId}/confirm`, undefined, { headers: { 'Idempotency-Key': key } }) as unknown as Promise<PaymentResultView>
}

export function getPaymentDetail(paymentId: Id) {
  return request.get<PaymentView>(`/payments/${paymentId}`) as unknown as Promise<PaymentView>
}

export function getWallet() {
  return request.get<WalletView>('/wallet') as unknown as Promise<WalletView>
}

export function getWalletTransactions(params: { transactionType?: WalletTransactionType; createdFrom?: string; createdTo?: string; page?: number; pageSize?: number } = {}) {
  return request.get<PageView<WalletTransactionView>>('/wallet/transactions', { params }) as unknown as Promise<PageView<WalletTransactionView>>
}

export function rechargeWallet(data: { amount: Money; remark?: string }, key = idempotencyKey()) {
  return request.post<WalletOperationView>('/wallet/recharges', data, { headers: { 'Idempotency-Key': key } }) as unknown as Promise<WalletOperationView>
}
