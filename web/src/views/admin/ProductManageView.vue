<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import PageHeader from '@/components/common/PageHeader.vue'
import SearchPanel from '@/components/common/SearchPanel.vue'
import StatusTag from '@/components/common/StatusTag.vue'
import AppPagination from '@/components/common/AppPagination.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { getProductDetail, listProducts, setProductStatus } from '@/api/admin/products'
import { useAdminFiltersStore } from '@/stores/adminFilters'
import { formatMoney, getProductStatusLabel } from '@/utils/labels'
import type { PlatformProduct, ProductStatus } from '@/types/admin'

const key = 'products'
const filterStore = useAdminFiltersStore()
const query = reactive(filterStore.getFilter(key))
const loading = ref(false)
const detailLoading = ref(false)
const total = ref(0)
const rows = ref<PlatformProduct[]>([])
const detailVisible = ref(false)
const detail = ref<PlatformProduct>()

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

onMounted(loadData)
</script>

<template>
  <div class="page-view">
    <PageHeader title="商品管理" description="查看全平台商品总列表，并对违规或高风险商品执行强制下架和驳回。" />

    <SearchPanel>
      <el-form>
        <el-form-item label="关键词">
          <el-input v-model="query.keyword" placeholder="商品/商家/分类" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" clearable>
            <el-option label="待审核" value="PENDING_REVIEW" />
            <el-option label="上架中" value="ON_SHELF" />
            <el-option label="已下架" value="OFF_SHELF" />
            <el-option label="已驳回" value="REJECTED" />
          </el-select>
        </el-form-item>
        <el-button type="primary" @click="loadData">查询</el-button>
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
        <el-table-column label="操作" fixed="right" width="280">
          <template #default="{ row }">
            <div class="table-actions">
              <el-button link type="primary" @click="openDetail(row)">查看</el-button>
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
