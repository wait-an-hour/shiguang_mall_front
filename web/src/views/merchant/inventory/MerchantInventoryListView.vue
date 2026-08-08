<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Document } from '@element-plus/icons-vue'
import { createInventoryAdjustment, createInventoryInbound, getMerchantInventory } from '../../../api/merchant/inventory'
import { STOCK_STATE_LABELS, STOCK_STATE_TAG_TYPES } from '../../../constants/merchant'
import { ROUTE_NAME } from '../../../constants/routes'
import type { PageView } from '../../../types/common'
import type { InventoryItemView, StockState } from '../../../types/merchant'

const route = useRoute()
const router = useRouter()
const shopId = computed(() => String(route.params.shopId))
const loading = ref(false)
const dialogVisible = ref(false)
const dialogType = ref<'inbound' | 'adjustment'>('inbound')
const currentItem = ref<InventoryItemView | null>(null)
const pageData = ref<PageView<InventoryItemView>>({ items: [], page: 1, pageSize: 10, total: 0, totalPages: 1 })
const filters = reactive({
  keyword: String(route.query.keyword ?? ''),
  stockState: String(route.query.stockState ?? route.query.stock ?? '') as StockState | '',
  page: Number(route.query.page ?? 1),
  pageSize: Number(route.query.pageSize ?? 10)
})
const operationForm = reactive({ quantity: 1, delta: 0, businessNo: '', remark: '' })
const operationSubmitting = ref(false)
const adjustmentAfterStock = computed(() => (currentItem.value?.availableStock ?? 0) + operationForm.delta)
const stockOptions = computed(() => Object.entries(STOCK_STATE_LABELS) as Array<[StockState, string]>)

function getStockStateLabel(state: StockState) {
  return STOCK_STATE_LABELS[state]
}

function getStockStateTagType(state: StockState) {
  return STOCK_STATE_TAG_TYPES[state]
}

async function loadInventory() {
  loading.value = true
  try {
    pageData.value = await getMerchantInventory(shopId.value, filters)
  } finally {
    loading.value = false
  }
}

function syncQuery() {
  router.replace({
    name: ROUTE_NAME.MerchantInventoryList,
    params: { shopId: shopId.value },
    query: {
      keyword: filters.keyword || undefined,
      stockState: filters.stockState || undefined,
      page: String(filters.page),
      pageSize: String(filters.pageSize)
    }
  })
}

function search() {
  filters.page = 1
  syncQuery()
  loadInventory()
}

function resetFilters() {
  filters.keyword = ''
  filters.stockState = ''
  search()
}

function goDetail(row: InventoryItemView) {
  router.push({ name: ROUTE_NAME.MerchantInventoryDetail, params: { shopId: shopId.value, skuId: row.skuId } })
}

function goTransactions() {
  router.push({ name: ROUTE_NAME.MerchantInventoryTransactions, params: { shopId: shopId.value } })
}

function openDialog(row: InventoryItemView, type: 'inbound' | 'adjustment') {
  currentItem.value = row
  dialogType.value = type
  operationForm.quantity = 1
  operationForm.delta = 0
  operationForm.businessNo = `${type === 'inbound' ? 'IN' : 'ADJ'}${Date.now()}`
  operationForm.remark = ''
  dialogVisible.value = true
}

async function submitOperation() {
  if (!currentItem.value || operationSubmitting.value) return
  if (dialogType.value === 'adjustment' && operationForm.delta === 0) {
    ElMessage.warning('调整数量不能为 0')
    return
  }
  if (dialogType.value === 'adjustment' && !operationForm.remark.trim()) {
    ElMessage.warning('请填写调整原因')
    return
  }
  if (dialogType.value === 'adjustment' && operationForm.remark.trim().length > 500) {
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
      await createInventoryInbound(shopId.value, { skuId: currentItem.value.skuId, quantity: operationForm.quantity, businessNo: operationForm.businessNo, remark: operationForm.remark })
    } else {
      await createInventoryAdjustment(shopId.value, { skuId: currentItem.value.skuId, delta: operationForm.delta, businessNo: operationForm.businessNo, remark: operationForm.remark, version: currentItem.value.version })
    }
    ElMessage.success('库存操作成功')
    dialogVisible.value = false
    await loadInventory()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '库存操作失败，请稍后重试')
  } finally {
    operationSubmitting.value = false
  }
}

watch(() => [filters.page, filters.pageSize], () => {
  syncQuery()
  loadInventory()
})

onMounted(loadInventory)
</script>

<template>
  <div class="inventory-page">
    <section class="page-header">
      <div>
        <h1 class="page-title">库存管理</h1>
        <p class="page-description">查看 SKU 库存水位，并执行入库和库存调整。</p>
      </div>
      <el-button :icon="Document" @click="goTransactions">库存流水</el-button>
    </section>

    <el-card class="page-card" shadow="never">
      <el-form :model="filters" inline>
        <el-form-item label="关键词"><el-input v-model="filters.keyword" clearable placeholder="商品 / SKU" @keyup.enter="search" /></el-form-item>
        <el-form-item label="库存状态">
          <el-select v-model="filters.stockState" clearable placeholder="全部" style="width: 150px">
            <el-option v-for="[value, label] in stockOptions" :key="value" :label="label" :value="value" />
          </el-select>
        </el-form-item>
        <el-form-item><el-button type="primary" @click="search">查询</el-button><el-button @click="resetFilters">重置</el-button></el-form-item>
      </el-form>
    </el-card>

    <el-card class="page-card" shadow="never" v-loading="loading">
      <el-table :data="pageData.items" row-key="skuId">
        <el-table-column label="商品 / SKU" min-width="280">
          <template #default="{ row }">
            <div class="sku-cell">
              <el-image class="cover" :src="row.coverImageUrl" fit="cover" />
              <div><div class="name">{{ row.productName }}</div><div class="meta">{{ row.skuName }} · {{ row.skuNo }}</div></div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="120"><template #default="{ row }"><el-tag :type="getStockStateTagType(row.stockState)" effect="light">{{ getStockStateLabel(row.stockState) }}</el-tag></template></el-table-column>
        <el-table-column prop="availableStock" label="可用库存" width="110" />
        <el-table-column prop="lockedStock" label="锁定库存" width="110" />
        <el-table-column prop="safetyStock" label="安全库存" width="110" />
        <el-table-column prop="version" label="版本" width="80" />
        <el-table-column label="操作" fixed="right" width="230">
          <template #default="{ row }">
            <div class="operation-group">
              <el-button-group>
                <el-button size="small" type="primary" plain @click="goDetail(row)">详情</el-button>
                <el-button size="small" type="success" plain @click="openDialog(row, 'inbound')">入库</el-button>
                <el-button size="small" type="warning" plain @click="openDialog(row, 'adjustment')">调整</el-button>
              </el-button-group>
            </div>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!loading && pageData.items.length === 0" description="暂无库存记录" />
      <div class="pagination"><el-pagination v-model:current-page="filters.page" v-model:page-size="filters.pageSize" layout="total, sizes, prev, pager, next" :total="pageData.total" /></div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogType === 'inbound' ? '采购入库' : '库存调整'" width="520px">
      <el-form :model="operationForm" label-width="90px">
        <el-form-item label="当前 SKU">{{ currentItem?.skuName }}</el-form-item>
        <el-form-item v-if="dialogType === 'inbound'" label="入库数量"><el-input-number v-model="operationForm.quantity" :min="1" /></el-form-item>
        <el-form-item v-else label="调整数量"><el-input-number v-model="operationForm.delta" /><div class="form-tip">正数为增加库存，负数为减少库存</div></el-form-item>
        <el-form-item v-if="dialogType === 'adjustment'" label="调整后库存"><el-tag :type="adjustmentAfterStock < 0 ? 'danger' : 'success'">{{ adjustmentAfterStock }}</el-tag></el-form-item>
        <el-form-item label="业务单号"><el-input v-model="operationForm.businessNo" /></el-form-item>
        <el-form-item label="调整原因" required><el-input v-model="operationForm.remark" type="textarea" :rows="3" maxlength="500" show-word-limit placeholder="请输入库存调整原因" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="dialogVisible = false">取消</el-button><el-button type="primary" @click="submitOperation">确认</el-button></template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.inventory-page { display: flex; flex-direction: column; gap: 16px; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.page-title { margin: 0; color: #111827; font-size: 20px; font-weight: 600; }
.page-description { margin: 8px 0 0; color: #6b7280; font-size: 13px; }
.page-card { border: 1px solid #e5e7eb; border-radius: 10px; }
.sku-cell { display: flex; align-items: center; gap: 12px; }
.cover { width: 48px; height: 48px; border-radius: 8px; background: #f1f5f9; }
.cover-placeholder { display: grid; place-items: center; color: #9ca3af; font-size: 12px; text-align: center; }
.name { color: #111827; font-weight: 600; }
.meta { margin-top: 4px; color: #6b7280; font-size: 12px; }
.pagination { display: flex; justify-content: flex-end; margin-top: 16px; }
.operation-group { display: flex; justify-content: center; }
.operation-group :deep(.el-button) { min-width: 58px; }
.form-tip { margin-top: 4px; color: #94a3b8; font-size: 12px; line-height: 1.4; }
</style>
