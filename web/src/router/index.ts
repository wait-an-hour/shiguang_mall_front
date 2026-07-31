import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import './meta'
import { SHOP_PERMISSION } from '../constants/merchant'
import { ROUTE_NAME } from '../constants/routes'
import { useAuthStore } from '../stores/auth'
import { useMerchantStore } from '../stores/merchant'

const merchantPlaceholder = () => import('../views/merchant/MerchantPlaceholderView.vue')

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: { name: ROUTE_NAME.MerchantEntry }
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
    component: () => import('../views/merchant/MerchantShopSelectView.vue'),
    meta: {
      title: '选择店铺',
      layout: 'blank',
      requiresAuth: true
    }
  },
  {
    path: '/merchant/shops/:shopId',
    component: () => import('../layouts/MerchantLayout.vue'),
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
        component: () => import('../views/merchant/MerchantDashboardView.vue'),
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
        component: merchantPlaceholder,
        meta: {
          title: '商品管理',
          layout: 'merchant',
          requiresAuth: true,
          shopScoped: true,
          permissions: [SHOP_PERMISSION.ProductManage]
        }
      },
      {
        path: 'inventory',
        name: ROUTE_NAME.MerchantInventoryList,
        component: merchantPlaceholder,
        meta: {
          title: '库存管理',
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
    path: '/403',
    name: ROUTE_NAME.Forbidden,
    component: () => import('../views/ForbiddenView.vue'),
    meta: {
      title: '无权访问',
      layout: 'blank'
    }
  },
  {
    path: '/:pathMatch(.*)*',
    name: ROUTE_NAME.NotFound,
    component: () => import('../views/NotFoundView.vue'),
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

  if (typeof to.meta.title === 'string') {
    document.title = `${to.meta.title} - 时光商城`
  }

  return true
})
