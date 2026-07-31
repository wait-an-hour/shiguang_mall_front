import type { EnabledStatus, InventoryTransactionType, ProductStatus, ShopStatus, StockState } from '../types/merchant'

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

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  DRAFT: '草稿',
  PENDING_REVIEW: '待审核',
  REJECTED: '审核驳回',
  OFF_SHELF: '已下架',
  ON_SHELF: '在售',
  BANNED: '已禁售'
}

export const PRODUCT_STATUS_TAG_TYPES: Record<ProductStatus, 'info' | 'success' | 'warning' | 'danger'> = {
  DRAFT: 'info',
  PENDING_REVIEW: 'warning',
  REJECTED: 'danger',
  OFF_SHELF: 'info',
  ON_SHELF: 'success',
  BANNED: 'danger'
}

export const SKU_STATUS_LABELS: Record<EnabledStatus, string> = {
  ENABLED: '启用',
  DISABLED: '停用'
}

export const SKU_STATUS_TAG_TYPES: Record<EnabledStatus, 'info' | 'success' | 'warning' | 'danger'> = {
  ENABLED: 'success',
  DISABLED: 'info'
}

export const STOCK_STATE_LABELS: Record<StockState, string> = {
  NORMAL: '库存正常',
  LOW: '库存偏低',
  OUT: '已售罄'
}

export const STOCK_STATE_TAG_TYPES: Record<StockState, 'info' | 'success' | 'warning' | 'danger'> = {
  NORMAL: 'success',
  LOW: 'warning',
  OUT: 'danger'
}

export const INVENTORY_TRANSACTION_TYPE_LABELS: Record<InventoryTransactionType, string> = {
  INBOUND: '采购入库',
  ADJUSTMENT: '库存调整',
  LOCK: '库存锁定',
  UNLOCK: '库存解锁',
  DEDUCT: '库存扣减',
  RELEASE: '库存释放'
}

export const INVENTORY_TRANSACTION_TYPE_TAG_TYPES: Record<InventoryTransactionType, 'info' | 'success' | 'warning' | 'danger'> = {
  INBOUND: 'success',
  ADJUSTMENT: 'warning',
  LOCK: 'info',
  UNLOCK: 'info',
  DEDUCT: 'danger',
  RELEASE: 'success'
}
