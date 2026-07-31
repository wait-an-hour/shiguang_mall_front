<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import PageHeader from '@/components/common/PageHeader.vue'
import SearchPanel from '@/components/common/SearchPanel.vue'
import StatusTag from '@/components/common/StatusTag.vue'
import AppPagination from '@/components/common/AppPagination.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ConfirmActionButton from '@/components/common/ConfirmActionButton.vue'
import { listAccounts, resetAccountPassword, saveAccount, setAccountStatus } from '@/api/admin/rbac'
import { useAdminFiltersStore } from '@/stores/adminFilters'
import type { PlatformAccount } from '@/types/admin'

const key = 'accounts'
const filterStore = useAdminFiltersStore()
const query = reactive(filterStore.getFilter(key))
const loading = ref(false)
const total = ref(0)
const rows = ref<PlatformAccount[]>([])
const dialogVisible = ref(false)
const form = reactive<PlatformAccount>({ id: '', username: '', displayName: '', role: 'OPERATION_ADMIN', permissions: ['admin:dashboard:view'], status: 'ACTIVE', phone: '', createdAt: '' })

async function loadData() { loading.value = true; filterStore.setFilter(key, query); const data = await listAccounts(query); rows.value = data.items; total.value = data.total; loading.value = false }
function openEdit(row?: PlatformAccount) { Object.assign(form, row ?? { id: '', username: '', displayName: '', role: 'OPERATION_ADMIN', permissions: ['admin:dashboard:view'], status: 'ACTIVE', phone: '', createdAt: '' }); dialogVisible.value = true }
async function submit() { await saveAccount({ ...form }); ElMessage.success('账号已保存'); dialogVisible.value = false; loadData() }
async function freeze(row: PlatformAccount) { await setAccountStatus(row.id, row.status === 'ACTIVE' ? 'FROZEN' : 'ACTIVE'); ElMessage.success('账号状态已更新'); loadData() }
async function resetPwd() { await resetAccountPassword(); ElMessage.success('已将密码重置为平台默认密码') }
onMounted(loadData)
</script>

<template>
  <div class="page-view">
    <PageHeader title="账号管理" description="统一维护平台管理员与入驻商家账号；冻结商户用于违规处置演示。"><template #actions><el-button type="primary" @click="openEdit()">新增账号</el-button></template></PageHeader>
    <SearchPanel><el-form><el-form-item label="关键词"><el-input v-model="query.keyword" placeholder="账号/姓名/店铺" clearable /></el-form-item><el-form-item label="状态"><el-select v-model="query.status" clearable><el-option label="正常" value="ACTIVE" /><el-option label="冻结" value="FROZEN" /></el-select></el-form-item><el-button type="primary" @click="loadData">查询</el-button></el-form></SearchPanel>
    <el-card class="sg-card" shadow="never" v-loading="loading"><el-table v-if="rows.length" :data="rows"><el-table-column prop="username" label="账号" /><el-table-column prop="displayName" label="名称" /><el-table-column prop="role" label="角色" /><el-table-column prop="ownerShopName" label="关联店铺" /><el-table-column label="状态"><template #default="{ row }"><StatusTag :label="row.status === 'ACTIVE' ? '正常' : '冻结'" :type="row.status === 'ACTIVE' ? 'success' : 'danger'" /></template></el-table-column><el-table-column label="操作" width="260"><template #default="{ row }"><div class="table-actions"><el-button link type="primary" @click="openEdit(row)">编辑</el-button><ConfirmActionButton text="重置密码" confirm-text="确认重置该账号密码？" @confirm="resetPwd" /><ConfirmActionButton :text="row.status === 'ACTIVE' ? '冻结' : '解冻'" type="danger" confirm-text="确认变更该账号状态？" @confirm="freeze(row)" /></div></template></el-table-column></el-table><EmptyState v-else description="暂无账号，请调整筛选条件" /><AppPagination :page="query.page!" :page-size="query.pageSize!" :total="total" @change="Object.assign(query, $event); loadData()" /></el-card>
    <el-dialog v-model="dialogVisible" title="账号信息"><el-form :model="form" label-width="90px"><el-form-item label="账号"><el-input v-model="form.username" /></el-form-item><el-form-item label="名称"><el-input v-model="form.displayName" /></el-form-item><el-form-item label="手机号"><el-input v-model="form.phone" /></el-form-item><el-form-item label="角色"><el-select v-model="form.role"><el-option label="运营管理员" value="OPERATION_ADMIN" /><el-option label="售后审核员" value="AUDIT_ADMIN" /><el-option label="商家" value="MERCHANT" /></el-select></el-form-item></el-form><template #footer><el-button @click="dialogVisible=false">取消</el-button><el-button type="primary" @click="submit">保存</el-button></template></el-dialog>
  </div>
</template>
