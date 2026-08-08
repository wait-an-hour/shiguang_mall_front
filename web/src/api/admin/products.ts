import request from '@/utils/request'
import type { Id, ListQuery, PageResult, PlatformProduct, ProductStatus, SkuInventory } from '@/types/admin'
import type { PageView, Timestamp } from '@/types/common'

interface ProductReviewSummaryView {
  spuId: Id
  spuNo: string
  productName: string
  coverUrl: string | null
  shop: { id: Id; shopName: string }
  category: { id: Id; categoryName: string }
  contentVersion: number
  submittedAt: Timestamp
}

function toPlatformProduct(item: ProductReviewSummaryView): PlatformProduct {
  return {
    id: item.spuId,
    name: item.productName,
    shopName: item.shop.shopName,
    categoryName: item.category.categoryName,
    brandName: '-',
    price: '0.00',
    status: 'PENDING_REVIEW',
    contentVersion: item.contentVersion,
    createdAt: item.submittedAt
  }
}

export async function listProducts(query: ListQuery) {
  const data = await request.get<PageView<ProductReviewSummaryView>>('/platform/products/reviews', { params: query }) as unknown as PageView<ProductReviewSummaryView>
  const items = data.items.map(toPlatformProduct)
  return { ...data, items } satisfies PageResult<PlatformProduct>
}

export function setProductStatus(id: Id, status: ProductStatus, reason?: string, contentVersion = 0) {
  if (status === 'ON_SHELF') {
    return request.post(`/platform/products/reviews/${id}/approve`, { contentVersion, reason })
  }

  if (status === 'REJECTED' || status === 'OFF_SHELF') {
    return request.post(`/platform/products/reviews/${id}/reject`, { contentVersion, reason })
  }

  throw new Error(`商品状态 ${status} 暂不支持平台接口`)
}

interface BackendInventoryItemView {
  spuId: Id
  productName: string
  sku: {
    id: Id
    skuName: string
    stock: { availableQuantity: number; lockedQuantity: number }
    updatedAt: string
  }
}

interface PlatformShopView {
  shop: { id: Id; shopName: string }
}

function toInventoryItem(item: BackendInventoryItemView, shopName: string): SkuInventory {
  return {
    id: item.sku.id,
    productName: item.productName,
    skuName: item.sku.skuName,
    shopName,
    stock: item.sku.stock.availableQuantity,
    warningStock: 10,
    lockedStock: item.sku.stock.lockedQuantity,
    updatedAt: item.sku.updatedAt
  }
}

export async function listInventories(query: ListQuery) {
  const page = query.page ?? 1
  const pageSize = query.pageSize ?? 10
  const shops = await request.get<PageView<PlatformShopView>>('/platform/shops', {
    params: { page: 1, pageSize: 200, keyword: query.shopName || undefined }
  }) as unknown as PageView<PlatformShopView>
  const pages = await Promise.all(shops.items.map(async (shop) => {
    const data = await request.get<PageView<BackendInventoryItemView>>(`/shops/${shop.shop.id}/inventory`, {
      params: { page: 1, pageSize: 100, keyword: query.keyword || undefined }
    }) as unknown as PageView<BackendInventoryItemView>
    return data.items.map((item) => toInventoryItem(item, shop.shop.shopName))
  }))
  const filtered = pages.flat().filter((item) => !query.keyword || [item.productName, item.skuName, item.shopName].some((value) => value.includes(query.keyword!)))
  const start = (page - 1) * pageSize
  return {
    items: filtered.slice(start, start + pageSize),
    page,
    pageSize,
    total: filtered.length,
    totalPages: Math.ceil(filtered.length / pageSize)
  } satisfies PageResult<SkuInventory>
}
