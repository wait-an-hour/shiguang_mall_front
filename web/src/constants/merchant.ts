import type {
  AfterSaleStatus,
  AfterSaleType,
  EnabledStatus,
  InventoryTransactionType,
  OrderPaymentStatus,
  OrderStatus,
  ProductStatus,
  RefundStatus,
  ShopStatus,
  StockState,
  RecentMerchantOrder
} from '../types/merchant'

export const SHOP_PERMISSION = {
  ProductManage: 'shop:product:manage',
  InventoryManage: 'shop:inventory:manage',
  OrderRead: 'shop:order:read',
  OrderShip: 'shop:order:ship',
  AfterSaleManage: 'shop:after-sale:manage',
  MemberManage: 'shop:member:manage',
  WalletRead: 'shop:wallet:read',
  WalletWithdraw: 'shop:wallet:withdraw'
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

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING_PAYMENT: '待付款',
  PENDING_SHIPMENT: '待发货',
  PENDING_RECEIPT: '待收货',
  COMPLETED: '已完成',
  CANCELLED: '已取消'
}

export const RECENT_ORDER_STATUS_LABELS: Record<RecentMerchantOrder['status'], string> = {
  PENDING_SHIPMENT: '待发货',
  PENDING_RECEIPT: '待收货',
  COMPLETED: '已完成',
  AFTER_SALE: '售后中'
}

export const ORDER_STATUS_TAG_TYPES: Record<OrderStatus, 'info' | 'success' | 'warning' | 'danger'> = {
  PENDING_PAYMENT: 'warning',
  PENDING_SHIPMENT: 'warning',
  PENDING_RECEIPT: 'info',
  COMPLETED: 'success',
  CANCELLED: 'danger'
}

export const ORDER_PAYMENT_STATUS_LABELS: Record<OrderPaymentStatus, string> = {
  UNPAID: '未支付',
  PAID: '已支付',
  PARTIALLY_REFUNDED: '部分退款',
  REFUNDED: '已退款'
}

export const ORDER_PAYMENT_STATUS_TAG_TYPES: Record<OrderPaymentStatus, 'info' | 'success' | 'warning' | 'danger'> = {
  UNPAID: 'warning',
  PAID: 'success',
  PARTIALLY_REFUNDED: 'warning',
  REFUNDED: 'info'
}

export const AFTER_SALE_TYPE_LABELS: Record<AfterSaleType, string> = {
  REFUND_ONLY: '仅退款',
  RETURN_REFUND: '退货退款'
}

export const AFTER_SALE_TYPE_TAG_TYPES: Record<AfterSaleType, 'info' | 'success' | 'warning' | 'danger'> = {
  REFUND_ONLY: 'info',
  RETURN_REFUND: 'warning'
}

export const AFTER_SALE_STATUS_LABELS: Record<AfterSaleStatus, string> = {
  PENDING: '待审核',
  REJECTED: '已拒绝',
  WAITING_RETURN: '待退货',
  REFUNDING: '退款中',
  COMPLETED: '已完成',
  CANCELLED: '已取消'
}

export const AFTER_SALE_STATUS_TAG_TYPES: Record<AfterSaleStatus, 'info' | 'success' | 'warning' | 'danger'> = {
  PENDING: 'warning',
  REJECTED: 'danger',
  WAITING_RETURN: 'warning',
  REFUNDING: 'warning',
  COMPLETED: 'success',
  CANCELLED: 'info'
}

export const REFUND_STATUS_LABELS: Record<RefundStatus, string> = {
  NOT_STARTED: '未开始',
  PROCESSING: '处理中',
  SUCCESS: '成功',
  FAILED: '失败'
}

export const REFUND_STATUS_TAG_TYPES: Record<RefundStatus, 'info' | 'success' | 'warning' | 'danger'> = {
  NOT_STARTED: 'info',
  PROCESSING: 'warning',
  SUCCESS: 'success',
  FAILED: 'danger'
}

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
