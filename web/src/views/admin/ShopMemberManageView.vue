<script setup lang="ts">
import { onMounted, reactive, shallowRef, useTemplateRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import PageHeader from '@/components/common/PageHeader.vue'
import SearchPanel from '@/components/common/SearchPanel.vue'
import AppPagination from '@/components/common/AppPagination.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import StatusTag from '@/components/common/StatusTag.vue'
import { getPlatformShops } from '@/api/admin/shops'
import { addShopMember, changeShopMemberRole, changeShopMemberStatus, listShopMembers, removeShopMember } from '@/api/admin/shopMembers'
import type { ShopMemberQuery, ShopMemberStatus, ShopMemberView } from '@/types/admin'
import { SHOP_MEMBER_STATUS_LABEL } from '@/utils/labels'

const route = useRoute()
const router = useRouter()
const shopOptions = shallowRef<Array<{ id: string; shopName: string; shopNo: string }>>([])
const currentShopId = shallowRef('')
const query = reactive<Required<ShopMemberQuery>>({ page: 1, pageSize: 10, keyword: '', roleId: '', status: '' })
const rows = shallowRef<ShopMemberView[]>([])
const total = shallowRef(0)
const loading = shallowRef(false)
const shopsLoading = shallowRef(false)
const errorMessage = shallowRef('')
const shopErrorMessage = shallowRef('')
const createDialogVisible = shallowRef(false)
const createSubmitting = shallowRef(false)
const roleDialogVisible = shallowRef(false)
const roleSubmitting = shallowRef(false)
const actionUserId = shallowRef('')
const createFormRef = useTemplateRef<FormInstance>('createFormRef')
const roleFormRef = useTemplateRef<FormInstance>('roleFormRef')
const createForm = reactive({ username: '', roleId: '' })
const roleForm = reactive({ userId: '', username: '', roleId: '' })
const createRules: FormRules<typeof createForm> = { username: [{ required: true, whitespace: true, message: '请输入成员账号', trigger: 'blur' }, { max: 64, message: '成员账号不能超过 64 个字符', trigger: 'blur' }], roleId: [{ required: true, whitespace: true, message: '请输入店铺角色 ID', trigger: 'blur' }] }
const roleRules: FormRules<typeof roleForm> = { roleId: [{ required: true, whitespace: true, message: '请输入店铺角色 ID', trigger: 'blur' }] }

function statusType(status: ShopMemberStatus) { return status === 'ACTIVE' ? 'success' : 'danger' }
function statusLabel(status: ShopMemberStatus) { return SHOP_MEMBER_STATUS_LABEL[status] }
function formatDate(value: string) { return new Date(value).toLocaleString('zh-CN') }
function requestedShopId() { const param = route.params.shopId; const queryId = route.query.shopId; return typeof param === 'string' ? param : typeof queryId === 'string' ? queryId : '' }

async function loadShops() {
  shopsLoading.value = true
  shopErrorMessage.value = ''
  try {
    const data = await getPlatformShops({ page: 1, pageSize: 100, sort: 'shopName,asc' })
    shopOptions.value = data.items.map((item) => ({ id: item.shop.id, shopName: item.shop.shopName, shopNo: item.shop.shopNo }))
    const preferred = requestedShopId()
    currentShopId.value = shopOptions.value.some((shop) => shop.id === preferred) ? preferred : shopOptions.value[0]?.id ?? ''
  } catch (error) {
    shopErrorMessage.value = error instanceof Error ? error.message : '店铺列表加载失败'
  } finally { shopsLoading.value = false }
}

async function loadData() {
  errorMessage.value = ''
  if (!currentShopId.value) { rows.value = []; total.value = 0; return }
  loading.value = true
  try { const data = await listShopMembers(currentShopId.value, query); rows.value = data.items; total.value = data.total }
  catch (error) { errorMessage.value = error instanceof Error ? error.message : '店铺成员加载失败'; ElMessage.error(errorMessage.value) }
  finally { loading.value = false }
}

function handleShopChange() { query.page = 1; void router.replace({ query: { ...route.query, shopId: currentShopId.value || undefined } }); void loadData() }
function handleSearch() { query.page = 1; void loadData() }
function openCreate() { Object.assign(createForm, { username: '', roleId: '' }); createFormRef.value?.clearValidate(); createDialogVisible.value = true }
function openChangeRole(row: ShopMemberView) { Object.assign(roleForm, { userId: row.user.id, username: row.user.username, roleId: row.role.id }); roleFormRef.value?.clearValidate(); roleDialogVisible.value = true }

async function submitCreate() {
  if (!currentShopId.value || !(await createFormRef.value?.validate().catch(() => false))) return
  createSubmitting.value = true
  try { await addShopMember(currentShopId.value, { username: createForm.username.trim(), roleId: createForm.roleId.trim() }); ElMessage.success('成员已添加'); createDialogVisible.value = false; await loadData() }
  catch (error) { ElMessage.error(error instanceof Error ? error.message : '添加成员失败') }
  finally { createSubmitting.value = false }
}
async function submitRole() {
  if (!currentShopId.value || !(await roleFormRef.value?.validate().catch(() => false))) return
  roleSubmitting.value = true
  try { await changeShopMemberRole(currentShopId.value, roleForm.userId, { roleId: roleForm.roleId.trim() }); ElMessage.success('成员角色已更新'); roleDialogVisible.value = false; await loadData() }
  catch (error) { ElMessage.error(error instanceof Error ? error.message : '修改成员角色失败') }
  finally { roleSubmitting.value = false }
}
async function toggleStatus(row: ShopMemberView) {
  if (!currentShopId.value) return
  const targetStatus: ShopMemberStatus = row.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE'
  if (!(await ElMessageBox.confirm(`确认${targetStatus === 'ACTIVE' ? '启用' : '停用'}成员“${row.user.username}”？`, '操作确认', { type: 'warning' }).then(() => true).catch(() => false))) return
  actionUserId.value = row.user.id
  try { await changeShopMemberStatus(currentShopId.value, row.user.id, { targetStatus }); ElMessage.success('成员状态已更新'); await loadData() }
  catch (error) { ElMessage.error(error instanceof Error ? error.message : '更新成员状态失败') }
  finally { actionUserId.value = '' }
}
async function removeMember(row: ShopMemberView) {
  if (!currentShopId.value || !(await ElMessageBox.confirm(`确认删除成员“${row.user.username}”？此操作不可撤销。`, '删除确认', { type: 'warning', confirmButtonText: '删除' }).then(() => true).catch(() => false))) return
  actionUserId.value = row.user.id
  try { await removeShopMember(currentShopId.value, row.user.id); ElMessage.success('成员已删除'); await loadData() }
  catch (error) { ElMessage.error(error instanceof Error ? error.message : '删除成员失败') }
  finally { actionUserId.value = '' }
}

onMounted(async () => { await loadShops(); await loadData() })
</script>

<template>
  <div class="page-view">
    <PageHeader title="店铺成员管理" description="切换店铺并维护成员账号、角色与启停状态。">
      <template #actions><el-select v-model="currentShopId" filterable :loading="shopsLoading" class="shop-select" placeholder="选择店铺" @change="handleShopChange"><el-option v-for="shop in shopOptions" :key="shop.id" :label="`${shop.shopName}（${shop.shopNo}）`" :value="shop.id" /></el-select><el-button type="primary" :disabled="!currentShopId" @click="openCreate">添加成员</el-button></template>
    </PageHeader>
    <el-alert v-if="shopErrorMessage" type="error" :closable="false" :title="shopErrorMessage"><template #default><el-button link type="primary" @click="loadShops">重新加载店铺</el-button></template></el-alert>
    <SearchPanel><el-form inline @submit.prevent="handleSearch"><el-form-item label="关键词"><el-input v-model="query.keyword" clearable placeholder="账号/昵称" /></el-form-item><el-form-item label="角色 ID"><el-input v-model="query.roleId" clearable placeholder="请输入角色 ID" /></el-form-item><el-form-item label="状态"><el-select v-model="query.status" clearable class="status-select" placeholder="全部状态"><el-option v-for="(label, value) in SHOP_MEMBER_STATUS_LABEL" :key="value" :label="label" :value="value" /></el-select></el-form-item><el-button type="primary" @click="handleSearch">查询</el-button></el-form></SearchPanel>
    <el-card class="sg-card" shadow="never" v-loading="loading">
      <el-result v-if="errorMessage && !loading" icon="error" title="成员列表加载失败" :sub-title="errorMessage"><template #extra><el-button type="primary" @click="loadData">重试</el-button></template></el-result>
      <template v-else><el-table v-if="rows.length" :data="rows"><el-table-column label="账号" min-width="140"><template #default="{ row }">{{ row.user.username }}</template></el-table-column><el-table-column label="昵称" min-width="140"><template #default="{ row }">{{ row.user.nickname || '-' }}</template></el-table-column><el-table-column label="角色" min-width="190"><template #default="{ row }">{{ row.role.roleName }} <span class="role-code">{{ row.role.roleCode }} · {{ row.role.id }}</span></template></el-table-column><el-table-column label="状态" width="100"><template #default="{ row }"><StatusTag :label="statusLabel(row.status)" :type="statusType(row.status)" /></template></el-table-column><el-table-column label="创建时间" width="180"><template #default="{ row }">{{ formatDate(row.createdAt) }}</template></el-table-column><el-table-column label="操作" width="220" fixed="right"><template #default="{ row }"><el-button link type="primary" :disabled="Boolean(actionUserId)" @click="openChangeRole(row)">修改角色</el-button><el-button link :type="row.status === 'ACTIVE' ? 'warning' : 'success'" :loading="actionUserId === row.user.id" :disabled="Boolean(actionUserId)" @click="toggleStatus(row)">{{ row.status === 'ACTIVE' ? '停用' : '启用' }}</el-button><el-button link type="danger" :loading="actionUserId === row.user.id" :disabled="Boolean(actionUserId)" @click="removeMember(row)">删除</el-button></template></el-table-column></el-table><EmptyState v-else :description="currentShopId ? '暂无符合条件的店铺成员' : '暂无可管理店铺'" /><AppPagination v-if="currentShopId" :page="query.page" :page-size="query.pageSize" :total="total" @change="Object.assign(query, $event); loadData()" /></template>
    </el-card>
    <el-dialog v-model="createDialogVisible" title="添加店铺成员" width="460px" :close-on-click-modal="false"><el-form ref="createFormRef" :model="createForm" :rules="createRules" label-width="100px"><el-form-item label="成员账号" prop="username"><el-input v-model="createForm.username" clearable maxlength="64" /></el-form-item><el-form-item label="角色 ID" prop="roleId"><el-input v-model="createForm.roleId" clearable placeholder="请输入后端角色 ID" /></el-form-item></el-form><template #footer><el-button :disabled="createSubmitting" @click="createDialogVisible = false">取消</el-button><el-button type="primary" :loading="createSubmitting" @click="submitCreate">保存</el-button></template></el-dialog>
    <el-dialog v-model="roleDialogVisible" title="修改成员角色" width="460px" :close-on-click-modal="false"><el-form ref="roleFormRef" :model="roleForm" :rules="roleRules" label-width="100px"><el-form-item label="成员账号"><el-input :model-value="roleForm.username" disabled /></el-form-item><el-form-item label="角色 ID" prop="roleId"><el-input v-model="roleForm.roleId" clearable placeholder="请输入后端角色 ID" /></el-form-item></el-form><template #footer><el-button :disabled="roleSubmitting" @click="roleDialogVisible = false">取消</el-button><el-button type="primary" :loading="roleSubmitting" @click="submitRole">保存</el-button></template></el-dialog>
  </div>
</template>

<style scoped lang="scss">
.shop-select { width: 280px; }
.status-select { width: 140px; }
.role-code { margin-left: 4px; color: var(--sg-text-muted); font-size: 12px; }
</style>
