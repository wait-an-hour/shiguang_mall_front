import { createRouter, createWebHistory, type RouteLocationNormalized, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const AdminLayout = () => import('@/layouts/AdminLayout.vue')

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/login' },
  { path: '/login', name: 'Login', component: () => import('@/views/LoginView.vue'), meta: { title: '登录' } },
  { path: '/register', name: 'Register', component: () => import('@/views/RegisterView.vue'), meta: { title: '商家注册' } },
  { path: '/admin/login', redirect: '/login' },
  { path: '/shop/login', redirect: '/login' },
  {
    path: '/admin', component: AdminLayout, meta: { title: '平台后台', requiresAuth: true, role: 'SUPER_ADMIN', permissions: ['admin:dashboard:view'] }, children: [
      { path: '', name: 'AdminDashboard', component: () => import('@/views/admin/AdminDashboardView.vue'), meta: { title: '后台首页', requiresAuth: true, role: 'SUPER_ADMIN', permissions: ['admin:dashboard:view'] } },
      { path: 'rbac/roles', name: 'AdminRoles', component: () => import('@/views/admin/RoleManageView.vue'), meta: { title: '角色管理', requiresAuth: true, role: 'SUPER_ADMIN', permissions: ['admin:rbac:role'] } },
      { path: 'rbac/accounts', name: 'AdminAccounts', component: () => import('@/views/admin/AccountManageView.vue'), meta: { title: '账号管理', requiresAuth: true, role: 'SUPER_ADMIN', permissions: ['admin:rbac:account'] } },
      { path: 'catalog/categories', name: 'AdminCategories', component: () => import('@/views/admin/CategoryManageView.vue'), meta: { title: '分类管理', requiresAuth: true, role: 'SUPER_ADMIN', permissions: ['admin:catalog:category'] } },
      { path: 'catalog/brands', name: 'AdminBrands', component: () => import('@/views/admin/BrandManageView.vue'), meta: { title: '品牌管理', requiresAuth: true, role: 'SUPER_ADMIN', permissions: ['admin:catalog:brand'] } },
      { path: 'products', name: 'AdminProducts', component: () => import('@/views/admin/ProductManageView.vue'), meta: { title: '商品管理', requiresAuth: true, role: 'SUPER_ADMIN', permissions: ['admin:product:view'] } },
      { path: 'inventory', name: 'AdminInventory', component: () => import('@/views/admin/InventoryOverviewView.vue'), meta: { title: '库存总览', requiresAuth: true, role: 'SUPER_ADMIN', permissions: ['admin:inventory:view'] } },
      { path: 'orders', name: 'AdminOrders', component: () => import('@/views/admin/OrderManageView.vue'), meta: { title: '订单管理', requiresAuth: true, role: 'SUPER_ADMIN', permissions: ['admin:order:view'] } },
      { path: 'after-sales', name: 'AdminAfterSales', component: () => import('@/views/admin/AfterSaleReviewView.vue'), meta: { title: '售后审核', requiresAuth: true, role: 'SUPER_ADMIN', permissions: ['admin:after-sale:audit'] } }
    ]
  },
  { path: '/shop', name: 'ShopHome', component: () => import('@/views/shop/ShopHomeView.vue'), meta: { title: '商家工作台', requiresAuth: true, role: 'MERCHANT', permissions: ['shop:home:view'] } },
  { path: '/403', name: 'Forbidden', component: () => import('@/views/ForbiddenView.vue'), meta: { title: '无权访问' } },
  { path: '/404', name: 'NotFound', component: () => import('@/views/NotFoundView.vue'), meta: { title: '页面不存在' } },
  { path: '/:pathMatch(.*)*', redirect: '/404' }
]

const router = createRouter({ history: createWebHistory(), routes })

router.beforeEach((to: RouteLocationNormalized) => {
  const auth = useAuthStore()
  document.title = `${to.meta.title ?? '时光管理中心'} - 时光电商平台`
  if (!to.meta.requiresAuth) return true

  if (!auth.isLoggedIn) {
    // 后台页面需要先登录；统一回到新登录页，并保留原访问地址，管理员登录后可以继续跳回。
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  if (to.path.startsWith('/admin') && auth.role === 'MERCHANT') return { path: '/shop' }
  if (to.path.startsWith('/shop') && auth.role !== 'MERCHANT') return { path: '/admin' }
  if (to.meta.permissions?.length && !auth.hasPermissions(to.meta.permissions)) return { path: '/403' }
  return true
})

export default router
