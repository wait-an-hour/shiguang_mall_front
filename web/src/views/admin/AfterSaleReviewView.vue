<script setup lang="ts">
import { onMounted, reactive, shallowRef } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import PageHeader from '@/components/common/PageHeader.vue'
import AppPagination from '@/components/common/AppPagination.vue'
import StatusTag from '@/components/common/StatusTag.vue'
import { decideAfterSaleAppeal, getAfterSaleAppealDetail, listAfterSaleAppeals, type AfterSaleAppealQuery, type DecideAfterSaleAppealRequest } from '@/api/admin/afterSaleAppeals'
import { getPlatformShops, type PlatformShopView } from '@/api/admin/shops'
import { formatMoney } from '@/utils/labels'
import type { AppealDetail, AppealSummary, AfterSaleAppealDecision, AfterSaleAppealStatus } from '@/types/admin'

const query = reactive<AfterSaleAppealQuery>({ page: 1, pageSize: 20, afterSaleNo: '' })
const rows = shallowRef<AppealSummary[]>([])
const shops = shallowRef<PlatformShopView[]>([])
const detail = shallowRef<AppealDetail | null>(null)
const total = shallowRef(0)
const loading = shallowRef(false)
const shopLoading = shallowRef(false)
const detailLoading = shallowRef(false)
const submitting = shallowRef(false)
const detailVisible = shallowRef(false)
const decisionVisible = shallowRef(false)
const decision = reactive<DecideAfterSaleAppealRequest>({ decision: 'APPROVE', reviewComment: '', version: 0 })

const statusLabel: Record<AfterSaleAppealStatus, string> = { PENDING: '待裁决', APPROVED: '已同意', REJECTED: '已驳回' }
const triggerLabel = { MERCHANT_REJECTED: '商家驳回', MERCHANT_TIMEOUT: '商家超时' } as const
const requestTypeLabel = { REFUND_ONLY: '仅退款', RETURN_REFUND: '退货退款' } as const

function statusType(status: AfterSaleAppealStatus) {
  return status === 'APPROVED' ? 'success' : status === 'REJECTED' ? 'danger' : 'warning'
}

function getStatusLabel(status: AfterSaleAppealStatus) {
  return statusLabel[status]
}

function getTriggerLabel(triggerType: AppealSummary['triggerType']) {
  return triggerLabel[triggerType]
}

function getRequestTypeLabel(requestType: AppealSummary['requestType']) {
  return requestTypeLabel[requestType]
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString('zh-CN') : '-'
}

async function load() {
  loading.value = true
  try {
    const result = await listAfterSaleAppeals(query)
    rows.value = result.items
    total.value = result.total
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '售后申诉加载失败')
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

function search() {
  query.page = 1
  void load()
}

async function openDetail(row: AppealSummary) {
  detailLoading.value = true
  try {
    detail.value = await getAfterSaleAppealDetail(row.id)
    detailVisible.value = true
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '申诉详情加载失败')
  } finally {
    detailLoading.value = false
  }
}

async function openDecision(row: Pick<AppealSummary, 'id'> | AppealDetail, value: AfterSaleAppealDecision) {
  detailLoading.value = true
  try {
    detail.value = await getAfterSaleAppealDetail(row.id)
    if (detail.value.status !== 'PENDING') {
      ElMessage.warning('该申诉已处理，请刷新列表')
      await load()
      return
    }
    decision.decision = value
    decision.version = detail.value.version
    decision.reviewComment = ''
    decision.approvedQuantity = value === 'APPROVE' ? detail.value.item?.purchasedQuantity : undefined
    decision.approvedAmount = value === 'APPROVE' ? detail.value.afterSale.requestedAmount : undefined
    decisionVisible.value = true
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '申诉详情加载失败')
  } finally {
    detailLoading.value = false
  }
}

async function submitDecision() {
  if (!detail.value || !decision.reviewComment.trim()) {
    ElMessage.warning('请填写裁决说明')
    return
  }
  if (decision.decision === 'APPROVE' && (!decision.approvedQuantity || !/^\d+\.\d{2}$/.test(decision.approvedAmount || ''))) {
    ElMessage.warning('请填写有效的批准数量和两位小数金额')
    return
  }
  await ElMessageBox.confirm(`确认${decision.decision === 'APPROVE' ? '同意' : '驳回'}该申诉？`, '操作确认')
  submitting.value = true
  try {
    const body: DecideAfterSaleAppealRequest = {
      decision: decision.decision,
      reviewComment: decision.reviewComment.trim(),
      version: decision.version,
      approvedQuantity: decision.decision === 'APPROVE' ? decision.approvedQuantity : undefined,
      approvedAmount: decision.decision === 'APPROVE' ? decision.approvedAmount : undefined
    }
    await decideAfterSaleAppeal(detail.value.id, body)
    ElMessage.success('申诉裁决已提交')
    decisionVisible.value = false
    detailVisible.value = false
    await load()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '申诉裁决提交失败')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  void Promise.all([load(), loadShops()])
})
</script>

<template>
  <div class="appeal-page">
    <PageHeader title="售后审核" description="审核用户在商家驳回或超时后提交的售后申诉。" />

    <el-card class="sg-card" shadow="never">
      <el-form class="appeal-filter-form" inline @submit.prevent="search">
        <el-form-item label="售后单号">
          <el-input v-model="query.afterSaleNo" clearable placeholder="请输入售后单号" />
        </el-form-item>
        <el-form-item label="申诉状态">
          <el-select v-model="query.status" clearable placeholder="全部" class="filter-select">
            <el-option label="待裁决" value="PENDING" />
            <el-option label="已同意" value="APPROVED" />
            <el-option label="已驳回" value="REJECTED" />
          </el-select>
        </el-form-item>
        <el-form-item label="触发类型">
          <el-select v-model="query.triggerType" clearable placeholder="全部" class="filter-select">
            <el-option label="商家驳回" value="MERCHANT_REJECTED" />
            <el-option label="商家超时" value="MERCHANT_TIMEOUT" />
          </el-select>
        </el-form-item>
        <el-form-item label="店铺">
          <el-select v-model="query.shopId" clearable filterable :loading="shopLoading" placeholder="全部店铺" class="shop-select">
            <el-option v-for="shop in shops" :key="shop.shop.id" :label="`${shop.shop.shopName}（${shop.shop.shopNo}）`" :value="shop.shop.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="创建时间">
          <el-date-picker v-model="query.createdFrom" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss" placeholder="开始时间" class="date-input" />
          <span class="range-separator">至</span>
          <el-date-picker v-model="query.createdTo" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss" placeholder="结束时间" class="date-input" />
        </el-form-item>
        <el-button type="primary" @click="search">查询</el-button>
      </el-form>
    </el-card>

    <el-card class="sg-card" shadow="never" v-loading="loading || detailLoading">
      <el-table :data="rows" empty-text="暂无售后申诉">
        <el-table-column prop="appealNo" label="申诉编号" min-width="170" />
        <el-table-column prop="afterSaleNo" label="售后单号" min-width="170" />
        <el-table-column label="触发类型" min-width="100">
          <template #default="{ row }">{{ getTriggerLabel(row.triggerType) }}</template>
        </el-table-column>
        <el-table-column prop="shop.name" label="店铺" min-width="140" />
        <el-table-column label="买家" min-width="130">
          <template #default="{ row }">{{ row.buyer.nickname || row.buyer.username }}</template>
        </el-table-column>
        <el-table-column label="售后类型" min-width="100">
          <template #default="{ row }">{{ getRequestTypeLabel(row.requestType) }}</template>
        </el-table-column>
        <el-table-column label="申请金额" min-width="110">
          <template #default="{ row }">{{ formatMoney(row.requestedAmount) }}</template>
        </el-table-column>
        <el-table-column label="状态" min-width="100">
          <template #default="{ row }"><StatusTag :label="getStatusLabel(row.status)" :type="statusType(row.status)" /></template>
        </el-table-column>
        <el-table-column label="创建时间" min-width="170">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row)">详情</el-button>
            <el-button v-if="row.status === 'PENDING'" link type="success" @click="openDecision(row, 'APPROVE')">同意</el-button>
            <el-button v-if="row.status === 'PENDING'" link type="danger" @click="openDecision(row, 'REJECT')">驳回</el-button>
          </template>
        </el-table-column>
      </el-table>
      <AppPagination :page="query.page || 1" :page-size="query.pageSize || 20" :total="total" @change="Object.assign(query, $event); load()" />
    </el-card>

    <el-drawer v-model="detailVisible" title="申诉详情" size="560px">
      <template v-if="detail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="申诉编号">{{ detail.appealNo }}</el-descriptions-item>
          <el-descriptions-item label="售后单号">{{ detail.afterSale.afterSaleNo }}</el-descriptions-item>
          <el-descriptions-item label="订单号">{{ detail.order.orderNo }}</el-descriptions-item>
          <el-descriptions-item label="店铺/买家">{{ detail.shop.name }} / {{ detail.buyer.nickname || detail.buyer.username }}</el-descriptions-item>
          <el-descriptions-item label="商品">{{ detail.item ? `${detail.item.productName} / ${detail.item.skuName}` : '-' }}</el-descriptions-item>
          <el-descriptions-item label="申诉原因">{{ detail.reasonCode }}：{{ detail.reasonDescription }}</el-descriptions-item>
          <el-descriptions-item label="商家审核">{{ detail.merchantReview?.comment || '-' }}</el-descriptions-item>
          <el-descriptions-item label="裁决说明">{{ detail.decisionComment || '-' }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatDate(detail.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ formatDate(detail.updatedAt) }}</el-descriptions-item>
        </el-descriptions>
        <div v-if="detail.status === 'PENDING'" class="drawer-actions">
          <el-button type="success" @click="openDecision(detail, 'APPROVE')">同意申诉</el-button>
          <el-button type="danger" @click="openDecision(detail, 'REJECT')">驳回申诉</el-button>
        </div>
      </template>
    </el-drawer>

    <el-dialog v-model="decisionVisible" :title="decision.decision === 'APPROVE' ? '同意申诉' : '驳回申诉'" width="500px" :close-on-click-modal="false">
      <el-form label-width="100px">
        <el-form-item v-if="decision.decision === 'APPROVE'" label="批准数量" required>
          <el-input-number v-model="decision.approvedQuantity" :min="1" />
        </el-form-item>
        <el-form-item v-if="decision.decision === 'APPROVE'" label="批准金额" required>
          <el-input v-model="decision.approvedAmount" placeholder="例如 3999.00" />
        </el-form-item>
        <el-form-item label="裁决说明" required>
          <el-input v-model="decision.reviewComment" type="textarea" :rows="4" maxlength="500" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="decisionVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitDecision">确认提交</el-button>
      </template>
    </el-dialog>
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
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.appeal-filter-form :deep(.el-form-item) {
  margin: 0;
}

.filter-select {
  width: 140px;
}

.shop-select {
  width: 220px;
}

.date-input {
  width: 190px;
}

.range-separator {
  margin: 0 8px;
  color: #909399;
}

.drawer-actions {
  margin-top: 20px;
}
</style>
