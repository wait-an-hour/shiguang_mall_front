import request from '@/utils/request'
import type { Id, Money, PageView, Timestamp } from '@/types/common'
import type { ShopStatus } from '@/types/merchant'

export interface CategoryNode {
  id: Id
  parentId?: Id | null
  categoryCode: string
  categoryName: string
  sortOrder: number
  status: 'ENABLED' | 'DISABLED'
  children?: CategoryNode[]
}

export interface CategoryAttributeView {
  id: Id
  attributeName: string
  valueType: string
  unit?: string | null
  required: boolean
  filterable: boolean
  options: string[]
  sortOrder: number
  status: 'ENABLED' | 'DISABLED'
}

export interface BrandView {
  id: Id
  brandCode: string
  brandName: string
  logoUrl?: string | null
  status: 'ENABLED' | 'DISABLED'
}

export interface PublicShopView {
  shop: {
    id: Id
    shopNo: string
    shopName: string
    logoUrl: string | null
    status: ShopStatus
  }
  description?: string | null
}

export interface ProductCardView {
  id: Id
  spuNo: string
  productName: string
  subtitle?: string | null
  coverUrl: string
  shop: PublicShopView['shop']
  category: { id: Id; categoryName: string }
  brand?: BrandView | null
  minSalePrice: Money
  totalAvailableQuantity: number
  createdAt: Timestamp
}

export interface ProductDetailView extends ProductCardView {
  galleryUrls: string[]
  detailHtml: string
  packingList?: string | null
  serviceNote?: string | null
  attributes: Array<{ attributeId: Id; attributeName: string; value: string; unit?: string | null }>
  skus: Array<{
    id: Id
    skuNo: string
    skuName: string
    spec: Record<string, string>
    salePrice: Money
    marketPrice: Money
    barcode: string
    imageUrl: string
    availableQuantity: number
  }>
}

export interface ProductQuery {
  keyword?: string
  categoryId?: Id
  brandId?: Id
  shopId?: Id
  minPrice?: Money
  maxPrice?: Money
  inStock?: boolean
  page?: number
  pageSize?: number
  sort?: string
}

export function getCategoryTree() {
  return request.get<CategoryNode[]>('/categories/tree') as unknown as Promise<CategoryNode[]>
}

export function getCategoryAttributes(categoryId: Id) {
  return request.get<CategoryAttributeView[]>(`/categories/${categoryId}/attributes`) as unknown as Promise<CategoryAttributeView[]>
}

export function getBrandList(params: { keyword?: string; page?: number; pageSize?: number; sort?: string } = {}) {
  return request.get<PageView<BrandView>>('/brands', { params }) as unknown as Promise<PageView<BrandView>>
}

export function getPublicShop(shopId: Id) {
  return request.get<PublicShopView>(`/shops/${shopId}`) as unknown as Promise<PublicShopView>
}

export function getProductList(params: ProductQuery = {}) {
  return request.get<PageView<ProductCardView>>('/products', { params }) as unknown as Promise<PageView<ProductCardView>>
}

export function getProductDetail(spuId: Id) {
  return request.get<ProductDetailView>(`/products/${spuId}`) as unknown as Promise<ProductDetailView>
}
