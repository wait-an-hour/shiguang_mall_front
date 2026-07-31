import { mockAdmin } from '@/mock/adminData'
import type { ListQuery } from '@/types/admin'

export function listOrders(query: ListQuery) { return mockAdmin.listOrders(query) }
