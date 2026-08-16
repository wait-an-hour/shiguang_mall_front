import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import AdminLayout from '@/layouts/AdminLayout.vue'
import { useAdminAuthStore } from '@/stores/adminAuth'
import type { PermissionCode, PlatformUser } from '@/types/admin'

// 布局测试只挂载菜单和路由出口，用三个真实平台角色验证可见菜单与首页分支。
const cases: Array<{ name: string; role: PlatformUser['role']; permissions: PermissionCode[]; expected: string[]; hidden: string[] }> = [
  {
    name: '超级管理员', role: 'SUPER_ADMIN',
    permissions: ['admin:dashboard:view', 'admin:rbac:role', 'admin:rbac:account', 'admin:shop:member:manage', 'admin:catalog:category', 'admin:catalog:brand', 'admin:shop:manage', 'admin:product:view', 'admin:order:view', 'admin:operation:read', 'admin:after-sale:audit'],
    expected: ['首页概览', '角色管理', '商品管理', '订单管理', '优惠券管理'], hidden: []
  },
  {
    name: '平台店铺管理员', role: 'PLATFORM_SHOP_ADMIN', permissions: ['admin:shop:manage'],
    expected: ['店铺管理'], hidden: ['首页概览', '商品管理', '订单管理']
  },
  {
    name: '平台商品审核员', role: 'PLATFORM_PRODUCT_AUDITOR', permissions: ['admin:product:view'],
    expected: ['商品管理'], hidden: ['首页概览', '店铺管理', '订单管理']
  }
]

describe('AdminLayout 角色权限菜单', () => {
  beforeEach(() => localStorage.clear())

  for (const testCase of cases) {
    it(`${testCase.name}只看到授权菜单`, async () => {
      const pinia = createPinia()
      setActivePinia(pinia)
      const auth = useAdminAuthStore()
      auth.setSession('token', {
        id: 'admin-1', username: 'admin', displayName: testCase.name, role: testCase.role,
        permissions: testCase.permissions, status: 'ACTIVE'
      })
      const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/admin/dashboard', component: { template: '<div />' } }, { path: '/admin/products', component: { template: '<div />' } }, { path: '/admin/shops', component: { template: '<div />' } }, { path: '/login', component: { template: '<div />' } }] })
      await router.push(testCase.role === 'SUPER_ADMIN' ? '/admin/dashboard' : testCase.role === 'PLATFORM_SHOP_ADMIN' ? '/admin/shops' : '/admin/products')
      await router.isReady()

      const wrapper = mount(AdminLayout, {
        global: {
          plugins: [pinia, router],
          stubs: { ElIcon: true, ElBreadcrumb: true, ElBreadcrumbItem: true, ElDropdown: true, ElDropdownMenu: true, ElDropdownItem: true, RouterView: true }
        }
      })
      const menuText = wrapper.findAll('.menu-item').map((item: { text: () => string }) => item.text())
      expect(menuText).toEqual(expect.arrayContaining(testCase.expected))
      for (const title of testCase.hidden) expect(menuText).not.toContain(title)
    })
  }
})
