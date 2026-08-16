import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { ADMIN_ROLE_LABEL, formatMoney, getAfterSaleStatusLabel, getOrderStatusLabel, getProductStatusLabel } from '@/utils/labels'
import { useAdminAuthStore } from '@/stores/adminAuth'
import { useAdminFiltersStore } from '@/stores/adminFilters'

// 这些测试覆盖管理员端最基础的纯业务规则：展示字典、会话持久化和列表筛选默认分页。
describe('管理员标签与状态存储', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('返回订单、商品、售后状态和金额展示文本', () => {
    expect(ADMIN_ROLE_LABEL.SUPER_ADMIN).toBe('超级管理员')
    expect(getOrderStatusLabel('PENDING_SHIPMENT')).toBe('待发货')
    expect(getProductStatusLabel('PENDING_REVIEW')).toBe('待审核')
    expect(getAfterSaleStatusLabel('REFUNDING')).toBe('退款中')
    expect(formatMoney('123.40')).toBe('¥123.40')
  })

  it('保存、校验权限并清理管理员登录态', () => {
    const store = useAdminAuthStore()
    store.setSession('admin-token', {
      id: 'admin-1', username: 'root', displayName: '超级管理员', role: 'SUPER_ADMIN',
      permissions: ['admin:dashboard:view', 'admin:order:view'], status: 'ACTIVE'
    })

    expect(store.isLoggedIn).toBe(true)
    expect(store.hasPermissions(['admin:dashboard:view'])).toBe(true)
    expect(store.hasPermissions(['admin:dashboard:view', 'admin:product:view'])).toBe(false)
    expect(JSON.parse(localStorage.getItem('shiguang-admin-auth') ?? '{}')).toMatchObject({ token: 'admin-token' })

    store.clearSession()
    expect(store.isLoggedIn).toBe(false)
    expect(localStorage.getItem('shiguang-admin-auth')).toBeNull()
  })

  it('空筛选返回稳定分页默认值，并持久化最新筛选条件', async () => {
    const store = useAdminFiltersStore()
    expect(store.getFilter('orders')).toEqual({ page: 1, pageSize: 10 })

    store.setFilter('orders', { keyword: 'SO-001', status: 'PENDING_SHIPMENT', page: 2, pageSize: 20 })
    await Promise.resolve()

    expect(store.getFilter('orders')).toEqual({ keyword: 'SO-001', status: 'PENDING_SHIPMENT', page: 2, pageSize: 20 })
    expect(JSON.parse(localStorage.getItem('shiguang-admin-list-filters') ?? '{}')).toMatchObject({
      orders: { keyword: 'SO-001', page: 2, pageSize: 20 }
    })
  })
})
