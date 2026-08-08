import request from '@/utils/request'
import type { PageView } from '@/types/common'
import type { AfterSaleStatus, OrderStatus, PlatformOrder } from '@/types/admin'

interface OperationOrderView {
  orderNo: string
  shopName: string
  buyerName: string
  amount: string
  orderStatus: OrderStatus
  paymentStatus: string
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

interface InventoryItemView {
  skuId: string
  skuNo: string
  productName: string
  shopName: string
  availableStock: number
  lockedStock: number
  warningStock: number
  updatedAt: string
}

async function count<T>(url: string, params: Record<string, unknown>) {
  const data = await request.get<PageView<T>>(url, { params: { page: 1, pageSize: 1, ...params } }) as unknown as PageView<T>
  return data.total
}

async function loadLowStockCount() {
  const shops = await request.get<PageView<{ shop: { id: string } }>>('/platform/shops', { params: { page: 1, pageSize: 200 } }) as unknown as PageView<{ shop: { id: string } }>
  const counts = await Promise.all(shops.items.map((item) => request.get<PageView<InventoryItemView>>(`/shops/${item.shop.id}/inventory`, { params: { page: 1, pageSize: 1, stockState: 'LOW_STOCK' } }) as unknown as Promise<PageView<InventoryItemView>>))
  return counts.reduce((sum, item) => sum + item.total, 0)
}

export async function getAdminDashboard() {
  const [products, orders, pendingAfterSale, lowStock] = await Promise.all([
    count<ProductReviewSummaryView>('/platform/products/reviews', {}),
    count<OperationOrderView>('/platform/operations/orders', {}),
    count<OperationAfterSaleView>('/platform/operations/after-sales', { status: 'PENDING' }),
    loadLowStockCount()
  ])

  const recent = await request.get<PageView<OperationOrderView>>('/platform/operations/orders', { params: { page: 1, pageSize: 3 } }) as unknown as PageView<OperationOrderView>

  return {
    metrics: { products, orders, lowStock, pendingAfterSale },
    tasks: [
      `${lowStock} 个 SKU 库存低于预警线`,
      `${pendingAfterSale} 笔售后纠纷等待平台审核`,
      `${products} 个商品待平台审核`
    ],
    recent: recent.items.map((item) => ({
      id: item.orderNo,
      orderNo: item.orderNo,
      shopName: item.shopName,
      buyerName: item.buyerName,
      amount: item.amount,
      status: item.orderStatus,
      products: [],
      createdAt: item.createdAt
    })) as PlatformOrder[]
  }
}
