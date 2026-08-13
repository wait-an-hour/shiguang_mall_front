<script setup lang="ts">
import { onMounted, reactive, shallowRef } from 'vue'
import { ElMessage } from 'element-plus'
import PageHeader from '@/components/common/PageHeader.vue'
import AppPagination from '@/components/common/AppPagination.vue'
import StatusTag from '@/components/common/StatusTag.vue'
import { listAfterSales, type OperationAfterSaleView, type PlatformAfterSaleQuery } from '@/api/admin/afterSales'
import { getPlatformShops, type PlatformShopView } from '@/api/admin/shops'
import { listPlatformUsers, type PlatformUserView } from '@/api/admin/rbac'
import { formatMoney } from '@/utils/labels'
import type { AfterSaleStatus } from '@/types/admin'
import type { AfterSaleType, RefundStatus } from '@/types/merchant'

const query = reactive<PlatformAfterSaleQuery>({ page: 1, pageSize: 20, afterSaleNo: '' })
const rows = shallowRef<OperationAfterSaleView[]>([])
const shops = shallowRef<PlatformShopView[]>([])
const users = shallowRef<PlatformUserView[]>([])
const total = shallowRef(0)
const loading = shallowRef(false)
const shopLoading = shallowRef(false)
const userLoading = shallowRef(false)

function afterSaleTypeLabel(type: AfterSaleType) {
  return type === 'REFUND_ONLY' ? '仅退款' : '退货退款'
}

function statusLabel(status: AfterSaleStatus) {
  const labels: Record<AfterSaleStatus, string> = {
    PENDING: '待处理',
    REJECTED: '已驳回',
    WAITING_RETURN: '待退货',
    REFUNDING: '退款中',
    COMPLETED: '已完成',
    CANCELLED: '已取消'
  }
  return labels[status]
}

function statusType(status: AfterSaleStatus) {
  if (status === 'COMPLETED') return 'success'
  if (status === 'REJECTED' || status === 'CANCELLED') return 'danger'
  return 'warning'
}

function refundStatusLabel(status: RefundStatus) {
  const labels: Record<RefundStatus, string> = {
    NOT_STARTED: '未开始',
    PROCESSING: '处理中',
    SUCCESS: '成功',
    FAILED: '失败'
  }
  return labels[status]
}

function refundStatusType(status: RefundStatus) {
  if (status === 'SUCCESS') return 'success'
  if (status === 'FAILED') return 'danger'
  return status === 'PROCESSING' ? 'warning' : 'info'
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('zh-CN')
}

async function load() {
  loading.value = true
  try {
    const result = await listAfterSales(query)
    rows.value = result.items
    total.value = result.total
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '售后数据加载失败')
  } finally {
    loading.value = false
  }
}

async function loadShops() {
  shopLoading.value = true
  try {
    const result = await getPlatformShops({ page: 1, pageSize: 100, sort: 'shopName,asc' })
    shops.value = result.items
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '店铺列表加载失败')
  } finally {
    shopLoading.value = false
  }
}

async function searchUsers(keyword: string) {
  if (!keyword.trim()) return
  userLoading.value = true
  try {
    const result = await listPlatformUsers({ keyword: keyword.trim(), page: 1, pageSize: 50 })
    users.value = result.items
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '买家列表加载失败')
  } finally {
    userLoading.value = false
  }
}

function search() {
  query.page = 1
  void load()
}

onMounted(() => {
  void Promise.all([load(), loadShops()])
})
</script>

<template>
  <div class="after-sale-query-page">
    <PageHeader title="售后查询" description="只读查询平台售后单及退款处理状态。" />

    <el-card class="sg-card" shadow="never">
      <el-form class="query-form" inline @submit.prevent="search">
        <el-form-item label="售后单号">
          <el-input v-model="query.afterSaleNo" clearable placeholder="请输入售后单号" />
        </el-form-item>
        <el-form-item label="店铺">
          <el-select v-model="query.shopId" clearable filterable :loading="shopLoading" placeholder="全部店铺" class="shop-select">
            <el-option v-for="shop in shops" :key="shop.shop.id" :label="`${shop.shop.shopName}（${shop.shop.shopNo}）`" :value="shop.shop.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="买家">
          <el-select v-model="query.userId" clearable filterable remote :remote-method="searchUsers" :loading="userLoading" placeholder="输入用户名或昵称" class="user-select">
            <el-option v-for="user in users" :key="user.id" :label="`${user.nickname || user.username}（${user.username}）`" :value="user.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="售后状态">
          <el-select v-model="query.status" clearable placeholder="全部" class="status-select">
            <el-option label="待处理" value="PENDING" />
            <el-option label="已驳回" value="REJECTED" />
            <el-option label="待退货" value="WAITING_RETURN" />
            <el-option label="退款中" value="REFUNDING" />
            <el-option label="已完成" value="COMPLETED" />
            <el-option label="已取消" value="CANCELLED" />
          </el-select>
        </el-form-item>
        <el-form-item label="退款状态">
          <el-select v-model="query.refundStatus" clearable placeholder="全部" class="status-select">
            <el-option label="未开始" value="NOT_STARTED" />
            <el-option label="处理中" value="PROCESSING" />
            <el-option label="成功" value="SUCCESS" />
            <el-option label="失败" value="FAILED" />
          </el-select>
        </el-form-item>
        <el-form-item class="query-action-item">
          <el-button type="primary" @click="search">查询</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="sg-card" shadow="never" v-loading="loading">
      <el-table :data="rows" empty-text="暂无售后记录">
        <el-table-column prop="afterSaleNo" label="售后单号" min-width="170" />
        <el-table-column prop="order.orderNo" label="订单号" min-width="170" />
        <el-table-column label="店铺" min-width="140">
          <template #default="{ row }">{{ row.shop.shopName }}</template>
        </el-table-column>
        <el-table-column label="买家" min-width="130">
          <template #default="{ row }">{{ row.buyer.nickname || row.buyer.username || '-' }}</template>
        </el-table-column>
        <el-table-column label="商品" min-width="200">
          <template #default="{ row }">{{ row.item ? `${row.item.productName} / ${row.item.skuName}` : '-' }}</template>
        </el-table-column>
        <el-table-column label="售后类型" min-width="100">
          <template #default="{ row }">{{ afterSaleTypeLabel(row.requestType) }}</template>
        </el-table-column>
        <el-table-column prop="quantity" label="数量" min-width="80" />
        <el-table-column label="申请金额" min-width="110">
          <template #default="{ row }">{{ formatMoney(row.requestedAmount) }}</template>
        </el-table-column>
        <el-table-column label="批准金额" min-width="110">
          <template #default="{ row }">{{ formatMoney(row.approvedAmount) }}</template>
        </el-table-column>
        <el-table-column label="售后状态" min-width="100">
          <template #default="{ row }"><StatusTag :label="statusLabel(row.status)" :type="statusType(row.status)" /></template>
        </el-table-column>
        <el-table-column label="退款状态" min-width="100">
          <template #default="{ row }"><StatusTag :label="refundStatusLabel(row.refundStatus)" :type="refundStatusType(row.refundStatus)" /></template>
        </el-table-column>
        <el-table-column label="创建时间" min-width="170">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
      </el-table>
      <AppPagination :page="query.page || 1" :page-size="query.pageSize || 20" :total="total" @change="Object.assign(query, $event); load()" />
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.after-sale-query-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.query-form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.query-form :deep(.el-form-item) {
  margin: 0;
}

.query-action-item {
  flex: 0 0 auto;
}

.shop-select,
.user-select {
  width: 220px;
}

.status-select {
  width: 140px;
}
</style>
