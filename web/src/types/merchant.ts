import type { Id, Money, Timestamp } from './common'

export type ShopStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'CLOSED'
export type DashboardTaskTone = 'warning' | 'danger' | 'info'

export interface ShopSummary {
  id: Id
  name: string
  code: string
  status: ShopStatus
  roleCode: MerchantMemberRole
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
  status: 'PENDING_SHIPMENT' | 'PENDING_RECEIPT' | 'COMPLETED' | 'AFTER_SALE'
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
export type MerchantMemberStatus = 'ACTIVE' | 'DISABLED'
export type MerchantMemberRole = 'SHOP_ADMIN' | 'SHOP_MEMBER'

export interface MerchantMemberView {
  id: Id
  username: string
  nickname: string
  roleId: Id
  roleCode: MerchantMemberRole
  roleName: string
  status: MerchantMemberStatus
  phone: string | null
  createdAt: Timestamp
}

export interface MerchantMemberQuery {
  keyword?: string
  roleId?: Id | ''
  status?: MerchantMemberStatus | ''
  page?: number
  pageSize?: number
}

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
  imageUrl?: string
  salePrice: Money
  marketPrice: Money
  barcode?: string
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
  coverImageUrl?: string | null
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
  coverImageUrl?: string | null
  galleryImageUrls: string[]
  detailHtml: string
  packageList?: string
  serviceNotes?: string
  attributes: ProductAttributeInput[]
  version: number
}

export interface CreateSkuRequest {
  skuName: string
  imageUrl?: string
  salePrice: Money
  marketPrice?: Money
  barcode?: string
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

export interface UserSummary {
  id: Id
  username: string
  nickname: string
  avatarUrl: string | null
  status: 'ACTIVE' | 'DISABLED' | 'LOCKED'
}

export interface ShopBrief {
  id: Id
  shopNo: string
  shopName: string
  logoUrl: string | null
  status: ShopStatus
}

export interface AddressSnapshot {
  recipientName: string
  recipientPhone: string
  provinceName: string
  cityName: string
  districtName: string
  detailAddress: string
}

export type OrderStatus = 'PENDING_PAYMENT' | 'PENDING_SHIPMENT' | 'PENDING_RECEIPT' | 'COMPLETED' | 'CANCELLED'
export type OrderPaymentStatus = 'UNPAID' | 'PAID' | 'PARTIALLY_REFUNDED' | 'REFUNDED'
export type OrderAction = 'SHIP' | 'VIEW_AFTER_SALE' | 'CONTACT_BUYER'
export type OrderOperationType = 'CREATE' | 'PAY' | 'CANCEL' | 'SHIP' | 'COMPLETE'
export type OperatorType = 'USER' | 'SHOP' | 'PLATFORM' | 'SYSTEM'
export type ReservationStatus = 'LOCKED' | 'RELEASED' | 'DEDUCTED'

export interface OrderItemSummaryView {
  productName: string
  skuName: string
  imageUrl: string | null
  quantity: number
}

export interface ShopOrderSummaryView {
  id: Id
  orderNo: string
  tradeId: Id
  tradeNo: string
  shop: ShopBrief
  buyer: UserSummary
  orderStatus: OrderStatus
  paymentStatus: OrderPaymentStatus
  payableAmount: Money
  refundAmount: Money
  itemSummary: OrderItemSummaryView[]
  itemKinds: number
  totalQuantity: number
  createdAt: Timestamp
  availableActions: OrderAction[]
}

export interface OrderItemView {
  id: Id
  spuId: Id
  skuId: Id
  spuNo: string
  skuNo: string
  productName: string
  skuName: string
  spec: Record<string, string>
  imageUrl: string | null
  unitPrice: Money
  quantity: number
  originalAmount: Money
  freightAmount: Money
  payableAmount: Money
  refundedQuantity: number
  refundedAmount: Money
  reservationStatus: ReservationStatus
}

export interface ShippingView {
  carrierCode: string
  carrierName: string
  trackingNo: string
  shippedAt: Timestamp
}

export interface OrderStatusHistoryView {
  fromStatus: OrderStatus | null
  toStatus: OrderStatus
  operationType: OrderOperationType
  operatorType: OperatorType
  remark: string | null
  createdAt: Timestamp
}

export interface OrderDetailView extends Omit<ShopOrderSummaryView, 'itemSummary' | 'itemKinds' | 'totalQuantity' | 'createdAt' | 'buyer'> {
  buyer?: UserSummary
  itemAmount: Money
  freightAmount: Money
  buyerRemark: string | null
  address: AddressSnapshot
  shipping: ShippingView | null
  items: OrderItemView[]
  history: OrderStatusHistoryView[]
}

export interface ShipOrderRequest {
  carrierCode: string
  carrierName: string
  trackingNo: string
}

export type AfterSaleType = 'REFUND_ONLY' | 'RETURN_REFUND'
export type AfterSaleStatus = 'PENDING' | 'REJECTED' | 'WAITING_RETURN' | 'REFUNDING' | 'COMPLETED' | 'CANCELLED'
export type RefundStatus = 'NOT_STARTED' | 'PROCESSING' | 'SUCCESS' | 'FAILED'
export type AfterSaleAction = 'APPROVE' | 'REJECT' | 'CONFIRM_RETURN_RECEIVED' | 'RETRY_REFUND'

export interface AfterSaleOrderBrief {
  id: Id
  orderNo: string
  orderStatus: OrderStatus
}

export interface AfterSaleItemView {
  id: Id
  productName: string
  skuName: string
  spec: Record<string, string>
  imageUrl: string | null
  unitPrice: Money
  purchasedQuantity: number
}

export interface AfterSaleReviewView {
  reviewerId: Id
  comment: string | null
  reviewedAt: Timestamp
}

export interface ReturnShipmentView {
  carrierCode: string
  carrierName: string
  trackingNo: string
  returnedAt: Timestamp
  receivedAt: Timestamp | null
}

export interface AfterSaleEligibilityView {
  orderId: Id
  orderItemId: Id
  orderStatus: OrderStatus
  purchasedQuantity: number
  refundedQuantity: number
  occupiedQuantity: number
  maximumRequestQuantity: number
  itemPayableAmount: Money
  refundedAmount: Money
  occupiedAmount: Money
  maximumRequestAmount: Money
  supportedTypes: AfterSaleType[]
  eligibleUntil: Timestamp | null
  eligible: boolean
  ineligibleReason: string | null
}

export interface ShopAfterSaleSummaryView {
  id: Id
  afterSaleNo: string
  requestType: AfterSaleType
  status: AfterSaleStatus
  refundStatus: RefundStatus
  order: AfterSaleOrderBrief
  shop: ShopBrief
  buyer: UserSummary
  item: AfterSaleItemView
  quantity: number
  requestedAmount: Money
  approvedAmount: Money | null
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface ShopAfterSaleDetailView extends ShopAfterSaleSummaryView {
  reasonCode: string
  reasonDescription: string | null
  evidenceUrls: string[]
  approvedQuantity: number | null
  review: AfterSaleReviewView | null
  returnShipment: ReturnShipmentView | null
  refundNo: string | null
  refundFailureReason: string | null
  refundedAt: Timestamp | null
  completedAt: Timestamp | null
  cancelledAt: Timestamp | null
  version: number
  availableActions: AfterSaleAction[]
  eligibilityAtReview: AfterSaleEligibilityView
}

export interface ApproveAfterSaleRequest {
  approvedQuantity: number
  approvedAmount: Money
  reviewComment: string | null
  version: number
}

export interface RejectAfterSaleRequest {
  reviewComment: string
  version: number
}

export interface ConfirmReturnReceivedRequest {
  remark: string | null
  version: number
}

export interface RetryRefundRequest {
  remark: string
  version: number
}
