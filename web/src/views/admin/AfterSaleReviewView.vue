<script setup lang="ts">
import { onMounted, reactive, shallowRef } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import PageHeader from '@/components/common/PageHeader.vue'
import SearchPanel from '@/components/common/SearchPanel.vue'
import AppPagination from '@/components/common/AppPagination.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import StatusTag from '@/components/common/StatusTag.vue'
import { decideAfterSaleAppeal, getAfterSaleAppealDetail, listAfterSaleAppeals, type AfterSaleAppealQuery, type DecideAfterSaleAppealRequest } from '@/api/admin/afterSaleAppeals'
import { getPlatformShops } from '@/api/admin/shops'
import { ApiRequestError } from '@/utils/request'
import { AFTER_SALE_APPEAL_STATUS_LABEL, AFTER_SALE_APPEAL_TRIGGER_LABEL, AFTER_SALE_TYPE_LABEL, formatMoney } from '@/utils/labels'
import type { AppealDetail, AppealSummary, AfterSaleAppealDecision, AfterSaleAppealStatus, PlatformShopView } from '@/types/admin'

const query = reactive<AfterSaleAppealQuery>({ page: 1, pageSize: 20, afterSaleNo: '' })
const rows = shallowRef<AppealSummary[]>([])
const shops = shallowRef<PlatformShopView[]>([])
const detail = shallowRef<AppealDetail | null>(null)
const total = shallowRef(0)
const loading = shallowRef(false)
const shopLoading = shallowRef(false)
const detailLoading = shallowRef(false)
const submitting = shallowRef(false)
const errorMessage = shallowRef('')
const detailErrorMessage = shallowRef('')
const detailVisible = shallowRef(false)
const decisionVisible = shallowRef(false)
const idempotencyKey = shallowRef('')
const decision = reactive<DecideAfterSaleAppealRequest>({ decision: 'APPROVE', reviewComment: '', version: 0 })

function statusType(status: AfterSaleAppealStatus) { return status === 'APPROVED' ? 'success' : status === 'REJECTED' ? 'danger' : 'warning' }
function appealStatusLabel(status: AfterSaleAppealStatus) { return AFTER_SALE_APPEAL_STATUS_LABEL[status] }
function appealTriggerLabel(triggerType: AppealSummary['triggerType']) { return AFTER_SALE_APPEAL_TRIGGER_LABEL[triggerType] }
function afterSaleTypeLabel(requestType: AppealSummary['requestType']) { return AFTER_SALE_TYPE_LABEL[requestType] }
function formatDate(value: string | null) { return value ? new Date(value).toLocaleString('zh-CN') : '-' }
function formatSpecs(spec: Record<string, string>) { return Object.entries(spec).map(([key, value]) => `${key}：${value}`).join('，') || '-' }

async function load() {
  loading.value = true
  errorMessage.value = ''
  try { const result = await listAfterSaleAppeals(query); rows.value = result.items; total.value = result.total }
  catch (error) { errorMessage.value = error instanceof Error ? error.message : '售后申诉加载失败'; ElMessage.error(errorMessage.value) }
  finally { loading.value = false }
}
async function loadShops() {
  shopLoading.value = true
  try { const result = await getPlatformShops({ page: 1, pageSize: 100, sort: 'shopName,asc' }); shops.value = result.items }
  catch (error) { ElMessage.error(error instanceof Error ? error.message : '店铺列表加载失败') }
  finally { shopLoading.value = false }
}
function search() { query.page = 1; void load() }
async function fetchDetail(appealId: string) {
  detailLoading.value = true
  detailErrorMessage.value = ''
  try { detail.value = await getAfterSaleAppealDetail(appealId); return detail.value }
  catch (error) { detailErrorMessage.value = error instanceof Error ? error.message : '申诉详情加载失败'; return null }
  finally { detailLoading.value = false }
}
async function openDetail(row: Pick<AppealSummary, 'id'>) { detailVisible.value = true; await fetchDetail(row.id) }
async function openDecision(row: Pick<AppealSummary, 'id'> | AppealDetail, value: AfterSaleAppealDecision) {
  const latest = await fetchDetail(row.id)
  if (!latest) { ElMessage.error(detailErrorMessage.value); return }
  if (latest.status !== 'PENDING') { ElMessage.warning('该申诉已处理，已刷新最新数据'); await load(); return }
  Object.assign(decision, { decision: value, version: latest.version, reviewComment: '', approvedQuantity: undefined, approvedAmount: value === 'APPROVE' ? latest.afterSale.requestedAmount : undefined })
  idempotencyKey.value = crypto.randomUUID()
  decisionVisible.value = true
}
function validateDecision() {
  if (!decision.reviewComment.trim()) return '请填写裁决说明'
  if (decision.decision === 'APPROVE') {
    if (!decision.approvedQuantity || decision.approvedQuantity < 1) return '请输入有效的批准数量'
    if (!/^(0|[1-9][0-9]{0,15})\.[0-9]{2}$/.test(decision.approvedAmount || '') || decision.approvedAmount === '0.00') return '请输入大于 0 的两位小数批准金额'
  }
  return ''
}
async function submitDecision() {
  if (!detail.value) return
  const validationMessage = validateDecision()
  if (validationMessage) { ElMessage.warning(validationMessage); return }
  if (!(await ElMessageBox.confirm(`确认${decision.decision === 'APPROVE' ? '同意' : '驳回'}该申诉？`, '操作确认', { type: 'warning' }).then(() => true).catch(() => false))) return
  submitting.value = true
  const body: DecideAfterSaleAppealRequest = { decision: decision.decision, reviewComment: decision.reviewComment.trim(), version: decision.version }
  if (decision.decision === 'APPROVE') { body.approvedQuantity = decision.approvedQuantity; body.approvedAmount = decision.approvedAmount?.trim() }
  try {
    detail.value = await decideAfterSaleAppeal(detail.value.id, body, idempotencyKey.value)
    ElMessage.success('申诉裁决已提交')
    decisionVisible.value = false
    await load()
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 409) {
      decisionVisible.value = false
      await Promise.all([fetchDetail(detail.value.id), load()])
      ElMessage.warning('数据已发生变化，已刷新最新申诉详情')
    } else { ElMessage.error(error instanceof Error ? error.message : '申诉裁决提交失败') }
  } finally { submitting.value = false }
}

onMounted(() => { void Promise.all([load(), loadShops()]) })
</script>

<template>
  <div class="appeal-page">
    <PageHeader title="售后审核" description="处理商家驳回或超时触发的平台售后申诉。" />
    <SearchPanel><el-form class="filter-form" inline @submit.prevent="search"><el-form-item label="售后单号"><el-input v-model="query.afterSaleNo" clearable placeholder="请输入售后单号" /></el-form-item><el-form-item label="申诉状态"><el-select v-model="query.status" clearable class="filter-select" placeholder="全部"><el-option v-for="(label, value) in AFTER_SALE_APPEAL_STATUS_LABEL" :key="value" :label="label" :value="value" /></el-select></el-form-item><el-form-item label="触发类型"><el-select v-model="query.triggerType" clearable class="filter-select" placeholder="全部"><el-option v-for="(label, value) in AFTER_SALE_APPEAL_TRIGGER_LABEL" :key="value" :label="label" :value="value" /></el-select></el-form-item><el-form-item label="店铺"><el-select v-model="query.shopId" clearable filterable :loading="shopLoading" class="shop-select" placeholder="全部店铺"><el-option v-for="shop in shops" :key="shop.shop.id" :label="`${shop.shop.shopName}（${shop.shop.shopNo}）`" :value="shop.shop.id" /></el-select></el-form-item><el-form-item label="创建时间"><el-date-picker v-model="query.createdFrom" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss" placeholder="开始时间" class="date-input" /><span class="range-separator">至</span><el-date-picker v-model="query.createdTo" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss" placeholder="结束时间" class="date-input" /></el-form-item><el-button type="primary" @click="search">查询</el-button></el-form></SearchPanel>
    <el-card class="sg-card" shadow="never" v-loading="loading || detailLoading"><el-result v-if="errorMessage && !loading" icon="error" title="售后申诉加载失败" :sub-title="errorMessage"><template #extra><el-button type="primary" @click="load">重试</el-button></template></el-result><template v-else><el-table v-if="rows.length" :data="rows"><el-table-column prop="appealNo" label="申诉编号" min-width="170" /><el-table-column prop="afterSaleNo" label="售后单号" min-width="170" /><el-table-column label="触发类型" min-width="100"><template #default="{ row }">{{ appealTriggerLabel(row.triggerType) }}</template></el-table-column><el-table-column label="店铺" min-width="150"><template #default="{ row }">{{ row.shop.shopName }}</template></el-table-column><el-table-column label="买家" min-width="130"><template #default="{ row }">{{ row.buyer.nickname || row.buyer.username }}</template></el-table-column><el-table-column label="售后类型" min-width="100"><template #default="{ row }">{{ afterSaleTypeLabel(row.requestType) }}</template></el-table-column><el-table-column label="申请金额" min-width="110"><template #default="{ row }">{{ formatMoney(row.requestedAmount) }}</template></el-table-column><el-table-column label="状态" min-width="100"><template #default="{ row }"><StatusTag :label="appealStatusLabel(row.status)" :type="statusType(row.status)" /></template></el-table-column><el-table-column label="创建时间" min-width="170"><template #default="{ row }">{{ formatDate(row.createdAt) }}</template></el-table-column><el-table-column label="操作" width="180" fixed="right"><template #default="{ row }"><el-button link type="primary" @click="openDetail(row)">详情</el-button><el-button v-if="row.status === 'PENDING'" link type="success" @click="openDecision(row, 'APPROVE')">同意</el-button><el-button v-if="row.status === 'PENDING'" link type="danger" @click="openDecision(row, 'REJECT')">驳回</el-button></template></el-table-column></el-table><EmptyState v-else description="暂无符合条件的售后申诉" /><AppPagination :page="query.page || 1" :page-size="query.pageSize || 20" :total="total" @change="Object.assign(query, $event); load()" /></template></el-card>
    <el-drawer v-model="detailVisible" title="申诉详情" size="620px"><el-result v-if="detailErrorMessage" icon="error" title="申诉详情加载失败" :sub-title="detailErrorMessage"><template #extra><el-button v-if="detail" type="primary" @click="fetchDetail(detail.id)">重试</el-button></template></el-result><template v-else-if="detail"><el-descriptions :column="1" border><el-descriptions-item label="申诉编号">{{ detail.appealNo }}</el-descriptions-item><el-descriptions-item label="售后/订单">{{ detail.afterSale.afterSaleNo }} / {{ detail.order.orderNo }}</el-descriptions-item><el-descriptions-item label="店铺/买家">{{ detail.shop.shopName }} / {{ detail.buyer.nickname || detail.buyer.username }}</el-descriptions-item><el-descriptions-item label="售后类型">{{ AFTER_SALE_TYPE_LABEL[detail.afterSale.requestType] }}</el-descriptions-item><el-descriptions-item label="商品">{{ detail.item ? `${detail.item.productName} / ${detail.item.skuName}` : '-' }}</el-descriptions-item><el-descriptions-item label="规格">{{ detail.item ? formatSpecs(detail.item.spec) : '-' }}</el-descriptions-item><el-descriptions-item label="申请金额">{{ formatMoney(detail.afterSale.requestedAmount) }}</el-descriptions-item><el-descriptions-item label="申诉原因">{{ detail.reasonCode }}：{{ detail.reasonDescription }}</el-descriptions-item><el-descriptions-item label="商家审核">{{ detail.merchantReview ? `${detail.merchantReview.comment}（${formatDate(detail.merchantReview.reviewedAt)}）` : '-' }}</el-descriptions-item><el-descriptions-item label="批准结果">{{ detail.decision === 'APPROVE' ? `${detail.approvedQuantity ?? '-'} 件 / ${detail.approvedAmount ? formatMoney(detail.approvedAmount) : '-'}` : '-' }}</el-descriptions-item><el-descriptions-item label="裁决信息">{{ detail.decidedBy ? `${detail.decidedBy.nickname || detail.decidedBy.username} · ${formatDate(detail.decidedAt)}` : '-' }}</el-descriptions-item><el-descriptions-item label="裁决说明">{{ detail.decisionComment || '-' }}</el-descriptions-item><el-descriptions-item label="创建/更新">{{ formatDate(detail.createdAt) }} / {{ formatDate(detail.updatedAt) }}</el-descriptions-item></el-descriptions><div class="evidence-section"><div class="section-title">申诉证据</div><el-image v-for="url in detail.evidenceUrls" :key="url" class="evidence-image" :src="url" :preview-src-list="detail.evidenceUrls" fit="cover" preview-teleported /><EmptyState v-if="!detail.evidenceUrls.length" description="未提交申诉证据" /></div><div v-if="detail.status === 'PENDING'" class="drawer-actions"><el-button type="success" @click="openDecision(detail, 'APPROVE')">同意申诉</el-button><el-button type="danger" @click="openDecision(detail, 'REJECT')">驳回申诉</el-button></div></template></el-drawer>
    <el-dialog v-model="decisionVisible" :title="decision.decision === 'APPROVE' ? '同意申诉' : '驳回申诉'" width="520px" :close-on-click-modal="false"><el-alert v-if="decision.decision === 'APPROVE'" type="info" :closable="false" :title="detail?.afterSale.requestType === 'REFUND_ONLY' ? '仅退款：批准后将进入退款流程' : '退货退款：批准后将进入待退货流程'" /><el-form label-width="100px" class="decision-form"><el-form-item v-if="decision.decision === 'APPROVE'" label="批准数量" required><el-input-number v-model="decision.approvedQuantity" :min="1" :step="1" step-strictly /></el-form-item><el-form-item v-if="decision.decision === 'APPROVE'" label="批准金额" required><el-input v-model="decision.approvedAmount" placeholder="例如 3999.00" /></el-form-item><el-form-item label="裁决说明" required><el-input v-model="decision.reviewComment" type="textarea" :rows="4" maxlength="500" show-word-limit /></el-form-item></el-form><template #footer><el-button :disabled="submitting" @click="decisionVisible = false">取消</el-button><el-button type="primary" :loading="submitting" @click="submitDecision">确认提交</el-button></template></el-dialog>
  </div>
</template>

<style scoped lang="scss">
.appeal-page { display: flex; flex-direction: column; gap: 16px; }
.filter-form { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; }
.filter-form :deep(.el-form-item) { margin: 0; }
.filter-select { width: 140px; }
.shop-select { width: 220px; }
.date-input { width: 190px; }
.range-separator { margin: 0 8px; color: var(--sg-text-muted); }
.evidence-section { margin-top: 20px; }
.section-title { margin-bottom: 12px; font-weight: 600; }
.evidence-image { width: 104px; height: 104px; margin: 0 8px 8px 0; border-radius: 6px; }
.drawer-actions { display: flex; gap: 8px; margin-top: 20px; }
.decision-form { margin-top: 16px; }
</style>
