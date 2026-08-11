export type Id = string
export type Money = string
export type Timestamp = string

// 平台端与商家端会共用一部分账号模型，所以这里把前端会展示或判断到的角色一次性补齐。
// 这样登录态、菜单权限、角色管理页和账号管理页可以使用同一套类型，避免不同页面各自写死角色常量。
export type AdminRole =
  | 'SUPER_ADMIN'
  | 'OPERATION_ADMIN'
  | 'AUDIT_ADMIN'
  | 'MERCHANT'
  | 'CUSTOMER'
  | 'SHOP_ADMIN'
  | 'SHOP_PRODUCT_OPERATOR'
  | 'SHOP_ORDER_OPERATOR'
  | 'SHOP_INVENTORY_OPERATOR'
  | 'PLATFORM_SHOP_ADMIN'
  | 'PLATFORM_PRODUCT_AUDITOR'
export type AccountStatus = 'ACTIVE' | 'DISABLED' | 'LOCKED'
export type CommonStatus = 'ENABLED' | 'DISABLED'
export type ProductStatus = 'DRAFT' | 'PENDING_REVIEW' | 'ON_SHELF' | 'OFF_SHELF' | 'REJECTED' | 'BANNED'
export type OrderStatus = 'PENDING_PAYMENT' | 'PAID' | 'PENDING_SHIPMENT' | 'PENDING_RECEIPT' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED'
export type AfterSaleStatus = 'PENDING' | 'REJECTED' | 'WAITING_RETURN' | 'REFUNDING' | 'COMPLETED' | 'CANCELLED'
export type PermissionCode =
  | 'admin:dashboard:view'
  | 'admin:rbac:role'
  | 'admin:rbac:account'
  | 'admin:catalog:category'
  | 'admin:catalog:brand'
  | 'admin:shop:manage'
  | 'admin:shop:member:manage'
  | 'admin:product:view'
  | 'admin:product:audit'
  | 'admin:inventory:view'
  | 'admin:order:view'
  | 'admin:after-sale:audit'
  | 'admin:operation:read'
  | 'shop:home:view'

export interface PlatformUser {
  id: Id
  username: string
  displayName: string
  role: AdminRole
  permissions: PermissionCode[]
  status: AccountStatus
}

export interface PlatformAccount extends PlatformUser {
  phone: string
  ownerShopName?: string
  createdAt: Timestamp
}

export type ShopMemberStatus = 'ACTIVE' | 'DISABLED'

export interface ShopMemberView {
  shopId: Id
  user: {
    id: Id
    username: string
    nickname: string
    avatarUrl: string | null
    status: AccountStatus
  }
  role: {
    id: Id
    roleCode: string
    roleName: string
    scopeType: 'PLATFORM' | 'SHOP'
    description: string | null
    status: ShopMemberStatus
    createdAt: Timestamp
    updatedAt: Timestamp
  }
  status: ShopMemberStatus
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface ShopMemberQuery {
  keyword?: string
  roleId?: Id | ''
  status?: ShopMemberStatus | ''
  page?: number
  pageSize?: number
}

export interface RoleRecord {
  id: Id
  name: string
  code: AdminRole
  description: string
  permissions: PermissionCode[]
  permissionIds?: Id[]
  createdAt: Timestamp
}

export interface CategoryRecord {
  id: Id
  parentId?: Id
  name: string
  code?: string
  level: number
  sort: number
  status: CommonStatus
  children?: CategoryRecord[]
}

export interface BrandRecord {
  id: Id
  name: string
  code?: string
  initial: string
  logoUrl?: string | null
  status: CommonStatus
  createdAt: Timestamp
}

export interface PlatformProductSku {
  id: Id
  skuNo: string
  skuName: string
  imageUrl?: string | null
  salePrice: Money
  marketPrice: Money
  barcode: string
  status: CommonStatus
  version: number
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface PlatformProduct {
  id: Id
  spuNo?: string
  name: string
  coverImageUrl?: string | null
  shopName: string
  categoryName: string
  brandName: string
  price: Money
  skuCount?: number
  totalAvailableStock?: number
  status: ProductStatus
  reason?: string
  contentVersion?: number
  createdAt: Timestamp
  updatedAt?: Timestamp
  skus?: PlatformProductSku[]
}

export interface SkuInventory {
  id: Id
  productName: string
  skuName: string
  shopName: string
  stock: number
  warningStock: number
  lockedStock: number
  updatedAt: Timestamp
}

export interface PlatformOrderItem {
  productName: string
  skuName: string
  quantity: number
  imageUrl?: string | null
  unitPrice?: Money
  payableAmount?: Money
}

export interface PlatformOrder {
  id: Id
  orderNo: string
  tradeNo?: string
  shopName: string
  buyerName: string
  amount: Money
  refundAmount: Money
  status: OrderStatus
  paymentStatus: string
  products: string[]
  orderItems: PlatformOrderItem[]
  itemKinds: number
  totalQuantity: number
  availableActions: string[]
  createdAt: Timestamp
  paidAt?: Timestamp | null
  shippedAt?: Timestamp | null
  receivedAt?: Timestamp | null
  completedAt?: Timestamp | null
  carrierName?: string | null
  trackingNo?: string | null
  receiverName?: string | null
  receiverPhone?: string | null
  receiverAddress?: string | null
}

export interface PlatformAfterSale {
  id: Id
  serviceNo: string
  orderNo: string
  shopName: string
  buyerName: string
  requestedAmount: Money
  reason: string
  status: AfterSaleStatus
  auditRemark?: string
  createdAt: Timestamp
}

export type AfterSaleAppealStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export type AfterSaleAppealDecision = 'APPROVE' | 'REJECT'
export type AfterSaleAppealTriggerType = 'MERCHANT_REJECTED' | 'MERCHANT_TIMEOUT'
export type AfterSaleType = 'REFUND_ONLY' | 'RETURN_REFUND'

export interface AppealShopSummary { id: Id; name: string; code: string; status: string; permissions: string[] }
export interface AppealUserSummary { id: Id; username: string; nickname: string; avatarUrl: string | null; status: string }
export interface AppealOperatorBrief { id: Id; username: string; displayName: string }
export interface AppealSummary {
  id: Id
  appealNo: string
  afterSaleId: Id
  afterSaleNo: string
  triggerType: AfterSaleAppealTriggerType
  status: AfterSaleAppealStatus
  shop: AppealShopSummary
  buyer: AppealUserSummary
  requestType: AfterSaleType
  requestedAmount: Money
  createdAt: Timestamp
  decidedAt: Timestamp | null
}
export interface AppealDetail {
  id: Id
  appealNo: string
  afterSale: { afterSaleId: Id; afterSaleNo: string; requestType: AfterSaleType; status: string; refundStatus: string; order: { id: Id; orderNo: string; orderStatus: string }; requestedAmount: Money; approvedAmount: Money | null }
  triggerType: AfterSaleAppealTriggerType
  status: AfterSaleAppealStatus
  reasonCode: string
  reasonDescription: string
  evidenceUrls: string[]
  merchantReview: { reviewerId: Id; comment: string; reviewedAt: Timestamp } | null
  decision: AfterSaleAppealDecision | null
  approvedQuantity: number | null
  approvedAmount: Money | null
  decidedBy: AppealOperatorBrief | null
  decisionComment: string | null
  decidedAt: Timestamp | null
  version: number
  createdAt: Timestamp
  updatedAt: Timestamp
  shop: AppealShopSummary
  buyer: AppealUserSummary
  order: { id: Id; orderNo: string; orderStatus: string }
  item: { id: Id; productName: string; skuName: string; spec: Record<string, string>; imageUrl: string | null; unitPrice: Money; purchasedQuantity: number } | null
}

export interface PageResult<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
  totalPages?: number
}

export interface ListQuery {
  keyword?: string
  status?: string
  shopId?: Id | ''
  categoryId?: Id | ''
  shopName?: string
  categoryName?: string
  page?: number
  pageSize?: number
}
