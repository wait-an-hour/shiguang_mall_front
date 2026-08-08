<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useRoute } from 'vue-router'
import PageHeader from '@/components/common/PageHeader.vue'
import SearchPanel from '@/components/common/SearchPanel.vue'
import AppPagination from '@/components/common/AppPagination.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import StatusTag from '@/components/common/StatusTag.vue'
import ConfirmActionButton from '@/components/common/ConfirmActionButton.vue'
import { addShopMember, changeShopMemberRole, changeShopMemberStatus, listShopMembers } from '@/api/merchant/members'
import { listRoles } from '@/api/admin/rbac'
import type { MerchantMemberQuery, MerchantMemberRole, MerchantMemberStatus, MerchantMemberView } from '@/types/merchant'
import type { RoleRecord } from '@/types/admin'

const route = useRoute()
const shopId = computed(() => String(route.params.shopId))
const rows = ref<MerchantMemberView[]>([])
const roles = ref<RoleRecord[]>([])
const total = ref(0)
const loading = ref(false)
const dialogVisible = ref(false)
const formRef = ref<FormInstance>()
const query = reactive<MerchantMemberQuery>({ page: 1, pageSize: 10, keyword: '', roleId: '', status: '' })
const form = reactive({ username: '', roleId: '' })
const rules: FormRules<typeof form> = {
  username: [{ required: true, message: '请输入成员账号', trigger: 'blur' }],
  roleId: [{ required: true, message: '请选择店铺角色', trigger: 'change' }]
}

const roleOptions = computed(() => roles.value.filter((role) => role.code.startsWith('SHOP_')))

function statusLabel(status: MerchantMemberStatus) {
  return status === 'ACTIVE' ? '正常' : '已停用'
}

function statusType(status: MerchantMemberStatus) {
  return status === 'ACTIVE' ? 'success' : 'danger'
}

function roleLabel(role: MerchantMemberRole) {
  return role === 'SHOP_ADMIN' ? '店铺管理员' : '店铺成员'
}

async function loadData() {
  loading.value = true
  try {
    const [data, roleData] = await Promise.all([
      listShopMembers(shopId.value, query),
      roles.value.length ? Promise.resolve({ items: roles.value }) : listRoles({ scopeType: 'SHOP', status: 'ACTIVE', page: 1, pageSize: 100 })
    ])
    rows.value = data.items
    total.value = data.total
    roles.value = roleData.items
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '成员数据加载失败')
  } finally {
    loading.value = false
  }
}

function openCreate() {
  form.username = ''
  form.roleId = roleOptions.value[0]?.id ?? ''
  dialogVisible.value = true
}

async function submit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  try {
    await addShopMember(shopId.value, { username: form.username.trim(), roleId: form.roleId })
    ElMessage.success('成员已添加')
    dialogVisible.value = false
    await loadData()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '添加成员失败')
  }
}

async function updateRole(row: MerchantMemberView) {
  const roleId = roleOptions.value.find((role) => String(role.code) !== String(row.roleCode) && String(role.code) !== 'SUPER_ADMIN')?.id
  if (!roleId) {
    ElMessage.warning('暂无可切换的店铺角色')
    return
  }
  try {
    await changeShopMemberRole(shopId.value, row.id, { roleId })
    ElMessage.success('角色已更新')
    await loadData()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '角色更新失败')
  }
}

async function toggleStatus(row: MerchantMemberView) {
  const targetStatus: MerchantMemberStatus = row.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE'
  try {
    await changeShopMemberStatus(shopId.value, row.id, { targetStatus })
    ElMessage.success('成员状态已更新')
    await loadData()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '成员状态更新失败')
  }
}

onMounted(loadData)
</script>

<template>
  <div class="page-view" v-loading="loading">
    <PageHeader title="成员管理" description="管理当前店铺的成员账号、角色和访问状态。">
      <template #actions>
        <el-button type="primary" @click="openCreate">添加成员</el-button>
      </template>
    </PageHeader>

    <SearchPanel>
      <el-form inline @submit.prevent="loadData">
        <el-form-item label="关键词">
          <el-input v-model="query.keyword" clearable placeholder="账号或昵称" @keyup.enter="loadData" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" clearable placeholder="全部状态" style="width: 140px">
            <el-option label="正常" value="ACTIVE" />
            <el-option label="已停用" value="DISABLED" />
          </el-select>
        </el-form-item>
        <el-button type="primary" @click="loadData">查询</el-button>
      </el-form>
    </SearchPanel>

    <el-card class="sg-card" shadow="never">
      <el-table v-if="rows.length" :data="rows" row-key="id">
        <el-table-column prop="username" label="账号" min-width="150" />
        <el-table-column prop="nickname" label="昵称" min-width="130" />
        <el-table-column label="角色" min-width="130">
          <template #default="{ row }">{{ row.roleName || roleLabel(row.roleCode) }}</template>
        </el-table-column>
        <el-table-column prop="phone" label="手机号" min-width="140" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }"><StatusTag :label="statusLabel(row.status)" :type="statusType(row.status)" /></template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <div class="table-actions">
              <el-button link type="primary" @click="updateRole(row)">切换角色</el-button>
              <ConfirmActionButton :text="row.status === 'ACTIVE' ? '停用' : '启用'" confirm-text="确认变更该成员状态？" @confirm="toggleStatus(row)" />
            </div>
          </template>
        </el-table-column>
      </el-table>
      <EmptyState v-else description="暂无成员数据" />
      <AppPagination :page="query.page!" :page-size="query.pageSize!" :total="total" @change="Object.assign(query, $event); loadData()" />
    </el-card>

    <el-dialog v-model="dialogVisible" title="添加店铺成员" width="460px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="成员账号" prop="username"><el-input v-model="form.username" clearable placeholder="请输入已注册账号" /></el-form-item>
        <el-form-item label="店铺角色" prop="roleId">
          <el-select v-model="form.roleId" placeholder="请选择角色" style="width: 100%">
            <el-option v-for="role in roleOptions" :key="role.id" :label="role.name" :value="role.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer><el-button @click="dialogVisible = false">取消</el-button><el-button type="primary" @click="submit">保存</el-button></template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.page-view { display: flex; flex-direction: column; gap: 16px; }
.table-actions { display: flex; gap: 8px; }
</style>
