<script setup lang="ts">
import { computed, onMounted, shallowRef, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Box, Goods, List, Operation } from '@element-plus/icons-vue'
import { RECENT_ORDER_STATUS_LABELS } from '../../constants/merchant'
import { ROUTE_NAME } from '../../constants/routes'
import { getMerchantAfterSales } from '../../api/merchant/afterSales'
import { getMerchantInventory } from '../../api/merchant/inventory'
import { getMerchantOrders } from '../../api/merchant/orders'
import { getMerchantProducts } from '../../api/merchant/products'
import { useMerchantStore } from '../../stores/merchant'
import type { DashboardTask, LowStockSku, RecentMerchantOrder } from '../../types/merchant'
import type { PageMetric } from '../../types/common'

const router = useRouter()
const merchantStore = useMerchantStore()

const loading = shallowRef(false)
const errorMessage = shallowRef('')
const metrics = shallowRef<PageMetric[]>([])
const tasks = shallowRef<DashboardTask[]>([])
const recentOrders = shallowRef<RecentMerchantOrder[]>([])
const lowStockSkus = shallowRef<LowStockSku[]>([])

const hasError = computed(() => Boolean(errorMessage.value))
const shopName = computed(() => merchantStore.currentShop?.name ?? '当前店铺')
const canCreateProduct = computed(() => merchantStore.isShopActive)

function getOrderStatusLabel(status: RecentMerchantOrder['status']) {
  return RECENT_ORDER_STATUS_LABELS[status]
}

function goRoute(routeName: string, query?: Record<string, string>) {
  router.push({
    name: routeName,
    params: { shopId: merchantStore.currentShopId },
    query
  })
}

function toRecentOrder(item: { id: string; orderNo: string; buyer: { nickname: string }; payableAmount: string; orderStatus: string; availableActions?: string[]; createdAt: string }): RecentMerchantOrder {
  const status = item.availableActions?.includes('VIEW_AFTER_SALE')
    ? 'AFTER_SALE'
    : item.orderStatus === 'PENDING_RECEIPT'
      ? 'PENDING_RECEIPT'
      : item.orderStatus === 'COMPLETED'
        ? 'COMPLETED'
        : 'PENDING_SHIPMENT'
  return {
    id: item.id,
    orderNo: item.orderNo,
    buyerName: item.buyer.nickname,
    amount: item.payableAmount,
    status,
    createdAt: item.createdAt
  }
}

async function loadDashboard() {
  const shopId = merchantStore.currentShopId
  if (!shopId) {
    errorMessage.value = '未选择店铺，请先进入店铺选择页。'
    return
  }

  loading.value = true
  errorMessage.value = ''
  try {
    const [pendingShipment, onShelfProducts, lowStock, pendingAfterSale, draftProducts, recentOrderPage, lowStockPage] = await Promise.all([
      getMerchantOrders(shopId, { orderStatus: 'PENDING_SHIPMENT', page: 1, pageSize: 1 }),
      getMerchantProducts(shopId, { status: 'ON_SHELF', page: 1, pageSize: 1 }),
      getMerchantInventory(shopId, { stockState: 'LOW', page: 1, pageSize: 1 }),
      getMerchantAfterSales(shopId, { status: 'PENDING', page: 1, pageSize: 1 }).catch(() => ({ items: [], page: 1, pageSize: 1, total: 0, totalPages: 0 })),
      getMerchantProducts(shopId, { status: 'DRAFT', page: 1, pageSize: 1 }),
      getMerchantOrders(shopId, { page: 1, pageSize: 3 }),
      getMerchantInventory(shopId, { stockState: 'LOW', page: 1, pageSize: 3 })
    ])

    metrics.value = [
      {
        key: 'pendingShipment',
        label: '待发货订单',
        value: String(pendingShipment.total),
        description: '需要及时处理，避免履约超时',
        tone: 'warning',
        routeName: ROUTE_NAME.MerchantOrderList,
        query: { status: 'PENDING_SHIPMENT' }
      },
      {
        key: 'onShelfProducts',
        label: '在售商品',
        value: String(onShelfProducts.total),
        description: '当前店铺可售 SPU 数量',
        tone: 'primary',
        routeName: ROUTE_NAME.MerchantProductList
      },
      {
        key: 'lowStock',
        label: '库存预警',
        value: String(lowStock.total),
        description: '建议补货或调整安全库存',
        tone: 'danger',
        routeName: ROUTE_NAME.MerchantInventoryList,
        query: { stockState: 'LOW' }
      },
      {
        key: 'afterSale',
        label: '售后待处理',
        value: String(pendingAfterSale.total),
        description: '待审核或待确认退货',
        tone: 'info',
        routeName: ROUTE_NAME.MerchantAfterSaleList
      }
    ]

    tasks.value = [
      {
        key: 'ship',
        label: '待发货订单',
        count: pendingShipment.total,
        description: '核对库存、收货地址后完成发货',
        tone: 'warning',
        routeName: ROUTE_NAME.MerchantOrderList,
        query: { status: 'PENDING_SHIPMENT' }
      },
      {
        key: 'stock',
        label: '低库存 SKU',
        count: lowStock.total,
        description: '库存低于安全线，建议补货或下架',
        tone: 'danger',
        routeName: ROUTE_NAME.MerchantInventoryList,
        query: { stockState: 'LOW' }
      },
      {
        key: 'review',
        label: '商品草稿',
        count: draftProducts.total,
        description: '完善商品资料后可提交平台审核',
        tone: 'info',
        routeName: ROUTE_NAME.MerchantProductList,
        query: { status: 'DRAFT' }
      }
    ]

    recentOrders.value = recentOrderPage.items.map(toRecentOrder)
    lowStockSkus.value = lowStockPage.items.map((item) => ({
      id: item.skuId,
      skuNo: item.skuNo,
      productName: item.productName,
      availableStock: item.availableStock,
      lockedStock: item.lockedStock
    }))
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '工作台加载失败'
  } finally {
    loading.value = false
  }
}

function reloadDashboard() {
  void loadDashboard()
}

onMounted(loadDashboard)
watch(() => merchantStore.currentShopId, () => {
  void loadDashboard()
})
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
              <el-button text type="primary" @click="goRoute(ROUTE_NAME.MerchantInventoryList, { stockState: 'LOW' })">
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
