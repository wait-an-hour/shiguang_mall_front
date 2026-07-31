import type { Id, Money, Timestamp } from './common'

export type ShopStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'CLOSED'
export type DashboardTaskTone = 'warning' | 'danger' | 'info'

export interface ShopSummary {
  id: Id
  name: string
  code: string
  status: ShopStatus
  permissions: string[]
}

export interface CurrentUserView {
  id: Id
  username: string
  displayName: string
  roles: string[]
  platformPermissions: string[]
  shops: ShopSummary[]
}

export interface DashboardTask {
  key: string
  label: string
  count: number
  description: string
  tone: DashboardTaskTone
  routeName: string
  query?: Record<string, string>
}

export interface RecentMerchantOrder {
  id: Id
  orderNo: string
  buyerName: string
  amount: Money
  status: 'PENDING_SHIPMENT' | 'SHIPPED' | 'COMPLETED' | 'AFTER_SALE'
  createdAt: Timestamp
}

export interface LowStockSku {
  id: Id
  skuNo: string
  productName: string
  availableStock: number
  lockedStock: number
}
