import type { AfterSaleStatus, CommonStatus, OrderStatus, ProductStatus } from '@/types/admin'

export const COMMON_STATUS_LABEL: Record<CommonStatus, string> = { ENABLED: '启用', DISABLED: '停用' }
export const PRODUCT_STATUS_LABEL: Record<ProductStatus, string> = { DRAFT: '草稿', PENDING_REVIEW: '待审核', ON_SHELF: '上架中', OFF_SHELF: '已下架', REJECTED: '已驳回', BANNED: '已禁售' }
export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = { PENDING_PAYMENT: '待支付', PAID: '已支付', PENDING_SHIPMENT: '待发货', PENDING_RECEIPT: '待收货', SHIPPED: '已发货', COMPLETED: '已完成', CANCELLED: '已取消' }
export const AFTER_SALE_STATUS_LABEL: Record<AfterSaleStatus, string> = { PENDING: '待处理', REJECTED: '已驳回', WAITING_RETURN: '待退货', REFUNDING: '退款中', COMPLETED: '已完成', CANCELLED: '已取消' }

// 表格插槽里的 row 会被 Element Plus 泛型推断成宽泛类型，统一用函数收口，避免模板里直接索引 Record 产生隐式 any 报错。
export function getProductStatusLabel(status: ProductStatus) {
  return PRODUCT_STATUS_LABEL[status]
}

// 订单状态展示统一从这里读取，保证后台各页面的中文文案和状态码一一对应。
export function getOrderStatusLabel(status: OrderStatus) {
  return ORDER_STATUS_LABEL[status]
}

// 售后状态展示统一从这里读取，后续如果后端状态文案调整，只需要改这一处。
export function getAfterSaleStatusLabel(status: AfterSaleStatus) {
  return AFTER_SALE_STATUS_LABEL[status]
}

export function formatMoney(value: string) {
  return `¥${value}`
}
