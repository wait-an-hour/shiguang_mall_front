<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import PageHeader from '@/components/common/PageHeader.vue'
import ConfirmActionButton from '@/components/common/ConfirmActionButton.vue'
import { deleteRole, listPermissions, listRoles, saveRole } from '@/api/admin/rbac'
import type { PermissionCode, RoleRecord } from '@/types/admin'

interface PermissionTreeCheckInfo {
  checkedKeys: string[]
}

const loading = ref(false)
const dialogVisible = ref(false)
const records = ref<RoleRecord[]>([])
const permissions = ref<Array<{ id: string; permissionCode: string; permissionName: string; resource: string }>>([])
const form = reactive<RoleRecord>({ id: '', name: '', code: 'OPERATION_ADMIN', description: '', permissions: [], permissionIds: [], createdAt: '' })
const permissionTree = computed(() => {
  const groups = new Map<string, { id: string; label: string; children: Array<{ id: string; label: string }> }>()
  permissions.value.forEach((permission) => {
    const groupId = permission.resource || 'other'
    const group = groups.get(groupId) ?? { id: groupId, label: groupId, children: [] }
    group.children.push({ id: permission.id, label: permission.permissionName || permission.permissionCode })
    groups.set(groupId, group)
  })
  return [...groups.values()]
})

async function loadData() {
  loading.value = true
  try {
    const [roleData, permissionData] = await Promise.all([listRoles(), listPermissions({ scopeType: 'PLATFORM', status: 'ACTIVE' })])
    records.value = roleData.items
    permissions.value = permissionData.items
  } finally {
    loading.value = false
  }
}
function openEdit(row?: RoleRecord) {
  Object.assign(form, row ?? { id: '', name: '', code: 'OPERATION_ADMIN', description: '', permissions: [], permissionIds: [], createdAt: '' })
  form.permissionIds = [...(row?.permissionIds ?? [])]
  dialogVisible.value = true
}
function handlePermissionCheck(_node: unknown, data: PermissionTreeCheckInfo) {
  form.permissionIds = permissions.value.filter((permission) => data.checkedKeys.includes(permission.id)).map((permission) => permission.id)
  form.permissions = permissions.value.filter((permission) => form.permissionIds?.includes(permission.id)).map((permission) => permission.permissionCode as PermissionCode)
}
async function submit() { await saveRole({ ...form, permissionIds: [...(form.permissionIds ?? [])] }); ElMessage.success('角色已保存'); dialogVisible.value = false; void loadData() }
async function remove(id: string) { await deleteRole(id); ElMessage.success('角色已删除'); void loadData() }
onMounted(() => { void loadData() })
</script>

<template>
  <div class="page-view">
    <PageHeader title="角色管理" description="通过菜单和按钮权限组合平台角色，前端权限仅用于体验隔离，真实安全仍需后端校验。"><template #actions><el-button type="primary" @click="openEdit()">新增角色</el-button></template></PageHeader>
    <el-card class="sg-card" shadow="never" v-loading="loading"><el-table :data="records"><el-table-column prop="name" label="角色名称" /><el-table-column prop="code" label="角色编码" /><el-table-column prop="description" label="说明" /><el-table-column label="权限数"><template #default="{ row }">{{ row.permissions.length }}</template></el-table-column><el-table-column label="操作" width="180"><template #default="{ row }"><div class="table-actions"><el-button link type="primary" @click="openEdit(row)">编辑</el-button><ConfirmActionButton text="删除" type="danger" confirm-text="删除角色会影响后续账号授权，确认继续？" @confirm="remove(row.id)" /></div></template></el-table-column></el-table></el-card>
    <el-dialog v-model="dialogVisible" title="角色权限" width="560px"><el-form :model="form" label-width="90px"><el-form-item label="名称"><el-input v-model="form.name" /></el-form-item><el-form-item label="编码"><el-select v-model="form.code"><el-option label="超级管理员" value="SUPER_ADMIN" /><el-option label="运营管理员" value="OPERATION_ADMIN" /><el-option label="售后审核员" value="AUDIT_ADMIN" /></el-select></el-form-item><el-form-item label="说明"><el-input v-model="form.description" /></el-form-item><el-form-item label="权限"><el-tree :data="permissionTree" show-checkbox node-key="id" :default-checked-keys="form.permissionIds" @check="handlePermissionCheck" /></el-form-item></el-form><template #footer><el-button @click="dialogVisible=false">取消</el-button><el-button type="primary" @click="submit">保存</el-button></template></el-dialog>
  </div>
</template>
