<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import {
  getMerchantProducts,
  putMerchantProductOnShelf,
  submitMerchantProductReview,
  takeMerchantProductOffShelf
} from '../../../api/merchant/products'
import { PRODUCT_STATUS_LABELS, PRODUCT_STATUS_TAG_TYPES } from '../../../constants/merchant'
import { ROUTE_NAME } from '../../../constants/routes'
import type { PageView } from '../../../types/common'
import type { ProductStatus, ShopProductSummaryView } from '../../../types/merchant'

const route = useRoute()
const router = useRouter()
const shopId = computed(() => String(route.params.shopId))
const loading = ref(false)
const pageData = ref<PageView<ShopProductSummaryView>>({ items: [], page: 1, pageSize: 10, total: 0, totalPages: 1 })

const filters = reactive({
  keyword: String(route.query.keyword ?? ''),
  status: String(route.query.status ?? '') as ProductStatus | '',
  categoryId: String(route.query.categoryId ?? ''),
  sort: String(route.query.sort ?? 'created_desc') as 'created_desc' | 'updated_desc' | 'stock_asc',
  page: Number(route.query.page ?? 1),
  pageSize: Number(route.query.pageSize ?? 10)
})

const statusOptions = computed(() => Object.entries(PRODUCT_STATUS_LABELS) as Array<[ProductStatus, string]>)

function getProductStatusLabel(status: ProductStatus) {
  return PRODUCT_STATUS_LABELS[status]
}

function getProductStatusTagType(status: ProductStatus) {
  return PRODUCT_STATUS_TAG_TYPES[status]
}

async function loadProducts() {
  loading.value = true
  try {
    pageData.value = await getMerchantProducts(shopId.value, filters)
  } finally {
    loading.value = false
  }
}

function syncQuery() {
  router.replace({
    name: ROUTE_NAME.MerchantProductList,
    params: { shopId: shopId.value },
    query: {
      keyword: filters.keyword || undefined,
      status: filters.status || undefined,
      categoryId: filters.categoryId || undefined,
      sort: filters.sort,
      page: String(filters.page),
      pageSize: String(filters.pageSize)
    }
  })
}

function search() {
  filters.page = 1
  syncQuery()
  loadProducts()
}

function resetFilters() {
  filters.keyword = ''
  filters.status = ''
  filters.categoryId = ''
  filters.sort = 'created_desc'
  search()
}

function goCreate() {
  router.push({ name: ROUTE_NAME.MerchantProductCreate, params: { shopId: shopId.value } })
}

function goDetail(row: ShopProductSummaryView) {
  router.push({ name: ROUTE_NAME.MerchantProductDetail, params: { shopId: shopId.value, spuId: row.id } })
}

function goEdit(row: ShopProductSummaryView) {
  router.push({ name: ROUTE_NAME.MerchantProductEdit, params: { shopId: shopId.value, spuId: row.id } })
}

async function confirmAction(row: ShopProductSummaryView, action: 'review' | 'on' | 'off') {
  const text = action === 'review' ? '提交审核' : action === 'on' ? '上架' : '下架'
  await ElMessageBox.confirm(`确认${text}商品「${row.productName}」吗？`, '操作确认', { type: 'warning' })
  if (action === 'review') await submitMerchantProductReview(shopId.value, row.id)
  if (action === 'on') await putMerchantProductOnShelf(shopId.value, row.id)
  if (action === 'off') await takeMerchantProductOffShelf(shopId.value, row.id)
  ElMessage.success(`${text}成功`)
  await loadProducts()
}

watch(() => [filters.page, filters.pageSize], () => {
  syncQuery()
  loadProducts()
})

onMounted(loadProducts)
</script>

<template>
  <div class="product-page">
    <section class="page-header">
      <div>
        <h1 class="page-title">商品管理</h1>
        <p class="page-description">维护店铺商品资料、SKU 与上下架状态。</p>
      </div>
      <el-button type="primary" :icon="Plus" @click="goCreate">新建商品</el-button>
    </section>

    <el-card class="page-card" shadow="never">
      <el-form :model="filters" inline>
        <el-form-item label="关键词">
          <el-input v-model="filters.keyword" clearable placeholder="商品名称 / SPU 编号" @keyup.enter="search" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" clearable placeholder="全部状态" style="width: 150px">
            <el-option v-for="[value, label] in statusOptions" :key="value" :label="label" :value="value" />
          </el-select>
        </el-form-item>
        <el-form-item label="类目 ID">
          <el-input v-model="filters.categoryId" clearable placeholder="CAT1001" style="width: 140px" />
        </el-form-item>
        <el-form-item label="排序">
          <el-select v-model="filters.sort" style="width: 150px">
            <el-option label="创建时间倒序" value="created_desc" />
            <el-option label="更新时间倒序" value="updated_desc" />
            <el-option label="库存从低到高" value="stock_asc" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="search">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="page-card" shadow="never" v-loading="loading">
      <el-table :data="pageData.items" row-key="id">
        <el-table-column label="商品" min-width="280">
          <template #default="{ row }">
            <div class="product-cell">
              <el-image class="cover" :src="row.coverImageUrl" fit="cover" />
              <div>
                <div class="name">{{ row.productName }}</div>
                <div class="meta">{{ row.spuNo }} · {{ row.category.name }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="getProductStatusTagType(row.status)" effect="light">{{ getProductStatusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="minSalePrice" label="最低售价" width="120" />
        <el-table-column prop="skuCount" label="SKU" width="80" />
        <el-table-column prop="totalAvailableStock" label="可用库存" width="110" />
        <el-table-column prop="updatedAt" label="更新时间" width="210" />
        <el-table-column class-name="product-operation-column" label="操作" fixed="right" width="300">
          <template #default="{ row }">
            <el-button text type="primary" @click="goDetail(row)">查看</el-button>
            <el-button text type="primary" @click="goEdit(row)">编辑</el-button>
            <el-button v-if="['DRAFT', 'REJECTED', 'OFF_SHELF'].includes(row.status)" text type="primary" @click="confirmAction(row, 'review')">提交审核</el-button>
            <el-button v-if="row.status === 'OFF_SHELF'" text type="success" @click="confirmAction(row, 'on')">上架</el-button>
            <el-button v-if="row.status === 'ON_SHELF'" text type="warning" @click="confirmAction(row, 'off')">下架</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!loading && pageData.items.length === 0" description="暂无商品，请调整筛选条件" />
      <div class="pagination">
        <el-pagination v-model:current-page="filters.page" v-model:page-size="filters.pageSize" layout="total, sizes, prev, pager, next" :total="pageData.total" />
      </div>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.product-page { display: flex; flex-direction: column; gap: 16px; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.page-title { margin: 0; color: #111827; font-size: 20px; font-weight: 600; }
.page-description { margin: 8px 0 0; color: #6b7280; font-size: 13px; }
.page-card { border: 1px solid #e5e7eb; border-radius: 10px; }
.product-cell { display: flex; align-items: center; gap: 12px; }
.cover { width: 48px; height: 48px; border-radius: 8px; background: #f1f5f9; }
.cover-placeholder { display: grid; place-items: center; color: #9ca3af; font-size: 12px; text-align: center; }
.name { color: #111827; font-weight: 600; }
.meta { margin-top: 4px; color: #6b7280; font-size: 12px; }
.product-actions { display: flex; flex-wrap: nowrap; align-items: center; gap: 4px; min-height: 32px; white-space: nowrap; }
:deep(.product-operation-column .cell) { display: flex; flex-wrap: nowrap; align-items: center; white-space: nowrap; }
:deep(.product-operation-column .el-button) { margin-left: 4px; }
:deep(.product-operation-column .el-button:first-child) { margin-left: 0; }
.pagination { display: flex; justify-content: flex-end; margin-top: 16px; }
</style>
