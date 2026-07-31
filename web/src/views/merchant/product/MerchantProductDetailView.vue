<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getMerchantProductDetail,
  putMerchantProductOnShelf,
  submitMerchantProductReview,
  takeMerchantProductOffShelf,
  updateMerchantSku
} from '../../../api/merchant/products'
import { PRODUCT_STATUS_LABELS, PRODUCT_STATUS_TAG_TYPES, SKU_STATUS_LABELS, SKU_STATUS_TAG_TYPES } from '../../../constants/merchant'
import { ROUTE_NAME } from '../../../constants/routes'
import type { EnabledStatus, ShopProductDetailView, ShopSkuView } from '../../../types/merchant'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const savingSku = ref(false)
const skuDialogVisible = ref(false)
const product = ref<ShopProductDetailView | null>(null)
const shopId = computed(() => String(route.params.shopId))
const spuId = computed(() => String(route.params.spuId))
const skuForm = reactive({ id: '', salePrice: '', marketPrice: '', barcode: '', status: 'ENABLED' as EnabledStatus, version: 1 })

function getSkuStatusLabel(status: EnabledStatus) {
  return SKU_STATUS_LABELS[status]
}

function getSkuStatusTagType(status: EnabledStatus) {
  return SKU_STATUS_TAG_TYPES[status]
}

async function loadDetail() {
  loading.value = true
  try {
    product.value = await getMerchantProductDetail(shopId.value, spuId.value)
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.push({ name: ROUTE_NAME.MerchantProductList, params: { shopId: shopId.value } })
}

function goEdit() {
  router.push({ name: ROUTE_NAME.MerchantProductEdit, params: { shopId: shopId.value, spuId: spuId.value } })
}

async function confirmAction(action: 'review' | 'on' | 'off') {
  if (!product.value) return
  const text = action === 'review' ? '提交审核' : action === 'on' ? '上架' : '下架'
  await ElMessageBox.confirm(`确认${text}商品「${product.value.productName}」吗？`, '操作确认', { type: 'warning' })
  if (action === 'review') await submitMerchantProductReview(shopId.value, spuId.value)
  if (action === 'on') await putMerchantProductOnShelf(shopId.value, spuId.value)
  if (action === 'off') await takeMerchantProductOffShelf(shopId.value, spuId.value)
  ElMessage.success(`${text}成功`)
  await loadDetail()
}

function openSkuDialog(sku: ShopSkuView) {
  skuForm.id = sku.id
  skuForm.salePrice = sku.salePrice
  skuForm.marketPrice = sku.marketPrice
  skuForm.barcode = sku.barcode
  skuForm.status = sku.status
  skuForm.version = sku.version
  skuDialogVisible.value = true
}

async function saveSku() {
  savingSku.value = true
  try {
    await updateMerchantSku(shopId.value, spuId.value, skuForm.id, {
      salePrice: skuForm.salePrice,
      marketPrice: skuForm.marketPrice,
      barcode: skuForm.barcode,
      status: skuForm.status,
      version: skuForm.version
    })
    ElMessage.success('SKU 已更新')
    skuDialogVisible.value = false
    await loadDetail()
  } finally {
    savingSku.value = false
  }
}

onMounted(loadDetail)
</script>

<template>
  <div class="detail-page">
    <section class="page-header">
      <div>
        <h1 class="page-title">商品详情</h1>
        <p class="page-description">查看商品内容、SKU 与状态流转记录。</p>
      </div>
      <div class="page-actions">
        <el-button @click="goBack">返回列表</el-button>
        <el-button @click="goEdit">编辑</el-button>
        <el-button v-if="product && ['DRAFT', 'REJECTED', 'OFF_SHELF'].includes(product.status)" type="primary" @click="confirmAction('review')">提交审核</el-button>
        <el-button v-if="product?.status === 'OFF_SHELF'" type="success" @click="confirmAction('on')">上架</el-button>
        <el-button v-if="product?.status === 'ON_SHELF'" type="warning" @click="confirmAction('off')">下架</el-button>
      </div>
    </section>

    <template v-if="product">
      <el-card class="page-card" shadow="never" v-loading="loading">
        <div class="summary">
          <el-image class="cover" :src="product.coverImageUrl" fit="cover" />
          <div>
            <div class="summary-title">{{ product.productName }}</div>
            <div class="summary-meta">{{ product.spuNo }} · {{ product.category.name }} · 内容版本 {{ product.contentVersion }}</div>
            <p class="summary-desc">{{ product.subtitle }}</p>
          </div>
          <el-tag :type="PRODUCT_STATUS_TAG_TYPES[product.status]" effect="light">{{ PRODUCT_STATUS_LABELS[product.status] }}</el-tag>
        </div>
      </el-card>

      <el-card class="page-card" shadow="never">
        <template #header><div class="card-header">SKU 列表</div></template>
        <el-table :data="product.skus" row-key="id">
          <el-table-column prop="skuNo" label="SKU 编号" min-width="150" />
          <el-table-column prop="skuName" label="SKU 名称" min-width="150" />
          <el-table-column prop="salePrice" label="售价" width="110" />
          <el-table-column prop="marketPrice" label="划线价" width="110" />
          <el-table-column label="状态" width="100"><template #default="{ row }"><el-tag :type="getSkuStatusTagType(row.status)" effect="light">{{ getSkuStatusLabel(row.status) }}</el-tag></template></el-table-column>
          <el-table-column label="库存" width="140"><template #default="{ row }">可用 {{ row.stock.availableStock }} / 锁定 {{ row.stock.lockedStock }}</template></el-table-column>
          <el-table-column label="操作" width="100"><template #default="{ row }"><el-button text type="primary" @click="openSkuDialog(row)">更新</el-button></template></el-table-column>
        </el-table>
      </el-card>

      <el-card class="page-card" shadow="never">
        <template #header><div class="card-header">状态历史</div></template>
        <el-timeline>
          <el-timeline-item v-for="history in product.statusHistories" :key="history.id" :timestamp="history.createdAt">
            {{ PRODUCT_STATUS_LABELS[history.status] }} · {{ history.operatorName }} · {{ history.remark }}
          </el-timeline-item>
        </el-timeline>
      </el-card>
    </template>

    <el-dialog v-model="skuDialogVisible" title="更新 SKU" width="520px">
      <el-form :model="skuForm" label-width="90px">
        <el-form-item label="售价"><el-input v-model="skuForm.salePrice" /></el-form-item>
        <el-form-item label="划线价"><el-input v-model="skuForm.marketPrice" /></el-form-item>
        <el-form-item label="条码"><el-input v-model="skuForm.barcode" /></el-form-item>
        <el-form-item label="状态">
          <el-select v-model="skuForm.status">
            <el-option label="启用" value="ENABLED" />
            <el-option label="停用" value="DISABLED" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="skuDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="savingSku" @click="saveSku">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.detail-page { display: flex; flex-direction: column; gap: 16px; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.page-title { margin: 0; color: #111827; font-size: 20px; font-weight: 600; }
.page-description, .summary-meta, .summary-desc { margin: 8px 0 0; color: #6b7280; font-size: 13px; }
.page-actions { display: flex; gap: 8px; }
.page-card { border: 1px solid #e5e7eb; border-radius: 10px; }
.summary { display: grid; grid-template-columns: 88px 1fr auto; align-items: center; gap: 16px; }
.cover { width: 88px; height: 88px; border-radius: 10px; background: #f1f5f9; }
.summary-title, .card-header { color: #111827; font-size: 16px; font-weight: 600; }
</style>
