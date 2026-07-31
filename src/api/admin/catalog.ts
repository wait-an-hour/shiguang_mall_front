import { mockAdmin } from '@/mock/adminData'
import type { BrandRecord, CategoryRecord, CommonStatus, Id, ListQuery } from '@/types/admin'

export function listCategories() { return mockAdmin.listCategories() }
export function saveCategory(record: CategoryRecord) { return mockAdmin.saveCategory(record) }
export function setCategoryStatus(id: Id, status: CommonStatus) { return mockAdmin.setCategoryStatus(id, status) }
export function listBrands(query: ListQuery) { return mockAdmin.listBrands(query) }
export function saveBrand(record: BrandRecord) { return mockAdmin.saveBrand(record) }
export function setBrandStatus(id: Id, status: CommonStatus) { return mockAdmin.setBrandStatus(id, status) }
