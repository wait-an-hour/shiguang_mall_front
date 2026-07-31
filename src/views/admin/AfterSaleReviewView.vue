<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import PageHeader from '@/components/common/PageHeader.vue'
import SearchPanel from '@/components/common/SearchPanel.vue'
import StatusTag from '@/components/common/StatusTag.vue'
import AppPagination from '@/components/common/AppPagination.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { auditAfterSale, listAfterSales } from '@/api/admin/afterSales'
import { useAdminFiltersStore } from '@/stores/adminFilters'
import { formatMoney, getAfterSaleStatusLabel } from '@/utils/labels'
import type { AfterSaleStatus, PlatformAfterSale } from '@/types/admin'
const key='afterSales'; const fs=useAdminFiltersStore(); const query=reactive(fs.getFilter(key)); const loading=ref(false); const total=ref(0); const rows=ref<PlatformAfterSale[]>([]); const dialogVisible=ref(false); const current=ref<PlatformAfterSale>(); const audit=reactive<{status:AfterSaleStatus;remark:string}>({status:'APPROVED',remark:''})
function statusType(status:AfterSaleStatus){return status==='APPROVED'?'success':status==='REJECTED'?'danger':'warning'}
async function loadData(){loading.value=true;fs.setFilter(key,query);const data=await listAfterSales(query);rows.value=data.items;total.value=data.total;loading.value=false}
function openAudit(row:PlatformAfterSale,status:AfterSaleStatus){current.value=row;audit.status=status;audit.remark=row.auditRemark??'';dialogVisible.value=true}
async function submitAudit(){if(!current.value)return;await auditAfterSale(current.value.id,audit.status,audit.remark);ElMessage.success('售后审核记录已保存');dialogVisible.value=false;loadData()}
onMounted(loadData)
</script>
<template><div class="page-view"><PageHeader title="售后审核" description="处理买卖双方售后纠纷，同意或驳回后保存平台审核记录供后续追踪。"/><SearchPanel><el-form><el-form-item label="关键词"><el-input v-model="query.keyword" placeholder="售后单/订单/商家/买家" clearable/></el-form-item><el-form-item label="状态"><el-select v-model="query.status" clearable><el-option label="待审核" value="PENDING"/><el-option label="平台同意" value="APPROVED"/><el-option label="平台驳回" value="REJECTED"/></el-select></el-form-item><el-button type="primary" @click="loadData">查询</el-button></el-form></SearchPanel><el-card class="sg-card" shadow="never" v-loading="loading"><el-table v-if="rows.length" :data="rows"><el-table-column prop="serviceNo" label="售后单"/><el-table-column prop="orderNo" label="订单号"/><el-table-column prop="shopName" label="商家"/><el-table-column prop="buyerName" label="买家"/><el-table-column label="金额"><template #default="{row}">{{formatMoney(row.amount)}}</template></el-table-column><el-table-column prop="reason" label="原因" min-width="180"/><el-table-column label="状态"><template #default="{row}"><StatusTag :label="getAfterSaleStatusLabel(row.status)" :type="statusType(row.status)"/></template></el-table-column><el-table-column label="操作" width="150"><template #default="{row}"><div class="table-actions"><el-button link type="primary" @click="openAudit(row,'APPROVED')">同意</el-button><el-button link type="danger" @click="openAudit(row,'REJECTED')">驳回</el-button></div></template></el-table-column></el-table><EmptyState v-else description="暂无售后纠纷"/><AppPagination :page="query.page!" :page-size="query.pageSize!" :total="total" @change="Object.assign(query,$event);loadData()"/></el-card><el-dialog v-model="dialogVisible" title="平台售后审核"><el-alert :title="audit.status==='APPROVED'?'本次操作将同意买家售后诉求':'本次操作将驳回售后申请'" type="warning" show-icon :closable="false"/><el-input v-model="audit.remark" class="audit-remark" type="textarea" :rows="4" placeholder="填写审核说明，便于商家和买家查看平台依据"/><template #footer><el-button @click="dialogVisible=false">取消</el-button><el-button type="primary" @click="submitAudit">保存审核记录</el-button></template></el-dialog></div></template>
<style scoped lang="scss">.audit-remark{margin-top:16px;}</style>
