import request from '@/utils/request'
import type { ListQuery, PageResult, PlatformOrder } from '@/types/admin'
import type { PageView } from '@/types/common'

interface OperationOrderView {
  id: string
  orderNo: string
  shop: { shopName: string }
  buyer: { nickname?: string; username?: string }
  payableAmount: string
  orderStatus: PlatformOrder['status']
  itemSummary: Array<{ productName: string; skuName: string; quantity: number }>
  createdAt: string
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
    items: data.items.map((item) => ({
      id: item.id,
      orderNo: item.orderNo,
      shopName: item.shop.shopName,
      buyerName: item.buyer.nickname || item.buyer.username || '-',
      amount: item.payableAmount,
      status: item.orderStatus,
      products: item.itemSummary.map((product) => `${product.productName} / ${product.skuName} x${product.quantity}`),
      createdAt: item.createdAt
    }))
  } satisfies PageResult<PlatformOrder>
}
