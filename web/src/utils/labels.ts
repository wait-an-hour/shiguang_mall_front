import type { AfterSaleStatus, CommonStatus, OrderStatus, ProductStatus, RoleCode } from '@/types/admin'

export const ADMIN_ROLE_LABEL: Record<RoleCode, string> = {
  SUPER_ADMIN: '超级管理员',
  OPERATION_ADMIN: '运营管理员',
  AUDIT_ADMIN: '售后审核员',
  MERCHANT: '商家',
  CUSTOMER: '普通用户',
  SHOP_ADMIN: '店铺管理员',
  SHOP_PRODUCT_OPERATOR: '店铺商品运营',
  SHOP_ORDER_OPERATOR: '店铺订单客服',
  SHOP_INVENTORY_OPERATOR: '店铺库存人员',
  PLATFORM_SHOP_ADMIN: '平台店铺管理员',
  PLATFORM_PRODUCT_AUDITOR: '平台商品审核员'
}

export const PERMISSION_RESOURCE_LABEL: Record<string, string> = {
  '/api/platform/after-sale-appeals/**': '平台处理售后申诉',
  '/api/after-sales/*/appeal': '提交本人售后申诉',
  '/api/assets/images': '上传图片到对象存储',
  '/api/internal/tasks/**': '平台执行内部任务',
  '/api/platform/operations/**': '平台运营与查询',
  '/api/platform/catalog/**': '平台目录与品牌',
  '/api/platform/rbac/**': '平台角色与权限',
  '/api/platform/products/bans/**': '商品禁售与解禁',
  '/api/platform/products/reviews/**': '商品审核与历史',
  '/api/platform/shops/**': '平台店铺管理',
  '/api/wallet/recharges': '钱包充值',
  '/api/wallet/**': '钱包管理',
  '/api/after-sales': '售后列表',
  '/api/orders/**': '订单管理',
  '/api/trades/**': '交易管理',
  '/api/cart/**': '购物车',
  '/api/products/**': '商品管理'
}

export const COMMON_STATUS_LABEL: Record<CommonStatus, string> = { ENABLED: '启用', DISABLED: '停用' }
export const PRODUCT_STATUS_LABEL: Record<ProductStatus, string> = { DRAFT: '草稿', PENDING_REVIEW: '待审核', ON_SHELF: '上架中', OFF_SHELF: '已下架', REJECTED: '已驳回', BANNED: '已禁售' }
export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = { PENDING_PAYMENT: '待支付', PAID: '已支付', PENDING_SHIPMENT: '待发货', PENDING_RECEIPT: '待收货', SHIPPED: '已发货', COMPLETED: '已完成', CANCELLED: '已取消' }
// 售后状态文案统一在这里维护，避免各个页面分别写死导致筛选、表格、详情页文案不一致。
export const AFTER_SALE_STATUS_LABEL: Record<AfterSaleStatus, string> = { PENDING: '待商家处理', REJECTED: '已驳回', WAITING_RETURN: '待退货', REFUNDING: '退款中', COMPLETED: '已完成', CANCELLED: '已取消' }

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

export function getPermissionResourceZhLabel(resource: string) {
  return PERMISSION_RESOURCE_LABEL[resource] ?? resource
}

export function formatMoney(value: string) {
  return `¥${value}`
}
