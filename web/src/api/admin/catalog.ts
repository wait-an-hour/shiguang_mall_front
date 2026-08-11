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

export type CategoryAttributeValueType = 'TEXT' | 'NUMBER' | 'BOOLEAN' | 'OPTION'

export interface CategoryAttributeView {
  id: Id
  attributeName: string
  valueType: CategoryAttributeValueType
  unit?: string | null
  required: boolean
  filterable: boolean
  options: string[]
  sortOrder: number
  status: CommonStatus
}

export interface CategoryAttributeRequest {
  attributeName: string
  valueType: CategoryAttributeValueType
  unit?: string
  required: boolean
  filterable: boolean
  options?: string[]
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
    brandName: record.name.trim(),
    brandCode: (record.code || record.initial || record.name).trim().toUpperCase(),
    logoUrl: record.logoUrl?.trim() || ''
  }
}

function createCategoryCode() {
  return `CAT_${Date.now()}_${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

function toCategoryPayload(record: CategoryRecord) {
  const categoryName = record.name.trim()
  const categoryCode = record.code?.trim() || createCategoryCode()
  return {
    // 一级分类不能把空字符串传给后端，否则部分接口会把它当成非法父级 ID。
    parentId: record.parentId || undefined,
    categoryName,
    // 分类编码是后端唯一键，新增时生成时间戳加随机后缀，避免和已有类目代码冲突。
    categoryCode,
    sortOrder: record.sort
  }
}

export async function listCategories() {
  const data = await request.get<PlatformCategoryNode[]>('/platform/catalog/categories/tree') as unknown as PlatformCategoryNode[]
  return data.map((item) => toCategoryRecord(item))
}

export async function saveCategory(record: CategoryRecord) {
  const payload = toCategoryPayload(record)
  const data = record.id
    ? await request.put<PlatformCategoryNode>(`/platform/catalog/categories/${record.id}`, payload) as unknown as PlatformCategoryNode
    : await request.post<PlatformCategoryNode>('/platform/catalog/categories', payload) as unknown as PlatformCategoryNode
  return toCategoryRecord(data)
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
