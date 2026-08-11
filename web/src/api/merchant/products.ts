import request from '@/utils/request'
import type { Id, PageView } from '../../types/common'
import type {
  CreateProductRequest,
  CreateSkuRequest,
  ProductStatus,
  ShopProductDetailView,
  ShopProductSummaryView,
  ShopSkuView,
  UpdateProductContentRequest,
  UpdateSkuRequest
} from '../../types/merchant'

export interface MerchantProductQuery {
  page?: number
  pageSize?: number
  keyword?: string
  status?: ProductStatus | ''
  categoryId?: Id | ''
  sort?: 'created_desc' | 'updated_desc' | 'stock_asc'
}

interface BackendCategoryBrief {
  id: Id
  categoryCode?: string
  categoryName: string
}

interface BackendBrandView {
  id: Id
  brandCode?: string
  brandName: string
  logoUrl?: string
  status?: string
}

interface BackendStockView {
  skuId: Id
  availableQuantity: number
  lockedQuantity: number
  version: number
  updatedAt?: string
}

interface BackendShopSkuView {
  id: Id
  skuNo: string
  skuName: string
  spec: Record<string, string>
  salePrice: string
  marketPrice: string
  barcode: string
  imageUrl: string
  status: 'ENABLED' | 'DISABLED'
  version: number
  stock: BackendStockView
  createdAt: string
  updatedAt: string
}

interface BackendStatusHistoryView {
  id: Id
  toStatus: ProductStatus
  operator?: { nickname?: string; username?: string }
  reason?: string
  createdAt: string
}

interface BackendShopProductSummaryView {
  id: Id
  spuNo: string
  productName: string
  subtitle?: string
  coverUrl: string
  category: BackendCategoryBrief
  brand?: BackendBrandView
  status: ProductStatus
  contentVersion: number
  skuCount: number
  enabledSkuCount: number
  availableQuantity: number
  lockedQuantity: number
  createdAt: string
  updatedAt: string
}

interface BackendShopProductDetailView extends BackendShopProductSummaryView {
  galleryUrls: string[]
  detailHtml: string
  packingList?: string
  serviceNote?: string
  attributes: Array<{ attributeId: Id; attributeName: string; value: string; unit?: string }>
  skus: BackendShopSkuView[]
  history: BackendStatusHistoryView[]
}

function toSort(sort?: MerchantProductQuery['sort']) {
  if (sort === 'created_desc') return 'createdAt,desc'
  if (sort === 'stock_asc') return 'availableQuantity,asc'
  return 'updatedAt,desc'
}

function toCategory(category: BackendCategoryBrief) {
  return { id: category.id, name: category.categoryName, level: 2 }
}

function toBrand(brand?: BackendBrandView) {
  return brand ? { id: brand.id, name: brand.brandName, logoUrl: brand.logoUrl } : undefined
}

function toSku(sku: BackendShopSkuView): ShopSkuView {
  return {
    id: sku.id,
    skuNo: sku.skuNo,
    skuName: sku.skuName,
    imageUrl: sku.imageUrl,
    salePrice: sku.salePrice,
    marketPrice: sku.marketPrice,
    barcode: sku.barcode,
    status: sku.status,
    stock: {
      skuId: sku.stock.skuId,
      availableStock: sku.stock.availableQuantity,
      lockedStock: sku.stock.lockedQuantity,
      safetyStock: 0,
      version: sku.stock.version
    },
    version: sku.version,
    createdAt: sku.createdAt,
    updatedAt: sku.updatedAt
  }
}

function toSummary(product: BackendShopProductSummaryView): ShopProductSummaryView {
  return {
    id: product.id,
    spuNo: product.spuNo,
    productName: product.productName,
    category: toCategory(product.category),
    brand: toBrand(product.brand),
    subtitle: product.subtitle,
    coverImageUrl: product.coverUrl,
    status: product.status,
    minSalePrice: '0.00',
    skuCount: product.skuCount,
    totalAvailableStock: product.availableQuantity,
    contentVersion: product.contentVersion,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt
  }
}

function toDetail(product: BackendShopProductDetailView): ShopProductDetailView {
  const skus = product.skus.map(toSku)
  return {
    ...toSummary(product),
    minSalePrice: skus.reduce((min, sku) => sku.salePrice < min ? sku.salePrice : min, skus[0]?.salePrice ?? '0.00'),
    galleryImageUrls: product.galleryUrls,
    detailHtml: product.detailHtml,
    packageList: product.packingList,
    serviceNotes: product.serviceNote,
    attributes: product.attributes.map((item) => ({ name: item.attributeName, value: item.value })),
    skus,
    statusHistories: product.history.map((item) => ({
      id: item.id,
      status: item.toStatus,
      operatorName: item.operator?.nickname || item.operator?.username || '系统',
      remark: item.reason || '',
      createdAt: item.createdAt
    }))
  }
}

function toCreatePayload(data: CreateProductRequest) {
  return {
    categoryId: data.categoryId.trim(),
    brandId: data.brandId?.trim() || null,
    productName: data.productName.trim(),
    subtitle: data.subtitle?.trim() || null,
    coverUrl: data.coverImageUrl?.trim() || null,
    galleryUrls: data.galleryImageUrls,
    detailHtml: data.detailHtml,
    packingList: data.packageList?.trim() || null,
    serviceNote: data.serviceNotes?.trim() || null,
    attributes: data.attributes.map((attribute) => ({
      attributeId: attribute.name.trim(),
      value: attribute.value.trim()
    })),
    skus: data.skus.map((sku) => ({
      skuName: sku.skuName.trim(),
      spec: { default: sku.skuName.trim() },
      salePrice: sku.salePrice.trim(),
      marketPrice: sku.marketPrice.trim() || null,
      barcode: sku.barcode?.trim() || null,
      imageUrl: sku.imageUrl?.trim() || null,
      stock: sku.stock
    }))
  }
}

function toUpdatePayload(data: UpdateProductContentRequest, detail: ShopProductDetailView) {
  return {
    categoryId: data.categoryId,
    brandId: data.brandId,
    productName: data.productName,
    subtitle: data.subtitle,
    coverUrl: data.coverImageUrl,
    galleryUrls: data.galleryImageUrls,
    detailHtml: data.detailHtml,
    packingList: data.packageList,
    serviceNote: data.serviceNotes,
    attributes: [],
    contentVersion: data.version,
    skuContents: detail.skus.map((sku) => ({
      skuId: sku.id,
      skuName: sku.skuName,
      imageUrl: sku.imageUrl,
      version: sku.version
    }))
  }
}

export async function getMerchantProducts(shopId: Id, query: MerchantProductQuery = {}) {
  const data = await request.get<PageView<BackendShopProductSummaryView>>(`/shops/${shopId}/products`, {
    params: { ...query, status: query.status || undefined, categoryId: query.categoryId || undefined, sort: toSort(query.sort) }
  }) as unknown as PageView<BackendShopProductSummaryView>
  return { ...data, items: data.items.map(toSummary) }
}

export async function createMerchantProduct(shopId: Id, data: CreateProductRequest) {
  const product = await request.post<BackendShopProductDetailView>(`/shops/${shopId}/products`, toCreatePayload(data)) as unknown as BackendShopProductDetailView
  return toDetail(product)
}

export async function getMerchantProductDetail(shopId: Id, spuId: Id) {
  const product = await request.get<BackendShopProductDetailView>(`/shops/${shopId}/products/${spuId}`) as unknown as BackendShopProductDetailView
  return toDetail(product)
}

export async function updateMerchantProductContent(shopId: Id, spuId: Id, data: UpdateProductContentRequest) {
  const detail = await getMerchantProductDetail(shopId, spuId)
  const product = await request.put<BackendShopProductDetailView>(`/shops/${shopId}/products/${spuId}/content`, toUpdatePayload(data, detail)) as unknown as BackendShopProductDetailView
  return toDetail(product)
}

export async function createMerchantSku(shopId: Id, spuId: Id, data: CreateSkuRequest) {
  const product = await request.post<BackendShopProductDetailView>(`/shops/${shopId}/products/${spuId}/skus`, {
    skuName: data.skuName,
    spec: { 默认: data.skuName },
    salePrice: data.salePrice,
    marketPrice: data.marketPrice?.trim() || null,
    barcode: data.barcode?.trim() || null,
    imageUrl: data.imageUrl?.trim() || null,
    stock: data.stock,
    contentVersion: 0
  }) as unknown as BackendShopProductDetailView
  return toDetail(product).skus.at(-1) as ShopSkuView
}

export async function updateMerchantSku(shopId: Id, spuId: Id, skuId: Id, data: UpdateSkuRequest) {
  const sku = await request.patch<BackendShopSkuView>(`/shops/${shopId}/products/${spuId}/skus/${skuId}`, data) as unknown as BackendShopSkuView
  return toSku(sku)
}

export async function submitMerchantProductReview(shopId: Id, spuId: Id) {
  const product = await request.post<BackendShopProductDetailView>(`/shops/${shopId}/products/${spuId}/submit-review`) as unknown as BackendShopProductDetailView
  return toDetail(product)
}

export async function putMerchantProductOnShelf(shopId: Id, spuId: Id) {
  const product = await request.post<BackendShopProductDetailView>(`/shops/${shopId}/products/${spuId}/put-on-shelf`) as unknown as BackendShopProductDetailView
  return toDetail(product)
}

export async function takeMerchantProductOffShelf(shopId: Id, spuId: Id) {
  const product = await request.post<BackendShopProductDetailView>(`/shops/${shopId}/products/${spuId}/take-off-shelf`) as unknown as BackendShopProductDetailView
  return toDetail(product)
}
