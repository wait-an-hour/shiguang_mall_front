import request from '@/utils/request'
import type { PageView } from '@/types/common'
import type { AfterSaleStatus, OrderStatus, PlatformOrder } from '@/types/admin'

interface OperationOrderView {
  id: string
  orderNo: string
  shop: { shopName: string }
  buyer: { nickname?: string; username?: string }
  payableAmount: string
  orderStatus: OrderStatus
  paymentStatus: string
  itemSummary: Array<{ productName: string; skuName: string; quantity: number }>
  createdAt: string
}

interface OperationAfterSaleView {
  afterSaleNo: string
  shopName: string
  buyerName: string
  amount: string
  status: AfterSaleStatus
  refundStatus: string
  createdAt: string
}

interface ProductReviewSummaryView {
  spuId: string
  spuNo: string
  productName: string
  coverUrl: string | null
  shop: { id: string; shopName: string }
  category: { id: string; categoryName: string }
  contentVersion: number
  submittedAt: string
}

async function count<T>(url: string, params: Record<string, unknown>) {
  const data = await request.get<PageView<T>>(url, { params: { page: 1, pageSize: 1, ...params } }) as unknown as PageView<T>
  return data.total
}

export async function getAdminDashboard() {
  const [products, orders, shops, pendingAfterSaleAppeals] = await Promise.all([
    count<ProductReviewSummaryView>('/platform/products/reviews', {}),
    count<OperationOrderView>('/platform/operations/orders', {}),
    count<{ shop: { id: string } }>('/platform/shops', { status: 'ACTIVE' }),
    count<{ id: string }>('/platform/after-sale-appeals', { status: 'PENDING' })
  ])

  const recent = await request.get<PageView<OperationOrderView>>('/platform/operations/orders', { params: { page: 1, pageSize: 3 } }) as unknown as PageView<OperationOrderView>

  return {
    metrics: { products, orders, shops, pendingAfterSale: pendingAfterSaleAppeals },
    tasks: [
      `${shops} 家平台店铺正在营业`,
      `${pendingAfterSaleAppeals} 笔售后申诉等待平台裁决`,
      `${products} 个商品待平台审核`
    ],
    recent: recent.items.map((item) => ({
      id: item.id,
      orderNo: item.orderNo,
      shopName: item.shop.shopName,
      buyerName: item.buyer.nickname || item.buyer.username || '-',
      amount: item.payableAmount,
      status: item.orderStatus,
      products: item.itemSummary.map((product) => `${product.productName} / ${product.skuName} x${product.quantity}`),
      createdAt: item.createdAt
    })) as PlatformOrder[]
  }
}
