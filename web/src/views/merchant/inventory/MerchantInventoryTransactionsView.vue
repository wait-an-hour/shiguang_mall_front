<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getInventoryTransactions } from '../../../api/merchant/inventory'
import { INVENTORY_TRANSACTION_TYPE_LABELS, INVENTORY_TRANSACTION_TYPE_TAG_TYPES } from '../../../constants/merchant'
import { ROUTE_NAME } from '../../../constants/routes'
import type { PageView } from '../../../types/common'
import type { InventoryTransactionType, InventoryTransactionView } from '../../../types/merchant'

const route = useRoute()
const router = useRouter()
const shopId = computed(() => String(route.params.shopId))
const loading = ref(false)
const pageData = ref<PageView<InventoryTransactionView>>({ items: [], page: 1, pageSize: 10, total: 0, totalPages: 1 })
const filters = reactive({
  skuId: String(route.query.skuId ?? ''),
  transactionType: String(route.query.transactionType ?? '') as InventoryTransactionType | '',
  businessType: String(route.query.businessType ?? ''),
  businessNo: String(route.query.businessNo ?? ''),
  page: Number(route.query.page ?? 1),
  pageSize: Number(route.query.pageSize ?? 10)
})
const typeOptions = computed(() => Object.entries(INVENTORY_TRANSACTION_TYPE_LABELS) as Array<[InventoryTransactionType, string]>)

function getTransactionTypeLabel(type: InventoryTransactionType) {
  return INVENTORY_TRANSACTION_TYPE_LABELS[type]
}

function getTransactionTypeTagType(type: InventoryTransactionType) {
  return INVENTORY_TRANSACTION_TYPE_TAG_TYPES[type]
}

async function loadTransactions() {
  loading.value = true
  try {
    pageData.value = await getInventoryTransactions(shopId.value, filters)
  } finally {
    loading.value = false
  }
}

function syncQuery() {
  router.replace({
    name: ROUTE_NAME.MerchantInventoryTransactions,
    params: { shopId: shopId.value },
    query: {
      skuId: filters.skuId || undefined,
      transactionType: filters.transactionType || undefined,
      businessType: filters.businessType || undefined,
      businessNo: filters.businessNo || undefined,
      page: String(filters.page),
      pageSize: String(filters.pageSize)
    }
  })
}

function search() {
  filters.page = 1
  syncQuery()
  loadTransactions()
}

function resetFilters() {
  filters.skuId = ''
  filters.transactionType = ''
  filters.businessType = ''
  filters.businessNo = ''
  search()
}

function goBack() {
  router.push({ name: ROUTE_NAME.MerchantInventoryList, params: { shopId: shopId.value } })
}

watch(() => [filters.page, filters.pageSize], () => {
  syncQuery()
  loadTransactions()
})

onMounted(loadTransactions)
</script>

<template>
  <div class="transaction-page">
    <section class="page-header">
      <div>
        <h1 class="page-title">库存流水</h1>
        <p class="page-description">按 SKU、业务单号和流水类型追踪库存变动。</p>
      </div>
      <el-button @click="goBack">返回库存</el-button>
    </section>

    <el-card class="page-card" shadow="never">
      <el-form :model="filters" inline>
        <el-form-item label="SKU ID"><el-input v-model="filters.skuId" clearable placeholder="SKU2026..." /></el-form-item>
        <el-form-item label="流水类型">
          <el-select v-model="filters.transactionType" clearable placeholder="全部" style="width: 150px">
            <el-option v-for="[value, label] in typeOptions" :key="value" :label="label" :value="value" />
          </el-select>
        </el-form-item>
        <el-form-item label="业务类型"><el-input v-model="filters.businessType" clearable placeholder="PURCHASE" /></el-form-item>
        <el-form-item label="业务单号"><el-input v-model="filters.businessNo" clearable placeholder="IN/ADJ..." /></el-form-item>
        <el-form-item><el-button type="primary" @click="search">查询</el-button><el-button @click="resetFilters">重置</el-button></el-form-item>
      </el-form>
    </el-card>

    <el-card class="page-card" shadow="never" v-loading="loading">
      <el-table :data="pageData.items" row-key="id">
        <el-table-column label="类型" width="120"><template #default="{ row }"><el-tag :type="getTransactionTypeTagType(row.transactionType)" effect="light">{{ getTransactionTypeLabel(row.transactionType) }}</el-tag></template></el-table-column>
        <el-table-column label="商品 / SKU" min-width="260"><template #default="{ row }"><div class="name">{{ row.productName }}</div><div class="meta">{{ row.skuName }} · {{ row.skuNo }}</div></template></el-table-column>
        <el-table-column prop="businessType" label="业务类型" width="120" />
        <el-table-column prop="businessNo" label="业务单号" min-width="160" />
        <el-table-column prop="quantity" label="变动" width="90" />
        <el-table-column label="库存" width="150"><template #default="{ row }">{{ row.beforeAvailableStock }} → {{ row.afterAvailableStock }}</template></el-table-column>
        <el-table-column prop="createdAt" label="发生时间" width="210" />
      </el-table>
      <el-empty v-if="!loading && pageData.items.length === 0" description="暂无库存流水" />
      <div class="pagination"><el-pagination v-model:current-page="filters.page" v-model:page-size="filters.pageSize" layout="total, sizes, prev, pager, next" :total="pageData.total" /></div>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.transaction-page { display: flex; flex-direction: column; gap: 16px; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.page-title { margin: 0; color: #111827; font-size: 20px; font-weight: 600; }
.page-description, .meta { margin: 8px 0 0; color: #6b7280; font-size: 13px; }
.page-card { border: 1px solid #e5e7eb; border-radius: 10px; }
.name { color: #111827; font-weight: 600; }
.pagination { display: flex; justify-content: flex-end; margin-top: 16px; }
</style>
