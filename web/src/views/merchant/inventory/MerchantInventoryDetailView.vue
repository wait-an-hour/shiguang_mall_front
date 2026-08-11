<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { createInventoryAdjustment, createInventoryInbound, getInventoryTransactions, getMerchantInventoryDetail } from '../../../api/merchant/inventory'
import { INVENTORY_TRANSACTION_TYPE_LABELS, STOCK_STATE_LABELS, STOCK_STATE_TAG_TYPES } from '../../../constants/merchant'
import { ROUTE_NAME } from '../../../constants/routes'
import type { InventoryItemView, InventoryTransactionType, InventoryTransactionView } from '../../../types/merchant'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const dialogVisible = ref(false)
const dialogType = ref<'inbound' | 'adjustment'>('inbound')
const item = ref<InventoryItemView | null>(null)
const transactions = ref<InventoryTransactionView[]>([])
const shopId = computed(() => String(route.params.shopId))
const skuId = computed(() => String(route.params.skuId))
const form = reactive({ quantity: 1, delta: 0, businessNo: '', remark: '' })
const operationSubmitting = ref(false)
const adjustmentAfterStock = computed(() => (item.value?.availableStock ?? 0) + form.delta)

function getTransactionTypeLabel(type: InventoryTransactionType) {
  return INVENTORY_TRANSACTION_TYPE_LABELS[type]
}

async function loadDetail() {
  loading.value = true
  try {
    item.value = await getMerchantInventoryDetail(shopId.value, skuId.value)
    const page = await getInventoryTransactions(shopId.value, { skuId: skuId.value, page: 1, pageSize: 8 })
    transactions.value = page.items
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.push({ name: ROUTE_NAME.MerchantInventoryList, params: { shopId: shopId.value } })
}

function goTransactions() {
  router.push({ name: ROUTE_NAME.MerchantInventoryTransactions, params: { shopId: shopId.value }, query: { skuId: skuId.value } })
}

function openDialog(type: 'inbound' | 'adjustment') {
  dialogType.value = type
  form.quantity = 1
  form.delta = 0
  form.businessNo = `${type === 'inbound' ? 'IN' : 'ADJ'}${Date.now()}`
  form.remark = ''
  dialogVisible.value = true
}

async function submitOperation() {
  if (!item.value || operationSubmitting.value) return
  if (dialogType.value === 'adjustment' && form.delta === 0) {
    ElMessage.warning('调整数量不能为 0')
    return
  }
  if (dialogType.value === 'adjustment' && !form.remark.trim()) {
    ElMessage.warning('请填写调整原因')
    return
  }
  if (dialogType.value === 'adjustment' && form.remark.trim().length > 500) {
    ElMessage.warning('调整原因不能超过 500 个字符')
    return
  }
  if (dialogType.value === 'adjustment' && adjustmentAfterStock.value < 0) {
    ElMessage.warning('调整后库存不能小于 0')
    return
  }
  operationSubmitting.value = true
  try {
    if (dialogType.value === 'inbound') {
      await createInventoryInbound(shopId.value, { skuId: skuId.value, quantity: form.quantity, businessNo: form.businessNo, remark: form.remark })
    } else {
      await createInventoryAdjustment(shopId.value, { skuId: skuId.value, delta: form.delta, businessNo: form.businessNo, remark: form.remark, version: item.value.version })
    }
    ElMessage.success('库存操作成功')
    dialogVisible.value = false
    await loadDetail()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '库存操作失败，请稍后重试')
  } finally {
    operationSubmitting.value = false
  }
}

onMounted(loadDetail)
</script>

<template>
  <div class="detail-page">
    <section class="page-header">
      <div>
        <h1 class="page-title">库存详情</h1>
        <p class="page-description">查看单个 SKU 的库存水位与最近流水。</p>
      </div>
      <div class="page-actions">
        <el-button @click="goBack">返回列表</el-button>
        <el-button-group class="detail-actions">
          <el-button type="success" plain @click="openDialog('inbound')">入库</el-button>
          <el-button type="warning" plain @click="openDialog('adjustment')">调整</el-button>
        </el-button-group>
      </div>
    </section>

    <el-card v-if="item" class="page-card" shadow="never" v-loading="loading">
      <div class="summary">
        <el-image class="cover" :src="item.coverImageUrl" fit="cover" />
        <div>
          <div class="summary-title">{{ item.productName }}</div>
          <div class="summary-meta">{{ item.skuName }} · {{ item.skuNo }}</div>
        </div>
        <el-tag :type="STOCK_STATE_TAG_TYPES[item.stockState]" effect="light">{{ STOCK_STATE_LABELS[item.stockState] }}</el-tag>
      </div>
      <el-descriptions class="stock-desc" :column="4" border>
        <el-descriptions-item label="可用库存">{{ item.availableStock }}</el-descriptions-item>
        <el-descriptions-item label="锁定库存">{{ item.lockedStock }}</el-descriptions-item>
        <el-descriptions-item label="安全库存">{{ item.safetyStock }}</el-descriptions-item>
        <el-descriptions-item label="版本">{{ item.version }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-card class="page-card" shadow="never">
      <template #header><div class="card-header"><span>最近流水</span><el-button text type="primary" @click="goTransactions">查看全部</el-button></div></template>
      <el-table :data="transactions" row-key="id">
        <el-table-column label="类型" width="120"><template #default="{ row }">{{ getTransactionTypeLabel(row.transactionType) }}</template></el-table-column>
        <el-table-column prop="businessNo" label="业务单号" min-width="160" />
        <el-table-column prop="quantity" label="变动数量" width="100" />
        <el-table-column prop="afterAvailableStock" label="变动后库存" width="120" />
        <el-table-column prop="createdAt" label="发生时间" width="210" />
      </el-table>
      <el-empty v-if="transactions.length === 0" description="暂无库存流水" />
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogType === 'inbound' ? '采购入库' : '库存调整'" width="520px">
      <el-form :model="form" label-width="90px">
        <el-form-item v-if="dialogType === 'inbound'" label="入库数量"><el-input-number v-model="form.quantity" :min="1" /></el-form-item>
        <el-form-item v-else label="调整数量"><el-input-number v-model="form.delta" /><div class="form-tip">正数为增加库存，负数为减少库存</div></el-form-item>
        <el-form-item v-if="dialogType === 'adjustment'" label="调整后库存"><el-tag :type="adjustmentAfterStock < 0 ? 'danger' : 'success'">{{ adjustmentAfterStock }}</el-tag></el-form-item>
        <el-form-item label="业务单号"><el-input v-model="form.businessNo" /></el-form-item>
        <el-form-item label="调整原因" :required="dialogType === 'adjustment'"><el-input v-model="form.remark" type="textarea" :rows="3" maxlength="500" show-word-limit placeholder="请输入库存调整原因" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="dialogVisible = false">取消</el-button><el-button type="primary" @click="submitOperation">确认</el-button></template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.detail-page { display: flex; flex-direction: column; gap: 16px; }
.page-header, .card-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.page-title { margin: 0; color: #111827; font-size: 20px; font-weight: 600; }
.page-description, .summary-meta { margin: 8px 0 0; color: #6b7280; font-size: 13px; }
.page-actions { display: flex; align-items: center; gap: 12px; }
.form-tip { margin-top: 4px; color: #94a3b8; font-size: 12px; line-height: 1.4; }
.page-card { border: 1px solid #e5e7eb; border-radius: 10px; }
.summary { display: grid; grid-template-columns: 72px 1fr auto; align-items: center; gap: 16px; }
.cover { width: 72px; height: 72px; border-radius: 10px; background: #f1f5f9; }
.cover-placeholder { display: grid; place-items: center; color: #9ca3af; font-size: 12px; text-align: center; }
.summary-title { color: #111827; font-size: 16px; font-weight: 600; }
.stock-desc { margin-top: 16px; }
.card-header { color: #111827; font-weight: 600; }
</style>
