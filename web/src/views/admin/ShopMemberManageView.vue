<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import PageHeader from '@/components/common/PageHeader.vue'
import SearchPanel from '@/components/common/SearchPanel.vue'
import AppPagination from '@/components/common/AppPagination.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import StatusTag from '@/components/common/StatusTag.vue'
import { getPlatformShops } from '@/api/admin/shops'
import {
  addShopMember,
  changeShopMemberRole,
  changeShopMemberStatus,
  listShopMembers,
  removeShopMember
} from '@/api/admin/shopMembers'
import type { ShopMemberQuery, ShopMemberStatus, ShopMemberView } from '@/types/admin'

const shopOptions = ref<Array<{ id: string; shopName: string }>>([])
const currentShopId = ref('')
const query = reactive<ShopMemberQuery>({ page: 1, pageSize: 10, keyword: '', roleId: '', status: '' })
const rows = ref<ShopMemberView[]>([])
const total = ref(0)
const loading = ref(false)
const createDialogVisible = ref(false)
const createSubmitting = ref(false)
const createFormRef = ref<FormInstance>()
const roleDialogVisible = ref(false)
const roleSubmitting = ref(false)
const roleFormRef = ref<FormInstance>()
const actionUserId = ref('')

const createForm = reactive({ username: '', roleId: '' })
const roleForm = reactive({ userId: '', username: '', roleId: '' })

const createRules: FormRules<typeof createForm> = {
  username: [{ required: true, message: '请输入成员账号', trigger: 'blur' }],
  roleId: [{ required: true, message: '请输入店铺角色 ID', trigger: 'blur' }]
}

const roleRules: FormRules<typeof roleForm> = {
  roleId: [{ required: true, message: '请输入店铺角色 ID', trigger: 'blur' }]
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

function statusLabel(status: ShopMemberStatus) {
  return status === 'ACTIVE' ? '正常' : '停用'
}

function statusType(status: ShopMemberStatus) {
  return status === 'ACTIVE' ? 'success' : 'danger'
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('zh-CN')
}

async function loadShops() {
  const data = await getPlatformShops({ page: 1, pageSize: 100 })
  shopOptions.value = data.items.map((item) => ({ id: item.shop.id, shopName: item.shop.shopName }))
  if (!currentShopId.value && shopOptions.value.length > 0) {
    currentShopId.value = shopOptions.value[0].id
  }
}

async function loadData() {
  if (!currentShopId.value) {
    rows.value = []
    total.value = 0
    return
  }

  loading.value = true
  try {
    const data = await listShopMembers(currentShopId.value, query)
    rows.value = data.items
    total.value = data.total
  } catch (error) {
    ElMessage.error(errorMessage(error, '店铺成员加载失败'))
  } finally {
    loading.value = false
  }
}

function handleShopChange() {
  query.page = 1
  void loadData()
}

function handleSearch() {
  query.page = 1
  void loadData()
}

function handlePagination(value: { page: number; pageSize: number }) {
  Object.assign(query, value)
  void loadData()
}

function openCreate() {
  createDialogVisible.value = true
}

function openChangeRole(row: ShopMemberView) {
  roleForm.userId = row.user.id
  roleForm.username = row.user.username
  roleForm.roleId = row.role.id
  roleDialogVisible.value = true
}

async function submitCreate() {
  const valid = await createFormRef.value?.validate().catch(() => false)
  if (!valid || !currentShopId.value) return

  createSubmitting.value = true
  try {
    await addShopMember(currentShopId.value, {
      username: createForm.username.trim(),
      roleId: createForm.roleId.trim()
    })
    ElMessage.success('成员已添加')
    createDialogVisible.value = false
    createForm.username = ''
    createForm.roleId = ''
    createFormRef.value?.clearValidate()
    await loadData()
  } catch (error) {
    ElMessage.error(errorMessage(error, '添加成员失败'))
  } finally {
    createSubmitting.value = false
  }
}

async function submitRole() {
  const valid = await roleFormRef.value?.validate().catch(() => false)
  if (!valid || !currentShopId.value) return

  roleSubmitting.value = true
  try {
    await changeShopMemberRole(currentShopId.value, roleForm.userId, { roleId: roleForm.roleId.trim() })
    ElMessage.success('成员角色已更新')
    roleDialogVisible.value = false
    await loadData()
  } catch (error) {
    ElMessage.error(errorMessage(error, '修改成员角色失败'))
  } finally {
    roleSubmitting.value = false
  }
}

async function toggleStatus(row: ShopMemberView) {
  if (!currentShopId.value) return

  const nextStatus: ShopMemberStatus = row.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE'
  try {
    await ElMessageBox.confirm(
      `确认${nextStatus === 'ACTIVE' ? '启用' : '停用'}成员“${row.user.username}”？`,
      '操作确认',
      { type: 'warning' }
    )
  } catch {
    return
  }

  actionUserId.value = row.user.id
  try {
    await changeShopMemberStatus(currentShopId.value, row.user.id, { targetStatus: nextStatus })
    ElMessage.success('成员状态已更新')
    await loadData()
  } catch (error) {
    ElMessage.error(errorMessage(error, '更新成员状态失败'))
  } finally {
    actionUserId.value = ''
  }
}

async function removeMember(row: ShopMemberView) {
  if (!currentShopId.value) return

  try {
    await ElMessageBox.confirm(`确认删除成员“${row.user.username}”？此操作不可撤销。`, '删除确认', {
      type: 'warning',
      confirmButtonText: '删除',
      confirmButtonClass: 'el-button--danger'
    })
  } catch {
    return
  }

  actionUserId.value = row.user.id
  try {
    await removeShopMember(currentShopId.value, row.user.id)
    ElMessage.success('成员已删除')
    await loadData()
  } catch (error) {
    ElMessage.error(errorMessage(error, '删除成员失败'))
  } finally {
    actionUserId.value = ''
  }
}

onMounted(async () => {
  try {
    await loadShops()
  } catch (error) {
    ElMessage.error(errorMessage(error, '店铺列表加载失败'))
  }
  await loadData()
})
</script>

<template>
  <div class="page-view">
    <PageHeader title="店铺成员管理" description="管理单个店铺下的成员账号与角色，仅用于店铺维度治理。">
      <template #actions>
        <el-select
          v-model="currentShopId"
          clearable
          style="width: 220px; margin-right: 12px"
          placeholder="选择店铺"
          @change="handleShopChange"
        >
          <el-option v-for="shop in shopOptions" :key="shop.id" :label="shop.shopName" :value="shop.id" />
        </el-select>
        <el-button type="primary" :disabled="!currentShopId" @click="openCreate">添加成员</el-button>
      </template>
    </PageHeader>

    <SearchPanel>
      <el-form inline>
        <el-form-item label="关键词">
          <el-input v-model="query.keyword" clearable placeholder="账号/昵称" />
        </el-form-item>
        <el-form-item label="角色 ID">
          <el-input v-model="query.roleId" clearable placeholder="请输入角色 ID" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" clearable placeholder="全部状态">
            <el-option label="正常" value="ACTIVE" />
            <el-option label="停用" value="DISABLED" />
          </el-select>
        </el-form-item>
        <el-button type="primary" @click="handleSearch">查询</el-button>
      </el-form>
    </SearchPanel>

    <el-card class="sg-card" shadow="never" v-loading="loading">
      <el-table v-if="rows.length" :data="rows">
        <el-table-column label="账号" min-width="140">
          <template #default="{ row }">{{ row.user.username }}</template>
        </el-table-column>
        <el-table-column label="昵称" min-width="140">
          <template #default="{ row }">{{ row.user.nickname || '-' }}</template>
        </el-table-column>
        <el-table-column label="角色" min-width="180">
          <template #default="{ row }">
            {{ row.role.roleName }}
            <span class="role-code">{{ row.role.roleCode }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <StatusTag :label="statusLabel(row.status)" :type="statusType(row.status)" />
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="180">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <div class="table-actions">
              <el-button link type="primary" :disabled="Boolean(actionUserId)" @click="openChangeRole(row)">修改角色</el-button>
              <el-button
                link
                :type="row.status === 'ACTIVE' ? 'warning' : 'success'"
                :loading="actionUserId === row.user.id"
                :disabled="Boolean(actionUserId)"
                @click="toggleStatus(row)"
              >
                {{ row.status === 'ACTIVE' ? '停用' : '启用' }}
              </el-button>
              <el-button
                link
                type="danger"
                :loading="actionUserId === row.user.id"
                :disabled="Boolean(actionUserId)"
                @click="removeMember(row)"
              >
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
      <EmptyState v-else :description="currentShopId ? '暂无符合条件的店铺成员' : '请选择店铺后查看成员列表'" />
      <AppPagination
        v-if="currentShopId"
        :page="query.page!"
        :page-size="query.pageSize!"
        :total="total"
        @change="handlePagination"
      />
    </el-card>

    <el-dialog v-model="createDialogVisible" title="添加店铺成员" width="460px" :close-on-click-modal="false">
      <el-form ref="createFormRef" :model="createForm" :rules="createRules" label-width="100px">
        <el-form-item label="成员账号" prop="username">
          <el-input v-model="createForm.username" clearable placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="角色 ID" prop="roleId">
          <el-input v-model="createForm.roleId" clearable placeholder="请输入角色 ID" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button :disabled="createSubmitting" @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="createSubmitting" @click="submitCreate">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="roleDialogVisible" title="修改成员角色" width="460px" :close-on-click-modal="false">
      <el-form ref="roleFormRef" :model="roleForm" :rules="roleRules" label-width="100px">
        <el-form-item label="成员账号">
          <el-input :model-value="roleForm.username" disabled />
        </el-form-item>
        <el-form-item label="角色 ID" prop="roleId">
          <el-input v-model="roleForm.roleId" clearable placeholder="请输入角色 ID" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button :disabled="roleSubmitting" @click="roleDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="roleSubmitting" @click="submitRole">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.table-actions {
  display: flex;
  gap: 8px;
}

.role-code {
  margin-left: 4px;
  color: #9ca3af;
  font-size: 12px;
}
</style>
