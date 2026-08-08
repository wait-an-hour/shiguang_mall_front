<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import {
  Box,
  Goods,
  HomeFilled,
  List,
  Operation,
  Switch,
  User,
  Wallet
} from '@element-plus/icons-vue'
import shiguangLogo from '../assets/shiguang-logo.png'
import { SHOP_PERMISSION, SHOP_STATUS_LABELS, SHOP_STATUS_TAG_TYPES } from '../constants/merchant'
import { ROUTE_NAME } from '../constants/routes'
import { useAuthStore } from '../stores/auth'
import { useMerchantStore } from '../stores/merchant'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const merchantStore = useMerchantStore()
const { currentUser } = storeToRefs(authStore)
const { currentShop } = storeToRefs(merchantStore)

const shopId = computed(() => String(route.params.shopId || merchantStore.currentShopId || ''))

const menuItems = computed(() => [
  {
    label: '工作台',
    routeName: ROUTE_NAME.MerchantDashboard,
    icon: HomeFilled,
    visible: merchantStore.hasAnyShopPermission([
      SHOP_PERMISSION.ProductManage,
      SHOP_PERMISSION.InventoryManage,
      SHOP_PERMISSION.OrderRead,
      SHOP_PERMISSION.AfterSaleManage,
      SHOP_PERMISSION.WalletRead,
      SHOP_PERMISSION.MemberManage
    ])
  },
  {
    label: '商品管理',
    routeName: ROUTE_NAME.MerchantProductList,
    icon: Goods,
    visible: merchantStore.hasShopPermission(SHOP_PERMISSION.ProductManage)
  },
  {
    label: '库存管理',
    routeName: ROUTE_NAME.MerchantInventoryList,
    icon: Box,
    visible: merchantStore.hasShopPermission(SHOP_PERMISSION.InventoryManage)
  },
  {
    label: '订单履约',
    routeName: ROUTE_NAME.MerchantOrderList,
    icon: List,
    visible: merchantStore.hasShopPermission(SHOP_PERMISSION.OrderRead)
  },
  {
    label: '售后处理',
    routeName: ROUTE_NAME.MerchantAfterSaleList,
    icon: Operation,
    visible: merchantStore.hasShopPermission(SHOP_PERMISSION.AfterSaleManage)
  },
  {
    label: '商家钱包',
    routeName: ROUTE_NAME.MerchantWallet,
    icon: Wallet,
    visible: merchantStore.hasShopPermission(SHOP_PERMISSION.WalletRead)
  },
  {
    label: '成员管理',
    routeName: ROUTE_NAME.MerchantMemberList,
    icon: User,
    visible: merchantStore.hasShopPermission(SHOP_PERMISSION.MemberManage)
  }
].filter((item) => item.visible))

const parentMenuByRouteName: Record<string, string> = {
  [ROUTE_NAME.MerchantProductCreate]: ROUTE_NAME.MerchantProductList,
  [ROUTE_NAME.MerchantProductDetail]: ROUTE_NAME.MerchantProductList,
  [ROUTE_NAME.MerchantProductEdit]: ROUTE_NAME.MerchantProductList,
  [ROUTE_NAME.MerchantInventoryDetail]: ROUTE_NAME.MerchantInventoryList,
  [ROUTE_NAME.MerchantInventoryTransactions]: ROUTE_NAME.MerchantInventoryList,
  [ROUTE_NAME.MerchantOrderDetail]: ROUTE_NAME.MerchantOrderList,
  [ROUTE_NAME.MerchantAfterSaleDetail]: ROUTE_NAME.MerchantAfterSaleList
}

const activeMenu = computed(() => {
  const routeName = String(route.name || ROUTE_NAME.MerchantDashboard)
  return parentMenuByRouteName[routeName] ?? routeName
})

function openMenu(routeName: string) {
  router.push({ name: routeName, params: { shopId: shopId.value } })
}

function switchShop() {
  router.push({ name: ROUTE_NAME.MerchantShopSelect })
}

function logout() {
  authStore.clearSession()
  merchantStore.setCurrentShop(null)
  router.replace({ name: ROUTE_NAME.Login })
}
</script>

<template>
  <div class="merchant-shell">
    <aside class="merchant-sidebar">
      <div class="brand">
        <img class="brand-logo" :src="shiguangLogo" alt="时光商城" />
        <div>
          <div class="brand-title">时光商家中心</div>
          <div class="brand-subtitle">Merchant Center</div>
        </div>
      </div>

      <section v-if="currentShop" class="shop-context">
        <div class="shop-label">当前店铺</div>
        <div class="shop-name">{{ currentShop.name }}</div>
        <div class="shop-meta">{{ currentShop.code }}</div>
        <el-tag :type="SHOP_STATUS_TAG_TYPES[currentShop.status]" effect="light" size="small">
          {{ SHOP_STATUS_LABELS[currentShop.status] }}
        </el-tag>
      </section>

      <el-menu class="merchant-menu" :default-active="activeMenu" @select="openMenu">
        <el-menu-item v-for="item in menuItems" :key="item.routeName" :index="item.routeName">
          <el-icon><component :is="item.icon" /></el-icon>
          <span>{{ item.label }}</span>
        </el-menu-item>
      </el-menu>
    </aside>

    <section class="merchant-main">
      <header class="merchant-topbar">
        <div>
          <div class="topbar-title">{{ route.meta.title }}</div>
          <div class="topbar-subtitle">店铺范围数据已按当前账号权限过滤</div>
        </div>

        <div class="topbar-actions">
          <el-button :icon="Switch" plain @click="switchShop">切换店铺</el-button>
          <span class="user-name">{{ currentUser?.displayName }}</span>
          <el-button plain @click="logout">退出登录</el-button>
        </div>
      </header>

      <main class="merchant-content">
        <RouterView />
      </main>
    </section>
  </div>
</template>

<style scoped lang="scss">
.merchant-shell {
  display: grid;
  min-width: 1180px;
  min-height: 100vh;
  grid-template-columns: 248px 1fr;
  background: #f7f8fa;
}

.merchant-sidebar {
  display: flex;
  flex-direction: column;
  gap: 16px;
  border-right: 1px solid #e5e7eb;
  background: #fff;
  padding: 20px 16px;
  box-sizing: border-box;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 4px 12px;
}

.brand-logo {
  width: 42px;
  height: 42px;
  flex: 0 0 auto;
  border-radius: 12px;
  object-fit: cover;
}

.brand-title {
  color: #111827;
  font-size: 15px;
  font-weight: 600;
}

.brand-subtitle,
.shop-label,
.shop-meta,
.topbar-subtitle {
  color: #6b7280;
  font-size: 12px;
}

.shop-context {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #f8fafc;
  padding: 14px;
}

.shop-name {
  margin: 6px 0 4px;
  color: #111827;
  font-size: 15px;
  font-weight: 600;
}

.shop-meta {
  margin-bottom: 10px;
}

.merchant-menu {
  border-right: 0;
}

.merchant-menu :deep(.el-menu-item) {
  height: 42px;
  border-radius: 8px;
  color: #374151;
}

.merchant-menu :deep(.el-menu-item.is-active) {
  color: #2563eb;
  background: #eff6ff;
}

.merchant-main {
  display: flex;
  min-width: 0;
  flex-direction: column;
}

.merchant-topbar {
  display: flex;
  height: 64px;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e5e7eb;
  background: #fff;
  padding: 0 24px;
  box-sizing: border-box;
}

.topbar-title {
  color: #111827;
  font-size: 15px;
  font-weight: 600;
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-name {
  color: #374151;
  font-size: 14px;
}

.merchant-content {
  padding: 24px;
}
</style>
