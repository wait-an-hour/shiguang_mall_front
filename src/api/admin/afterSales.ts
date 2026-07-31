import { mockAdmin } from '@/mock/adminData'
import type { AfterSaleStatus, Id, ListQuery } from '@/types/admin'

export function listAfterSales(query: ListQuery) { return mockAdmin.listAfterSales(query) }
export function auditAfterSale(id: Id, status: AfterSaleStatus, auditRemark: string) { return mockAdmin.auditAfterSale(id, status, auditRemark) }
