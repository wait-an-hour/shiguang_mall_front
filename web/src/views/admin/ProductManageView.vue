<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import PageHeader from '@/components/common/PageHeader.vue'
import SearchPanel from '@/components/common/SearchPanel.vue'
import StatusTag from '@/components/common/StatusTag.vue'
import AppPagination from '@/components/common/AppPagination.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { approveProductReview, getProductDetail, listProducts, rejectProductReview, setProductStatus } from '@/api/admin/products'
import { listCategories } from '@/api/admin/catalog'
import { getPlatformShops, type PlatformShopView } from '@/api/admin/shops'
import { useAdminFiltersStore } from '@/stores/adminFilters'
import { formatMoney, getProductStatusLabel } from '@/utils/labels'
import type { CategoryRecord, PlatformProduct, ProductStatus } from '@/types/admin'

const key = 'products'
const filterStore = useAdminFiltersStore()
const query = reactive(filterStore.getFilter(key))
const loading = ref(false)
const detailLoading = ref(false)
const total = ref(0)
const rows = ref<PlatformProduct[]>([])
const shopOptions = ref<PlatformShopView[]>([])
const categoryOptions = ref<CategoryRecord[]>([])
const filterOptionsLoading = ref(false)
const detailVisible = ref(false)
const detail = ref<PlatformProduct>()

function flattenCategories(categories: CategoryRecord[]): CategoryRecord[] {
  return categories.flatMap((category) => [category, ...flattenCategories(category.children ?? [])])
}

function statusType(status: ProductStatus) {
  return status === 'ON_SHELF' ? 'success' : status === 'REJECTED' ? 'danger' : status === 'PENDING_REVIEW' ? 'warning' : 'info'
}

function skuStatusLabel(status: string) {
  return status === 'ENABLED' ? '启用' : '停用'
}

function skuStatusType(status: string) {
  return status === 'ENABLED' ? 'success' : 'danger'
}

async function loadData() {
  loading.value = true
  try {
    filterStore.setFilter(key, query)
    const data = await listProducts(query)
    rows.value = data.items
    total.value = data.total
  } finally {
    loading.value = false
  }
}

async function loadFilterOptions() {
  filterOptionsLoading.value = true
  const [shopsResult, categoriesResult] = await Promise.allSettled([
    getPlatformShops({ page: 1, pageSize: 100 }),
    listCategories()
  ])
  if (shopsResult.status === 'fulfilled') shopOptions.value = shopsResult.value.items
  else ElMessage.error('商家选项加载失败')
  if (categoriesResult.status === 'fulfilled') categoryOptions.value = flattenCategories(categoriesResult.value)
  else ElMessage.error('分类选项加载失败')
  filterOptionsLoading.value = false
}

function search() {
  query.page = 1
  void loadData()
}

async function openDetail(row: PlatformProduct) {
  detailVisible.value = true
  detailLoading.value = true
  detail.value = undefined
  try {
    detail.value = await getProductDetail(row.id)
  } finally {
    detailLoading.value = false
  }
}

async function approveReview(row: PlatformProduct) {
  try {
    await ElMessageBox.confirm('确认同意该商品上架申请？', '同意上架', {
      confirmButtonText: '同意上架',
      cancelButtonText: '取消',
      type: 'success'
    })
    // 审核通过必须提交当前内容版本，后端会据此防止审核到旧版本商品内容。
    await approveProductReview(row.id, { contentVersion: row.contentVersion ?? 0, reason: '审核通过' })
    ElMessage.success('已同意上架申请')
    loadData()
  } catch {
    // 用户取消确认时不做任何状态变更，避免误操作。
  }
}

async function rejectReview(row: PlatformProduct) {
  try {
    const { value } = await ElMessageBox.prompt('请输入驳回原因', '驳回申请', {
      confirmButtonText: '驳回申请',
      cancelButtonText: '取消',
      inputType: 'textarea',
      inputPlaceholder: '请填写驳回原因',
      inputValidator: (value) => Boolean(value.trim()) || '请填写驳回原因'
    })
    // 驳回原因是后端必填字段，前端先 trim 后提交，减少无效请求。
    await rejectProductReview(row.id, { contentVersion: row.contentVersion ?? 0, reason: value.trim() })
    ElMessage.success('已驳回上架申请')
    loadData()
  } catch {
    // 用户取消输入时不提交驳回请求。
  }
}

async function govern(row: PlatformProduct, status: Exclude<ProductStatus, 'DRAFT' | 'PENDING_REVIEW' | 'REJECTED'>, title: string) {
  try {
    const { value } = await ElMessageBox.prompt('请输入治理原因', title, {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputType: 'textarea',
      inputPlaceholder: '请填写原因'
    })
    await setProductStatus(row.id, status, value, row.contentVersion)
    ElMessage.success(`${title}成功`)
    loadData()
  } catch {
    // 用户取消
  }
}

onMounted(() => {
  void loadData()
  void loadFilterOptions()
})
</script>

<template>
  <div class="page-view">
    <PageHeader title="商品管理" description="查看全平台商品总列表，并对违规或高风险商品执行强制下架和驳回。" />

    <SearchPanel>
      <el-form>
        <el-form-item label="关键词">
          <el-input v-model="query.keyword" placeholder="商品名称/SPU 编号" clearable />
        </el-form-item>
        <el-form-item label="商家">
          <el-select v-model="query.shopId" filterable clearable :loading="filterOptionsLoading" placeholder="请选择商家">
            <el-option v-for="shop in shopOptions" :key="shop.shop.id" :label="`${shop.shop.shopName}（${shop.shop.shopNo}）`" :value="shop.shop.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="query.categoryId" filterable clearable :loading="filterOptionsLoading" placeholder="请选择分类">
            <el-option v-for="category in categoryOptions" :key="category.id" :label="category.name" :value="category.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" clearable>
            <el-option label="待审核" value="PENDING_REVIEW" />
            <el-option label="上架中" value="ON_SHELF" />
            <el-option label="已下架" value="OFF_SHELF" />
            <el-option label="已驳回" value="REJECTED" />
          </el-select>
        </el-form-item>
        <el-button type="primary" @click="search">查询</el-button>
      </el-form>
    </SearchPanel>

    <el-card class="sg-card" shadow="never" v-loading="loading">
      <el-table v-if="rows.length" :data="rows" row-key="id">
        <el-table-column label="商品" min-width="300">
          <template #default="{ row }">
            <div class="product-cell">
              <el-image class="product-cover" :src="row.coverImageUrl || ''" fit="cover">
                <template #error><div class="cover-placeholder">暂无图</div></template>
              </el-image>
              <div class="product-info">
                <div class="product-name">{{ row.name }}</div>
                <div class="product-meta">{{ row.spuNo || '-' }} · {{ row.categoryName }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="shopName" label="商家" min-width="140" />
        <el-table-column prop="brandName" label="品牌" width="110" />
        <el-table-column label="最低售价" width="110">
          <template #default="{ row }">{{ formatMoney(row.price) }}</template>
        </el-table-column>
        <el-table-column label="SKU" width="90">
          <template #default="{ row }">{{ row.skuCount ?? '-' }}</template>
        </el-table-column>
        <el-table-column label="可用库存" width="110">
          <template #default="{ row }">{{ row.totalAvailableStock ?? '-' }}</template>
        </el-table-column>
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <StatusTag :label="getProductStatusLabel(row.status)" :type="statusType(row.status)" />
          </template>
        </el-table-column>
        <el-table-column prop="updatedAt" label="更新时间" min-width="190" />
        <el-table-column label="操作" fixed="right" width="230">
          <template #default="{ row }">
            <div class="table-actions">
              <el-button link type="primary" @click="openDetail(row)">查看</el-button>
              <el-button v-if="row.status === 'PENDING_REVIEW'" link type="success" @click="approveReview(row)">同意上架</el-button>
              <el-button v-if="row.status === 'PENDING_REVIEW'" link type="danger" @click="rejectReview(row)">驳回申请</el-button>
              <el-button v-if="row.status === 'ON_SHELF'" link type="warning" @click="govern(row, 'OFF_SHELF', '强制下架')">强制下架</el-button>
              <el-button v-if="row.status === 'ON_SHELF' || row.status === 'OFF_SHELF'" link type="danger" @click="govern(row, 'BANNED', '禁售')">禁售</el-button>
              <el-button v-if="row.status === 'BANNED'" link type="success" @click="govern(row, 'ON_SHELF', '解禁')">解禁</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
      <EmptyState v-else description="暂无商品，请调整筛选条件" />
      <AppPagination :page="query.page!" :page-size="query.pageSize!" :total="total" @change="Object.assign(query, $event); loadData()" />
    </el-card>

    <el-dialog v-model="detailVisible" title="商品详情" width="860px">
      <div v-loading="detailLoading">
        <template v-if="detail">
          <div class="detail-summary">
            <el-image class="detail-cover" :src="detail.coverImageUrl || ''" fit="cover">
              <template #error><div class="cover-placeholder">暂无图</div></template>
            </el-image>
            <div>
              <div class="detail-title">{{ detail.name }}</div>
              <div class="detail-meta">{{ detail.spuNo }} · {{ detail.shopName }} · {{ detail.categoryName }} · {{ detail.brandName }}</div>
              <div class="detail-meta">内容版本 {{ detail.contentVersion }} · 更新时间 {{ detail.updatedAt || '-' }}</div>
            </div>
            <StatusTag :label="getProductStatusLabel(detail.status)" :type="statusType(detail.status)" />
          </div>

          <el-table class="sku-table" :data="detail.skus || []" row-key="id">
            <el-table-column label="SKU" min-width="260">
              <template #default="{ row }">
                <div class="product-cell">
                  <el-image class="sku-cover" :src="row.imageUrl || detail?.coverImageUrl || ''" fit="cover">
                    <template #error><div class="cover-placeholder">暂无图</div></template>
                  </el-image>
                  <div class="product-info">
                    <div class="product-name">{{ row.skuName }}</div>
                    <div class="product-meta">{{ row.skuNo }}</div>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="售价" width="100"><template #default="{ row }">{{ formatMoney(row.salePrice) }}</template></el-table-column>
            <el-table-column label="划线价" width="100"><template #default="{ row }">{{ formatMoney(row.marketPrice) }}</template></el-table-column>
            <el-table-column prop="barcode" label="条码" min-width="140" />
            <el-table-column label="状态" width="100"><template #default="{ row }"><StatusTag :label="skuStatusLabel(row.status)" :type="skuStatusType(row.status)" /></template></el-table-column>
            <el-table-column prop="updatedAt" label="更新时间" min-width="180" />
          </el-table>
        </template>
      </div>
    </el-dialog>

  </div>
</template>

<style scoped lang="scss">
.product-cell {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.product-cover,
.sku-cover {
  width: 48px;
  height: 48px;
  flex: 0 0 auto;
  border-radius: 8px;
  background: #f1f5f9;
}

.detail-cover {
  width: 76px;
  height: 76px;
  flex: 0 0 auto;
  border-radius: 10px;
  background: #f1f5f9;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  color: #9ca3af;
  font-size: 12px;
}

.product-info {
  min-width: 0;
  text-align: left;
}

.product-name,
.detail-title {
  color: #111827;
  font-weight: 600;
}

.product-meta,
.detail-meta {
  margin-top: 4px;
  color: #6b7280;
  font-size: 12px;
}

.detail-summary {
  display: grid;
  grid-template-columns: 76px minmax(0, 1fr) auto;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.sku-table {
  margin-top: 8px;
}
</style>
