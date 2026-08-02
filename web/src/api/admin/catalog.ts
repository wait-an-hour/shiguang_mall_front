import request from '@/utils/request'
import type { BrandRecord, CategoryRecord, CommonStatus, Id, ListQuery, PageResult } from '@/types/admin'
import type { PageView, Timestamp } from '@/types/common'

interface PlatformCategoryNode {
  id: Id
  parentId?: Id | null
  categoryCode: string
  categoryName: string
  sortOrder: number
  status: CommonStatus
  children?: PlatformCategoryNode[]
}

export interface CategoryAttributeView {
  id: Id
  attributeName: string
  valueType: 'TEXT' | 'NUMBER' | 'BOOLEAN' | 'ENUM'
  unit?: string | null
  required: boolean
  filterable: boolean
  options: string[]
  sortOrder: number
  status: CommonStatus
}

export interface CategoryAttributeRequest {
  attributeName: string
  valueType: 'TEXT' | 'NUMBER' | 'BOOLEAN' | 'ENUM'
  unit?: string
  required: boolean
  filterable: boolean
  options: string[]
  sortOrder: number
}

interface BrandView {
  id: Id
  brandCode: string
  brandName: string
  logoUrl?: string | null
  status: CommonStatus
}

function toCategoryRecord(node: PlatformCategoryNode, level = 1): CategoryRecord {
  return {
    id: node.id,
    parentId: node.parentId ?? undefined,
    name: node.categoryName,
    code: node.categoryCode,
    level,
    sort: node.sortOrder,
    status: node.status,
    children: node.children?.map((child) => toCategoryRecord(child, level + 1))
  }
}

function toBrandRecord(item: BrandView): BrandRecord {
  return {
    id: item.id,
    name: item.brandName,
    code: item.brandCode,
    initial: item.brandCode.slice(0, 1).toUpperCase(),
    logoUrl: item.logoUrl,
    status: item.status,
    createdAt: '' as Timestamp
  }
}

function toBrandPayload(record: BrandRecord) {
  return {
    brandName: record.name,
    brandCode: record.code || record.initial || record.name,
    logoUrl: record.logoUrl ?? ''
  }
}

function toCategoryPayload(record: CategoryRecord) {
  return {
    parentId: record.parentId,
    categoryName: record.name,
    categoryCode: record.code || record.name,
    sortOrder: record.sort
  }
}

export async function listCategories() {
  const data = await request.get<PlatformCategoryNode[]>('/platform/catalog/categories/tree') as unknown as PlatformCategoryNode[]
  return data.map((item) => toCategoryRecord(item))
}

export async function saveCategory(record: CategoryRecord) {
  const payload = toCategoryPayload(record)
  if (record.id) {
    await request.put(`/platform/catalog/categories/${record.id}`, payload)
  } else {
    await request.post('/platform/catalog/categories', payload)
  }
}

export function setCategoryStatus(id: Id, status: CommonStatus) {
  return request.post(`/platform/catalog/categories/${id}/status`, { targetStatus: status })
}

export async function listBrands(query: ListQuery) {
  const data = await request.get<PageView<BrandView>>('/platform/catalog/brands', { params: query }) as unknown as PageView<BrandView>
  const items = data.items.map(toBrandRecord)
  const filtered = query.status ? items.filter((item) => item.status === query.status) : items
  return { ...data, items: filtered, total: filtered.length } satisfies PageResult<BrandRecord>
}

export async function saveBrand(record: BrandRecord) {
  const payload = toBrandPayload(record)
  if (record.id) {
    await request.put(`/platform/catalog/brands/${record.id}`, payload)
  } else {
    await request.post('/platform/catalog/brands', payload)
  }
}

export function setBrandStatus(id: Id, status: CommonStatus) {
  return request.post(`/platform/catalog/brands/${id}/status`, { targetStatus: status })
}

export function listCategoryAttributes(categoryId: Id) {
  return request.get<CategoryAttributeView[]>(`/platform/catalog/categories/${categoryId}/attributes`) as unknown as Promise<CategoryAttributeView[]>
}

export function createCategoryAttribute(categoryId: Id, data: CategoryAttributeRequest) {
  return request.post<CategoryAttributeView>(`/platform/catalog/categories/${categoryId}/attributes`, data) as unknown as Promise<CategoryAttributeView>
}

export function updateCategoryAttribute(categoryId: Id, attributeId: Id, data: CategoryAttributeRequest) {
  return request.put<CategoryAttributeView>(`/platform/catalog/categories/${categoryId}/attributes/${attributeId}`, data) as unknown as Promise<CategoryAttributeView>
}

export function setCategoryAttributeStatus(categoryId: Id, attributeId: Id, status: CommonStatus, reason?: string) {
  return request.post<CategoryAttributeView>(`/platform/catalog/categories/${categoryId}/attributes/${attributeId}/status`, { targetStatus: status, reason }) as unknown as Promise<CategoryAttributeView>
}
