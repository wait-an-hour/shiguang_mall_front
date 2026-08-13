<script setup lang="ts">
import { computed, type Component } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowDown, Avatar, Coin, CollectionTag, Discount, Goods, House, List, Notebook, Service, Setting, Shop, User, Wallet } from '@element-plus/icons-vue'
import logoUrl from '@/assets/shiguang-logo.png'
import { useAdminAuthStore } from '@/stores/adminAuth'
import type { PermissionCode } from '@/types/admin'

const route = useRoute()
const router = useRouter()
const auth = useAdminAuthStore()

const homePath = computed(() => {
  // 三类平台后台角色各自拥有自己的首页入口，避免共用一个总览链接。
  // Pinia setup store 的返回值会自动解包，所以这里直接读 auth.role，不要再写 .value。
  if (auth.role === 'PLATFORM_PRODUCT_AUDITOR') return '/admin/products'
  if (auth.role === 'PLATFORM_SHOP_ADMIN') return '/admin/shops'
  return '/admin/dashboard'
})

interface AdminMenuItem {
  title: string
  path: string
  icon: Component
  permissions: PermissionCode[]
  permissionMode?: 'all' | 'any'
}

const menus = computed<AdminMenuItem[]>(() => [
  { title: '首页概览', path: homePath.value, icon: House, permissions: ['admin:dashboard:view', 'admin:product:view', 'admin:shop:manage'], permissionMode: 'any' },
  { title: '角色管理', path: '/admin/rbac/roles', icon: Setting, permissions: ['admin:rbac:role'] },
  { title: '平台账号', path: '/admin/rbac/accounts', icon: Avatar, permissions: ['admin:rbac:account'] },
  { title: '店铺成员', path: '/admin/shops/members', icon: User, permissions: ['admin:shop:member:manage'] },
  { title: '分类管理', path: '/admin/catalog/categories', icon: CollectionTag, permissions: ['admin:catalog:category'] },
  { title: '品牌管理', path: '/admin/catalog/brands', icon: Notebook, permissions: ['admin:catalog:brand'] },
  { title: '店铺管理', path: '/admin/shops', icon: Shop, permissions: ['admin:shop:manage'] },
  { title: '商品管理', path: '/admin/products', icon: Goods, permissions: ['admin:product:view'] },
  { title: '订单管理', path: '/admin/orders', icon: List, permissions: ['admin:order:view'] },
  { title: '售后查询', path: '/admin/after-sales', icon: Service, permissions: ['admin:operation:read'] },
  { title: '售后审核', path: '/admin/after-sale-appeals', icon: Discount, permissions: ['admin:after-sale:audit'] },
  { title: '商家钱包', path: '/admin/merchant-wallets', icon: Wallet, permissions: ['admin:operation:read'] },
  { title: '优惠券管理', path: '/admin/coupons', icon: Coin, permissions: ['admin:operation:read'] }
])

const visibleMenus = computed(() => menus.value.filter((item) => {
  // 平台店铺管理员没有独立首页，左侧直接隐藏“首页概览”，避免误导为与超级管理员共用首页。
  if (auth.role === 'PLATFORM_SHOP_ADMIN' && item.title === '首页概览') return false
  return item.permissionMode === 'any'
    ? item.permissions.some((permission) => auth.hasPermissions([permission]))
    : auth.hasPermissions(item.permissions)
}))

function isMenuActive(item: AdminMenuItem) {
  if (item.path !== '/admin/shops') return route.path === item.path
  return route.path === '/admin/shops' || /^\/admin\/shops\/(create|(?!members(?:\/|$))[^/]+(?:\/edit)?)$/.test(route.path)
}

function logout() {
  auth.clearSession()
  router.replace('/login')
}
</script>

<template>
  <div class="admin-shell">
    <aside class="sidebar">
      <div class="brand">
        <img class="brand-logo" :src="logoUrl" alt="时光电商平台" />
        <div>
          <div class="brand-title">时光管理中心</div>
          <div class="brand-subtitle">Management Center</div>
        </div>
      </div>
      <div class="platform-context">
        <div class="context-label">当前后台域</div>
        <div class="context-name">平台管理员端</div>
        <div class="context-meta">与商家端权限隔离</div>
      </div>
      <nav class="menu">
        <router-link v-for="item in visibleMenus" :key="item.path" class="menu-item" :class="{ 'is-active': isMenuActive(item) }" :to="item.path"><el-icon class="menu-icon"><component :is="item.icon" /></el-icon><span>{{ item.title }}</span></router-link>
      </nav>
    </aside>

    <section class="workspace">
      <header class="topbar">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item>平台后台</el-breadcrumb-item>
          <el-breadcrumb-item>{{ route.meta.title }}</el-breadcrumb-item>
        </el-breadcrumb>
        <el-dropdown @command="logout">
          <span class="account">
            <span class="avatar">{{ auth.user?.displayName?.slice(0, 1) }}</span>
            {{ auth.user?.displayName }}
            <el-icon><ArrowDown /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu><el-dropdown-item command="logout">退出登录</el-dropdown-item></el-dropdown-menu>
          </template>
        </el-dropdown>
      </header>
      <main class="page"><router-view /></main>
    </section>
  </div>
</template>

<style scoped lang="scss">
.admin-shell { display: grid; min-height: 100vh; grid-template-columns: 236px minmax(0, 1fr); }
.sidebar { border-right: 1px solid var(--sg-border); background: #fff; }
.brand { display: flex; align-items: center; gap: 8px; height: 60px; padding: 0 14px; border-bottom: 1px solid var(--sg-divider); }
.brand-logo { width: 30px; height: 30px; border-radius: 8px; object-fit: cover; }
.brand-title { font-size: 16px; font-weight: 600; }
.brand-subtitle, .context-label, .context-meta { color: var(--sg-text-muted); font-size: 12px; }
.platform-context { margin: 12px; padding: 10px; border: 1px solid var(--sg-border); border-radius: var(--sg-radius-card); background: #fafafa; }
.context-name { margin-top: 4px; font-weight: 600; }
.menu { display: flex; flex-direction: column; gap: 3px; padding: 0 8px; }
.menu-item { display: flex; align-items: center; min-height: 38px; gap: 8px; padding: 0 8px; border-radius: 8px; color: var(--sg-text-regular); line-height: 38px; }
.menu-icon { width: 18px; color: currentColor; font-size: 18px; }
.menu-item.is-active { background: var(--sg-primary-soft); color: var(--sg-primary); font-weight: 600; }
.workspace { min-width: 0; }
.topbar { display: flex; align-items: center; justify-content: space-between; height: 64px; padding: 0 24px; border-bottom: 1px solid var(--sg-border); background: #fff; }
.account { display: flex; align-items: center; gap: 10px; cursor: pointer; }
.avatar { display: grid; width: 32px; height: 32px; border-radius: 50%; background: var(--sg-primary-soft); color: var(--sg-primary); font-weight: 600; place-items: center; }
.page { padding: 24px; }
</style>
