import type { Id, PageView } from '../../types/common'
import type {
  AfterSaleStatus,
  AfterSaleType,
  ApproveAfterSaleRequest,
  ConfirmReturnReceivedRequest,
  RefundStatus,
  RejectAfterSaleRequest,
  RetryRefundRequest,
  ShopAfterSaleDetailView,
  ShopAfterSaleSummaryView,
  ShopBrief,
  UserSummary
} from '../../types/merchant'

export interface MerchantAfterSaleQuery {
  page?: number
  pageSize?: number
  status?: AfterSaleStatus | ''
  refundStatus?: RefundStatus | ''
  requestType?: AfterSaleType | ''
  keyword?: string
  createdFrom?: string
  createdTo?: string
}

const shop: ShopBrief = { id: 'SHOP202607260001', shopNo: 'SHOP-SG-001', shopName: '时光数码旗舰店', logoUrl: null, status: 'ACTIVE' }
const buyers: UserSummary[] = [
  { id: 'USER202607260004', username: 'momo', nickname: '沫沫', avatarUrl: null, status: 'ACTIVE' },
  { id: 'USER202607260002', username: 'linyi', nickname: '林一', avatarUrl: null, status: 'ACTIVE' },
  { id: 'USER202607260003', username: 'zhouzhou', nickname: '周周', avatarUrl: null, status: 'ACTIVE' },
  { id: 'USER202607260005', username: 'xiaoyu', nickname: '小雨', avatarUrl: null, status: 'ACTIVE' }
]

const afterSales: ShopAfterSaleDetailView[] = [
  {
    id: 'AS202607310001',
    afterSaleNo: 'AS202607310001',
    requestType: 'REFUND_ONLY',
    status: 'PENDING',
    refundStatus: 'NOT_STARTED',
    order: { id: 'ORDER202607280004', orderNo: 'SO202607280004', orderStatus: 'COMPLETED' },
    shop,
    buyer: buyers[0],
    item: { id: 'OI202607280004', productName: 'iPhone 16 黑色 512GB', skuName: '黑色 512GB', spec: { 颜色: '黑色', 容量: '512GB' }, imageUrl: 'https://dummyimage.com/120x120/e5e7eb/64748b&text=512G', unitPrice: '6999.00', purchasedQuantity: 1 },
    quantity: 1,
    requestedAmount: '99.00',
    approvedAmount: null,
    createdAt: '2026-07-31T10:10:00.000+08:00',
    updatedAt: '2026-07-31T10:10:00.000+08:00',
    reasonCode: 'PRICE_PROTECTION',
    reasonDescription: '刚收到商品就降价，希望退还差价。',
    evidenceUrls: ['https://dummyimage.com/360x240/f8fafc/64748b&text=Evidence'],
    approvedQuantity: null,
    review: null,
    returnShipment: null,
    refundNo: null,
    refundFailureReason: null,
    refundedAt: null,
    completedAt: null,
    cancelledAt: null,
    version: 1,
    availableActions: ['APPROVE', 'REJECT'],
    eligibilityAtReview: { orderId: 'ORDER202607280004', orderItemId: 'OI202607280004', orderStatus: 'COMPLETED', purchasedQuantity: 1, refundedQuantity: 0, occupiedQuantity: 0, maximumRequestQuantity: 1, itemPayableAmount: '6999.00', refundedAmount: '0.00', occupiedAmount: '0.00', maximumRequestAmount: '6999.00', supportedTypes: ['REFUND_ONLY', 'RETURN_REFUND'], eligibleUntil: '2026-08-07T23:59:59.000+08:00', eligible: true, ineligibleReason: null }
  },
  {
    id: 'AS202607300002',
    afterSaleNo: 'AS202607300002',
    requestType: 'RETURN_REFUND',
    status: 'WAITING_RETURN',
    refundStatus: 'NOT_STARTED',
    order: { id: 'ORDER202607300002', orderNo: 'SO202607300002', orderStatus: 'PENDING_RECEIPT' },
    shop,
    buyer: buyers[1],
    item: { id: 'OI202607300002', productName: '磁吸保护壳 雾蓝色', skuName: '雾蓝色', spec: { 颜色: '雾蓝色' }, imageUrl: 'https://dummyimage.com/120x120/dbeafe/64748b&text=Blue', unitPrice: '99.00', purchasedQuantity: 2 },
    quantity: 1,
    requestedAmount: '99.00',
    approvedAmount: '99.00',
    createdAt: '2026-07-30T17:30:00.000+08:00',
    updatedAt: '2026-07-31T09:20:00.000+08:00',
    reasonCode: 'NOT_AS_EXPECTED',
    reasonDescription: '颜色与预期不一致，已寄回。',
    evidenceUrls: [],
    approvedQuantity: 1,
    review: { reviewerId: 'USER_SHOP_ADMIN', comment: '同意退货退款，请保持商品完好寄回。', reviewedAt: '2026-07-30T18:00:00.000+08:00' },
    returnShipment: { carrierCode: 'SF', carrierName: '顺丰速运', trackingNo: 'SFRETURN2026073002', returnedAt: '2026-07-31T09:20:00.000+08:00', receivedAt: null },
    refundNo: null,
    refundFailureReason: null,
    refundedAt: null,
    completedAt: null,
    cancelledAt: null,
    version: 2,
    availableActions: ['CONFIRM_RETURN_RECEIVED'],
    eligibilityAtReview: { orderId: 'ORDER202607300002', orderItemId: 'OI202607300002', orderStatus: 'PENDING_RECEIPT', purchasedQuantity: 2, refundedQuantity: 0, occupiedQuantity: 1, maximumRequestQuantity: 1, itemPayableAmount: '198.00', refundedAmount: '0.00', occupiedAmount: '99.00', maximumRequestAmount: '99.00', supportedTypes: ['RETURN_REFUND'], eligibleUntil: '2026-08-06T23:59:59.000+08:00', eligible: true, ineligibleReason: null }
  },
  {
    id: 'AS202607290003',
    afterSaleNo: 'AS202607290003',
    requestType: 'RETURN_REFUND',
    status: 'REFUNDING',
    refundStatus: 'FAILED',
    order: { id: 'ORDER202607290003', orderNo: 'SO202607290003', orderStatus: 'COMPLETED' },
    shop,
    buyer: buyers[2],
    item: { id: 'OI202607290003', productName: 'Type-C 编织数据线 1m', skuName: '白色 1m', spec: { 长度: '1m' }, imageUrl: 'https://dummyimage.com/120x120/f1f5f9/64748b&text=1m', unitPrice: '39.00', purchasedQuantity: 1 },
    quantity: 1,
    requestedAmount: '39.00',
    approvedAmount: '39.00',
    createdAt: '2026-07-29T19:10:00.000+08:00',
    updatedAt: '2026-07-31T08:30:00.000+08:00',
    reasonCode: 'QUALITY_ISSUE',
    reasonDescription: '线材接触不稳定。',
    evidenceUrls: ['https://dummyimage.com/360x240/fee2e2/991b1b&text=Issue'],
    approvedQuantity: 1,
    review: { reviewerId: 'USER_SHOP_ADMIN', comment: '同意退货退款。', reviewedAt: '2026-07-29T20:00:00.000+08:00' },
    returnShipment: { carrierCode: 'YTO', carrierName: '圆通速递', trackingNo: 'YTRETURN2026072903', returnedAt: '2026-07-30T09:10:00.000+08:00', receivedAt: '2026-07-31T08:20:00.000+08:00' },
    refundNo: 'RF202607310003',
    refundFailureReason: '钱包退款通道暂时不可用，请重试。',
    refundedAt: null,
    completedAt: null,
    cancelledAt: null,
    version: 3,
    availableActions: ['RETRY_REFUND'],
    eligibilityAtReview: { orderId: 'ORDER202607290003', orderItemId: 'OI202607290003', orderStatus: 'COMPLETED', purchasedQuantity: 1, refundedQuantity: 0, occupiedQuantity: 1, maximumRequestQuantity: 1, itemPayableAmount: '39.00', refundedAmount: '0.00', occupiedAmount: '39.00', maximumRequestAmount: '39.00', supportedTypes: ['RETURN_REFUND'], eligibleUntil: '2026-08-05T23:59:59.000+08:00', eligible: true, ineligibleReason: null }
  },
  {
    id: 'AS202607280004',
    afterSaleNo: 'AS202607280004',
    requestType: 'REFUND_ONLY',
    status: 'COMPLETED',
    refundStatus: 'SUCCESS',
    order: { id: 'ORDER202607280004', orderNo: 'SO202607280004', orderStatus: 'COMPLETED' },
    shop,
    buyer: buyers[3],
    item: { id: 'OI202607280004', productName: 'iPhone 16 黑色 512GB', skuName: '黑色 512GB', spec: { 颜色: '黑色', 容量: '512GB' }, imageUrl: 'https://dummyimage.com/120x120/e5e7eb/64748b&text=512G', unitPrice: '6999.00', purchasedQuantity: 1 },
    quantity: 1,
    requestedAmount: '99.00',
    approvedAmount: '99.00',
    createdAt: '2026-07-28T20:10:00.000+08:00',
    updatedAt: '2026-07-29T10:30:00.000+08:00',
    reasonCode: 'PRICE_PROTECTION',
    reasonDescription: '价保退款。',
    evidenceUrls: [],
    approvedQuantity: 1,
    review: { reviewerId: 'USER_SHOP_ADMIN', comment: '同意价保退款。', reviewedAt: '2026-07-29T09:30:00.000+08:00' },
    returnShipment: null,
    refundNo: 'RF202607290004',
    refundFailureReason: null,
    refundedAt: '2026-07-29T10:30:00.000+08:00',
    completedAt: '2026-07-29T10:30:00.000+08:00',
    cancelledAt: null,
    version: 2,
    availableActions: [],
    eligibilityAtReview: { orderId: 'ORDER202607280004', orderItemId: 'OI202607280004', orderStatus: 'COMPLETED', purchasedQuantity: 1, refundedQuantity: 0, occupiedQuantity: 1, maximumRequestQuantity: 1, itemPayableAmount: '6999.00', refundedAmount: '0.00', occupiedAmount: '99.00', maximumRequestAmount: '99.00', supportedTypes: ['REFUND_ONLY'], eligibleUntil: '2026-08-04T23:59:59.000+08:00', eligible: true, ineligibleReason: null }
  }
]

function now() {
  return new Date().toISOString()
}

function clone<T>(value: T): T {
  return structuredClone(value)
}

function paginate<T>(items: T[], page = 1, pageSize = 10): PageView<T> {
  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const start = (page - 1) * pageSize
  return { items: clone(items.slice(start, start + pageSize)), page, pageSize, total, totalPages }
}

function toSummary(item: ShopAfterSaleDetailView): ShopAfterSaleSummaryView {
  return clone({
    id: item.id,
    afterSaleNo: item.afterSaleNo,
    requestType: item.requestType,
    status: item.status,
    refundStatus: item.refundStatus,
    order: item.order,
    shop: item.shop,
    buyer: item.buyer,
    item: item.item,
    quantity: item.quantity,
    requestedAmount: item.requestedAmount,
    approvedAmount: item.approvedAmount,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  })
}

function findAfterSale(afterSaleId: Id) {
  const detail = afterSales.find((item) => item.id === afterSaleId)
  if (!detail) {
    throw new Error('售后单不存在')
  }
  return detail
}

function includesKeyword(item: ShopAfterSaleDetailView, keyword: string) {
  return [item.afterSaleNo, item.order.orderNo, item.buyer.nickname, item.item.productName, item.item.skuName]
    .some((text) => text.toLowerCase().includes(keyword))
}

function touch(item: ShopAfterSaleDetailView) {
  item.updatedAt = now()
  item.version += 1
}

export async function getMerchantAfterSales(_shopId: Id, query: MerchantAfterSaleQuery = {}) {
  const keyword = query.keyword?.trim().toLowerCase()
  let filtered = [...afterSales]

  if (query.status) filtered = filtered.filter((item) => item.status === query.status)
  if (query.refundStatus) filtered = filtered.filter((item) => item.refundStatus === query.refundStatus)
  if (query.requestType) filtered = filtered.filter((item) => item.requestType === query.requestType)
  if (keyword) filtered = filtered.filter((item) => includesKeyword(item, keyword))
  if (query.createdFrom) filtered = filtered.filter((item) => item.createdAt >= query.createdFrom!)
  if (query.createdTo) filtered = filtered.filter((item) => item.createdAt <= query.createdTo!)

  filtered.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  return paginate(filtered.map(toSummary), query.page, query.pageSize)
}

export async function getMerchantAfterSaleDetail(_shopId: Id, afterSaleId: Id) {
  return clone(findAfterSale(afterSaleId))
}

export async function approveMerchantAfterSale(_shopId: Id, afterSaleId: Id, request: ApproveAfterSaleRequest) {
  const item = findAfterSale(afterSaleId)
  if (item.status !== 'PENDING' || !item.availableActions.includes('APPROVE')) throw new Error('当前售后不可批准')

  item.approvedQuantity = request.approvedQuantity
  item.approvedAmount = request.approvedAmount
  item.review = { reviewerId: 'USER_SHOP_ADMIN', comment: request.reviewComment, reviewedAt: now() }
  item.availableActions = []
  if (item.requestType === 'REFUND_ONLY') {
    item.status = 'COMPLETED'
    item.refundStatus = 'SUCCESS'
    item.refundNo = `RF${Date.now()}`
    item.refundedAt = now()
    item.completedAt = item.refundedAt
  } else {
    item.status = 'WAITING_RETURN'
    item.refundStatus = 'NOT_STARTED'
  }
  touch(item)
  return clone(item)
}

export async function rejectMerchantAfterSale(_shopId: Id, afterSaleId: Id, request: RejectAfterSaleRequest) {
  const item = findAfterSale(afterSaleId)
  if (item.status !== 'PENDING' || !item.availableActions.includes('REJECT')) throw new Error('当前售后不可拒绝')

  item.status = 'REJECTED'
  item.review = { reviewerId: 'USER_SHOP_ADMIN', comment: request.reviewComment, reviewedAt: now() }
  item.availableActions = []
  touch(item)
  return clone(item)
}

export async function confirmMerchantReturnReceived(_shopId: Id, afterSaleId: Id, _request: ConfirmReturnReceivedRequest) {
  const item = findAfterSale(afterSaleId)
  if (item.status !== 'WAITING_RETURN' || !item.returnShipment || !item.availableActions.includes('CONFIRM_RETURN_RECEIVED')) {
    throw new Error('当前售后不可确认收货')
  }

  item.returnShipment.receivedAt = now()
  item.refundNo = `RF${Date.now()}`
  if (item.afterSaleNo.endsWith('0002')) {
    item.status = 'COMPLETED'
    item.refundStatus = 'SUCCESS'
    item.refundedAt = now()
    item.completedAt = item.refundedAt
    item.refundFailureReason = null
    item.availableActions = []
  } else {
    item.status = 'REFUNDING'
    item.refundStatus = 'FAILED'
    item.refundFailureReason = '模拟退款失败，可执行重试。'
    item.availableActions = ['RETRY_REFUND']
  }
  touch(item)
  return clone(item)
}

export async function retryMerchantRefund(_shopId: Id, afterSaleId: Id, _request: RetryRefundRequest) {
  const item = findAfterSale(afterSaleId)
  if (item.status !== 'REFUNDING' || item.refundStatus !== 'FAILED' || !item.availableActions.includes('RETRY_REFUND')) {
    throw new Error('当前退款不可重试')
  }

  item.status = 'COMPLETED'
  item.refundStatus = 'SUCCESS'
  item.refundFailureReason = null
  item.refundedAt = now()
  item.completedAt = item.refundedAt
  item.availableActions = []
  touch(item)
  return clone(item)
}
