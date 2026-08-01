import type { Id, PageView } from '../../types/common'
import type {
  OrderAction,
  OrderDetailView,
  OrderPaymentStatus,
  OrderStatus,
  ShipOrderRequest,
  ShopOrderSummaryView,
  ShopBrief,
  UserSummary
} from '../../types/merchant'

export interface MerchantOrderQuery {
  page?: number
  pageSize?: number
  orderStatus?: OrderStatus | ''
  paymentStatus?: OrderPaymentStatus | ''
  keyword?: string
  createdFrom?: string
  createdTo?: string
}

const shop: ShopBrief = { id: 'SHOP202607260001', shopNo: 'SHOP-SG-001', shopName: '时光数码旗舰店', logoUrl: null, status: 'ACTIVE' }
const buyers: UserSummary[] = [
  { id: 'USER202607260001', username: 'chenxi', nickname: '陈曦', avatarUrl: null, status: 'ACTIVE' },
  { id: 'USER202607260002', username: 'linyi', nickname: '林一', avatarUrl: null, status: 'ACTIVE' },
  { id: 'USER202607260003', username: 'zhouzhou', nickname: '周周', avatarUrl: null, status: 'ACTIVE' },
  { id: 'USER202607260004', username: 'momo', nickname: '沫沫', avatarUrl: null, status: 'ACTIVE' }
]

const orders: OrderDetailView[] = [
  {
    id: 'ORDER202607310001',
    orderNo: 'SO202607310001',
    tradeId: 'TRADE202607310001',
    tradeNo: 'TR202607310001',
    shop,
    buyer: buyers[0],
    orderStatus: 'PENDING_SHIPMENT',
    paymentStatus: 'PAID',
    payableAmount: '5999.00',
    refundAmount: '0.00',
    availableActions: ['SHIP', 'CONTACT_BUYER'],
    itemAmount: '5999.00',
    freightAmount: '0.00',
    buyerRemark: '请尽快发货，宿舍门口可自提。',
    address: { recipientName: '陈曦', recipientPhone: '138****1024', provinceName: '上海市', cityName: '上海市', districtName: '杨浦区', detailAddress: '大学路 100 号 8 号楼 302' },
    shipping: null,
    items: [
      { id: 'OI202607310001', spuId: 'SPU202607260001', skuId: 'SKU202607260001', spuNo: 'SPU-IP16-001', skuNo: 'IP16-BLK-256', productName: 'iPhone 16 黑色 256GB', skuName: '黑色 256GB', spec: { 颜色: '黑色', 容量: '256GB' }, imageUrl: 'https://dummyimage.com/120x120/e5e7eb/64748b&text=256G', unitPrice: '5999.00', quantity: 1, originalAmount: '5999.00', freightAmount: '0.00', payableAmount: '5999.00', refundedQuantity: 0, refundedAmount: '0.00', reservationStatus: 'LOCKED' }
    ],
    history: [
      { fromStatus: 'PENDING_PAYMENT', toStatus: 'PENDING_SHIPMENT', operationType: 'PAY', operatorType: 'USER', remark: '买家完成支付', createdAt: '2026-07-31T09:12:00.000+08:00' },
      { fromStatus: null, toStatus: 'PENDING_PAYMENT', operationType: 'CREATE', operatorType: 'USER', remark: '买家提交订单', createdAt: '2026-07-31T09:10:00.000+08:00' }
    ]
  },
  {
    id: 'ORDER202607300002',
    orderNo: 'SO202607300002',
    tradeId: 'TRADE202607300002',
    tradeNo: 'TR202607300002',
    shop,
    buyer: buyers[1],
    orderStatus: 'PENDING_RECEIPT',
    paymentStatus: 'PAID',
    payableAmount: '198.00',
    refundAmount: '0.00',
    availableActions: ['CONTACT_BUYER'],
    itemAmount: '198.00',
    freightAmount: '0.00',
    buyerRemark: null,
    address: { recipientName: '林一', recipientPhone: '139****2048', provinceName: '浙江省', cityName: '杭州市', districtName: '西湖区', detailAddress: '留和路 288 号 12 幢 501' },
    shipping: { carrierCode: 'SF', carrierName: '顺丰速运', trackingNo: 'SF1234567890', shippedAt: '2026-07-30T16:20:00.000+08:00' },
    items: [
      { id: 'OI202607300002', spuId: 'SPU202607260002', skuId: 'SKU202607260002', spuNo: 'SPU-CASE-001', skuNo: 'CASE-MAG-BLUE', productName: '磁吸保护壳 雾蓝色', skuName: '雾蓝色', spec: { 颜色: '雾蓝色' }, imageUrl: 'https://dummyimage.com/120x120/dbeafe/64748b&text=Blue', unitPrice: '99.00', quantity: 2, originalAmount: '198.00', freightAmount: '0.00', payableAmount: '198.00', refundedQuantity: 0, refundedAmount: '0.00', reservationStatus: 'DEDUCTED' }
    ],
    history: [
      { fromStatus: 'PENDING_SHIPMENT', toStatus: 'PENDING_RECEIPT', operationType: 'SHIP', operatorType: 'SHOP', remark: '商家已发货，顺丰速运 SF1234567890', createdAt: '2026-07-30T16:20:00.000+08:00' },
      { fromStatus: 'PENDING_PAYMENT', toStatus: 'PENDING_SHIPMENT', operationType: 'PAY', operatorType: 'USER', remark: '买家完成支付', createdAt: '2026-07-30T15:10:00.000+08:00' }
    ]
  },
  {
    id: 'ORDER202607290003',
    orderNo: 'SO202607290003',
    tradeId: 'TRADE202607290003',
    tradeNo: 'TR202607290003',
    shop,
    buyer: buyers[2],
    orderStatus: 'COMPLETED',
    paymentStatus: 'PAID',
    payableAmount: '39.00',
    refundAmount: '0.00',
    availableActions: [],
    itemAmount: '39.00',
    freightAmount: '0.00',
    buyerRemark: '放门卫即可。',
    address: { recipientName: '周周', recipientPhone: '137****4096', provinceName: '江苏省', cityName: '南京市', districtName: '鼓楼区', detailAddress: '汉口路 22 号 5 舍 101' },
    shipping: { carrierCode: 'YTO', carrierName: '圆通速递', trackingNo: 'YT9876543210', shippedAt: '2026-07-29T11:00:00.000+08:00' },
    items: [
      { id: 'OI202607290003', spuId: 'SPU202607260003', skuId: 'SKU202607260003', spuNo: 'SPU-CABLE-001', skuNo: 'CABLE-C-1M', productName: 'Type-C 编织数据线 1m', skuName: '白色 1m', spec: { 长度: '1m' }, imageUrl: 'https://dummyimage.com/120x120/f1f5f9/64748b&text=1m', unitPrice: '39.00', quantity: 1, originalAmount: '39.00', freightAmount: '0.00', payableAmount: '39.00', refundedQuantity: 0, refundedAmount: '0.00', reservationStatus: 'DEDUCTED' }
    ],
    history: [
      { fromStatus: 'PENDING_RECEIPT', toStatus: 'COMPLETED', operationType: 'COMPLETE', operatorType: 'SYSTEM', remark: '系统自动确认收货', createdAt: '2026-07-30T11:00:00.000+08:00' },
      { fromStatus: 'PENDING_SHIPMENT', toStatus: 'PENDING_RECEIPT', operationType: 'SHIP', operatorType: 'SHOP', remark: '商家已发货', createdAt: '2026-07-29T11:00:00.000+08:00' }
    ]
  },
  {
    id: 'ORDER202607280004',
    orderNo: 'SO202607280004',
    tradeId: 'TRADE202607280004',
    tradeNo: 'TR202607280004',
    shop,
    buyer: buyers[3],
    orderStatus: 'COMPLETED',
    paymentStatus: 'PARTIALLY_REFUNDED',
    payableAmount: '6999.00',
    refundAmount: '99.00',
    availableActions: ['VIEW_AFTER_SALE'],
    itemAmount: '6999.00',
    freightAmount: '0.00',
    buyerRemark: null,
    address: { recipientName: '沫沫', recipientPhone: '136****8192', provinceName: '北京市', cityName: '北京市', districtName: '海淀区', detailAddress: '学院路 30 号 3 号楼 618' },
    shipping: { carrierCode: 'ZTO', carrierName: '中通快递', trackingNo: 'ZT202607280004', shippedAt: '2026-07-28T13:00:00.000+08:00' },
    items: [
      { id: 'OI202607280004', spuId: 'SPU202607260001', skuId: 'SKU202607260004', spuNo: 'SPU-IP16-001', skuNo: 'IP16-BLK-512', productName: 'iPhone 16 黑色 512GB', skuName: '黑色 512GB', spec: { 颜色: '黑色', 容量: '512GB' }, imageUrl: 'https://dummyimage.com/120x120/e5e7eb/64748b&text=512G', unitPrice: '6999.00', quantity: 1, originalAmount: '6999.00', freightAmount: '0.00', payableAmount: '6999.00', refundedQuantity: 0, refundedAmount: '99.00', reservationStatus: 'DEDUCTED' }
    ],
    history: [
      { fromStatus: 'PENDING_RECEIPT', toStatus: 'COMPLETED', operationType: 'COMPLETE', operatorType: 'USER', remark: '买家确认收货，后续发生部分退款', createdAt: '2026-07-29T20:00:00.000+08:00' }
    ]
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

function toSummary(order: OrderDetailView): ShopOrderSummaryView {
  return clone({
    id: order.id,
    orderNo: order.orderNo,
    tradeId: order.tradeId,
    tradeNo: order.tradeNo,
    shop: order.shop,
    buyer: order.buyer,
    orderStatus: order.orderStatus,
    paymentStatus: order.paymentStatus,
    payableAmount: order.payableAmount,
    refundAmount: order.refundAmount,
    itemSummary: order.items.map((item) => ({ productName: item.productName, skuName: item.skuName, imageUrl: item.imageUrl, quantity: item.quantity })),
    itemKinds: order.items.length,
    totalQuantity: order.items.reduce((total, item) => total + item.quantity, 0),
    createdAt: order.history[order.history.length - 1]?.createdAt ?? now(),
    availableActions: order.availableActions
  })
}

function findOrder(orderId: Id) {
  const order = orders.find((item) => item.id === orderId)
  if (!order) {
    throw new Error('订单不存在')
  }
  return order
}

function includesKeyword(order: OrderDetailView, keyword: string) {
  return [order.orderNo, order.tradeNo, order.buyer.nickname, ...order.items.flatMap((item) => [item.productName, item.skuName, item.skuNo])]
    .some((text) => text.toLowerCase().includes(keyword))
}

export async function getMerchantOrders(_shopId: Id, query: MerchantOrderQuery = {}) {
  const keyword = query.keyword?.trim().toLowerCase()
  let filtered = [...orders]

  if (query.orderStatus) filtered = filtered.filter((order) => order.orderStatus === query.orderStatus)
  if (query.paymentStatus) filtered = filtered.filter((order) => order.paymentStatus === query.paymentStatus)
  if (keyword) filtered = filtered.filter((order) => includesKeyword(order, keyword))
  if (query.createdFrom) filtered = filtered.filter((order) => toSummary(order).createdAt >= query.createdFrom!)
  if (query.createdTo) filtered = filtered.filter((order) => toSummary(order).createdAt <= query.createdTo!)

  filtered.sort((a, b) => toSummary(b).createdAt.localeCompare(toSummary(a).createdAt))
  return paginate(filtered.map(toSummary), query.page, query.pageSize)
}

export async function getMerchantOrderDetail(_shopId: Id, orderId: Id) {
  return clone(findOrder(orderId))
}

export async function shipMerchantOrder(_shopId: Id, orderId: Id, request: ShipOrderRequest) {
  const order = findOrder(orderId)
  if (order.orderStatus !== 'PENDING_SHIPMENT' || !order.availableActions.includes('SHIP')) {
    throw new Error('当前订单不可发货')
  }

  const shippedAt = now()
  order.shipping = { ...request, shippedAt }
  order.orderStatus = 'PENDING_RECEIPT'
  order.availableActions = order.availableActions.filter((action: OrderAction) => action !== 'SHIP')
  order.history.unshift({
    fromStatus: 'PENDING_SHIPMENT',
    toStatus: 'PENDING_RECEIPT',
    operationType: 'SHIP',
    operatorType: 'SHOP',
    remark: `商家已发货，${request.carrierName} ${request.trackingNo}`,
    createdAt: shippedAt
  })

  return clone(order)
}
