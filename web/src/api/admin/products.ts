import { mockAdmin } from '@/mock/adminData'
import type { Id, ListQuery } from '@/types/admin'

export function listProductReviews(query: ListQuery) { return mockAdmin.listProducts(query) }
export function approveProductReview(id: Id, reason?: string) { return mockAdmin.setProductStatus(id, 'ON_SHELF', reason) }
export function rejectProductReview(id: Id, reason: string) { return mockAdmin.setProductStatus(id, 'REJECTED', reason) }
export function takeOffShelfProduct(id: Id, reason: string) { return mockAdmin.setProductStatus(id, 'OFF_SHELF', reason) }
export function banProduct(id: Id, reason: string) { return mockAdmin.setProductStatus(id, 'BANNED', reason) }
export function revokeProductBan(id: Id, reason: string) { return mockAdmin.setProductStatus(id, 'OFF_SHELF', reason) }
export function listInventories(query: ListQuery) { return mockAdmin.listInventories(query) }
