<script setup lang="ts">
import { onMounted, shallowRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import PageHeader from '@/components/common/PageHeader.vue'
import ShopFormCard from '@/components/admin/ShopFormCard.vue'
import { getPlatformShopDetail, updatePlatformShop } from '@/api/admin/shops'
import { ROUTE_NAME } from '@/constants/routes'
import type { CreateShopRequest, PlatformShopView, UpdateShopRequest } from '@/types/admin'

const route = useRoute()
const router = useRouter()
const shopId = route.params.shopId as string
const detail = shallowRef<PlatformShopView | null>(null)
const loading = shallowRef(false)
const submitting = shallowRef(false)
const errorMessage = shallowRef('')

async function loadDetail() {
  loading.value = true
  errorMessage.value = ''
  try {
    detail.value = await getPlatformShopDetail(shopId)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '店铺详情加载失败'
  } finally {
    loading.value = false
  }
}

async function submit(payload: CreateShopRequest | UpdateShopRequest) {
  submitting.value = true
  try {
    await updatePlatformShop(shopId, payload as UpdateShopRequest)
    ElMessage.success('店铺信息已更新')
    await router.replace({ name: ROUTE_NAME.AdminShopDetail, params: { shopId } })
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '店铺更新失败')
  } finally {
    submitting.value = false
  }
}

onMounted(loadDetail)
</script>

<template>
  <div class="page-view">
    <PageHeader title="编辑店铺" :description="detail ? `更新 ${detail.shop.shopName} 的基础资料与联系方式。` : '更新店铺基础资料与联系方式。'" />
    <el-card v-if="errorMessage" class="sg-card" shadow="never"><el-result icon="error" title="店铺详情加载失败" :sub-title="errorMessage"><template #extra><el-button type="primary" @click="loadDetail">重试</el-button></template></el-result></el-card>
    <div v-else v-loading="loading"><ShopFormCard v-if="detail" mode="edit" :initial-value="detail" :submitting="submitting" @submit="submit" @cancel="router.push({ name: ROUTE_NAME.AdminShopDetail, params: { shopId } })" /></div>
  </div>
</template>
