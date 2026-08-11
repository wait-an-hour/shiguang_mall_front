import request from '@/utils/request'
import type { ListQuery, PageResult, PlatformOrder } from '@/types/admin'
import type { PageView, Timestamp } from '@/types/common'
import type { OrderDetailView, OrderStatusHistoryView } from '@/types/merchant'

interface OperationOrderView {
  id: string
  orderNo: string
  tradeId?: string
  tradeNo?: string
  shop: { shopName: string }
  buyer: { nickname?: string; username?: string }
  payableAmount: string
  orderStatus: PlatformOrder['status']
  paymentStatus?: string
  refundAmount?: string
  itemSummary: Array<{ productName: string; skuName: string; imageUrl?: string | null; quantity: number }>
  itemKinds?: number
  totalQuantity?: number
  createdAt: Timestamp
  paidAt?: Timestamp | null
  shippedAt?: Timestamp | null
  completedAt?: Timestamp | null
  shipping?: OrderDetailView['shipping']
  items?: OrderDetailView['items']
  history?: OrderDetailView['history']
}

function historyTime(history: OrderStatusHistoryView[] | undefined, operationType: OrderStatusHistoryView['operationType']) {
  // 平台订单接口没有单独的 paidAt/receivedAt 字段；这些时间来自订单状态历史，倒序取最近一次记录。
  return [...(history ?? [])].reverse().find((item) => item.operationType === operationType)?.createdAt ?? null
}

export async function listOrders(query: ListQuery) {
  const data = await request.get<PageView<OperationOrderView>>('/platform/operations/orders', {
    params: {
      ...query,
      orderNo: query.keyword || undefined,
      orderStatus: query.status || undefined,
      keyword: undefined,
      status: undefined,
      shopName: undefined
    }
  }) as unknown as PageView<OperationOrderView>

  return {
    ...data,
    items: data.items.map((item) => {
      const orderItems = item.items?.length
        ? item.items.map((product) => ({
            productName: product.productName,
            skuName: product.skuName,
            quantity: product.quantity,
            imageUrl: product.imageUrl ?? null,
            unitPrice: product.unitPrice,
            payableAmount: product.payableAmount
          }))
        : item.itemSummary.map((product) => ({
            productName: product.productName,
            skuName: product.skuName,
            quantity: product.quantity,
            imageUrl: product.imageUrl ?? null
          }))

      return {
        id: item.id,
        orderNo: item.orderNo,
        tradeNo: item.tradeNo,
        shopName: item.shop.shopName,
        buyerName: item.buyer.nickname || item.buyer.username || '-',
        amount: item.payableAmount,
        status: item.orderStatus,
        products: orderItems.map((product) => `${product.productName} / ${product.skuName} x${product.quantity}`),
        orderItems,
        createdAt: item.createdAt,
        paidAt: item.paidAt ?? historyTime(item.history, 'PAY'),
        shippedAt: item.shippedAt ?? item.shipping?.shippedAt ?? historyTime(item.history, 'SHIP'),
        receivedAt: item.completedAt ?? historyTime(item.history, 'COMPLETE'),
        completedAt: item.completedAt ?? historyTime(item.history, 'COMPLETE'),
        carrierName: item.shipping?.carrierName ?? null,
        trackingNo: item.shipping?.trackingNo ?? null
      }
    })
  } satisfies PageResult<PlatformOrder>
}
