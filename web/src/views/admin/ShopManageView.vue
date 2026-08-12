<script setup lang="ts">
import { onMounted, reactive, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import PageHeader from '@/components/common/PageHeader.vue'
import SearchPanel from '@/components/common/SearchPanel.vue'
import AppPagination from '@/components/common/AppPagination.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import StatusTag from '@/components/common/StatusTag.vue'
import { getPlatformShops } from '@/api/admin/shops'
import { ROUTE_NAME } from '@/constants/routes'
import type { PlatformShopQuery, PlatformShopSort, PlatformShopView, ShopStatus } from '@/types/admin'
import { SHOP_STATUS_LABEL, SHOP_STATUS_TYPE } from '@/utils/labels'

const router = useRouter()
const query = reactive<Required<PlatformShopQuery>>({ keyword: '', status: '', page: 1, pageSize: 10, sort: 'createdAt,desc' })
const rows = shallowRef<PlatformShopView[]>([])
const total = shallowRef(0)
const loading = shallowRef(false)
const errorMessage = shallowRef('')

const sortOptions: Array<{ label: string; value: PlatformShopSort }> = [
  { label: '创建时间倒序', value: 'createdAt,desc' },
  { label: '更新时间倒序', value: 'updatedAt,desc' },
  { label: '店铺名称升序', value: 'shopName,asc' },
  { label: '状态升序', value: 'status,asc' }
]

async function loadData() {
  loading.value = true
  errorMessage.value = ''
  try {
    const data = await getPlatformShops(query)
    rows.value = data.items
    total.value = data.total
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '店铺列表加载失败'
    ElMessage.error(errorMessage.value)
  } finally {
    loading.value = false
  }
}

function search() {
  query.page = 1
  void loadData()
}

function shopStatusLabel(status: ShopStatus) { return SHOP_STATUS_LABEL[status] }
function shopStatusType(status: ShopStatus) { return SHOP_STATUS_TYPE[status] }

function navigate(name: string, params?: Record<string, string>) {
  void router.push({ name, params })
}

onMounted(loadData)
</script>

<template>
  <div class="page-view">
    <PageHeader title="店铺管理" description="筛选平台店铺并进入独立详情页面维护资料、状态与成员。">
      <template #actions>
        <el-button type="primary" @click="navigate(ROUTE_NAME.AdminShopCreate)">创建店铺</el-button>
      </template>
    </PageHeader>

    <SearchPanel>
      <el-form inline @submit.prevent="search">
        <el-form-item label="关键词"><el-input v-model="query.keyword" clearable placeholder="店铺名称/店铺号" /></el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" clearable placeholder="全部状态" class="filter-select">
            <el-option v-for="(label, value) in SHOP_STATUS_LABEL" :key="value" :label="label" :value="value" />
          </el-select>
        </el-form-item>
        <el-form-item label="排序">
          <el-select v-model="query.sort" class="sort-select">
            <el-option v-for="option in sortOptions" :key="option.value" :label="option.label" :value="option.value" />
          </el-select>
        </el-form-item>
        <el-button type="primary" @click="search">查询</el-button>
      </el-form>
    </SearchPanel>

    <el-card class="sg-card" shadow="never" v-loading="loading">
      <el-result v-if="errorMessage && !loading" icon="error" title="店铺列表加载失败" :sub-title="errorMessage">
        <template #extra><el-button type="primary" @click="loadData">重试</el-button></template>
      </el-result>
      <template v-else>
        <el-table v-if="rows.length" :data="rows" @row-click="navigate(ROUTE_NAME.AdminShopDetail, { shopId: $event.shop.id })">
          <el-table-column label="店铺" min-width="220">
            <template #default="{ row }"><div class="shop-name">{{ row.shop.shopName }}</div><div class="shop-meta">{{ row.shop.shopNo }}</div></template>
          </el-table-column>
          <el-table-column prop="contactName" label="联系人" min-width="120" />
          <el-table-column prop="contactPhone" label="联系电话" min-width="140" />
          <el-table-column label="成员" width="130"><template #default="{ row }">{{ row.activeMembersCount }} / {{ row.membersCount }} 正常</template></el-table-column>
          <el-table-column label="状态" width="110"><template #default="{ row }"><StatusTag :label="shopStatusLabel(row.shop.status)" :type="shopStatusType(row.shop.status)" /></template></el-table-column>
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click.stop="navigate(ROUTE_NAME.AdminShopDetail, { shopId: row.shop.id })">详情</el-button>
              <el-button link type="primary" @click.stop="navigate(ROUTE_NAME.AdminShopEdit, { shopId: row.shop.id })">编辑</el-button>
            </template>
          </el-table-column>
        </el-table>
        <EmptyState v-else description="暂无符合条件的店铺" />
        <AppPagination :page="query.page" :page-size="query.pageSize" :total="total" @change="Object.assign(query, $event); loadData()" />
      </template>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.shop-name { font-weight: 600; }
.shop-meta { margin-top: 4px; color: var(--sg-text-muted); font-size: 12px; }
.filter-select { width: 150px; }
.sort-select { width: 180px; }
:deep(.el-table__row) { cursor: pointer; }
</style>
