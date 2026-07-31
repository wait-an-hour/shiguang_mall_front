<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import { Box, Goods, List, Operation } from '@element-plus/icons-vue'
import { ORDER_STATUS_LABELS } from '../../constants/merchant'
import { ROUTE_NAME } from '../../constants/routes'
import { useMerchantStore } from '../../stores/merchant'
import type { DashboardTask, LowStockSku, RecentMerchantOrder } from '../../types/merchant'
import type { PageMetric } from '../../types/common'

const router = useRouter()
const merchantStore = useMerchantStore()

const loading = shallowRef(false)
const errorMessage = shallowRef('')

const metrics = shallowRef<PageMetric[]>([
  {
    key: 'pendingShipment',
    label: '待发货订单',
    value: '18',
    description: '需要及时处理，避免履约超时',
    tone: 'warning',
    routeName: ROUTE_NAME.MerchantOrderList,
    query: { status: 'PENDING_SHIPMENT' }
  },
  {
    key: 'onShelfProducts',
    label: '在售商品',
    value: '36',
    description: '当前店铺可售 SPU 数量',
    tone: 'primary',
    routeName: ROUTE_NAME.MerchantProductList
  },
  {
    key: 'lowStock',
    label: '库存预警',
    value: '9',
    description: '建议补货或调整安全库存',
    tone: 'danger',
    routeName: ROUTE_NAME.MerchantInventoryList,
    query: { stock: 'LOW' }
  },
  {
    key: 'afterSale',
    label: '售后待处理',
    value: '3',
    description: '待审核或待确认退货',
    tone: 'info',
    routeName: ROUTE_NAME.MerchantAfterSaleList
  }
])

const tasks = shallowRef<DashboardTask[]>([
  {
    key: 'ship',
    label: '待发货订单',
    count: 18,
    description: '核对库存、收货地址后完成发货',
    tone: 'warning',
    routeName: ROUTE_NAME.MerchantOrderList,
    query: { status: 'PENDING_SHIPMENT' }
  },
  {
    key: 'stock',
    label: '低库存 SKU',
    count: 9,
    description: '库存低于安全线，建议补货或下架',
    tone: 'danger',
    routeName: ROUTE_NAME.MerchantInventoryList,
    query: { stock: 'LOW' }
  },
  {
    key: 'review',
    label: '商品草稿',
    count: 6,
    description: '完善商品资料后可提交平台审核',
    tone: 'info',
    routeName: ROUTE_NAME.MerchantProductList,
    query: { status: 'DRAFT' }
  }
])

const recentOrders = shallowRef<RecentMerchantOrder[]>([
  {
    id: 'ORDER202607310001',
    orderNo: 'SO202607310001',
    buyerName: '林同学',
    amount: '4299.00',
    status: 'PENDING_SHIPMENT',
    createdAt: '2026-07-31T09:24:12.000+08:00'
  },
  {
    id: 'ORDER202607310002',
    orderNo: 'SO202607310002',
    buyerName: '陈老师',
    amount: '268.00',
    status: 'SHIPPED',
    createdAt: '2026-07-31T08:18:46.000+08:00'
  },
  {
    id: 'ORDER202607300018',
    orderNo: 'SO202607300018',
    buyerName: '王同学',
    amount: '99.00',
    status: 'AFTER_SALE',
    createdAt: '2026-07-30T20:11:34.000+08:00'
  }
])

const lowStockSkus = shallowRef<LowStockSku[]>([
  {
    id: 'SKU202607260001',
    skuNo: 'IP16-BLK-256',
    productName: 'iPhone 16 黑色 256GB',
    availableStock: 4,
    lockedStock: 2
  },
  {
    id: 'SKU202607260002',
    skuNo: 'CASE-MAG-BLUE',
    productName: '磁吸保护壳 雾蓝色',
    availableStock: 7,
    lockedStock: 1
  },
  {
    id: 'SKU202607260003',
    skuNo: 'CABLE-C-1M',
    productName: 'Type-C 编织数据线 1m',
    availableStock: 11,
    lockedStock: 5
  }
])

const hasError = computed(() => Boolean(errorMessage.value))
const shopName = computed(() => merchantStore.currentShop?.name ?? '当前店铺')
const canCreateProduct = computed(() => merchantStore.isShopActive)

function getOrderStatusLabel(status: RecentMerchantOrder['status']) {
  return ORDER_STATUS_LABELS[status]
}

function goRoute(routeName: string, query?: Record<string, string>) {
  router.push({
    name: routeName,
    params: { shopId: merchantStore.currentShopId },
    query
  })
}

function reloadDashboard() {
  loading.value = false
  errorMessage.value = ''
}
</script>

<template>
  <div class="dashboard-page">
    <section class="page-header">
      <div>
        <h1 class="page-title">商家工作台</h1>
        <p class="page-description">聚合 {{ shopName }} 的待办、订单、库存与快捷操作。</p>
      </div>

      <div class="page-actions">
        <el-button @click="goRoute(ROUTE_NAME.MerchantOrderList)">查看订单</el-button>
        <el-button type="primary" :disabled="!canCreateProduct" @click="goRoute(ROUTE_NAME.MerchantProductList)">
          发布商品
        </el-button>
      </div>
    </section>

    <el-card v-if="hasError" class="page-card" shadow="never">
      <el-result icon="error" title="加载失败" :sub-title="errorMessage">
        <template #extra>
          <el-button type="primary" @click="reloadDashboard">重试</el-button>
        </template>
      </el-result>
    </el-card>

    <template v-else>
      <section v-loading="loading" class="metric-grid">
        <button
          v-for="metric in metrics"
          :key="metric.key"
          class="metric-card"
          :class="`is-${metric.tone}`"
          type="button"
          @click="metric.routeName && goRoute(metric.routeName, metric.query)"
        >
          <span class="metric-label">{{ metric.label }}</span>
          <strong class="metric-value">{{ metric.value }}</strong>
          <span class="metric-description">{{ metric.description }}</span>
        </button>
      </section>

      <section class="dashboard-grid">
        <el-card class="page-card task-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>待办事项</span>
              <el-button text type="primary" @click="goRoute(ROUTE_NAME.MerchantOrderList)">查看全部</el-button>
            </div>
          </template>

          <div class="task-list">
            <button
              v-for="task in tasks"
              :key="task.key"
              class="task-item"
              type="button"
              @click="goRoute(task.routeName, task.query)"
            >
              <span class="task-count" :class="`is-${task.tone}`">{{ task.count }}</span>
              <span class="task-content">
                <strong>{{ task.label }}</strong>
                <small>{{ task.description }}</small>
              </span>
            </button>
          </div>
        </el-card>

        <el-card class="page-card quick-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>快捷入口</span>
            </div>
          </template>

          <div class="quick-grid">
            <el-button :icon="Goods" plain @click="goRoute(ROUTE_NAME.MerchantProductList)">商品维护</el-button>
            <el-button :icon="Box" plain @click="goRoute(ROUTE_NAME.MerchantInventoryList)">库存调整</el-button>
            <el-button :icon="List" plain @click="goRoute(ROUTE_NAME.MerchantOrderList)">订单发货</el-button>
            <el-button :icon="Operation" plain @click="goRoute(ROUTE_NAME.MerchantAfterSaleList)">售后审核</el-button>
          </div>
        </el-card>
      </section>

      <section class="dashboard-grid">
        <el-card class="page-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>近期订单</span>
              <el-button text type="primary" @click="goRoute(ROUTE_NAME.MerchantOrderList)">进入订单</el-button>
            </div>
          </template>

          <el-table :data="recentOrders" stripe>
            <el-table-column prop="orderNo" label="订单号" min-width="150" />
            <el-table-column prop="buyerName" label="买家" width="110" />
            <el-table-column prop="amount" label="金额" width="110">
              <template #default="scope">¥{{ scope.row.amount }}</template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="110">
              <template #default="{ row }: { row: RecentMerchantOrder }">
                <el-tag effect="light" type="warning">{{ getOrderStatusLabel(row.status) }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <el-card class="page-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>库存预警</span>
              <el-button text type="primary" @click="goRoute(ROUTE_NAME.MerchantInventoryList, { stock: 'LOW' })">
                处理库存
              </el-button>
            </div>
          </template>

          <el-table :data="lowStockSkus" stripe>
            <el-table-column prop="productName" label="商品" min-width="170" />
            <el-table-column prop="availableStock" label="可用" width="80" />
            <el-table-column prop="lockedStock" label="锁定" width="80" />
          </el-table>
        </el-card>
      </section>
    </template>
  </div>
</template>

<style scoped lang="scss">
.dashboard-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.page-title {
  margin: 0;
  color: #111827;
  font-size: 20px;
  font-weight: 600;
}

.page-description {
  margin: 8px 0 0;
  color: #6b7280;
  font-size: 13px;
}

.page-actions,
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.metric-card {
  display: flex;
  min-height: 132px;
  flex-direction: column;
  align-items: flex-start;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #fff;
  padding: 18px;
  text-align: left;
  cursor: pointer;
}

.metric-card:hover {
  border-color: #bfdbfe;
}

.metric-label,
.metric-description {
  color: #6b7280;
  font-size: 13px;
}

.metric-value {
  margin: 14px 0 8px;
  color: #111827;
  font-size: 28px;
  line-height: 1;
}

.metric-card.is-primary .metric-value {
  color: #2563eb;
}

.metric-card.is-warning .metric-value {
  color: #d97706;
}

.metric-card.is-danger .metric-value {
  color: #dc2626;
}

.metric-card.is-info .metric-value {
  color: #475569;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(360px, 0.9fr);
  gap: 16px;
}

.page-card {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.task-item {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 12px;
  border: 1px solid #f1f5f9;
  border-radius: 8px;
  background: #fff;
  padding: 12px;
  text-align: left;
  cursor: pointer;
}

.task-item:hover {
  background: #f8fafc;
}

.task-count {
  display: inline-grid;
  width: 40px;
  height: 40px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 10px;
  font-weight: 600;
}

.task-count.is-warning {
  color: #d97706;
  background: #fffbeb;
}

.task-count.is-danger {
  color: #dc2626;
  background: #fef2f2;
}

.task-count.is-info {
  color: #2563eb;
  background: #eff6ff;
}

.task-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.task-content strong {
  color: #111827;
  font-size: 14px;
}

.task-content small {
  color: #6b7280;
  font-size: 12px;
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.quick-grid :deep(.el-button) {
  height: 44px;
  margin-left: 0;
}
</style>
