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

  const firstShop = authStore.manageableShops[0]
  if (firstShop) {
    await router.replace({ name: ROUTE_NAME.MerchantDashboard, params: { shopId: firstShop.id } })
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
