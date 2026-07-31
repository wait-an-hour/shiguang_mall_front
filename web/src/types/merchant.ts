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

export type ProductStatus = 'DRAFT' | 'PENDING_REVIEW' | 'REJECTED' | 'OFF_SHELF' | 'ON_SHELF' | 'BANNED'
export type EnabledStatus = 'ENABLED' | 'DISABLED'
export type StockState = 'NORMAL' | 'LOW' | 'OUT'
export type InventoryTransactionType = 'INBOUND' | 'ADJUSTMENT' | 'LOCK' | 'UNLOCK' | 'DEDUCT' | 'RELEASE'

export interface CategoryBrief {
  id: Id
  name: string
  level: number
}

export interface BrandView {
  id: Id
  name: string
  logoUrl?: string
}

export interface StockView {
  skuId: Id
  availableStock: number
  lockedStock: number
  safetyStock: number
  version: number
}

export interface ProductAttributeInput {
  name: string
  value: string
}

export interface SkuCreateInput {
  skuName: string
  imageUrl: string
  salePrice: Money
  marketPrice: Money
  barcode: string
  stock: number
}

export interface SkuContentInput {
  skuName?: string
  imageUrl?: string
}

export interface CreateProductRequest {
  productName: string
  categoryId: Id
  brandId?: Id
  subtitle?: string
  coverImageUrl: string
  galleryImageUrls: string[]
  detailHtml: string
  packageList?: string
  serviceNotes?: string
  attributes: ProductAttributeInput[]
  skus: SkuCreateInput[]
}

export interface UpdateProductContentRequest {
  productName: string
  categoryId: Id
  brandId?: Id
  subtitle?: string
  coverImageUrl: string
  galleryImageUrls: string[]
  detailHtml: string
  packageList?: string
  serviceNotes?: string
  attributes: ProductAttributeInput[]
  version: number
}

export interface CreateSkuRequest {
  skuName: string
  imageUrl: string
  salePrice: Money
  marketPrice: Money
  barcode: string
  stock: number
}

export interface UpdateSkuRequest {
  skuName?: string
  imageUrl?: string
  salePrice?: Money
  marketPrice?: Money
  barcode?: string
  status?: EnabledStatus
  version: number
}

export interface ShopSkuView {
  id: Id
  skuNo: string
  skuName: string
  imageUrl: string
  salePrice: Money
  marketPrice: Money
  barcode: string
  status: EnabledStatus
  stock: StockView
  version: number
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface ShopProductSummaryView {
  id: Id
  spuNo: string
  productName: string
  category: CategoryBrief
  brand?: BrandView
  subtitle?: string
  coverImageUrl: string
  status: ProductStatus
  minSalePrice: Money
  skuCount: number
  totalAvailableStock: number
  contentVersion: number
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface ProductStatusHistoryView {
  id: Id
  status: ProductStatus
  operatorName: string
  remark: string
  createdAt: Timestamp
}

export interface ShopProductDetailView extends ShopProductSummaryView {
  galleryImageUrls: string[]
  detailHtml: string
  packageList?: string
  serviceNotes?: string
  attributes: ProductAttributeInput[]
  skus: ShopSkuView[]
  statusHistories: ProductStatusHistoryView[]
}

export interface InventoryItemView {
  skuId: Id
  skuNo: string
  skuName: string
  spuId: Id
  spuNo: string
  productName: string
  coverImageUrl: string
  stockState: StockState
  availableStock: number
  lockedStock: number
  safetyStock: number
  version: number
  updatedAt: Timestamp
}

export interface InventoryInboundRequest {
  skuId: Id
  quantity: number
  businessNo: string
  remark?: string
}

export interface InventoryAdjustmentRequest {
  skuId: Id
  delta: number
  businessNo: string
  remark?: string
  version: number
}

export interface InventoryOperationView {
  skuId: Id
  availableStock: number
  lockedStock: number
  version: number
  operationType: InventoryTransactionType
  businessNo: string
  createdAt: Timestamp
}

export interface InventoryTransactionView {
  id: Id
  skuId: Id
  skuNo: string
  skuName: string
  productName: string
  transactionType: InventoryTransactionType
  businessType: string
  businessNo: string
  quantity: number
  beforeAvailableStock: number
  afterAvailableStock: number
  remark?: string
  createdAt: Timestamp
}
