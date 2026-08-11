<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import PageHeader from '@/components/common/PageHeader.vue'
import SearchPanel from '@/components/common/SearchPanel.vue'
import AppPagination from '@/components/common/AppPagination.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import StatusTag from '@/components/common/StatusTag.vue'
import {
  createPlatformShop,
  getPlatformShopDetail,
  getPlatformShops,
  setPlatformShopStatus,
  updatePlatformShop,
  type CreateShopRequest,
  type PlatformShopQuery,
  type PlatformShopSort,
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

interface StatusForm {
  shopId: string
  shopName: string
  targetStatus: ShopStatus
  reason: string
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

const SHOP_SORT_OPTIONS: Array<{ label: string; value: PlatformShopSort }> = [
  { label: '创建时间倒序', value: 'createdAt,desc' },
  { label: '更新时间倒序', value: 'updatedAt,desc' },
  { label: '店铺名称升序', value: 'shopName,asc' },
  { label: '状态升序', value: 'status,asc' }
]

const STATUS_ACTION_LABEL: Record<ShopStatus, string> = {
  PENDING: '待开通',
  ACTIVE: '启用',
  SUSPENDED: '停业',
  CLOSED: '关闭'
}

const STATUS_TRANSITIONS: Record<ShopStatus, ShopStatus[]> = {
  PENDING: ['ACTIVE', 'CLOSED'],
  ACTIVE: ['SUSPENDED', 'CLOSED'],
  SUSPENDED: ['ACTIVE', 'CLOSED'],
  CLOSED: []
}

const query = reactive<Required<PlatformShopQuery>>({
  keyword: '',
  status: '',
  page: 1,
  pageSize: 10,
  sort: 'createdAt,desc'
})
const rows = ref<PlatformShopView[]>([])
const total = ref(0)
const loading = ref(false)
const dialogVisible = ref(false)
const detailLoading = ref(false)
const detailLoaded = ref(true)
const submitting = ref(false)
const formRef = ref<FormInstance>()
const statusDialogVisible = ref(false)
const statusSubmitting = ref(false)
const statusFormRef = ref<FormInstance>()

const form = reactive<ShopForm>({
  id: '',
  shopName: '',
  logoUrl: '',
  description: '',
  contactName: '',
  contactPhone: '',
  adminUsername: ''
})

const statusForm = reactive<StatusForm>({
  shopId: '',
  shopName: '',
  targetStatus: 'ACTIVE',
  reason: ''
})

const rules: FormRules<ShopForm> = {
  shopName: [
    { required: true, whitespace: true, message: '请输入店铺名称', trigger: 'blur' },
    { min: 1, max: 128, message: '店铺名称长度为 1 到 128 个字符', trigger: 'blur' }
  ],
  description: [{ max: 500, message: '店铺描述不能超过 500 个字符', trigger: 'blur' }],
  contactName: [{ max: 64, message: '联系人不能超过 64 个字符', trigger: 'blur' }],
  contactPhone: [{ max: 32, message: '联系电话不能超过 32 个字符', trigger: 'blur' }],
  adminUsername: [{ required: true, whitespace: true, message: '请输入商家注册账号', trigger: 'blur' }]
}

const statusRules: FormRules<StatusForm> = {
  reason: [
    { required: true, whitespace: true, message: '请输入状态变更原因', trigger: 'blur' },
    { max: 500, message: '状态变更原因不能超过 500 个字符', trigger: 'blur' }
  ]
}

function showAsyncError(error: unknown) {
  if (error instanceof Error) {
    ElMessage.error(error.message)
  }
}

async function loadData() {
  loading.value = true
  try {
    const data = await getPlatformShops(query)
    rows.value = data.items
    total.value = data.total
  } catch (error) {
    showAsyncError(error)
  } finally {
    loading.value = false
  }
}

function search() {
  query.page = 1
  loadData()
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
  formRef.value?.clearValidate()
}

function openCreate() {
  resetForm()
  detailLoaded.value = true
  dialogVisible.value = true
}

async function openEdit(row: PlatformShopView) {
  resetForm()
  form.id = row.shop.id
  detailLoaded.value = false
  detailLoading.value = true
  dialogVisible.value = true

  try {
    const detail = await getPlatformShopDetail(row.shop.id)
    Object.assign(form, {
      id: detail.shop.id,
      shopName: detail.shop.shopName,
      logoUrl: detail.shop.logoUrl ?? '',
      description: detail.description ?? '',
      contactName: detail.contactName ?? '',
      contactPhone: detail.contactPhone ?? '',
      adminUsername: ''
    })
    detailLoaded.value = true
  } catch (error) {
    showAsyncError(error)
  } finally {
    detailLoading.value = false
  }
}

function toNullable(value: string) {
  return value.trim() || null
}

async function submit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    if (form.id) {
      const payload: UpdateShopRequest = {
        shopName: form.shopName.trim(),
        logoUrl: toNullable(form.logoUrl),
        description: toNullable(form.description),
        contactName: toNullable(form.contactName),
        contactPhone: toNullable(form.contactPhone)
      }
      await updatePlatformShop(form.id, payload)
      ElMessage.success('店铺信息已更新')
    } else {
      const payload: CreateShopRequest = {
        shopName: form.shopName.trim(),
        description: toNullable(form.description),
        contactName: toNullable(form.contactName),
        contactPhone: toNullable(form.contactPhone),
        adminUsername: form.adminUsername.trim()
      }
      await createPlatformShop(payload)
      ElMessage.success('店铺已创建，商家账号已绑定为店铺管理员')
    }

    dialogVisible.value = false
    await loadData()
  } catch (error) {
    showAsyncError(error)
  } finally {
    submitting.value = false
  }
}

function getShopStatusLabel(status: ShopStatus) {
  return SHOP_STATUS_LABEL[status]
}

function getShopStatusType(status: ShopStatus) {
  return SHOP_STATUS_TYPE[status]
}

function getStatusActions(status: ShopStatus) {
  return STATUS_TRANSITIONS[status]
}

function openStatusDialog(row: PlatformShopView, targetStatus: ShopStatus) {
  Object.assign(statusForm, {
    shopId: row.shop.id,
    shopName: row.shop.shopName,
    targetStatus,
    reason: ''
  })
  statusFormRef.value?.clearValidate()
  statusDialogVisible.value = true
}

async function submitStatusChange() {
  const valid = await statusFormRef.value?.validate().catch(() => false)
  if (!valid) return

  const targetLabel = SHOP_STATUS_LABEL[statusForm.targetStatus]
  const confirmed = await ElMessageBox.confirm(
    `确认将店铺“${statusForm.shopName}”的状态变更为“${targetLabel}”吗？提交后将立即生效。`,
    '确认状态变更',
    {
      confirmButtonText: '确认变更',
      cancelButtonText: '取消',
      type: statusForm.targetStatus === 'CLOSED' ? 'warning' : 'info'
    }
  ).then(() => true).catch(() => false)
  if (!confirmed) return

  statusSubmitting.value = true
  try {
    await setPlatformShopStatus(
      statusForm.shopId,
      statusForm.targetStatus,
      statusForm.reason.trim()
    )
    ElMessage.success('店铺状态已更新')
    statusDialogVisible.value = false
    await loadData()
  } catch (error) {
    showAsyncError(error)
  } finally {
    statusSubmitting.value = false
  }
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
        <el-form-item label="排序">
          <el-select v-model="query.sort" placeholder="请选择排序">
            <el-option v-for="option in SHOP_SORT_OPTIONS" :key="option.value" :label="option.label" :value="option.value" />
          </el-select>
        </el-form-item>
        <el-button type="primary" @click="search">查询</el-button>
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
              <el-button
                v-for="targetStatus in getStatusActions(row.shop.status)"
                :key="targetStatus"
                link
                :type="targetStatus === 'ACTIVE' ? 'success' : targetStatus === 'SUSPENDED' ? 'warning' : 'danger'"
                @click="openStatusDialog(row, targetStatus)"
              >
                {{ STATUS_ACTION_LABEL[targetStatus] }}
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
      <EmptyState v-else description="暂无店铺，请先让商家完成账号预注册，再创建店铺" />
      <AppPagination :page="query.page" :page-size="query.pageSize" :total="total" @change="Object.assign(query, $event); loadData()" />
    </el-card>

    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑店铺' : '创建店铺'" width="560px" :close-on-click-modal="false">
      <el-form ref="formRef" v-loading="detailLoading" :model="form" :rules="rules" label-width="110px">
        <el-form-item label="店铺名称" prop="shopName">
          <el-input v-model="form.shopName" clearable maxlength="128" />
        </el-form-item>
        <el-form-item v-if="!form.id" label="商家账号" prop="adminUsername">
          <el-input v-model="form.adminUsername" clearable placeholder="填写商家预注册的 username" />
        </el-form-item>
        <el-form-item label="联系人" prop="contactName">
          <el-input v-model="form.contactName" clearable maxlength="64" />
        </el-form-item>
        <el-form-item label="联系电话" prop="contactPhone">
          <el-input v-model="form.contactPhone" clearable maxlength="32" />
        </el-form-item>
        <el-form-item label="店铺描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" maxlength="500" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button :disabled="submitting" @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" :disabled="detailLoading || !detailLoaded" @click="submit">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="statusDialogVisible" title="变更店铺状态" width="520px" :close-on-click-modal="false">
      <el-form ref="statusFormRef" :model="statusForm" :rules="statusRules" label-width="100px">
        <el-form-item label="店铺">
          <span>{{ statusForm.shopName }}</span>
        </el-form-item>
        <el-form-item label="目标状态">
          <StatusTag :label="getShopStatusLabel(statusForm.targetStatus)" :type="getShopStatusType(statusForm.targetStatus)" />
        </el-form-item>
        <el-form-item label="变更原因" prop="reason">
          <el-input
            v-model="statusForm.reason"
            type="textarea"
            :rows="4"
            maxlength="500"
            show-word-limit
            placeholder="请填写本次状态变更原因"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button :disabled="statusSubmitting" @click="statusDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="statusSubmitting" @click="submitStatusChange">提交变更</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.shop-name { font-weight: 600; }
.shop-meta { margin-top: 4px; color: var(--sg-text-muted); font-size: 12px; }
.table-actions { display: flex; flex-wrap: wrap; gap: 8px; }
</style>
