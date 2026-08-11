<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import PageHeader from '@/components/common/PageHeader.vue'
import SearchPanel from '@/components/common/SearchPanel.vue'
import StatusTag from '@/components/common/StatusTag.vue'
import AppPagination from '@/components/common/AppPagination.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { listOrders } from '@/api/admin/orders'
import { useAdminFiltersStore } from '@/stores/adminFilters'
import { formatMoney, getOrderStatusLabel } from '@/utils/labels'
import type { OrderStatus, PlatformOrder } from '@/types/admin'

const key = 'orders'
const filterStore = useAdminFiltersStore()
const query = reactive(filterStore.getFilter(key))
const loading = ref(false)
const total = ref(0)
const rows = ref<PlatformOrder[]>([])
const detail = ref<PlatformOrder>()
const detailVisible = ref(false)

function statusType(status: OrderStatus) {
  return status === 'COMPLETED' ? 'success' : status === 'PENDING_PAYMENT' ? 'warning' : status === 'CANCELLED' ? 'danger' : 'info'
}

function formatTime(value?: string | null) {
  // 后端时间统一是 ISO 8601 字符串；详情弹窗集中格式化，避免模板里重复写空值判断。
  return value ? value.replace('T', ' ').replace(/\.\d{3}.*/, '') : '-'
}

async function loadData() {
  loading.value = true
  filterStore.setFilter(key, query)
  const data = await listOrders(query)
  rows.value = data.items
  total.value = data.total
  loading.value = false
}

function openDetail(row: PlatformOrder) {
  detail.value = row
  detailVisible.value = true
}

onMounted(loadData)
</script>

<template>
  <div class="page-view">
    <PageHeader title="订单管理" description="按商户维度查看全平台订单总表，订单详情弹窗展示完整商品和交易信息。" />

    <SearchPanel>
      <el-form>
        <el-form-item label="关键词">
          <el-input v-model="query.keyword" placeholder="订单号/商家/买家" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" clearable>
            <el-option label="待支付" value="PENDING_PAYMENT" />
            <el-option label="已支付" value="PAID" />
            <el-option label="已发货" value="SHIPPED" />
            <el-option label="已完成" value="COMPLETED" />
            <el-option label="已取消" value="CANCELLED" />
          </el-select>
        </el-form-item>
        <el-button type="primary" @click="loadData">查询</el-button>
      </el-form>
    </SearchPanel>

    <el-card class="sg-card" shadow="never" v-loading="loading">
      <el-table v-if="rows.length" :data="rows" row-key="id">
        <el-table-column prop="orderNo" label="订单号" min-width="160" />
        <el-table-column prop="shopName" label="商家" min-width="140" />
        <el-table-column prop="buyerName" label="买家" min-width="120" />
        <el-table-column label="金额" width="120">
          <template #default="{ row }">{{ formatMoney(row.amount) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <StatusTag :label="getOrderStatusLabel(row.status)" :type="statusType(row.status)" />
          </template>
        </el-table-column>
        <el-table-column label="下单时间" min-width="170">
          <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row)">查看详情</el-button>
          </template>
        </el-table-column>
      </el-table>
      <EmptyState v-else description="暂无订单记录" />
      <AppPagination :page="query.page!" :page-size="query.pageSize!" :total="total" @change="Object.assign(query, $event); loadData()" />
    </el-card>

    <el-dialog v-model="detailVisible" title="订单详情" width="920px">
      <template v-if="detail">
        <section class="detail-section">
          <div class="section-title">基础信息</div>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="订单号">{{ detail.orderNo }}</el-descriptions-item>
            <el-descriptions-item label="交易号">{{ detail.tradeNo || '-' }}</el-descriptions-item>
            <el-descriptions-item label="商家">{{ detail.shopName }}</el-descriptions-item>
            <el-descriptions-item label="买家">{{ detail.buyerName }}</el-descriptions-item>
            <el-descriptions-item label="订单金额">{{ formatMoney(detail.amount) }}</el-descriptions-item>
            <el-descriptions-item label="订单状态">
              <StatusTag :label="getOrderStatusLabel(detail.status)" :type="statusType(detail.status)" />
            </el-descriptions-item>
          </el-descriptions>
        </section>

        <section class="detail-section">
          <div class="section-title">时间信息</div>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="下单时间">{{ formatTime(detail.createdAt) }}</el-descriptions-item>
            <el-descriptions-item label="支付时间">{{ formatTime(detail.paidAt) }}</el-descriptions-item>
            <el-descriptions-item label="发货时间">{{ formatTime(detail.shippedAt) }}</el-descriptions-item>
            <el-descriptions-item label="收货时间">{{ formatTime(detail.receivedAt) }}</el-descriptions-item>
            <el-descriptions-item label="完成时间">{{ formatTime(detail.completedAt) }}</el-descriptions-item>
            <el-descriptions-item label="物流公司">{{ detail.carrierName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="运单号">{{ detail.trackingNo || '-' }}</el-descriptions-item>
          </el-descriptions>
        </section>

        <section class="detail-section">
          <div class="section-title">商品明细</div>
          <el-table :data="detail.orderItems" row-key="skuName" border>
            <el-table-column label="商品" min-width="320">
              <template #default="{ row }">
                <div class="order-product">
                  <el-image class="product-cover" :src="row.imageUrl || ''" fit="cover">
                    <template #error>
                      <div class="cover-placeholder">暂无图</div>
                    </template>
                  </el-image>
                  <div class="product-info">
                    <div class="product-name">{{ row.productName }}</div>
                    <div class="product-meta">{{ row.skuName }}</div>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="数量" width="90">
              <template #default="{ row }">x{{ row.quantity }}</template>
            </el-table-column>
            <el-table-column label="单价" width="120">
              <template #default="{ row }">{{ row.unitPrice ? formatMoney(row.unitPrice) : '-' }}</template>
            </el-table-column>
            <el-table-column label="实付" width="120">
              <template #default="{ row }">{{ row.payableAmount ? formatMoney(row.payableAmount) : '-' }}</template>
            </el-table-column>
          </el-table>
        </section>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.detail-section + .detail-section {
  margin-top: 18px;
}

.section-title {
  margin-bottom: 10px;
  color: #111827;
  font-size: 15px;
  font-weight: 600;
}

.order-product {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.product-cover {
  width: 56px;
  height: 56px;
  flex: 0 0 auto;
  border-radius: 8px;
  background: #f1f5f9;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  color: #9ca3af;
  font-size: 12px;
}

.product-info {
  min-width: 0;
  text-align: left;
}

.product-name {
  color: #111827;
  font-weight: 600;
}

.product-meta {
  margin-top: 4px;
  color: #6b7280;
  font-size: 12px;
}
</style>
