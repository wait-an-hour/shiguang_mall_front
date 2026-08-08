export type Id = string
export type Money = string
export type Timestamp = string

export type AdminRole = 'SUPER_ADMIN' | 'OPERATION_ADMIN' | 'AUDIT_ADMIN' | 'MERCHANT'
export type AccountStatus = 'ACTIVE' | 'DISABLED' | 'LOCKED'
export type CommonStatus = 'ENABLED' | 'DISABLED'
export type ProductStatus = 'DRAFT' | 'PENDING_REVIEW' | 'ON_SHELF' | 'OFF_SHELF' | 'REJECTED' | 'BANNED'
export type OrderStatus = 'PENDING_PAYMENT' | 'PAID' | 'PENDING_SHIPMENT' | 'PENDING_RECEIPT' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED'
export type AfterSaleStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export type PermissionCode =
  | 'admin:dashboard:view'
  | 'admin:rbac:role'
  | 'admin:rbac:account'
  | 'admin:catalog:category'
  | 'admin:catalog:brand'
  | 'admin:shop:manage'
  | 'admin:product:view'
  | 'admin:product:audit'
  | 'admin:inventory:view'
  | 'admin:order:view'
  | 'admin:after-sale:audit'
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
export type ShopMemberRole = 'SHOP_ADMIN' | 'SHOP_MEMBER'

export interface ShopMemberView {
  id: Id
  username: string
  nickname: string
  roleCode: ShopMemberRole
  roleName: string
  status: ShopMemberStatus
  phone: string | null
  createdAt: Timestamp
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

export interface PlatformProduct {
  id: Id
  name: string
  shopName: string
  categoryName: string
  brandName: string
  price: Money
  status: ProductStatus
  reason?: string
  contentVersion?: number
  createdAt: Timestamp
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

export interface PlatformOrder {
  id: Id
  orderNo: string
  shopName: string
  buyerName: string
  amount: Money
  status: OrderStatus
  products: string[]
  createdAt: Timestamp
}

export interface PlatformAfterSale {
  id: Id
  serviceNo: string
  orderNo: string
  shopName: string
  buyerName: string
  amount: Money
  reason: string
  status: AfterSaleStatus
  auditRemark?: string
  createdAt: Timestamp
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
  shopName?: string
  categoryName?: string
  page?: number
  pageSize?: number
}
