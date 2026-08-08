<script setup lang="ts">
import { onMounted, ref } from 'vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StatusTag from '@/components/common/StatusTag.vue'
import { getAdminDashboard } from '@/api/admin/dashboard'
import { formatMoney, getOrderStatusLabel } from '@/utils/labels'
import type { PlatformOrder } from '@/types/admin'

const loading = ref(false)
const metrics = ref({ products: 0, orders: 0, lowStock: 0, pendingAfterSale: 0 })
const tasks = ref<string[]>([])
const recent = ref<PlatformOrder[]>([])

async function loadData() {
  loading.value = true
  try {
    const data = await getAdminDashboard()
    metrics.value = data.metrics
    tasks.value = data.tasks
    recent.value = data.recent
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void loadData()
})
</script>

<template>
  <div class="page-view" v-loading="loading">
    <PageHeader title="后台首页" description="汇总平台商品、订单、库存预警和售后纠纷，帮助管理员优先处理高风险事项。" />
    <section class="metric-grid">
      <div class="metric-card"><div class="metric-label">平台商品</div><div class="metric-value">{{ metrics.products }}</div></div>
      <div class="metric-card"><div class="metric-label">全平台订单</div><div class="metric-value">{{ metrics.orders }}</div></div>
      <div class="metric-card"><div class="metric-label">库存预警</div><div class="metric-value warning">{{ metrics.lowStock }}</div></div>
      <div class="metric-card"><div class="metric-label">待审售后</div><div class="metric-value warning">{{ metrics.pendingAfterSale }}</div></div>
    </section>
    <el-card class="sg-card" shadow="never"><template #header>待处理事项</template><el-timeline><el-timeline-item v-for="item in tasks" :key="item">{{ item }}</el-timeline-item></el-timeline></el-card>
    <el-card class="sg-card" shadow="never"><template #header>近期订单</template><el-table :data="recent"><el-table-column prop="orderNo" label="订单号" /><el-table-column prop="shopName" label="商家" /><el-table-column label="金额"><template #default="{ row }">{{ formatMoney(row.amount) }}</template></el-table-column><el-table-column label="状态"><template #default="{ row }"><StatusTag :label="getOrderStatusLabel(row.status)" type="info" /></template></el-table-column></el-table></el-card>
  </div>
</template>

<style scoped lang="scss">.warning{color:var(--sg-warning);}</style>
