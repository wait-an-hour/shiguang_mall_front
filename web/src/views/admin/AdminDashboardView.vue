<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import PageHeader from '@/components/common/PageHeader.vue'
import StatusTag from '@/components/common/StatusTag.vue'
import { getAdminDashboard } from '@/api/admin/dashboard'
import { formatMoney, getOrderStatusLabel } from '@/utils/labels'
import type { PlatformOrder } from '@/types/admin'

const router = useRouter()
const loading = ref(false)
const metrics = ref({ products: 0, orders: 0, lowStock: 0, pendingAfterSale: 0 })
const tasks = ref<string[]>([])
const recent = ref<PlatformOrder[]>([])

async function loadData() {
  loading.value = true
  const data = await getAdminDashboard()
  metrics.value = data.metrics
  tasks.value = data.tasks
  recent.value = data.recent
  loading.value = false
}

function goTo(path: string) {
  // 统计卡片作为后台快捷入口，只负责路由跳转，不改变统计数据。
  router.push(path)
}

onMounted(loadData)
</script>

<template>
  <div class="page-view" v-loading="loading">
    <PageHeader title="后台首页" description="汇总平台商品、订单、库存预警和售后纠纷，帮助管理员优先处理高风险事项。" />
    <section class="metric-grid">
      <div class="metric-card metric-card--clickable" role="button" tabindex="0" @click="goTo('/admin/products')" @keyup.enter="goTo('/admin/products')"><div class="metric-label">平台商品</div><div class="metric-value">{{ metrics.products }}</div></div>
      <div class="metric-card metric-card--clickable" role="button" tabindex="0" @click="goTo('/admin/orders')" @keyup.enter="goTo('/admin/orders')"><div class="metric-label">全平台订单</div><div class="metric-value">{{ metrics.orders }}</div></div>
      <div class="metric-card metric-card--clickable" role="button" tabindex="0" @click="goTo('/admin/inventory')" @keyup.enter="goTo('/admin/inventory')"><div class="metric-label">库存预警</div><div class="metric-value warning">{{ metrics.lowStock }}</div></div>
      <div class="metric-card metric-card--clickable" role="button" tabindex="0" @click="goTo('/admin/after-sales')" @keyup.enter="goTo('/admin/after-sales')"><div class="metric-label">待审售后</div><div class="metric-value warning">{{ metrics.pendingAfterSale }}</div></div>
    </section>
    <el-card class="sg-card" shadow="never"><template #header>待处理事项</template><el-timeline><el-timeline-item v-for="item in tasks" :key="item">{{ item }}</el-timeline-item></el-timeline></el-card>
    <el-card class="sg-card" shadow="never"><template #header>近期订单</template><el-table :data="recent"><el-table-column prop="orderNo" label="订单号" /><el-table-column prop="shopName" label="商家" /><el-table-column label="金额"><template #default="{ row }">{{ formatMoney(row.amount) }}</template></el-table-column><el-table-column label="状态"><template #default="{ row }"><StatusTag :label="getOrderStatusLabel(row.status)" type="info" /></template></el-table-column></el-table></el-card>
  </div>
</template>

<style scoped lang="scss">
.warning { color: var(--sg-warning); }

.metric-card--clickable {
  // 统计卡片作为快捷入口使用，增加指针和轻微动效，让用户明确知道可以点击。
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.metric-card--clickable:hover,
.metric-card--clickable:focus-visible {
  border-color: rgba(37, 99, 235, 0.35);
  box-shadow: 0 12px 28px rgba(37, 99, 235, 0.12);
  outline: none;
  transform: translateY(-2px);
}
</style>
