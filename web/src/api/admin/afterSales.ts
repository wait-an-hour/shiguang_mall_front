import { mockAdmin } from '@/mock/adminData'
import type { ListQuery } from '@/types/admin'

export function listAfterSales(query: ListQuery) { return mockAdmin.listAfterSales(query) }
