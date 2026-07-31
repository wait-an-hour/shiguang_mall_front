import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import './meta'
import { SHOP_PERMISSION } from '@/constants/merchant'
import { ROUTE_NAME } from '@/constants/routes'
import { useAdminAuthStore } from '@/stores/adminAuth'
import { useAuthStore } from '@/stores/auth'
import { useMerchantStore } from '@/stores/merchant'

const merchantPlaceholder = () => import('@/views/merchant/MerchantPlaceholderView.vue')
const merchantProductList = () => import('@/views/merchant/product/MerchantProductListView.vue')
const merchantProductForm = () => import('@/views/merchant/product/MerchantProductFormView.vue')
const merchantProductDetail = () => import('@/views/merchant/product/MerchantProductDetailView.vue')
const merchantInventoryList = () => import('@/views/merchant/inventory/MerchantInventoryListView.vue')
const merchantInventoryDetail = () => import('@/views/merchant/inventory/MerchantInventoryDetailView.vue')
const merchantInventoryTransactions = () => import('@/views/merchant/inventory/MerchantInventoryTransactionsView.vue')

const adminRouteMeta = {
  layout: 'admin',
  requiresAuth: true,
  role: 'SUPER_ADMIN'
} as const

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: { name: ROUTE_NAME.MerchantEntry }
  },
  {
    path: '/login',
    name: ROUTE_NAME.Login,
    component: () => import('@/views/LoginView.vue'),
    meta: {
      title: '登录',
      layout: 'blank'
    }
  },
  {
    path: '/register',
    name: ROUTE_NAME.Register,
    component: () => import('@/views/RegisterView.vue'),
    meta: {
      title: '商家注册',
      layout: 'blank'
    }
  },
  {
    path: '/admin/login',
    redirect: '/login'
  },
  {
    path: '/shop/login',
    redirect: '/login'
  },
  {
    path: '/merchant',
    name: ROUTE_NAME.MerchantEntry,
    redirect: () => ({ name: ROUTE_NAME.MerchantDashboard, params: { shopId: 'SHOP202607260001' } }),
    meta: {
      title: '商家端入口',
      layout: 'blank',
      requiresAuth: true
    }
  },
  {
    path: '/merchant/shops',
    name: ROUTE_NAME.MerchantShopSelect,
    component: () => import('@/views/merchant/MerchantShopSelectView.vue'),
    meta: {
      title: '选择店铺',
      layout: 'blank',
      requiresAuth: true
    }
  },
  {
    path: '/merchant/shops/:shopId',
    component: () => import('@/layouts/MerchantLayout.vue'),
    meta: {
      title: '商家中心',
      layout: 'merchant',
      requiresAuth: true,
      shopScoped: true
    },
    children: [
      {
        path: '',
        redirect: { name: ROUTE_NAME.MerchantDashboard }
      },
      {
        path: 'dashboard',
        name: ROUTE_NAME.MerchantDashboard,
        component: () => import('@/views/merchant/MerchantDashboardView.vue'),
        meta: {
          title: '工作台',
          layout: 'merchant',
          requiresAuth: true,
          shopScoped: true
        }
      },
      {
        path: 'products',
        name: ROUTE_NAME.MerchantProductList,
        component: merchantProductList,
        meta: {
          title: '商品管理',
          layout: 'merchant',
          requiresAuth: true,
          shopScoped: true,
          permissions: [SHOP_PERMISSION.ProductManage]
        }
      },
      {
        path: 'products/new',
        name: ROUTE_NAME.MerchantProductCreate,
        component: merchantProductForm,
        meta: {
          title: '新建商品',
          layout: 'merchant',
          requiresAuth: true,
          shopScoped: true,
          permissions: [SHOP_PERMISSION.ProductManage]
        }
      },
      {
        path: 'products/:spuId',
        name: ROUTE_NAME.MerchantProductDetail,
        component: merchantProductDetail,
        meta: {
          title: '商品详情',
          layout: 'merchant',
          requiresAuth: true,
          shopScoped: true,
          permissions: [SHOP_PERMISSION.ProductManage]
        }
      },
      {
        path: 'products/:spuId/edit',
        name: ROUTE_NAME.MerchantProductEdit,
        component: merchantProductForm,
        meta: {
          title: '编辑商品',
          layout: 'merchant',
          requiresAuth: true,
          shopScoped: true,
          permissions: [SHOP_PERMISSION.ProductManage]
        }
      },
      {
        path: 'inventory',
        name: ROUTE_NAME.MerchantInventoryList,
        component: merchantInventoryList,
        meta: {
          title: '库存管理',
          layout: 'merchant',
          requiresAuth: true,
          shopScoped: true,
          permissions: [SHOP_PERMISSION.InventoryManage]
        }
      },
      {
        path: 'inventory/transactions',
        name: ROUTE_NAME.MerchantInventoryTransactions,
        component: merchantInventoryTransactions,
        meta: {
          title: '库存流水',
          layout: 'merchant',
          requiresAuth: true,
          shopScoped: true,
          permissions: [SHOP_PERMISSION.InventoryManage]
        }
      },
      {
        path: 'inventory/:skuId',
        name: ROUTE_NAME.MerchantInventoryDetail,
        component: merchantInventoryDetail,
        meta: {
          title: '库存详情',
          layout: 'merchant',
          requiresAuth: true,
          shopScoped: true,
          permissions: [SHOP_PERMISSION.InventoryManage]
        }
      },
      {
        path: 'orders',
        name: ROUTE_NAME.MerchantOrderList,
        component: merchantPlaceholder,
        meta: {
          title: '订单履约',
          layout: 'merchant',
          requiresAuth: true,
          shopScoped: true,
          permissions: [SHOP_PERMISSION.OrderRead]
        }
      },
      {
        path: 'after-sales',
        name: ROUTE_NAME.MerchantAfterSaleList,
        component: merchantPlaceholder,
        meta: {
          title: '售后处理',
          layout: 'merchant',
          requiresAuth: true,
          shopScoped: true,
          permissions: [SHOP_PERMISSION.AfterSaleManage]
        }
      },
      {
        path: 'members',
        name: ROUTE_NAME.MerchantMemberList,
        component: merchantPlaceholder,
        meta: {
          title: '成员管理',
          layout: 'merchant',
          requiresAuth: true,
          shopScoped: true,
          permissions: [SHOP_PERMISSION.MemberManage]
        }
      }
    ]
  },
  {
    path: '/admin',
    component: () => import('@/layouts/AdminLayout.vue'),
    meta: {
      ...adminRouteMeta,
      title: '平台后台',
      permissions: ['admin:dashboard:view']
    },
    children: [
      { path: '', name: ROUTE_NAME.AdminDashboard, component: () => import('@/views/admin/AdminDashboardView.vue'), meta: { ...adminRouteMeta, title: '后台首页', permissions: ['admin:dashboard:view'] } },
      { path: 'rbac/roles', name: ROUTE_NAME.AdminRoles, component: () => import('@/views/admin/RoleManageView.vue'), meta: { ...adminRouteMeta, title: '角色管理', permissions: ['admin:rbac:role'] } },
      { path: 'rbac/accounts', name: ROUTE_NAME.AdminAccounts, component: () => import('@/views/admin/AccountManageView.vue'), meta: { ...adminRouteMeta, title: '账号管理', permissions: ['admin:rbac:account'] } },
      { path: 'catalog/categories', name: ROUTE_NAME.AdminCategories, component: () => import('@/views/admin/CategoryManageView.vue'), meta: { ...adminRouteMeta, title: '分类管理', permissions: ['admin:catalog:category'] } },
      { path: 'catalog/brands', name: ROUTE_NAME.AdminBrands, component: () => import('@/views/admin/BrandManageView.vue'), meta: { ...adminRouteMeta, title: '品牌管理', permissions: ['admin:catalog:brand'] } },
      { path: 'products', name: ROUTE_NAME.AdminProducts, component: () => import('@/views/admin/ProductManageView.vue'), meta: { ...adminRouteMeta, title: '商品管理', permissions: ['admin:product:view'] } },
      { path: 'inventory', name: ROUTE_NAME.AdminInventory, component: () => import('@/views/admin/InventoryOverviewView.vue'), meta: { ...adminRouteMeta, title: '库存总览', permissions: ['admin:inventory:view'] } },
      { path: 'orders', name: ROUTE_NAME.AdminOrders, component: () => import('@/views/admin/OrderManageView.vue'), meta: { ...adminRouteMeta, title: '订单管理', permissions: ['admin:order:view'] } },
      { path: 'after-sales', name: ROUTE_NAME.AdminAfterSales, component: () => import('@/views/admin/AfterSaleReviewView.vue'), meta: { ...adminRouteMeta, title: '售后审核', permissions: ['admin:after-sale:audit'] } }
    ]
  },
  {
    path: '/403',
    name: ROUTE_NAME.Forbidden,
    component: () => import('@/views/ForbiddenView.vue'),
    meta: {
      title: '无权访问',
      layout: 'blank'
    }
  },
  {
    path: '/:pathMatch(.*)*',
    name: ROUTE_NAME.NotFound,
    component: () => import('@/views/NotFoundView.vue'),
    meta: {
      title: '页面不存在',
      layout: 'blank'
    }
  }
]

export const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to) => {
  const publicPaths = ['/login', '/register', '/403']
  if (publicPaths.includes(to.path) || to.name === ROUTE_NAME.NotFound) {
    setDocumentTitle(to.meta.title)
    return true
  }

  if (to.path.startsWith('/admin')) {
    const adminAuthStore = useAdminAuthStore()
    if (to.meta.requiresAuth && !adminAuthStore.isLoggedIn) {
      return { path: '/login', query: { redirect: to.fullPath } }
    }

    const permissions = to.meta.permissions ?? []
    if (permissions.length > 0 && !adminAuthStore.hasPermissions(permissions)) {
      return { name: ROUTE_NAME.Forbidden }
    }

    setDocumentTitle(to.meta.title)
    return true
  }

  const authStore = useAuthStore()
  const merchantStore = useMerchantStore()

  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    return { name: ROUTE_NAME.Forbidden }
  }

  if (to.meta.shopScoped) {
    const shopId = to.params.shopId

    if (typeof shopId !== 'string' || !merchantStore.ensureShop(shopId)) {
      return { name: ROUTE_NAME.Forbidden }
    }

    const permissions = to.meta.permissions ?? []
    if (permissions.length > 0 && !merchantStore.hasEveryShopPermission(permissions)) {
      return { name: ROUTE_NAME.Forbidden }
    }
  }

  setDocumentTitle(to.meta.title)
  return true
})

function setDocumentTitle(title?: string) {
  if (title) {
    document.title = `${title} - 时光商城`
  }
}
