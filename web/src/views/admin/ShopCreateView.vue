<script setup lang="ts">
import { shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import PageHeader from '@/components/common/PageHeader.vue'
import ShopFormCard from '@/components/admin/ShopFormCard.vue'
import { createPlatformShop } from '@/api/admin/shops'
import { ROUTE_NAME } from '@/constants/routes'
import type { CreateShopRequest, UpdateShopRequest } from '@/types/admin'

const router = useRouter()
const submitting = shallowRef(false)

async function submit(payload: CreateShopRequest | UpdateShopRequest) {
  submitting.value = true
  try {
    const created = await createPlatformShop(payload as CreateShopRequest)
    ElMessage.success('店铺已创建')
    await router.replace({ name: ROUTE_NAME.AdminShopDetail, params: { shopId: created.shop.id } })
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '店铺创建失败')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="page-view">
    <PageHeader title="创建店铺" description="为已注册的商家账号创建平台店铺并绑定首位店铺管理员。" />
    <ShopFormCard mode="create" :submitting="submitting" @submit="submit" @cancel="router.push({ name: ROUTE_NAME.AdminShops })" />
  </div>
</template>
