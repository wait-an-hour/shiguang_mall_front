export type Id = string
export type Money = string
export type Timestamp = string

export type AdminRole = 'SUPER_ADMIN' | 'OPERATION_ADMIN' | 'AUDIT_ADMIN' | 'MERCHANT'
export type AccountStatus = 'ACTIVE' | 'FROZEN'
export type CommonStatus = 'ENABLED' | 'DISABLED'
export type ProductStatus = 'ON_SHELF' | 'OFF_SHELF' | 'REJECTED'
export type OrderStatus = 'PENDING_PAYMENT' | 'PAID' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED'
export type AfterSaleStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export type PermissionCode =
  | 'admin:dashboard:view'
  | 'admin:rbac:role'
  | 'admin:rbac:account'
  | 'admin:catalog:category'
  | 'admin:catalog:brand'
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

export interface RoleRecord {
  id: Id
  name: string
  code: AdminRole
  description: string
  permissions: PermissionCode[]
  createdAt: Timestamp
}

export interface CategoryRecord {
  id: Id
  parentId?: Id
  name: string
  level: number
  sort: number
  status: CommonStatus
  children?: CategoryRecord[]
}

export interface BrandRecord {
  id: Id
  name: string
  initial: string
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
}

export interface ListQuery {
  keyword?: string
  status?: string
  shopName?: string
  categoryName?: string
  page?: number
  pageSize?: number
}
