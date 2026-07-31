import type { ShopStatus } from '../types/merchant'

export const SHOP_PERMISSION = {
  ProductManage: 'shop:product:manage',
  InventoryManage: 'shop:inventory:manage',
  OrderRead: 'shop:order:read',
  OrderShip: 'shop:order:ship',
  AfterSaleManage: 'shop:after-sale:manage',
  MemberManage: 'shop:member:manage'
} as const

export const SHOP_STATUS_LABELS: Record<ShopStatus, string> = {
  PENDING: '待审核',
  ACTIVE: '营业中',
  SUSPENDED: '已暂停',
  CLOSED: '已关闭'
}

export const SHOP_STATUS_TAG_TYPES: Record<ShopStatus, 'info' | 'success' | 'warning' | 'danger'> = {
  PENDING: 'warning',
  ACTIVE: 'success',
  SUSPENDED: 'danger',
  CLOSED: 'info'
}

export const ORDER_STATUS_LABELS = {
  PENDING_SHIPMENT: '待发货',
  SHIPPED: '已发货',
  COMPLETED: '已完成',
  AFTER_SALE: '售后中'
} as const
