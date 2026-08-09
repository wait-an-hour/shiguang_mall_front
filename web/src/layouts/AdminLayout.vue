<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowDown } from '@element-plus/icons-vue'
import logoUrl from '@/assets/shiguang-logo.png'
import { useAdminAuthStore } from '@/stores/adminAuth'

const route = useRoute()
const router = useRouter()
const auth = useAdminAuthStore()

const menus = [
  { title: '首页概览', path: '/admin', permission: 'admin:dashboard:view' },
  { title: '角色管理', path: '/admin/rbac/roles', permission: 'admin:rbac:role' },
  { title: '平台账号', path: '/admin/rbac/accounts', permission: 'admin:rbac:account' },
  { title: '店铺成员', path: '/admin/shops/members', permission: 'admin:shop:manage' },
  { title: '分类管理', path: '/admin/catalog/categories', permission: 'admin:catalog:category' },
  { title: '品牌管理', path: '/admin/catalog/brands', permission: 'admin:catalog:brand' },
  { title: '店铺管理', path: '/admin/shops', permission: 'admin:shop:manage' },
  { title: '商品管理', path: '/admin/products', permission: 'admin:product:view' },
  { title: '库存总览', path: '/admin/inventory', permission: 'admin:inventory:view' },
  { title: '订单管理', path: '/admin/orders', permission: 'admin:order:view' },
  { title: '售后审核', path: '/admin/after-sales', permission: 'admin:after-sale:audit' },
  { title: '售后申诉', path: '/admin/after-sale-appeals', permission: 'admin:after-sale:audit' },
  { title: '商家钱包', path: '/admin/merchant-wallets', permission: 'admin:operation:read' }
] as const

const visibleMenus = computed(() => menus.filter((item) => auth.hasPermissions([item.permission])))

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
        <router-link v-for="item in visibleMenus" :key="item.path" class="menu-item" :class="{ 'is-active': route.path === item.path }" :to="item.path">{{ item.title }}</router-link>
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
.brand { display: flex; align-items: center; gap: 10px; height: 64px; padding: 0 20px; border-bottom: 1px solid var(--sg-divider); }
.brand-logo { width: 34px; height: 34px; border-radius: 8px; object-fit: cover; }
.brand-title { font-size: 16px; font-weight: 600; }
.brand-subtitle, .context-label, .context-meta { color: var(--sg-text-muted); font-size: 12px; }
.platform-context { margin: 16px; padding: 14px; border: 1px solid var(--sg-border); border-radius: var(--sg-radius-card); background: #fafafa; }
.context-name { margin-top: 4px; font-weight: 600; }
.menu { display: flex; flex-direction: column; gap: 4px; padding: 0 12px; }
.menu-item { min-height: 40px; padding: 0 12px; border-radius: 8px; color: var(--sg-text-regular); line-height: 40px; }
.menu-item.is-active { background: var(--sg-primary-soft); color: var(--sg-primary); font-weight: 600; }
.workspace { min-width: 0; }
.topbar { display: flex; align-items: center; justify-content: space-between; height: 64px; padding: 0 24px; border-bottom: 1px solid var(--sg-border); background: #fff; }
.account { display: flex; align-items: center; gap: 10px; cursor: pointer; }
.avatar { display: grid; width: 32px; height: 32px; border-radius: 50%; background: var(--sg-primary-soft); color: var(--sg-primary); font-weight: 600; place-items: center; }
.page { padding: 24px; }
</style>
