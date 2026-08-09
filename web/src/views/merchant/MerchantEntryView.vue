<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ROUTE_NAME } from '../../constants/routes'
import { useAuthStore } from '../../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

async function initMerchantEntry() {
  if (authStore.token) {
    try {
      await authStore.refreshCurrentUser()
    } catch {
      authStore.clearSession()
      await router.replace({ name: ROUTE_NAME.Login })
      return
    }
  }

  const accessibleShop = authStore.manageableShops.find((shop) => shop.roleCode === 'SHOP_ADMIN' && shop.permissions.length > 0)
    ?? authStore.manageableShops.find((shop) => shop.permissions.length > 0)
  if (accessibleShop) {
    const routeName = accessibleShop.roleCode === 'SHOP_ADMIN'
      ? ROUTE_NAME.MerchantDashboard
      : accessibleShop.permissions.includes('shop:product:manage')
        ? ROUTE_NAME.MerchantProductList
        : accessibleShop.permissions.includes('shop:inventory:manage')
          ? ROUTE_NAME.MerchantInventoryList
          : accessibleShop.permissions.includes('shop:order:read')
            ? ROUTE_NAME.MerchantOrderList
            : accessibleShop.permissions.includes('shop:after-sale:manage')
              ? ROUTE_NAME.MerchantAfterSaleList
              : accessibleShop.permissions.includes('shop:wallet:read')
                ? ROUTE_NAME.MerchantWallet
                : ROUTE_NAME.MerchantMemberList
    await router.replace({ name: routeName, params: { shopId: accessibleShop.id } })
    return
  }

  await router.replace({ name: ROUTE_NAME.MerchantShopSelect })
}

onMounted(() => {
  void initMerchantEntry()
})
</script>

<template>
  <main class="merchant-entry-page">
    <el-empty description="正在刷新店铺信息..." />
  </main>
</template>

<style scoped lang="scss">
.merchant-entry-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: #f7f8fa;
}
</style>
