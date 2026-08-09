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
const key='afterSales'; const fs=useAdminFiltersStore(); const query=reactive(fs.getFilter(key)); const loading=ref(false); const total=ref(0); const rows=ref<PlatformAfterSale[]>([])
function statusType(status:AfterSaleStatus){return status==='COMPLETED'?'success':status==='REJECTED'||status==='CANCELLED'?'danger':status==='REFUNDING'?'info':'warning'}
async function loadData(){loading.value=true;const params={...query};fs.setFilter(key,params);try{const data=await listAfterSales(params);rows.value=data.items;total.value=data.total}finally{loading.value=false}}
onMounted(loadData)
</script>
<template><div class="page-view"><PageHeader title="售后审核" description="处理买卖双方售后纠纷，同意或驳回后保存平台审核记录供后续追踪。"/><SearchPanel><el-form><el-form-item label="关键词"><el-input v-model="query.keyword" placeholder="售后单/订单/商家/买家" clearable/></el-form-item><el-form-item label="状态"><el-select v-model="query.status" clearable><el-option label="待商家处理" value="PENDING"/><el-option label="待退货" value="WAITING_RETURN"/><el-option label="退款中" value="REFUNDING"/><el-option label="已完成" value="COMPLETED"/><el-option label="已驳回" value="REJECTED"/><el-option label="已取消" value="CANCELLED"/></el-select></el-form-item><el-button type="primary" @click="loadData">查询</el-button></el-form></SearchPanel><el-card class="sg-card" shadow="never" v-loading="loading"><el-table v-if="rows.length" :data="rows"><el-table-column prop="serviceNo" label="售后单"/><el-table-column prop="orderNo" label="订单号"/><el-table-column prop="shopName" label="商家"/><el-table-column prop="buyerName" label="买家"/><el-table-column prop="requestedAmount" label="金额"><template #default="{row}">{{formatMoney(row.requestedAmount)}}</template></el-table-column><el-table-column prop="reason" label="原因" min-width="180"/><el-table-column label="状态"><template #default="{row}"><StatusTag :label="getAfterSaleStatusLabel(row.status)" :type="statusType(row.status)"/></template></el-table-column></el-table><EmptyState v-else description="暂无售后纠纷"/><AppPagination :page="query.page!" :page-size="query.pageSize!" :total="total" @change="Object.assign(query,$event);loadData()"/></el-card></div></template>
<style scoped lang="scss">.audit-remark{margin-top:16px;}</style>
