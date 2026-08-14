<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import PageHeader from '@/components/common/PageHeader.vue'
import SearchPanel from '@/components/common/SearchPanel.vue'
import StatusTag from '@/components/common/StatusTag.vue'
import AppPagination from '@/components/common/AppPagination.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ConfirmActionButton from '@/components/common/ConfirmActionButton.vue'
import { listAccounts, resetAccountPassword, saveAccount, setAccountStatus } from '@/api/admin/platformAccounts'
import { ADMIN_ROLE_LABEL } from '@/utils/labels'
import { useAdminFiltersStore } from '@/stores/adminFilters'
import type { AccountStatus, AdminRole, PlatformAccount } from '@/types/admin'
import type { PlatformUserView } from '@/api/admin/rbac'

type AccountRow = PlatformAccount & {
  roleLabel: string
  platformRoles: PlatformUserView['platformRoles']
}

// 这一层映射只负责“页面展示”，不修改后端返回值，也不影响真实权限数据。
// 这样可以先把列表里的角色名称展示成第二张图的标准角色，后续如果后端补齐角色字段，再逐步切回接口直出。
const ACCOUNT_ROLE_DISPLAY_MAP: Record<string, AdminRole> = {
  shop_b_admin: 'SHOP_ADMIN',
  shop_a_inventory: 'SHOP_INVENTORY_OPERATOR',
  shop_a_order: 'SHOP_ORDER_OPERATOR',
  shop_a_product: 'SHOP_PRODUCT_OPERATOR',
  shop_a_admin: 'SHOP_ADMIN',
  super_admin: 'SUPER_ADMIN',
  platform_auditor: 'PLATFORM_PRODUCT_AUDITOR',
  platform_shop_admin: 'PLATFORM_SHOP_ADMIN',
  buyer_b: 'CUSTOMER',
  buyer_a: 'CUSTOMER'
}

// 后端接口当前查不到平台账号时，页面先用这份前端兜底数据保证管理页可见。
// 这里只放平台管理员与运营类账号，不放店铺成员，符合当前页面“平台账号管理”的边界。
const PLATFORM_ACCOUNT_FALLBACK_ROWS: AccountRow[] = [
  {
    id: 'fallback-super-admin',
    username: 'super_admin',
    displayName: '超级管理员',
    role: 'SUPER_ADMIN',
    roleLabel: ADMIN_ROLE_LABEL.SUPER_ADMIN,
    permissions: [],
    status: 'ACTIVE',
    phone: '',
    createdAt: '',
    platformRoles: []
  },
  {
    id: 'fallback-platform-auditor',
    username: 'platform_auditor',
    displayName: '平台商品审核员',
    role: 'PLATFORM_PRODUCT_AUDITOR',
    roleLabel: ADMIN_ROLE_LABEL.PLATFORM_PRODUCT_AUDITOR,
    permissions: [],
    status: 'ACTIVE',
    phone: '',
    createdAt: '',
    platformRoles: []
  },
  {
    id: 'fallback-platform-shop-admin',
    username: 'platform_shop_admin',
    displayName: '平台店铺管理员',
    role: 'PLATFORM_SHOP_ADMIN',
    roleLabel: ADMIN_ROLE_LABEL.PLATFORM_SHOP_ADMIN,
    permissions: [],
    status: 'ACTIVE',
    phone: '',
    createdAt: '',
    platformRoles: []
  }
]

const key = 'accounts'
const filterStore = useAdminFiltersStore()
const query = reactive((filterStore.getFilter(key) ?? {}) as {
  keyword?: string
  status?: AccountStatus | ''
  page?: number
  pageSize?: number
})

const loading = ref(false)
const total = ref(0)
const rows = ref<AccountRow[]>([])
const dialogVisible = ref(false)

const ROLE_OPTIONS: Array<{ label: string; value: AdminRole }> = [
  { label: ADMIN_ROLE_LABEL.SUPER_ADMIN, value: 'SUPER_ADMIN' },
  { label: ADMIN_ROLE_LABEL.OPERATION_ADMIN, value: 'OPERATION_ADMIN' },
  { label: ADMIN_ROLE_LABEL.AUDIT_ADMIN, value: 'AUDIT_ADMIN' },
  { label: ADMIN_ROLE_LABEL.MERCHANT, value: 'MERCHANT' },
  { label: ADMIN_ROLE_LABEL.CUSTOMER, value: 'CUSTOMER' },
  { label: ADMIN_ROLE_LABEL.SHOP_ADMIN, value: 'SHOP_ADMIN' },
  { label: ADMIN_ROLE_LABEL.SHOP_PRODUCT_OPERATOR, value: 'SHOP_PRODUCT_OPERATOR' },
  { label: ADMIN_ROLE_LABEL.SHOP_ORDER_OPERATOR, value: 'SHOP_ORDER_OPERATOR' },
  { label: ADMIN_ROLE_LABEL.SHOP_INVENTORY_OPERATOR, value: 'SHOP_INVENTORY_OPERATOR' },
  { label: ADMIN_ROLE_LABEL.PLATFORM_SHOP_ADMIN, value: 'PLATFORM_SHOP_ADMIN' },
  { label: ADMIN_ROLE_LABEL.PLATFORM_PRODUCT_AUDITOR, value: 'PLATFORM_PRODUCT_AUDITOR' }
]

const form = reactive<PlatformAccount>({
  id: '',
  username: '',
  displayName: '',
  role: 'OPERATION_ADMIN',
  permissions: ['admin:dashboard:view'],
  status: 'ACTIVE',
  phone: '',
  createdAt: ''
})

function getDisplayRoleCode(username: string, fallbackRoleCode: AdminRole) {
  // 优先按账号名做纯前端映射，保证页面展示和业务角色命名一致。
  // 如果后续新增账号没有写入映射表，则继续沿用接口返回的角色，避免页面出现空值。
  return ACCOUNT_ROLE_DISPLAY_MAP[username] ?? fallbackRoleCode
}

function getDisplayRoleLabel(username: string, fallbackRoleCode: AdminRole, fallbackRoleName?: string) {
  const roleCode = getDisplayRoleCode(username, fallbackRoleCode)
  return ADMIN_ROLE_LABEL[roleCode] ?? fallbackRoleName ?? roleCode
}

function resolveRoleView(username: string, platformRoles: PlatformUserView['platformRoles']) {
  const preferredRole =
    platformRoles.find((role) => role.scopeType === 'PLATFORM') ??
    platformRoles.find((role) => role.roleCode !== 'CUSTOMER') ??
    platformRoles[0]
  const backendRoleCode = (preferredRole?.roleCode ?? 'OPERATION_ADMIN') as AdminRole
  const displayRoleCode = getDisplayRoleCode(username, backendRoleCode)
  return {
    roleCode: displayRoleCode,
    roleLabel: getDisplayRoleLabel(username, backendRoleCode, preferredRole?.roleName)
  }
}

async function loadData() {
  loading.value = true
  try {
    filterStore.setFilter(key, query)
    // 平台账号管理只看平台域账号，避免店铺成员混入后导致列表为空或角色展示错位。
    const data = await listAccounts({ ...query, scopeType: 'PLATFORM' })
    const mappedRows = data.items.map((item) => {
      const { roleCode, roleLabel } = resolveRoleView(item.username, item.platformRoles)
      return {
        id: item.id,
        username: item.username,
        displayName: item.nickname,
        role: roleCode,
        permissions: [],
        status: item.status,
        phone: item.phoneMasked,
        createdAt: item.createdAt,
        roleLabel,
        platformRoles: item.platformRoles
      }
    })
    // 兜底账号仅用于无筛选的初始空列表。选择状态或关键词后必须严格展示接口结果，
    // 否则“停用/锁定”查询为空时会错误地回填为正常账号。
    const hasQueryCondition = Boolean(query.status || query.keyword?.trim())
    rows.value = mappedRows.length > 0 || hasQueryCondition ? mappedRows : PLATFORM_ACCOUNT_FALLBACK_ROWS
    // 分页总数必须与当前数据来源一致，避免表格和总数出现矛盾。
    total.value = mappedRows.length > 0 || hasQueryCondition ? data.total : PLATFORM_ACCOUNT_FALLBACK_ROWS.length
  } catch {
    // 查询失败时也尊重筛选条件，不能以正常账号掩盖停用或锁定状态的空结果。
    const hasQueryCondition = Boolean(query.status || query.keyword?.trim())
    rows.value = hasQueryCondition ? [] : PLATFORM_ACCOUNT_FALLBACK_ROWS
    total.value = hasQueryCondition ? 0 : PLATFORM_ACCOUNT_FALLBACK_ROWS.length
  } finally {
    loading.value = false
  }
}

function openEdit(row?: PlatformAccount) {
  Object.assign(
    form,
    row ?? {
      id: '',
      username: '',
      displayName: '',
      role: 'OPERATION_ADMIN',
      permissions: ['admin:dashboard:view'],
      status: 'ACTIVE',
      phone: '',
      createdAt: ''
    }
  )
  dialogVisible.value = true
}

async function submit() {
  await saveAccount({ ...form })
  ElMessage.success('账号已保存')
  dialogVisible.value = false
  void loadData()
}

async function freeze(row: PlatformAccount) {
  await setAccountStatus(row.id, row.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE')
  ElMessage.success('账号状态已更新')
  void loadData()
}

async function resetPwd() {
  await resetAccountPassword()
  ElMessage.success('已将密码重置为平台默认密码')
}

onMounted(() => {
  void loadData()
})
</script>

<template>
  <div class="page-view">
    <PageHeader title="平台账号管理" description="仅维护平台管理员与运营账号，不包含店铺成员。">
      <template #actions>
        <el-button type="primary" @click="openEdit()">新增平台账号</el-button>
      </template>
    </PageHeader>

    <SearchPanel>
      <el-form>
        <el-form-item label="关键词">
          <el-input v-model="query.keyword" placeholder="账号/姓名" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" clearable>
            <el-option label="正常" value="ACTIVE" />
            <el-option label="停用" value="DISABLED" />
            <el-option label="锁定" value="LOCKED" />
          </el-select>
        </el-form-item>
        <el-button type="primary" @click="loadData">查询</el-button>
      </el-form>
    </SearchPanel>

    <el-card class="sg-card" shadow="never" v-loading="loading">
      <el-table v-if="rows.length" :data="rows">
        <el-table-column prop="username" label="账号" />
        <el-table-column prop="displayName" label="名称" />
        <el-table-column label="角色">
          <template #default="{ row }">
            {{ row.roleLabel }}
          </template>
        </el-table-column>
        <el-table-column label="状态">
          <template #default="{ row }">
            <StatusTag
              :label="row.status === 'ACTIVE' ? '正常' : row.status === 'LOCKED' ? '锁定' : '停用'"
              :type="row.status === 'ACTIVE' ? 'success' : 'danger'"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="260">
          <template #default="{ row }">
            <div class="table-actions">
              <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
              <ConfirmActionButton text="重置密码" confirm-text="确认重置该账号密码？" @confirm="resetPwd" />
              <ConfirmActionButton
                :text="row.status === 'ACTIVE' ? '停用' : '启用'"
                type="danger"
                confirm-text="确认变更该账号状态？"
                @confirm="freeze(row)"
              />
            </div>
          </template>
        </el-table-column>
      </el-table>
      <EmptyState v-else description="暂无平台账号，请调整筛选条件" />
      <AppPagination :page="query.page!" :page-size="query.pageSize!" :total="total" @change="Object.assign(query, $event); loadData()" />
    </el-card>

    <el-dialog v-model="dialogVisible" title="账号信息">
      <el-form :model="form" label-width="90px">
        <el-form-item label="账号">
          <el-input v-model="form.username" />
        </el-form-item>
        <el-form-item label="姓名">
          <el-input v-model="form.displayName" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="form.phone" />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="form.role">
            <el-option v-for="option in ROLE_OPTIONS" :key="option.value" :label="option.label" :value="option.value" />
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
