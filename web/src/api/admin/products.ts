import request from '@/utils/request'
import type { CommonStatus, Id, ListQuery, PageResult, PlatformProduct, PlatformProductSku, ProductStatus, SkuInventory } from '@/types/admin'
import type { PageView, Timestamp } from '@/types/common'

interface PlatformProductSummaryView {
  id: Id
  spuNo: string
  productName: string
  coverUrl: string | null
  shop: { id: Id; shopNo: string; shopName: string; logoUrl: string | null; status: string }
  category: { id: Id; categoryCode: string; categoryName: string }
  brand: { id: Id; brandName: string } | null
  status: ProductStatus
  contentVersion: number
  skuCount: number
  enabledSkuCount: number
  availableQuantity: number
  lockedQuantity: number
  createdAt: Timestamp
  updatedAt: Timestamp
}

interface PlatformProductSkuView {
  id: Id
  skuNo: string
  skuName: string
  imageUrl: string | null
  salePrice: string
  marketPrice: string
  barcode: string
  status: CommonStatus
  availableQuantity: number
  lockedQuantity: number
  version: number
  createdAt: Timestamp
  updatedAt: Timestamp
}

interface PlatformProductDetailView {
  id: Id
  spuNo: string
  productName: string
  subtitle: string | null
  coverUrl: string | null
  galleryUrls: string[]
  detailHtml: string | null
  packingList: string | null
  serviceNote: string | null
  shop: { id: Id; shopNo: string; shopName: string; logoUrl: string | null; status: string }
  category: { id: Id; categoryCode: string; categoryName: string }
  brand?: { id: Id; brandName: string } | null
  attributes: Array<Record<string, string>>
  skus: PlatformProductSkuView[]
  status: ProductStatus
  contentVersion: number
  createdBy: { id: Id; username: string; nickname: string } | null
  updatedBy: { id: Id; username: string; nickname: string } | null
  createdAt: Timestamp
  updatedAt: Timestamp
}

interface ReviewDecisionRequest {
  contentVersion: number
  reason?: string | null
}

function toProductSku(item: PlatformProductSkuView): PlatformProductSku {
  return {
    id: item.id,
    skuNo: item.skuNo,
    skuName: item.skuName,
    imageUrl: item.imageUrl,
    salePrice: item.salePrice,
    marketPrice: item.marketPrice,
    barcode: item.barcode,
    status: item.status,
    version: item.version,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  }
}

function toPlatformProduct(item: PlatformProductSummaryView): PlatformProduct {
  return {
    id: item.id,
    spuNo: item.spuNo,
    name: item.productName,
    coverImageUrl: item.coverUrl,
    shopName: item.shop.shopName,
    categoryName: item.category.categoryName,
    brandName: item.brand?.brandName ?? '-',
    price: '0.00',
    skuCount: item.skuCount,
    totalAvailableStock: item.availableQuantity,
    status: item.status,
    contentVersion: item.contentVersion,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  }
}

function toPlatformProductDetail(item: PlatformProductDetailView): PlatformProduct {
  const skus = item.skus.map(toProductSku)
  return {
    id: item.id,
    spuNo: item.spuNo,
    name: item.productName,
    coverImageUrl: item.coverUrl,
    shopName: item.shop.shopName,
    categoryName: item.category.categoryName,
    brandName: item.brand?.brandName ?? '-',
    price: skus.reduce((min, sku) => sku.salePrice < min ? sku.salePrice : min, skus[0]?.salePrice ?? '0.00'),
    status: item.status,
    contentVersion: item.contentVersion,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    skus
  }
}

export async function listProducts(query: ListQuery) {
  const data = await request.get<PageView<PlatformProductSummaryView>>('/platform/products', {
    params: {
      ...query,
      shopId: query.shopId || undefined,
      categoryId: query.categoryId || undefined,
      shopName: undefined,
      categoryName: undefined
    }
  }) as unknown as PageView<PlatformProductSummaryView>
  const items = data.items.map(toPlatformProduct)
  return { ...data, items } satisfies PageResult<PlatformProduct>
}

export async function getProductDetail(id: Id) {
  const data = await request.get<PlatformProductDetailView>(`/platform/products/${id}`) as unknown as PlatformProductDetailView
  return toPlatformProductDetail(data)
}

export function setProductStatus(id: Id, status: ProductStatus, reason?: string, contentVersion = 0) {
  if (status === 'OFF_SHELF') {
    return request.post(`/platform/products/bans/${id}/take-off-shelf`, { contentVersion, reason })
  }

  if (status === 'BANNED') {
    return request.post(`/platform/products/bans/${id}`, { contentVersion, reason })
  }

  if (status === 'ON_SHELF') {
    return request.post(`/platform/products/bans/${id}/revoke`, { contentVersion, reason })
  }

  throw new Error(`商品状态 ${status} 暂不支持平台接口`)
}

export async function approveProductReview(id: Id, requestBody: ReviewDecisionRequest) {
  // 待审核商品必须走审核专用接口，不能复用禁售/解禁治理接口，否则后端权限和状态历史会不准确。
  const data = await request.post<PlatformProductDetailView>(`/platform/products/reviews/${id}/approve`, requestBody) as unknown as PlatformProductDetailView
  return toPlatformProductDetail(data)
}

export async function rejectProductReview(id: Id, requestBody: ReviewDecisionRequest) {
  // 驳回申请同样写入审核历史，并且后端要求驳回原因必填，所以页面会在提交前做输入校验。
  const data = await request.post<PlatformProductDetailView>(`/platform/products/reviews/${id}/reject`, requestBody) as unknown as PlatformProductDetailView
  return toPlatformProductDetail(data)
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
  const pages = await Promise.allSettled(shops.items.map(async (shop) => {
    const data = await request.get<PageView<BackendInventoryItemView>>(`/shops/${shop.shop.id}/inventory`, {
      params: { page: 1, pageSize: 100, keyword: query.keyword || undefined }
    }) as unknown as PageView<BackendInventoryItemView>
    return data.items.map((item) => toInventoryItem(item, shop.shop.shopName))
  }))
  const items = pages.flatMap((result) => (result.status === 'fulfilled' ? result.value : []))
  const filtered = items.filter((item) => !query.keyword || [item.productName, item.skuName, item.shopName].some((value) => value.includes(query.keyword!)))
  const start = (page - 1) * pageSize
  return {
    items: filtered.slice(start, start + pageSize),
    page,
    pageSize,
    total: filtered.length,
    totalPages: Math.ceil(filtered.length / pageSize)
  } satisfies PageResult<SkuInventory>
}
