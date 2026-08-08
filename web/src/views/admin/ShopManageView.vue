<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import PageHeader from '@/components/common/PageHeader.vue'
import SearchPanel from '@/components/common/SearchPanel.vue'
import AppPagination from '@/components/common/AppPagination.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import StatusTag from '@/components/common/StatusTag.vue'
import {
  createPlatformShop,
  getPlatformShops,
  setPlatformShopStatus,
  updatePlatformShop,
  type PlatformShopView,
  type UpdateShopRequest
} from '@/api/admin/shops'
import type { ShopStatus } from '@/types/merchant'

interface ShopForm {
  id: string
  shopName: string
  logoUrl: string
  description: string
  contactName: string
  contactPhone: string
  adminUsername: string
}

const SHOP_STATUS_LABEL: Record<ShopStatus, string> = {
  PENDING: '待开通',
  ACTIVE: '营业中',
  SUSPENDED: '已停业',
  CLOSED: '已关闭'
}

const SHOP_STATUS_TYPE: Record<ShopStatus, 'success' | 'warning' | 'danger' | 'info'> = {
  PENDING: 'warning',
  ACTIVE: 'success',
  SUSPENDED: 'danger',
  CLOSED: 'info'
}

const query = reactive({ keyword: '', status: '' as ShopStatus | '', page: 1, pageSize: 10 })
const rows = ref<PlatformShopView[]>([])
const total = ref(0)
const loading = ref(false)
const dialogVisible = ref(false)
const formRef = ref<FormInstance>()

const form = reactive<ShopForm>({
  id: '',
  shopName: '',
  logoUrl: '',
  description: '',
  contactName: '',
  contactPhone: '',
  adminUsername: ''
})

const rules: FormRules<ShopForm> = {
  shopName: [{ required: true, message: '请输入店铺名称', trigger: 'blur' }],
  adminUsername: [{ required: true, message: '请输入商家注册账号', trigger: 'blur' }]
}

async function loadData() {
  loading.value = true
  try {
    const data = await getPlatformShops(query)
    rows.value = data.items
    total.value = data.total
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '店铺列表加载失败')
  } finally {
    loading.value = false
  }
}

function resetForm() {
  Object.assign(form, {
    id: '',
    shopName: '',
    logoUrl: '',
    description: '',
    contactName: '',
    contactPhone: '',
    adminUsername: ''
  })
}

function openCreate() {
  resetForm()
  dialogVisible.value = true
}

function openEdit(row: PlatformShopView) {
  Object.assign(form, {
    id: row.shop.id,
    shopName: row.shop.shopName,
    logoUrl: row.shop.logoUrl || '',
    description: row.description || '',
    contactName: row.contactName || '',
    contactPhone: row.contactPhone || '',
    adminUsername: ''
  })
  dialogVisible.value = true
}

function toOptional(value: string) {
  return value.trim() || undefined
}

async function submit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  const payload: UpdateShopRequest = {
    shopName: form.shopName.trim(),
    logoUrl: toOptional(form.logoUrl),
    description: toOptional(form.description),
    contactName: toOptional(form.contactName),
    contactPhone: toOptional(form.contactPhone)
  }

  if (form.id) {
    await updatePlatformShop(form.id, payload)
    ElMessage.success('店铺信息已更新')
  } else {
    await createPlatformShop({ ...payload, adminUsername: form.adminUsername.trim() })
    ElMessage.success('店铺已创建，商家账号已绑定为店铺管理员')
  }

  dialogVisible.value = false
  loadData()
}

function getShopStatusLabel(status: ShopStatus) {
  return SHOP_STATUS_LABEL[status]
}

function getShopStatusType(status: ShopStatus) {
  return SHOP_STATUS_TYPE[status]
}

async function changeStatus(row: PlatformShopView, targetStatus: ShopStatus) {
  await setPlatformShopStatus(row.shop.id, targetStatus, '平台管理端操作')
  ElMessage.success('店铺状态已更新')
  loadData()
}

onMounted(loadData)
</script>

<template>
  <div class="page-view">
    <PageHeader title="店铺管理" description="为已预注册的商家账号创建店铺，并维护店铺营业状态。">
      <template #actions>
        <el-button type="primary" @click="openCreate">创建店铺</el-button>
      </template>
    </PageHeader>

    <SearchPanel>
      <el-form inline>
        <el-form-item label="关键词">
          <el-input v-model="query.keyword" clearable placeholder="店铺名称/店铺号" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" clearable placeholder="全部状态">
            <el-option v-for="(label, value) in SHOP_STATUS_LABEL" :key="value" :label="label" :value="value" />
          </el-select>
        </el-form-item>
        <el-button type="primary" @click="query.page = 1; loadData()">查询</el-button>
      </el-form>
    </SearchPanel>

    <el-card class="sg-card" shadow="never" v-loading="loading">
      <el-table v-if="rows.length" :data="rows">
        <el-table-column label="店铺">
          <template #default="{ row }">
            <div class="shop-name">{{ row.shop.shopName }}</div>
            <div class="shop-meta">{{ row.shop.shopNo }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="contactName" label="联系人" />
        <el-table-column prop="contactPhone" label="联系电话" />
        <el-table-column prop="membersCount" label="成员数" width="90" />
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <StatusTag :label="getShopStatusLabel(row.shop.status)" :type="getShopStatusType(row.shop.status)" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="260">
          <template #default="{ row }">
            <div class="table-actions">
              <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
              <el-button v-if="row.shop.status !== 'ACTIVE' && row.shop.status !== 'CLOSED'" link type="success" @click="changeStatus(row, 'ACTIVE')">启用</el-button>
              <el-button v-if="row.shop.status === 'ACTIVE'" link type="warning" @click="changeStatus(row, 'SUSPENDED')">停业</el-button>
              <el-button v-if="row.shop.status !== 'CLOSED'" link type="danger" @click="changeStatus(row, 'CLOSED')">关闭</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
      <EmptyState v-else description="暂无店铺，请先让商家完成账号预注册，再创建店铺" />
      <AppPagination :page="query.page" :page-size="query.pageSize" :total="total" @change="Object.assign(query, $event); loadData()" />
    </el-card>

    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑店铺' : '创建店铺'" width="560px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
        <el-form-item label="店铺名称" prop="shopName">
          <el-input v-model="form.shopName" clearable />
        </el-form-item>
        <el-form-item v-if="!form.id" label="商家账号" prop="adminUsername">
          <el-input v-model="form.adminUsername" clearable placeholder="填写商家预注册的 username" />
        </el-form-item>
        <el-form-item label="联系人">
          <el-input v-model="form.contactName" clearable />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="form.contactPhone" clearable />
        </el-form-item>
        <el-form-item label="Logo URL">
          <el-input v-model="form.logoUrl" clearable />
        </el-form-item>
        <el-form-item label="店铺描述">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.shop-name { font-weight: 600; }
.shop-meta { margin-top: 4px; color: var(--sg-text-muted); font-size: 12px; }
.table-actions { display: flex; flex-wrap: wrap; gap: 8px; }
</style>
