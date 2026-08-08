<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import shiguangLogo from '../../assets/shiguang-logo.png'
import { SHOP_STATUS_LABELS, SHOP_STATUS_TAG_TYPES } from '../../constants/merchant'
import { ROUTE_NAME } from '../../constants/routes'
import { useAuthStore } from '../../stores/auth'
import { useMerchantStore } from '../../stores/merchant'
import type { ShopSummary } from '../../types/merchant'

const router = useRouter()
const authStore = useAuthStore()
const merchantStore = useMerchantStore()
const { manageableShops } = storeToRefs(authStore)

async function refreshShops() {
  if (!authStore.token) return
  try {
    await authStore.refreshCurrentUser()
  } catch {
    authStore.clearSession()
    await router.replace('/login')
  }
}

const hasShopAccess = (shop: ShopSummary) => shop.permissions.length > 0

function enterShop(shop: ShopSummary) {
  merchantStore.setCurrentShop(shop.id)
  router.push({ name: ROUTE_NAME.MerchantDashboard, params: { shopId: shop.id } })
}

onMounted(() => {
  void refreshShops()
})
</script>

<template>
  <main class="shop-select-page">
    <section class="shop-select-panel">
      <div class="brand-row">
        <img class="brand-logo" :src="shiguangLogo" alt="时光商城" />
        <div>
          <h1 class="page-title">选择店铺</h1>
          <p class="page-description">请选择本次要管理的店铺，系统会按店铺权限展示菜单和操作。</p>
        </div>
      </div>

      <el-empty
        v-if="manageableShops.length === 0"
        description="当前账号尚未分配店铺，请联系平台管理员开通店铺"
      >
        <el-button type="primary" plain @click="router.replace('/login')">返回登录</el-button>
      </el-empty>

      <div v-else class="shop-grid">
        <el-card v-for="shop in manageableShops" :key="shop.id" class="shop-card" shadow="never">
          <div class="shop-card-header">
            <div>
              <h2 class="shop-name">{{ shop.name }}</h2>
              <p class="shop-code">{{ shop.code }}</p>
            </div>
            <el-tag :type="SHOP_STATUS_TAG_TYPES[shop.status]" effect="light">
              {{ SHOP_STATUS_LABELS[shop.status] }}
            </el-tag>
          </div>

          <p class="shop-permission">已开通 {{ shop.permissions.length }} 项店铺权限</p>

          <el-button v-if="hasShopAccess(shop)" class="enter-button" type="primary" plain @click="enterShop(shop)">
            进入工作台
          </el-button>
          <el-alert v-else title="暂无店铺功能权限" type="info" :closable="false" show-icon />
        </el-card>
      </div>
    </section>
  </main>
</template>

<style scoped lang="scss">
.shop-select-page {
  min-height: 100vh;
  padding: 48px 24px;
  background: #f7f8fa;
  box-sizing: border-box;
}

.shop-select-panel {
  max-width: 980px;
  margin: 0 auto;
}

.brand-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.brand-logo {
  width: 52px;
  height: 52px;
  flex: 0 0 auto;
  border-radius: 14px;
  object-fit: cover;
}

.page-title {
  margin: 0;
  color: #111827;
  font-size: 22px;
  font-weight: 600;
}

.page-description {
  margin: 8px 0 0;
  color: #6b7280;
  font-size: 13px;
}

.shop-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.shop-card {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
}

.shop-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.shop-name {
  margin: 0;
  color: #111827;
  font-size: 16px;
  font-weight: 600;
}

.shop-code,
.shop-permission {
  margin: 8px 0 0;
  color: #6b7280;
  font-size: 13px;
}

.enter-button {
  margin-top: 20px;
}
</style>
