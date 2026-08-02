<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import PageHeader from '@/components/common/PageHeader.vue'
import { listRoles, saveRole } from '@/api/admin/rbac'
import { permissionTree } from '@/mock/adminData'
import type { PermissionCode, RoleRecord } from '@/types/admin'

interface PermissionTreeCheckInfo {
  checkedKeys: string[]
}

const loading = ref(false)
const dialogVisible = ref(false)
const records = ref<RoleRecord[]>([])
const form = reactive<RoleRecord>({ id: '', name: '', code: 'OPERATION_ADMIN', description: '', permissions: [], createdAt: '' })

async function loadData() { loading.value = true; records.value = await listRoles(); loading.value = false }
function openEdit(row?: RoleRecord) { Object.assign(form, row ?? { id: '', name: '', code: 'OPERATION_ADMIN', description: '', permissions: [], createdAt: '' }); dialogVisible.value = true }
async function submit() { await saveRole({ ...form, permissions: [...form.permissions] }); ElMessage.success('角色已保存'); dialogVisible.value = false; loadData() }
onMounted(loadData)
</script>

<template>
  <div class="page-view">
    <PageHeader title="角色管理" description="通过菜单和按钮权限组合平台角色，当前范围内不提供删除接口，所有变更均通过编辑保存完成。"><template #actions><el-button type="primary" @click="openEdit()">新增角色</el-button></template></PageHeader>
    <el-card class="sg-card" shadow="never" v-loading="loading"><el-table :data="records"><el-table-column prop="name" label="角色名称" /><el-table-column prop="code" label="角色编码" /><el-table-column prop="description" label="说明" /><el-table-column label="权限数"><template #default="{ row }">{{ row.permissions.length }}</template></el-table-column><el-table-column label="操作" width="120"><template #default="{ row }"><div class="table-actions"><el-button link type="primary" @click="openEdit(row)">编辑</el-button></div></template></el-table-column></el-table></el-card>
    <el-dialog v-model="dialogVisible" title="角色权限" width="560px"><el-form :model="form" label-width="90px"><el-form-item label="名称"><el-input v-model="form.name" /></el-form-item><el-form-item label="编码"><el-select v-model="form.code"><el-option label="超级管理员" value="SUPER_ADMIN" /><el-option label="运营管理员" value="OPERATION_ADMIN" /><el-option label="售后审核员" value="AUDIT_ADMIN" /></el-select></el-form-item><el-form-item label="说明"><el-input v-model="form.description" /></el-form-item><el-form-item label="权限"><el-tree :data="permissionTree" show-checkbox node-key="id" :default-checked-keys="form.permissions" @check="(_node: unknown, data: PermissionTreeCheckInfo) => form.permissions = data.checkedKeys.filter((item) => item.startsWith('platform:')) as PermissionCode[]" /></el-form-item></el-form><template #footer><el-button @click="dialogVisible=false">取消</el-button><el-button type="primary" @click="submit">保存</el-button></template></el-dialog>
  </div>
</template>
