<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  AFTER_SALE_STATUS_LABELS,
  AFTER_SALE_STATUS_TAG_TYPES,
  AFTER_SALE_TYPE_LABELS,
  AFTER_SALE_TYPE_TAG_TYPES,
  REFUND_STATUS_LABELS,
  REFUND_STATUS_TAG_TYPES
} from '../../../constants/merchant'
import { ROUTE_NAME } from '../../../constants/routes'
import { getMerchantAfterSales } from '../../../api/merchant/afterSales'
import type { PageView } from '../../../types/common'
import type { AfterSaleStatus, AfterSaleType, RefundStatus, ShopAfterSaleSummaryView } from '../../../types/merchant'

const route = useRoute()
const router = useRouter()
const shopId = computed(() => String(route.params.shopId))
const loading = ref(false)
const pageData = ref<PageView<ShopAfterSaleSummaryView>>({ items: [], page: 1, pageSize: 10, total: 0, totalPages: 1 })
const filters = reactive({
  keyword: String(route.query.keyword ?? ''),
  status: String(route.query.status ?? '') as AfterSaleStatus | '',
  refundStatus: String(route.query.refundStatus ?? '') as RefundStatus | '',
  requestType: String(route.query.requestType ?? '') as AfterSaleType | '',
  createdFrom: String(route.query.createdFrom ?? ''),
  createdTo: String(route.query.createdTo ?? ''),
  page: Number(route.query.page ?? 1),
  pageSize: Number(route.query.pageSize ?? 10)
})
const statusOptions = computed(() => Object.entries(AFTER_SALE_STATUS_LABELS) as Array<[AfterSaleStatus, string]>)
const refundOptions = computed(() => Object.entries(REFUND_STATUS_LABELS) as Array<[RefundStatus, string]>)
const typeOptions = computed(() => Object.entries(AFTER_SALE_TYPE_LABELS) as Array<[AfterSaleType, string]>)

async function loadAfterSales() {
  loading.value = true
  try {
    pageData.value = await getMerchantAfterSales(shopId.value, filters)
  } finally {
    loading.value = false
  }
}

function syncQuery() {
  router.replace({
    name: ROUTE_NAME.MerchantAfterSaleList,
    params: { shopId: shopId.value },
    query: {
      keyword: filters.keyword || undefined,
      status: filters.status || undefined,
      refundStatus: filters.refundStatus || undefined,
      requestType: filters.requestType || undefined,
      createdFrom: filters.createdFrom || undefined,
      createdTo: filters.createdTo || undefined,
      page: String(filters.page),
      pageSize: String(filters.pageSize)
    }
  })
}

function search() {
  filters.page = 1
  syncQuery()
  loadAfterSales()
}

function resetFilters() {
  filters.keyword = ''
  filters.status = ''
  filters.refundStatus = ''
  filters.requestType = ''
  filters.createdFrom = ''
  filters.createdTo = ''
  search()
}

function goDetail(row: ShopAfterSaleSummaryView) {
  router.push({ name: ROUTE_NAME.MerchantAfterSaleDetail, params: { shopId: shopId.value, afterSaleId: row.id } })
}

watch(() => [filters.page, filters.pageSize], () => {
  syncQuery()
  loadAfterSales()
})

onMounted(loadAfterSales)
</script>

<template>
  <div class="after-sale-page">
    <section class="page-header">
      <div>
        <h1 class="page-title">售后处理</h1>
        <p class="page-description">处理退款、退货退款审核和退款异常。</p>
      </div>
    </section>

    <el-card class="page-card" shadow="never">
      <el-form :model="filters" inline>
        <el-form-item label="关键词"><el-input v-model="filters.keyword" clearable placeholder="售后号 / 订单号 / 商品" @keyup.enter="search" /></el-form-item>
        <el-form-item label="类型"><el-select v-model="filters.requestType" clearable placeholder="全部" style="width: 130px"><el-option v-for="[value, label] in typeOptions" :key="value" :label="label" :value="value" /></el-select></el-form-item>
        <el-form-item label="售后状态"><el-select v-model="filters.status" clearable placeholder="全部" style="width: 140px"><el-option v-for="[value, label] in statusOptions" :key="value" :label="label" :value="value" /></el-select></el-form-item>
        <el-form-item label="退款状态"><el-select v-model="filters.refundStatus" clearable placeholder="全部" style="width: 140px"><el-option v-for="[value, label] in refundOptions" :key="value" :label="label" :value="value" /></el-select></el-form-item>
        <el-form-item label="申请时间"><el-date-picker v-model="filters.createdFrom" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss.SSSZ" placeholder="开始时间" style="width: 190px" /><span class="range-separator">至</span><el-date-picker v-model="filters.createdTo" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss.SSSZ" placeholder="结束时间" style="width: 190px" /></el-form-item>
        <el-form-item><el-button type="primary" @click="search">查询</el-button><el-button @click="resetFilters">重置</el-button></el-form-item>
      </el-form>
    </el-card>

    <el-card class="page-card" shadow="never" v-loading="loading">
      <el-table :data="pageData.items" row-key="id">
        <el-table-column label="售后单" min-width="210"><template #default="{ row }"><div class="name">{{ row.afterSaleNo }}</div><div class="meta">{{ row.order.orderNo }}</div></template></el-table-column>
        <el-table-column label="商品" min-width="260"><template #default="{ row }"><div class="name">{{ row.item.productName }}</div><div class="meta">{{ row.item.skuName }} x{{ row.quantity }}</div></template></el-table-column>
        <el-table-column label="类型" width="110"><template #default="{ row }"><el-tag :type="AFTER_SALE_TYPE_TAG_TYPES[row.requestType]" effect="light">{{ AFTER_SALE_TYPE_LABELS[row.requestType] }}</el-tag></template></el-table-column>
        <el-table-column label="售后状态" width="110"><template #default="{ row }"><el-tag :type="AFTER_SALE_STATUS_TAG_TYPES[row.status]" effect="light">{{ AFTER_SALE_STATUS_LABELS[row.status] }}</el-tag></template></el-table-column>
        <el-table-column label="退款状态" width="110"><template #default="{ row }"><el-tag :type="REFUND_STATUS_TAG_TYPES[row.refundStatus]" effect="light">{{ REFUND_STATUS_LABELS[row.refundStatus] }}</el-tag></template></el-table-column>
        <el-table-column prop="requestedAmount" label="申请金额" width="110" />
        <el-table-column prop="updatedAt" label="更新时间" width="210" />
        <el-table-column label="操作" fixed="right" width="100"><template #default="{ row }"><el-button text type="primary" @click="goDetail(row)">处理</el-button></template></el-table-column>
      </el-table>
      <el-empty v-if="!loading && pageData.items.length === 0" description="暂无售后记录" />
      <div class="pagination"><el-pagination v-model:current-page="filters.page" v-model:page-size="filters.pageSize" layout="total, sizes, prev, pager, next" :total="pageData.total" /></div>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.after-sale-page { display: flex; flex-direction: column; gap: 16px; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.page-title { margin: 0; color: #111827; font-size: 20px; font-weight: 600; }
.page-description { margin: 8px 0 0; color: #6b7280; font-size: 13px; }
.page-card { border: 1px solid #e5e7eb; border-radius: 10px; }
.name { color: #111827; font-weight: 600; }
.meta { margin-top: 4px; color: #6b7280; font-size: 12px; }
.range-separator { margin: 0 8px; color: #9ca3af; }
.pagination { display: flex; justify-content: flex-end; margin-top: 16px; }
</style>
