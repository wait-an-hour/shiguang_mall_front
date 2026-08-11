<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import PageHeader from '@/components/common/PageHeader.vue'
import StatusTag from '@/components/common/StatusTag.vue'
import { getAdminDashboard } from '@/api/admin/dashboard'
import { ROUTE_NAME } from '@/constants/routes'
import { formatMoney, getOrderStatusLabel } from '@/utils/labels'
import { useAdminAuthStore } from '@/stores/adminAuth'
import type { PlatformOrder } from '@/types/admin'

// 这个页面会根据当前平台角色只展示自己有权限的概览模块，避免平台商品审核员看到超级管理员那套全量首页。
const router = useRouter()
const auth = useAdminAuthStore()
const loading = ref(false)
const metrics = ref<Record<'products' | 'orders' | 'shops' | 'pendingAfterSale', number>>({
  products: 0,
  orders: 0,
  shops: 0,
  pendingAfterSale: 0
})
const tasks = ref<string[]>([])
const recent = ref<PlatformOrder[]>([])

const metricCards = [
  {
    label: '已上架商品',
    valueKey: 'products',
    routeName: ROUTE_NAME.AdminProducts,
    description: '点击进入商品管理',
    permission: 'admin:product:view'
  },
  {
    label: '全平台订单',
    valueKey: 'orders',
    routeName: ROUTE_NAME.AdminOrders,
    description: '点击进入订单管理',
    permission: 'admin:order:view'
  },
  {
    label: '平台店铺',
    valueKey: 'shops',
    routeName: ROUTE_NAME.AdminShops,
    description: '点击进入店铺管理',
    permission: 'admin:shop:manage'
  },
  {
    label: '待裁决申诉',
    valueKey: 'pendingAfterSale',
    routeName: ROUTE_NAME.AdminAfterSaleAppeals,
    description: '点击进入售后申诉',
    permission: 'admin:after-sale:audit'
  }
] as const

type MetricKey = typeof metricCards[number]['valueKey']

type MetricCard = typeof metricCards[number]

const visibleMetricCards = computed(() => metricCards.filter((card) => auth.hasPermissions([card.permission])))
const visibleTasks = computed(() => {
  if (tasks.value.length) return tasks.value
  const list: string[] = []
  if (auth.hasPermissions(['admin:product:view'])) list.push(`${metrics.value.products} 个商品已上架`)
  if (auth.hasPermissions(['admin:shop:manage'])) list.push(`${metrics.value.shops} 家平台店铺正在营业`)
  if (auth.hasPermissions(['admin:after-sale:audit'])) list.push(`${metrics.value.pendingAfterSale} 笔售后申诉等待平台裁决`)
  if (auth.hasPermissions(['admin:order:view'])) list.push(`${metrics.value.orders} 笔订单正在平台流转`)
  return list
})

function goToMetric(routeName: MetricCard['routeName']) {
  void router.push({ name: routeName })
}

async function loadData() {
  loading.value = true
  try {
    const data = await getAdminDashboard()
    metrics.value = data.metrics
    tasks.value = data.tasks
    recent.value = data.recent
  } catch {
    // 接口偶发失败时保留默认空态，避免页面因为一次请求异常直接报错。
    metrics.value = { products: 0, orders: 0, shops: 0, pendingAfterSale: 0 }
    tasks.value = []
    recent.value = []
  } finally {
    loading.value = false
  }
}

function getMetricValue(key: MetricKey) {
  return metrics.value[key]
}

function isWarningMetric(key: MetricKey) {
  return key === 'pendingAfterSale'
}

onMounted(() => {
  void loadData()
})
</script>

<template>
  <div class="page-view" v-loading="loading">
    <PageHeader title="后台首页" description="汇总平台商品、订单、平台店铺和售后纠纷，帮助管理员优先处理高风险事项。" />
    <section v-if="visibleMetricCards.length" class="metric-grid">
      <button
        v-for="card in visibleMetricCards"
        :key="card.label"
        type="button"
        class="metric-card"
        @click="goToMetric(card.routeName)"
      >
        <div class="metric-label">{{ card.label }}</div>
        <div class="metric-value" :class="{ warning: isWarningMetric(card.valueKey) }">
          {{ getMetricValue(card.valueKey) }}
        </div>
        <div class="metric-hint">{{ card.description }}</div>
      </button>
    </section>
    <el-card v-if="visibleTasks.length" class="sg-card" shadow="never"><template #header>待处理事项</template><el-timeline><el-timeline-item v-for="item in visibleTasks" :key="item">{{ item }}</el-timeline-item></el-timeline></el-card>
    <el-card v-if="auth.hasPermissions(['admin:order:view'])" class="sg-card" shadow="never"><template #header>近期订单</template><el-table :data="recent"><el-table-column prop="orderNo" label="订单号" /><el-table-column prop="shopName" label="商家" /><el-table-column label="金额"><template #default="{ row }">{{ formatMoney(row.amount) }}</template></el-table-column><el-table-column label="状态"><template #default="{ row }"><StatusTag :label="getOrderStatusLabel(row.status)" type="info" /></template></el-table-column></el-table></el-card>
  </div>
</template>

<style scoped lang="scss">
.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.metric-card {
  border: 1px solid var(--el-border-color-light);
  border-radius: 12px;
  background: #fff;
  padding: 24px;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.metric-card:hover {
  border-color: var(--el-color-primary-light-3);
  box-shadow: 0 8px 24px rgb(0 0 0 / 8%);
  transform: translateY(-1px);
}

.metric-label {
  color: var(--el-text-color-secondary);
  font-size: 16px;
  line-height: 1.4;
}

.metric-value {
  margin-top: 12px;
  color: var(--el-text-color-primary);
  font-size: 36px;
  font-weight: 700;
  line-height: 1;
}

.metric-hint {
  margin-top: 10px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.4;
}

.warning {
  color: var(--sg-warning);
}
</style>
