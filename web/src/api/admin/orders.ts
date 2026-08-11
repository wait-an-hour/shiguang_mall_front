import request from '@/utils/request'
import type { ListQuery, PageResult, PlatformOrder } from '@/types/admin'
import type { PageView, Timestamp } from '@/types/common'

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
  availableActions: string[]
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
      const orderItems = item.itemSummary.map((product) => ({
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
        refundAmount: item.refundAmount ?? '0.00',
        status: item.orderStatus,
        paymentStatus: item.paymentStatus ?? 'UNPAID',
        products: orderItems.map((product) => `${product.productName} / ${product.skuName} x${product.quantity}`),
        orderItems,
        itemKinds: item.itemKinds ?? orderItems.length,
        totalQuantity: item.totalQuantity ?? orderItems.reduce((total, product) => total + product.quantity, 0),
        availableActions: item.availableActions ?? [],
        createdAt: item.createdAt
      }
    })
  } satisfies PageResult<PlatformOrder>
}
