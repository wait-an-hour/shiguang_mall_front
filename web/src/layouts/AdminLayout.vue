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
  { title: '首页概览', path: '/admin', permission: 'platform:operation:read' },
  { title: '角色管理', path: '/admin/rbac/roles', permission: 'platform:rbac:manage' },
  { title: '账号管理', path: '/admin/rbac/accounts', permission: 'platform:rbac:manage' },
  { title: '分类管理', path: '/admin/catalog/categories', permission: 'platform:catalog:manage' },
  { title: '品牌管理', path: '/admin/catalog/brands', permission: 'platform:catalog:manage' },
  { title: '商品审核', path: '/admin/products', permission: 'platform:product:audit' },
  { title: '平台运营', path: '/admin/orders', permission: 'platform:operation:read' }
] as const

const visibleMenus = computed(() => menus.filter((item) => auth.hasPermissions([item.permission])))

const adminOptions = [
  { username: 'admin', displayName: '平台管理员' },
  { username: 'operation', displayName: '运营管理员' },
  { username: 'audit', displayName: '售后审核员' }
]

function switchAdmin(username: string) {
  // 切换管理员必须重新输入目标账号密码，避免仅靠前端下拉直接越权切换权限。
  auth.clearSession()
  router.replace({ path: '/login', query: { admin: username, redirect: '/admin' } })
}

function logout() {
  auth.clearSession()
  router.replace('/login')
}

function handleAccountCommand(command: string) {
  if (command === 'logout') {
    logout()
    return
  }

  if (command.startsWith('switch:')) {
    switchAdmin(command.replace('switch:', ''))
  }
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
        <div class="context-name">{{ auth.user?.displayName }}端</div>
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
        <el-dropdown @command="handleAccountCommand">
          <span class="account">
            <span class="avatar">{{ auth.user?.displayName?.slice(0, 1) }}</span>
            {{ auth.user?.displayName }}
            <el-icon><ArrowDown /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item v-for="admin in adminOptions" :key="admin.username" :command="`switch:${admin.username}`" :disabled="admin.username === auth.user?.username">切换到{{ admin.displayName }}</el-dropdown-item>
              <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
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
.brand-subtitle { color: var(--sg-text-muted); font-size: 12px; }
.platform-context { margin: 16px; padding: 14px; border: 1px solid var(--sg-border); border-radius: var(--sg-radius-card); background: #fafafa; }
.context-name { font-weight: 600; }
.menu { display: flex; flex-direction: column; gap: 4px; padding: 0 12px; }
.menu-item { min-height: 40px; padding: 0 12px; border-radius: 8px; color: var(--sg-text-regular); line-height: 40px; }
.menu-item.is-active { background: var(--sg-primary-soft); color: var(--sg-primary); font-weight: 600; }
.workspace { min-width: 0; }
.topbar { display: flex; align-items: center; justify-content: space-between; height: 64px; padding: 0 24px; border-bottom: 1px solid var(--sg-border); background: #fff; }
.account { display: flex; align-items: center; gap: 10px; cursor: pointer; }
.avatar { display: grid; width: 32px; height: 32px; border-radius: 50%; background: var(--sg-primary-soft); color: var(--sg-primary); font-weight: 600; place-items: center; }
.page { padding: 24px; }
</style>
