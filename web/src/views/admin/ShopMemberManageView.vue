<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import PageHeader from '@/components/common/PageHeader.vue'
import SearchPanel from '@/components/common/SearchPanel.vue'
import AppPagination from '@/components/common/AppPagination.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import StatusTag from '@/components/common/StatusTag.vue'
import ConfirmActionButton from '@/components/common/ConfirmActionButton.vue'
import { getPlatformShops } from '@/api/admin/shops'
import { listRoles } from '@/api/admin/rbac'
import { addShopMember, changeShopMemberRole, changeShopMemberStatus, listShopMembers } from '@/api/admin/shopMembers'
import type { RoleRecord, ShopMemberQuery, ShopMemberStatus, ShopMemberView } from '@/types/admin'


const shopOptions = ref<Array<{ id: string; shopName: string }>>([])
const roleOptions = ref<RoleRecord[]>([])
const currentShopId = ref('')
const query = reactive<ShopMemberQuery>({ page: 1, pageSize: 10, keyword: '', roleId: '', status: '' })
const rows = ref<ShopMemberView[]>([])
const total = ref(0)
const loading = ref(false)
const dialogVisible = ref(false)
const formRef = ref<FormInstance>()

const form = reactive({ username: '', roleId: '' })

const rules: FormRules<typeof form> = {
  username: [{ required: true, message: '请输入成员账号', trigger: 'blur' }],
  roleId: [{ required: true, message: '请选择店铺角色', trigger: 'change' }]
}

function statusLabel(status: ShopMemberStatus) {
  return status === 'ACTIVE' ? '正常' : '停用'
}

function statusType(status: ShopMemberStatus) {
  return status === 'ACTIVE' ? 'success' : 'danger'
}

function canEditShop() {
  return Boolean(currentShopId.value)
}

async function loadShops() {
  // 后端店铺列表接口有分页上限，pageSize 过大时会拿不到可选店铺，导致右上角下拉显示 No data。
  const data = await getPlatformShops({ page: 1, pageSize: 100 })
  shopOptions.value = data.items.map((item) => ({ id: item.shop.id, shopName: item.shop.shopName }))
  if (!currentShopId.value && shopOptions.value.length > 0) {
    currentShopId.value = shopOptions.value[0].id
  }
}

async function loadRoles() {
  const data = await listRoles({ scopeType: 'SHOP', status: 'ACTIVE', page: 1, pageSize: 100 })
  roleOptions.value = data.items
}

async function loadData() {
  if (!currentShopId.value) return
  loading.value = true
  try {
    const data = await listShopMembers(currentShopId.value, query)
    rows.value = data.items
    total.value = data.total
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '店铺成员加载失败')
  } finally {
    loading.value = false
  }
}

function openCreate() {
  dialogVisible.value = true
}

async function submit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid || !currentShopId.value) return
  await addShopMember(currentShopId.value, { username: form.username.trim(), roleId: form.roleId })
  ElMessage.success('成员已添加')
  dialogVisible.value = false
  form.username = ''
  form.roleId = ''
  formRef.value?.clearValidate()
  void loadData()
}

async function toggleStatus(row: ShopMemberView) {
  if (!currentShopId.value) return
  const nextStatus: ShopMemberStatus = row.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE'
  await changeShopMemberStatus(currentShopId.value, row.id, { targetStatus: nextStatus })
  ElMessage.success('成员状态已更新')
  void loadData()
}


onMounted(async () => {
  await loadShops()
  await loadRoles()
  await loadData()
})
</script>

<template>
  <div class="page-view">
    <PageHeader title="店铺成员管理" description="管理单个店铺下的成员账号与角色，仅用于店铺维度治理。">
      <template #actions>
        <el-select v-model="currentShopId" style="width: 220px; margin-right: 12px" placeholder="选择店铺" @change="loadData">
          <el-option v-for="shop in shopOptions" :key="shop.id" :label="shop.shopName" :value="shop.id" />
        </el-select>
        <el-button type="primary" :disabled="!canEditShop()" @click="openCreate">添加成员</el-button>
      </template>
    </PageHeader>

    <SearchPanel>
      <el-form inline>
        <el-form-item label="关键词">
          <el-input v-model="query.keyword" clearable placeholder="账号/昵称" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" clearable placeholder="全部状态">
            <el-option label="正常" value="ACTIVE" />
            <el-option label="停用" value="DISABLED" />
          </el-select>
        </el-form-item>
        <el-button type="primary" @click="loadData">查询</el-button>
      </el-form>
    </SearchPanel>

    <el-card class="sg-card" shadow="never" v-loading="loading">
      <el-table v-if="rows.length" :data="rows">
        <el-table-column prop="username" label="账号" />
        <el-table-column prop="nickname" label="昵称" />
        <el-table-column prop="roleName" label="角色" />
        <el-table-column prop="phone" label="手机号" />
        <el-table-column label="状态">
          <template #default="{ row }">
            <StatusTag :label="statusLabel(row.status)" :type="statusType(row.status)" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180">
          <template #default="{ row }">
            <div class="table-actions">
              <ConfirmActionButton
                :text="row.status === 'ACTIVE' ? '停用' : '启用'"
                confirm-text="确认变更该店铺成员状态？"
                @confirm="toggleStatus(row)"
              />
            </div>
          </template>
        </el-table-column>
      </el-table>
      <EmptyState v-else description="请选择店铺后查看成员列表" />
      <AppPagination :page="query.page!" :page-size="query.pageSize!" :total="total" @change="Object.assign(query, $event); loadData()" />
    </el-card>

    <el-dialog v-model="dialogVisible" title="添加店铺成员" width="460px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="成员账号" prop="username">
          <el-input v-model="form.username" clearable />
        </el-form-item>
        <el-form-item label="店铺角色" prop="roleId">
          <el-select v-model="form.roleId" placeholder="请选择角色">
            <el-option v-for="role in roleOptions" :key="role.id" :label="role.name" :value="role.id" />
          </el-select>
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
.table-actions {
  display: flex;
  gap: 8px;
}
</style>
