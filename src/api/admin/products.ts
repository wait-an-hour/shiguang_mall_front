import { mockAdmin } from '@/mock/adminData'
import type { Id, ListQuery, ProductStatus } from '@/types/admin'

export function listProducts(query: ListQuery) { return mockAdmin.listProducts(query) }
export function setProductStatus(id: Id, status: ProductStatus, reason?: string) { return mockAdmin.setProductStatus(id, status, reason) }
export function listInventories(query: ListQuery) { return mockAdmin.listInventories(query) }
