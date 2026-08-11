<script setup lang="ts">
import { onMounted, reactive, shallowRef } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import PageHeader from '@/components/common/PageHeader.vue'
import AppPagination from '@/components/common/AppPagination.vue'
import StatusTag from '@/components/common/StatusTag.vue'
import { decideAfterSaleAppeal, getAfterSaleAppealDetail, listAfterSaleAppeals, type DecideAfterSaleAppealRequest } from '@/api/admin/afterSaleAppeals'
import type { AppealDetail, AppealSummary, AfterSaleAppealDecision, AfterSaleAppealStatus } from '@/types/admin'

const query = reactive({ page: 1, pageSize: 20, status: undefined as AfterSaleAppealStatus | undefined, afterSaleNo: '' })
const rows = shallowRef<AppealSummary[]>([])
const detail = shallowRef<AppealDetail | null>(null)
const total = shallowRef(0)
const loading = shallowRef(false)
const detailVisible = shallowRef(false)
const decisionVisible = shallowRef(false)
const decision = reactive<DecideAfterSaleAppealRequest>({ decision: 'APPROVE', reviewComment: '', version: 0 })

const statusLabel: Record<AfterSaleAppealStatus, string> = { PENDING: '待裁决', APPROVED: '已同意', REJECTED: '已驳回' }
function statusType(status: AfterSaleAppealStatus) { return status === 'APPROVED' ? 'success' : status === 'REJECTED' ? 'danger' : 'warning' }
function getStatusLabel(status: AfterSaleAppealStatus) { return statusLabel[status] }
function formatDate(value: string | null) { return value ? new Date(value).toLocaleString('zh-CN') : '-' }
async function load() { loading.value = true; try { const result = await listAfterSaleAppeals(query); rows.value = result.items; total.value = result.total } finally { loading.value = false } }
async function openDetail(row: AppealSummary) { detail.value = await getAfterSaleAppealDetail(row.id); detailVisible.value = true }
async function openDecision(row: { id: string }, value: AfterSaleAppealDecision) { detail.value = await getAfterSaleAppealDetail(row.id); decision.decision = value; decision.version = detail.value.version; decision.reviewComment = ''; decision.approvedQuantity = value === 'APPROVE' ? detail.value.item?.purchasedQuantity : undefined; decision.approvedAmount = value === 'APPROVE' ? detail.value.afterSale.requestedAmount : undefined; decisionVisible.value = true }
async function submitDecision() { if (!detail.value || !decision.reviewComment.trim()) { ElMessage.warning('请填写裁决说明'); return }; await ElMessageBox.confirm(`确认${decision.decision === 'APPROVE' ? '同意' : '驳回'}该申诉？`, '操作确认'); await decideAfterSaleAppeal(detail.value.id, decision); ElMessage.success('申诉裁决已提交'); decisionVisible.value = false; await load() }
onMounted(load)
</script>

<template>
  <div class="appeal-page">
    <PageHeader title="售后申诉" description="处理商家拒绝或超时触发的平台售后申诉，所有裁决均提交真实接口。" />
    <el-card class="sg-card" shadow="never">
      <el-form class="appeal-filter-form" inline @submit.prevent="load"><el-form-item label="申诉状态"><el-select v-model="query.status" clearable placeholder="全部" class="appeal-status-select"><el-option label="待裁决" value="PENDING" /><el-option label="已同意" value="APPROVED" /><el-option label="已驳回" value="REJECTED" /></el-select></el-form-item><el-form-item label="售后单号"><el-input v-model="query.afterSaleNo" clearable placeholder="请输入售后单号" /></el-form-item><el-button type="primary" @click="query.page = 1; load()">查询</el-button></el-form>
    </el-card>
    <el-card class="sg-card" shadow="never" v-loading="loading"><el-table :data="rows" empty-text="暂无申诉"><el-table-column prop="appealNo" label="申诉编号" min-width="150" /><el-table-column prop="afterSaleNo" label="售后单号" min-width="150" /><el-table-column prop="shop.name" label="店铺" /><el-table-column prop="buyer.nickname" label="买家" /><el-table-column prop="requestedAmount" label="申请金额" /><el-table-column label="状态"><template #default="{ row }"><StatusTag :label="getStatusLabel(row.status)" :type="statusType(row.status)" /></template></el-table-column><el-table-column label="创建时间" min-width="160"><template #default="{ row }">{{ formatDate(row.createdAt) }}</template></el-table-column><el-table-column label="操作" width="180" fixed="right"><template #default="{ row }"><el-button link type="primary" @click="openDetail(row)">详情</el-button><el-button v-if="row.status === 'PENDING'" link type="success" @click="openDecision(row, 'APPROVE')">同意</el-button><el-button v-if="row.status === 'PENDING'" link type="danger" @click="openDecision(row, 'REJECT')">驳回</el-button></template></el-table-column></el-table><AppPagination :page="query.page" :page-size="query.pageSize" :total="total" @change="Object.assign(query, $event); load()" /></el-card>
    <el-drawer v-model="detailVisible" title="申诉详情" size="520px"><template v-if="detail"><el-descriptions :column="1" border><el-descriptions-item label="申诉编号">{{ detail.appealNo }}</el-descriptions-item><el-descriptions-item label="售后单号">{{ detail.afterSale.afterSaleNo }}</el-descriptions-item><el-descriptions-item label="店铺/买家">{{ detail.shop.name }} / {{ detail.buyer.nickname }}</el-descriptions-item><el-descriptions-item label="申诉原因">{{ detail.reasonCode }}：{{ detail.reasonDescription }}</el-descriptions-item><el-descriptions-item label="商家审核">{{ detail.merchantReview?.comment || '-' }}</el-descriptions-item><el-descriptions-item label="裁决说明">{{ detail.decisionComment || '-' }}</el-descriptions-item><el-descriptions-item label="更新时间">{{ formatDate(detail.updatedAt) }}</el-descriptions-item></el-descriptions><div class="drawer-actions" v-if="detail.status === 'PENDING'"><el-button type="success" @click="openDecision(detail, 'APPROVE')">同意申诉</el-button><el-button type="danger" @click="openDecision(detail, 'REJECT')">驳回申诉</el-button></div></template></el-drawer>
    <el-dialog v-model="decisionVisible" :title="decision.decision === 'APPROVE' ? '同意申诉' : '驳回申诉'" width="500px"><el-form label-width="100px"><el-form-item v-if="decision.decision === 'APPROVE'" label="批准数量"><el-input-number v-model="decision.approvedQuantity" :min="1" /></el-form-item><el-form-item v-if="decision.decision === 'APPROVE'" label="批准金额"><el-input v-model="decision.approvedAmount" /></el-form-item><el-form-item label="裁决说明" required><el-input v-model="decision.reviewComment" type="textarea" :rows="4" maxlength="500" show-word-limit /></el-form-item></el-form><template #footer><el-button @click="decisionVisible = false">取消</el-button><el-button type="primary" @click="submitDecision">确认提交</el-button></template></el-dialog>
  </div>
</template>

<style scoped lang="scss">
.appeal-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.appeal-filter-form {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 16px;
}

.appeal-filter-form :deep(.el-form-item) {
  margin-bottom: 0;
  flex: 0 0 auto;
}

.appeal-status-select {
  width: 140px;
}

.drawer-actions {
  margin-top: 20px;
}
</style>
