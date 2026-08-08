import request from '@/utils/request'
import { mockAdmin } from '@/mock/adminData'
import type { Id, ListQuery, PageResult, PlatformProduct, ProductStatus } from '@/types/admin'
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

  return mockAdmin.setProductStatus(id, status, reason)
}

export function listInventories(query: ListQuery) {
  return mockAdmin.listInventories(query)
}
