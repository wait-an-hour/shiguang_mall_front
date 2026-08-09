<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import PageHeader from '@/components/common/PageHeader.vue'
import ConfirmActionButton from '@/components/common/ConfirmActionButton.vue'
import { deleteRole, getRoleDetail, listPermissions, listRoles, saveRole } from '@/api/admin/rbac'
import { getPermissionResourceZhLabel } from '@/utils/labels'
import type { PermissionCode, RoleRecord } from '@/types/admin'

interface PermissionTreeCheckInfo {
  checkedKeys: string[]
}

interface PermissionTreeNode {
  id: string
  label: string
  children?: PermissionTreeNode[]
}

const loading = ref(false)
const dialogVisible = ref(false)
const editing = ref(false)
const treeRef = ref()
const records = ref<RoleRecord[]>([])
const permissions = ref<Array<{ id: string; permissionCode: string; permissionName: string; resource: string }>>([])
const form = reactive<RoleRecord>({ id: '', name: '', code: 'OPERATION_ADMIN', description: '', permissions: [], permissionIds: [], createdAt: '' })
const permissionTree = computed<PermissionTreeNode[]>(() => {
  return permissions.value.map((permission) => ({
    id: permission.id,
    label: permission.permissionName || permission.permissionCode
  }))
})

const roleScopeMap: Partial<Record<string, 'SHOP' | 'PLATFORM'>> = {
  SUPER_ADMIN: 'PLATFORM',
  OPERATION_ADMIN: 'PLATFORM',
  AUDIT_ADMIN: 'PLATFORM',
  CUSTOMER: 'PLATFORM',
  SHOP_ADMIN: 'SHOP',
  SHOP_PRODUCT_OPERATOR: 'SHOP',
  SHOP_ORDER_OPERATOR: 'SHOP',
  SHOP_INVENTORY_OPERATOR: 'SHOP',
  PLATFORM_SHOP_ADMIN: 'PLATFORM',
  PLATFORM_PRODUCT_AUDITOR: 'PLATFORM'
}

async function loadPermissionsByScope(scopeType: 'SHOP' | 'PLATFORM') {
  const page = await listPermissions({ scopeType, status: 'ACTIVE' })
  permissions.value = page.items
}

watch(dialogVisible, async (visible) => {
  if (!visible) return
  await nextTick()
  treeRef.value?.setCheckedKeys(form.permissionIds ?? [])
})

async function loadData() {
  loading.value = true
  try {
    const [roleData, permissionData] = await Promise.all([listRoles(), listPermissions({ scopeType: 'PLATFORM', status: 'ACTIVE' })])
    const withCount = await Promise.all(roleData.items.map(async (role) => {
      try {
        const detail = await getRoleDetail(role.id)
        return {
          ...role,
          permissionIds: detail.permissions?.map((permission) => permission.id) ?? [],
          permissions: detail.permissions?.map((permission) => permission.permissionCode as PermissionCode) ?? []
        }
      } catch {
        return { ...role, permissionIds: [], permissions: [] }
      }
    }))
    records.value = withCount
    permissions.value = permissionData.items
  } finally {
    loading.value = false
  }
}

async function openCreate() {
  editing.value = false
  Object.assign(form, { id: '', name: '', code: 'OPERATION_ADMIN', description: '', permissions: [], permissionIds: [], createdAt: '' })
  await loadPermissionsByScope('PLATFORM')
  dialogVisible.value = true
}

async function openEdit(row?: RoleRecord) {
  editing.value = Boolean(row?.id)
  Object.assign(form, row ?? { id: '', name: '', code: 'OPERATION_ADMIN', description: '', permissions: [], permissionIds: [], createdAt: '' })
  form.permissionIds = [...(row?.permissionIds ?? [])]
  if (row?.id) {
    const scopeType = roleScopeMap[row.code] ?? 'PLATFORM'
    await loadPermissionsByScope(scopeType)
  }
  dialogVisible.value = true
  void nextTick(() => treeRef.value?.setCheckedKeys(form.permissionIds ?? []))
}

function syncPermissionChecks() {
  treeRef.value?.setCheckedKeys(form.permissionIds ?? [])
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
    <PageHeader title="角色管理" description="通过菜单和按钮权限组合平台角色，前端权限仅用于体验隔离，真实安全仍需后端校验。"><template #actions><el-button type="primary" @click="openCreate">新增角色</el-button></template></PageHeader>
    <el-card class="sg-card" shadow="never" v-loading="loading"><el-table :data="records"><el-table-column prop="name" label="角色名称" /><el-table-column prop="code" label="角色编码"><template #default="{ row }">{{ row.code }}</template></el-table-column><el-table-column prop="description" label="说明" /><el-table-column label="权限数" align="center"><template #default="{ row }">{{ row.permissionIds?.length ?? row.permissions?.length ?? 0 }}</template></el-table-column><el-table-column label="操作" width="180" align="center"><template #default="{ row }"><div class="table-actions table-actions-center table-actions-guard"><el-button type="primary" link @click.stop.prevent="openEdit(row)">编辑</el-button><ConfirmActionButton text="删除" type="danger" confirm-text="删除角色会影响后续账号授权，确认继续？" @confirm="remove(row.id)" /></div></template></el-table-column></el-table></el-card>
    <el-dialog v-model="dialogVisible" title="角色权限" width="560px" append-to-body @opened="syncPermissionChecks"><el-form :model="form" label-width="90px"><el-form-item label="名称"><el-input v-model="form.name" /></el-form-item><el-form-item label="编码"><template v-if="editing"><span class="role-code-display">{{ form.code }}</span></template><template v-else><el-select v-model="form.code"><el-option label="超级管理员" value="SUPER_ADMIN" /><el-option label="运营管理员" value="OPERATION_ADMIN" /><el-option label="售后审核员" value="AUDIT_ADMIN" /><el-option label="普通用户" value="CUSTOMER" /><el-option label="店铺管理员" value="SHOP_ADMIN" /><el-option label="店铺商品运营" value="SHOP_PRODUCT_OPERATOR" /><el-option label="店铺订单客服" value="SHOP_ORDER_OPERATOR" /><el-option label="店铺库存人员" value="SHOP_INVENTORY_OPERATOR" /><el-option label="平台店铺管理员" value="PLATFORM_SHOP_ADMIN" /><el-option label="平台商品审核员" value="PLATFORM_PRODUCT_AUDITOR" /></el-select></template></el-form-item><el-form-item label="说明"><el-input v-model="form.description" /></el-form-item><el-form-item label="权限"><el-tree ref="treeRef" :data="permissionTree" show-checkbox node-key="id" @check="handlePermissionCheck" /></el-form-item></el-form><template #footer><el-button @click="dialogVisible=false">取消</el-button><el-button type="primary" @click="submit">保存</el-button></template></el-dialog>
  </div>
</template>
