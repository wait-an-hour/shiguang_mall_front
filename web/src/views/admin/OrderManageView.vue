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
const key='orders'; const fs=useAdminFiltersStore(); const query=reactive(fs.getFilter(key)); const loading=ref(false); const total=ref(0); const rows=ref<PlatformOrder[]>([]); const detail=ref<PlatformOrder>(); const detailVisible=ref(false)
function statusType(status:OrderStatus){return status==='COMPLETED'?'success':status==='PENDING_PAYMENT'?'warning':status==='CANCELLED'?'danger':'info'}
async function loadData(){loading.value=true;fs.setFilter(key,query);const data=await listOrders(query);rows.value=data.items;total.value=data.total;loading.value=false}
function openDetail(row:PlatformOrder){detail.value=row;detailVisible.value=true}
onMounted(loadData)
</script>
<template><div class="page-view"><PageHeader title="订单管理" description="按商户维度查看全平台订单总表，订单详情弹窗展示完整商品和交易信息。"/><SearchPanel><el-form><el-form-item label="关键词"><el-input v-model="query.keyword" placeholder="订单号/商家/买家" clearable/></el-form-item><el-form-item label="状态"><el-select v-model="query.status" clearable><el-option label="待支付" value="PENDING_PAYMENT"/><el-option label="已支付" value="PAID"/><el-option label="已发货" value="SHIPPED"/><el-option label="已完成" value="COMPLETED"/></el-select></el-form-item><el-button type="primary" @click="loadData">查询</el-button></el-form></SearchPanel><el-card class="sg-card" shadow="never" v-loading="loading"><el-table v-if="rows.length" :data="rows"><el-table-column prop="orderNo" label="订单号"/><el-table-column prop="shopName" label="商家"/><el-table-column prop="buyerName" label="买家"/><el-table-column label="金额"><template #default="{row}">{{formatMoney(row.amount)}}</template></el-table-column><el-table-column label="状态"><template #default="{row}"><StatusTag :label="getOrderStatusLabel(row.status)" :type="statusType(row.status)"/></template></el-table-column><el-table-column label="操作"><template #default="{row}"><el-button link type="primary" @click="openDetail(row)">查看详情</el-button></template></el-table-column></el-table><EmptyState v-else description="暂无订单记录"/><AppPagination :page="query.page!" :page-size="query.pageSize!" :total="total" @change="Object.assign(query,$event);loadData()"/></el-card><el-dialog v-model="detailVisible" title="订单详情"><el-descriptions v-if="detail" :column="2" border><el-descriptions-item label="订单号">{{detail.orderNo}}</el-descriptions-item><el-descriptions-item label="商家">{{detail.shopName}}</el-descriptions-item><el-descriptions-item label="买家">{{detail.buyerName}}</el-descriptions-item><el-descriptions-item label="金额">{{formatMoney(detail.amount)}}</el-descriptions-item><el-descriptions-item label="商品" :span="2">{{detail.products.join('、')}}</el-descriptions-item></el-descriptions></el-dialog></div></template>
