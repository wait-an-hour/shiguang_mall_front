<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import PageHeader from '@/components/common/PageHeader.vue'
import SearchPanel from '@/components/common/SearchPanel.vue'
import StatusTag from '@/components/common/StatusTag.vue'
import AppPagination from '@/components/common/AppPagination.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ConfirmActionButton from '@/components/common/ConfirmActionButton.vue'
import { approveProductReview, banProduct, listProductReviews, rejectProductReview, takeOffShelfProduct } from '@/api/admin/products'
import { useAdminFiltersStore } from '@/stores/adminFilters'
import { formatMoney, getProductStatusLabel } from '@/utils/labels'
import type { PlatformProduct, ProductStatus } from '@/types/admin'

const key = 'products'
const filterStore = useAdminFiltersStore()
const query = reactive(filterStore.getFilter(key))
const loading = ref(false)
const total = ref(0)
const rows = ref<PlatformProduct[]>([])
const rejectVisible = ref(false)
const current = ref<PlatformProduct>()
const reason = ref('')

function statusType(status: ProductStatus) {
  return status === 'ON_SHELF' ? 'success' : status === 'REJECTED' || status === 'BANNED' ? 'danger' : status === 'PENDING_REVIEW' ? 'warning' : 'info'
}

async function loadData() {
  loading.value = true
  filterStore.setFilter(key, query)
  const data = await listProductReviews(query)
  rows.value = data.items
  total.value = data.total
  loading.value = false
}

async function approve(row: PlatformProduct) {
  await approveProductReview(row.id)
  ElMessage.success('商品审核已通过')
  loadData()
}

async function offShelf(row: PlatformProduct) {
  await takeOffShelfProduct(row.id, '平台强制下架')
  ElMessage.success('商品已强制下架')
  loadData()
}

async function ban(row: PlatformProduct) {
  await banProduct(row.id, '商品图片包含违规内容')
  ElMessage.success('商品已禁售')
  loadData()
}

function openReject(row: PlatformProduct) {
  current.value = row
  reason.value = row.reason ?? ''
  rejectVisible.value = true
}

async function submitReject() {
  if (!current.value) return
  await rejectProductReview(current.value.id, reason.value)
  ElMessage.success('商品审核已驳回')
  rejectVisible.value = false
  loadData()
}

onMounted(loadData)
</script>

<template>
  <div class="page-view">
    <PageHeader title="商品审核" description="对齐平台商品审核与治理接口，支持审核通过、审核驳回、强制下架和禁售处理。" />
    <SearchPanel>
      <el-form>
        <el-form-item label="关键词"><el-input v-model="query.keyword" placeholder="商品/商家/分类" clearable /></el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" clearable>
            <el-option label="待审核" value="PENDING_REVIEW" />
            <el-option label="上架中" value="ON_SHELF" />
            <el-option label="已下架" value="OFF_SHELF" />
            <el-option label="已驳回" value="REJECTED" />
            <el-option label="已禁售" value="BANNED" />
          </el-select>
        </el-form-item>
        <el-button type="primary" @click="loadData">查询</el-button>
      </el-form>
    </SearchPanel>
    <el-card class="sg-card" shadow="never" v-loading="loading">
      <el-table v-if="rows.length" :data="rows">
        <el-table-column prop="name" label="商品" min-width="180" />
        <el-table-column prop="shopName" label="商家" />
        <el-table-column prop="categoryName" label="分类" />
        <el-table-column prop="brandName" label="品牌" />
        <el-table-column label="价格"><template #default="{ row }">{{ formatMoney(row.price) }}</template></el-table-column>
        <el-table-column label="状态"><template #default="{ row }"><StatusTag :label="getProductStatusLabel(row.status)" :type="statusType(row.status)" /></template></el-table-column>
        <el-table-column label="操作" width="260">
          <template #default="{ row }">
            <div class="table-actions">
              <ConfirmActionButton v-if="row.status === 'PENDING_REVIEW'" text="通过" confirm-text="确认通过该商品审核？" @confirm="approve(row)" />
              <el-button v-if="row.status === 'PENDING_REVIEW'" link type="danger" @click="openReject(row)">驳回</el-button>
              <ConfirmActionButton v-if="row.status === 'ON_SHELF'" text="下架" type="warning" confirm-text="确认强制下架该商品？" @confirm="offShelf(row)" />
              <ConfirmActionButton v-if="row.status === 'ON_SHELF' || row.status === 'OFF_SHELF'" text="禁售" type="danger" confirm-text="确认禁售该商品？" @confirm="ban(row)" />
            </div>
          </template>
        </el-table-column>
      </el-table>
      <EmptyState v-else description="暂无商品，请调整筛选条件" />
      <AppPagination :page="query.page!" :page-size="query.pageSize!" :total="total" @change="Object.assign(query, $event); loadData()" />
    </el-card>
    <el-dialog v-model="rejectVisible" title="审核驳回原因">
      <el-input v-model="reason" type="textarea" :rows="4" placeholder="请填写平台驳回原因，便于商家整改" />
      <template #footer><el-button @click="rejectVisible = false">取消</el-button><el-button type="primary" @click="submitReject">保存审核记录</el-button></template>
    </el-dialog>
  </div>
</template>
