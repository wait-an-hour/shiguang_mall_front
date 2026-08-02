<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import PageHeader from '@/components/common/PageHeader.vue'
import SearchPanel from '@/components/common/SearchPanel.vue'
import StatusTag from '@/components/common/StatusTag.vue'
import AppPagination from '@/components/common/AppPagination.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { listAfterSales } from '@/api/admin/afterSales'
import { useAdminFiltersStore } from '@/stores/adminFilters'
import { formatMoney, getAfterSaleStatusLabel } from '@/utils/labels'
import type { AfterSaleStatus, PlatformAfterSale } from '@/types/admin'

const key = 'afterSales'
const filterStore = useAdminFiltersStore()
const query = reactive(filterStore.getFilter(key))
const loading = ref(false)
const total = ref(0)
const rows = ref<PlatformAfterSale[]>([])

function statusType(status: AfterSaleStatus) {
  return status === 'APPROVED' ? 'success' : status === 'REJECTED' ? 'danger' : 'warning'
}

async function loadData() {
  loading.value = true
  filterStore.setFilter(key, query)
  const data = await listAfterSales(query)
  rows.value = data.items
  total.value = data.total
  loading.value = false
}

onMounted(loadData)
</script>

<template>
  <div class="page-view">
    <PageHeader title="平台售后查询" description="对齐平台运营只读接口，仅查询售后单状态和纠纷信息，审核动作保留在商家售后接口中。" />
    <SearchPanel>
      <el-form>
        <el-form-item label="关键词"><el-input v-model="query.keyword" placeholder="售后单/订单/商家/买家" clearable /></el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" clearable>
            <el-option label="待处理" value="PENDING" />
            <el-option label="已同意" value="APPROVED" />
            <el-option label="已驳回" value="REJECTED" />
          </el-select>
        </el-form-item>
        <el-button type="primary" @click="loadData">查询</el-button>
      </el-form>
    </SearchPanel>
    <el-card class="sg-card" shadow="never" v-loading="loading">
      <el-table v-if="rows.length" :data="rows">
        <el-table-column prop="serviceNo" label="售后单" />
        <el-table-column prop="orderNo" label="订单号" />
        <el-table-column prop="shopName" label="商家" />
        <el-table-column prop="buyerName" label="买家" />
        <el-table-column label="金额"><template #default="{ row }">{{ formatMoney(row.amount) }}</template></el-table-column>
        <el-table-column prop="reason" label="原因" min-width="180" />
        <el-table-column label="状态"><template #default="{ row }"><StatusTag :label="getAfterSaleStatusLabel(row.status)" :type="statusType(row.status)" /></template></el-table-column>
        <el-table-column prop="auditRemark" label="处理说明" min-width="180" />
      </el-table>
      <EmptyState v-else description="暂无售后记录" />
      <AppPagination :page="query.page!" :page-size="query.pageSize!" :total="total" @change="Object.assign(query, $event); loadData()" />
    </el-card>
  </div>
</template>
