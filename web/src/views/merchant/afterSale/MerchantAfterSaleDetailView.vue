<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import {
  approveMerchantAfterSale,
  confirmMerchantReturnReceived,
  getMerchantAfterSaleDetail,
  rejectMerchantAfterSale,
  retryMerchantRefund
} from '../../../api/merchant/afterSales'
import {
  AFTER_SALE_STATUS_LABELS,
  AFTER_SALE_STATUS_TAG_TYPES,
  AFTER_SALE_TYPE_LABELS,
  AFTER_SALE_TYPE_TAG_TYPES,
  ORDER_STATUS_LABELS,
  REFUND_STATUS_LABELS,
  REFUND_STATUS_TAG_TYPES
} from '../../../constants/merchant'
import { ROUTE_NAME } from '../../../constants/routes'
import type { AfterSaleAction, ShopAfterSaleDetailView } from '../../../types/merchant'

const route = useRoute()
const router = useRouter()
const shopId = computed(() => String(route.params.shopId))
const afterSaleId = computed(() => String(route.params.afterSaleId))
const loading = ref(false)
const submitting = ref(false)
const detail = ref<ShopAfterSaleDetailView | null>(null)
const dialogType = ref<AfterSaleAction | ''>('')
const formRef = ref<FormInstance>()
const approveForm = reactive({ approvedQuantity: 1, approvedAmount: '', reviewComment: '' })
const rejectForm = reactive({ reviewComment: '' })
const remarkForm = reactive({ remark: '' })
const approveRules: FormRules = {
  approvedQuantity: [{ required: true, message: '请输入批准数量', trigger: 'blur' }],
  approvedAmount: [{ required: true, message: '请输入批准金额', trigger: 'blur' }]
}
const rejectRules: FormRules = { reviewComment: [{ required: true, message: '请输入拒绝原因', trigger: 'blur' }] }
const retryRules: FormRules = { remark: [{ required: true, message: '请输入重试备注', trigger: 'blur' }] }
const dialogVisible = computed({
  get: () => Boolean(dialogType.value),
  set: (value: boolean) => { if (!value) dialogType.value = '' }
})
const timelineItems = computed(() => {
  if (!detail.value) return []
  const items = [{ title: '提交申请', time: detail.value.createdAt, remark: detail.value.reasonDescription || detail.value.reasonCode }]
  if (detail.value.review) items.push({ title: '商家审核', time: detail.value.review.reviewedAt, remark: detail.value.review.comment || '审核通过' })
  if (detail.value.returnShipment) items.push({ title: '买家退货', time: detail.value.returnShipment.returnedAt, remark: `${detail.value.returnShipment.carrierName} ${detail.value.returnShipment.trackingNo}` })
  if (detail.value.returnShipment?.receivedAt) items.push({ title: '确认收货', time: detail.value.returnShipment.receivedAt, remark: '商家确认收到退货' })
  if (detail.value.refundedAt) items.push({ title: '退款成功', time: detail.value.refundedAt, remark: detail.value.refundNo || '退款完成' })
  if (detail.value.cancelledAt) items.push({ title: '已取消', time: detail.value.cancelledAt, remark: '申请已取消' })
  return items
})

async function loadDetail() {
  loading.value = true
  try {
    detail.value = await getMerchantAfterSaleDetail(shopId.value, afterSaleId.value)
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.push({ name: ROUTE_NAME.MerchantAfterSaleList, params: { shopId: shopId.value } })
}

function openDialog(action: AfterSaleAction) {
  if (!detail.value) return
  dialogType.value = action
  approveForm.approvedQuantity = detail.value.quantity
  approveForm.approvedAmount = detail.value.requestedAmount
  approveForm.reviewComment = ''
  rejectForm.reviewComment = ''
  remarkForm.remark = ''
}

async function submitAction() {
  if (!detail.value || !dialogType.value) return
  await formRef.value?.validate()
  submitting.value = true
  try {
    if (dialogType.value === 'APPROVE') {
      detail.value = await approveMerchantAfterSale(shopId.value, detail.value.id, { ...approveForm, reviewComment: approveForm.reviewComment.trim() || null, approvedAmount: approveForm.approvedAmount.trim(), version: detail.value.version })
      ElMessage.success('已批准售后')
    }
    if (dialogType.value === 'REJECT') {
      detail.value = await rejectMerchantAfterSale(shopId.value, detail.value.id, { reviewComment: rejectForm.reviewComment.trim(), version: detail.value.version })
      ElMessage.success('已拒绝售后')
    }
    if (dialogType.value === 'CONFIRM_RETURN_RECEIVED') {
      detail.value = await confirmMerchantReturnReceived(shopId.value, detail.value.id, { remark: remarkForm.remark.trim() || null, version: detail.value.version })
      ElMessage.success('已确认退货收货')
    }
    if (dialogType.value === 'RETRY_REFUND') {
      detail.value = await retryMerchantRefund(shopId.value, detail.value.id, { remark: remarkForm.remark.trim(), version: detail.value.version })
      ElMessage.success('退款重试成功')
    }
    dialogType.value = ''
    await loadDetail()
  } finally {
    submitting.value = false
  }
}

onMounted(loadDetail)
</script>

<template>
  <div class="after-sale-detail-page" v-loading="loading">
    <section class="page-header">
      <div>
        <el-button :icon="ArrowLeft" text @click="goBack">返回售后列表</el-button>
        <h1 class="page-title">售后详情</h1>
        <p class="page-description">审核售后申请，跟进退货物流和退款结果。</p>
      </div>
      <div v-if="detail" class="page-actions">
        <el-button v-if="detail.availableActions.includes('APPROVE')" type="primary" @click="openDialog('APPROVE')">批准</el-button>
        <el-button v-if="detail.availableActions.includes('REJECT')" type="danger" plain @click="openDialog('REJECT')">拒绝</el-button>
        <el-button v-if="detail.availableActions.includes('CONFIRM_RETURN_RECEIVED')" type="primary" @click="openDialog('CONFIRM_RETURN_RECEIVED')">确认退货</el-button>
        <el-button v-if="detail.availableActions.includes('RETRY_REFUND')" type="warning" @click="openDialog('RETRY_REFUND')">退款重试</el-button>
      </div>
    </section>

    <template v-if="detail">
      <el-card class="page-card" shadow="never">
        <div class="summary-grid">
          <div><div class="label">售后号</div><div class="value">{{ detail.afterSaleNo }}</div></div>
          <div><div class="label">类型</div><el-tag :type="AFTER_SALE_TYPE_TAG_TYPES[detail.requestType]" effect="light">{{ AFTER_SALE_TYPE_LABELS[detail.requestType] }}</el-tag></div>
          <div><div class="label">售后状态</div><el-tag :type="AFTER_SALE_STATUS_TAG_TYPES[detail.status]" effect="light">{{ AFTER_SALE_STATUS_LABELS[detail.status] }}</el-tag></div>
          <div><div class="label">退款状态</div><el-tag :type="REFUND_STATUS_TAG_TYPES[detail.refundStatus]" effect="light">{{ REFUND_STATUS_LABELS[detail.refundStatus] }}</el-tag></div>
          <div><div class="label">申请金额</div><div class="value amount">{{ detail.requestedAmount }}</div></div>
          <div><div class="label">批准金额</div><div class="value">{{ detail.approvedAmount || '-' }}</div></div>
          <div><div class="label">版本</div><div class="value">{{ detail.version }}</div></div>
          <div><div class="label">更新时间</div><div class="value small">{{ detail.updatedAt }}</div></div>
        </div>
      </el-card>

      <el-row :gutter="16">
        <el-col :span="12"><el-card class="page-card" shadow="never"><template #header>订单 / 买家</template><el-descriptions :column="1" border><el-descriptions-item label="订单号">{{ detail.order.orderNo }}</el-descriptions-item><el-descriptions-item label="订单状态">{{ ORDER_STATUS_LABELS[detail.order.orderStatus] }}</el-descriptions-item><el-descriptions-item label="买家">{{ detail.buyer.nickname }}（{{ detail.buyer.username }}）</el-descriptions-item></el-descriptions></el-card></el-col>
        <el-col :span="12"><el-card class="page-card" shadow="never"><template #header>商品明细</template><div class="product-cell"><el-image class="cover" :src="detail.item.imageUrl" fit="cover" /><div><div class="name">{{ detail.item.productName }}</div><div class="meta">{{ detail.item.skuName }} · 购买 {{ detail.item.purchasedQuantity }} 件 · 申请 {{ detail.quantity }} 件</div><div class="meta">单价 {{ detail.item.unitPrice }}</div></div></div></el-card></el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12"><el-card class="page-card" shadow="never"><template #header>申请信息</template><el-descriptions :column="1" border><el-descriptions-item label="原因代码">{{ detail.reasonCode }}</el-descriptions-item><el-descriptions-item label="原因描述">{{ detail.reasonDescription || '无' }}</el-descriptions-item><el-descriptions-item label="凭证"><el-image v-for="url in detail.evidenceUrls" :key="url" class="evidence" :src="url" fit="cover" /><span v-if="detail.evidenceUrls.length === 0">无</span></el-descriptions-item></el-descriptions></el-card></el-col>
        <el-col :span="12"><el-card class="page-card" shadow="never"><template #header>审核信息</template><el-empty v-if="!detail.review" description="尚未审核" /><el-descriptions v-else :column="1" border><el-descriptions-item label="审核人">{{ detail.review.reviewerId }}</el-descriptions-item><el-descriptions-item label="审核备注">{{ detail.review.comment || '无' }}</el-descriptions-item><el-descriptions-item label="审核时间">{{ detail.review.reviewedAt }}</el-descriptions-item></el-descriptions></el-card></el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12"><el-card class="page-card" shadow="never"><template #header>退货物流</template><el-empty v-if="!detail.returnShipment" description="无需或暂无退货物流" /><el-descriptions v-else :column="1" border><el-descriptions-item label="承运商">{{ detail.returnShipment.carrierName }}（{{ detail.returnShipment.carrierCode }}）</el-descriptions-item><el-descriptions-item label="运单号">{{ detail.returnShipment.trackingNo }}</el-descriptions-item><el-descriptions-item label="寄回时间">{{ detail.returnShipment.returnedAt }}</el-descriptions-item><el-descriptions-item label="收货时间">{{ detail.returnShipment.receivedAt || '未确认' }}</el-descriptions-item></el-descriptions></el-card></el-col>
        <el-col :span="12"><el-card class="page-card" shadow="never"><template #header>退款信息</template><el-descriptions :column="1" border><el-descriptions-item label="退款单号">{{ detail.refundNo || '-' }}</el-descriptions-item><el-descriptions-item label="失败原因">{{ detail.refundFailureReason || '-' }}</el-descriptions-item><el-descriptions-item label="退款时间">{{ detail.refundedAt || '-' }}</el-descriptions-item><el-descriptions-item label="完成时间">{{ detail.completedAt || '-' }}</el-descriptions-item></el-descriptions></el-card></el-col>
      </el-row>

      <el-card class="page-card" shadow="never"><template #header>状态时间线</template><el-timeline><el-timeline-item v-for="item in timelineItems" :key="item.title + item.time" :timestamp="item.time"><div class="name">{{ item.title }}</div><div class="meta">{{ item.remark }}</div></el-timeline-item></el-timeline></el-card>
    </template>

    <el-empty v-else-if="!loading" description="售后单不存在" />

    <el-dialog v-model="dialogVisible" :title="dialogType === 'APPROVE' ? '批准售后' : dialogType === 'REJECT' ? '拒绝售后' : dialogType === 'CONFIRM_RETURN_RECEIVED' ? '确认退货收货' : '退款重试'" width="540px">
      <el-form v-if="dialogType === 'APPROVE'" ref="formRef" :model="approveForm" :rules="approveRules" label-width="110px"><el-form-item label="批准数量" prop="approvedQuantity"><el-input-number v-model="approveForm.approvedQuantity" :min="1" /></el-form-item><el-form-item label="批准金额" prop="approvedAmount"><el-input v-model="approveForm.approvedAmount" /></el-form-item><el-form-item label="审核备注"><el-input v-model="approveForm.reviewComment" type="textarea" :rows="3" /></el-form-item></el-form>
      <el-form v-else-if="dialogType === 'REJECT'" ref="formRef" :model="rejectForm" :rules="rejectRules" label-width="110px"><el-form-item label="拒绝原因" prop="reviewComment"><el-input v-model="rejectForm.reviewComment" type="textarea" :rows="4" /></el-form-item></el-form>
      <el-form v-else ref="formRef" :model="remarkForm" :rules="dialogType === 'RETRY_REFUND' ? retryRules : {}" label-width="110px"><el-form-item :label="dialogType === 'RETRY_REFUND' ? '重试备注' : '确认备注'" :prop="dialogType === 'RETRY_REFUND' ? 'remark' : undefined"><el-input v-model="remarkForm.remark" type="textarea" :rows="3" /></el-form-item></el-form>
      <template #footer><el-button @click="dialogType = ''">取消</el-button><el-button type="primary" :loading="submitting" @click="submitAction">确认</el-button></template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.after-sale-detail-page { display: flex; flex-direction: column; gap: 16px; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.page-actions { display: flex; gap: 8px; }
.page-title { margin: 8px 0 0; color: #111827; font-size: 20px; font-weight: 600; }
.page-description { margin: 8px 0 0; color: #6b7280; font-size: 13px; }
.page-card { border: 1px solid #e5e7eb; border-radius: 10px; }
.summary-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; }
.label { margin-bottom: 6px; color: #6b7280; font-size: 12px; }
.value, .name { color: #111827; font-weight: 600; }
.small { font-size: 13px; }
.amount { color: #2563eb; }
.meta { margin-top: 4px; color: #6b7280; font-size: 12px; }
.product-cell { display: flex; align-items: center; gap: 12px; }
.cover { width: 56px; height: 56px; border-radius: 8px; background: #f1f5f9; }
.evidence { width: 72px; height: 72px; margin-right: 8px; border-radius: 8px; background: #f1f5f9; }
</style>
