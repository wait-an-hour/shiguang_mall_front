<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import PageHeader from '@/components/common/PageHeader.vue'
import StatusTag from '@/components/common/StatusTag.vue'
import ConfirmActionButton from '@/components/common/ConfirmActionButton.vue'
import { listCategories, saveCategory, setCategoryStatus } from '@/api/admin/catalog'
import type { CategoryRecord } from '@/types/admin'

const loading = ref(false)
const rows = ref<CategoryRecord[]>([])
const dialogVisible = ref(false)
const form = reactive<CategoryRecord>({ id: '', name: '', parentId: '', level: 1, sort: 1, status: 'ENABLED' })

const parentCategoryOptions = computed(() => {
  const options: Array<{ label: string; value: string }> = []
  const walk = (items: CategoryRecord[], prefix = '') => {
    items.forEach((item) => {
      // 父分类最多只能选择四级分类，这样新建分类最多生成五级，避免分类树无限加深影响页面可读性。
      if (item.id !== form.id && item.level < 5) {
        options.push({ label: `${prefix}${item.name}`, value: item.id })
      }
      if (item.children?.length) {
        walk(item.children, `${prefix}└─ `)
      }
    })
  }
  walk(rows.value)
  return options
})

function findCategoryById(items: CategoryRecord[], id?: string): CategoryRecord | undefined {
  for (const item of items) {
    if (item.id === id) return item
    const matched = findCategoryById(item.children ?? [], id)
    if (matched) return matched
  }
  return undefined
}

function resetForm(row?: CategoryRecord) {
  Object.assign(
    form,
    row
      ? { ...row }
      : { id: '', name: '', code: '', parentId: '', level: 1, sort: 1, status: 'ENABLED' }
  )
  if (!form.parentId) form.level = 1
}

async function loadData() {
  loading.value = true
  try {
    rows.value = await listCategories()
  } finally {
    loading.value = false
  }
}

function openEdit(row?: CategoryRecord) {
  resetForm(row)
  dialogVisible.value = true
}

function openCreateChild(parent: CategoryRecord) {
  // 从分类行直接新增子类时，父分类固定为当前行，避免用户在下拉框里重复查找父级。
  Object.assign(form, {
    id: '',
    name: '',
    code: '',
    parentId: parent.id,
    level: parent.level + 1,
    sort: 1,
    status: 'ENABLED'
  })
  dialogVisible.value = true
}

function handleParentChange(parentId: string) {
  form.parentId = parentId
  const parent = findCategoryById(rows.value, parentId)
  form.level = parent ? parent.level + 1 : 1
}

function getErrorMessage(error: unknown) {
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message
  }
  return '分类保存失败，请检查父分类和名称后重试'
}

async function submit() {
  try {
    await saveCategory({ ...form })
    ElMessage.success('分类已保存')
    dialogVisible.value = false
    await loadData()
  } catch (error) {
    ElMessage.error(getErrorMessage(error))
  }
}

async function toggle(row: CategoryRecord) {
  await setCategoryStatus(row.id, row.status === 'ENABLED' ? 'DISABLED' : 'ENABLED')
  ElMessage.success('分类状态已更新')
  await loadData()
}

function getCategoryRowClassName({ row }: { row: CategoryRecord }) {
  return `category-row-level-${row.level}`
}

function getLevelTagType(level: number) {
  if (level === 1) return 'primary'
  if (level === 2) return 'success'
  if (level === 3) return 'warning'
  if (level === 4) return 'info'
  return 'danger'
}

onMounted(loadData)
</script>

<template>
  <div class="page-view">
    <PageHeader title="分类管理" description="维护全平台商品类目树，所有商家商品发布共用同一套分类基础数据。">
      <template #actions>
        <el-button type="primary" @click="openEdit()">新增分类</el-button>
      </template>
    </PageHeader>

    <el-card class="sg-card" shadow="never" v-loading="loading">
      <el-table :data="rows" row-key="id" default-expand-all :row-class-name="getCategoryRowClassName">
        <el-table-column label="分类名称">
          <template #default="{ row }">
            <span class="category-name" :class="`category-name-level-${row.level}`">{{ row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column label="层级">
          <template #default="{ row }">
            <el-tag :type="getLevelTagType(row.level)" effect="light" :class="`category-level-tag-${row.level}`">{{ row.level }} 级</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" />
        <el-table-column label="状态">
          <template #default="{ row }">
            <StatusTag :label="row.status === 'ENABLED' ? '启用' : '停用'" :type="row.status === 'ENABLED' ? 'success' : 'danger'" />
          </template>
        </el-table-column>
        <el-table-column label="操作">
          <template #default="{ row }">
            <div class="table-actions">
              <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
              <el-button v-if="row.level < 5" link type="primary" @click="openCreateChild(row)">添加子类</el-button>
              <ConfirmActionButton :text="row.status === 'ENABLED' ? '停用' : '启用'" confirm-text="确认变更该分类状态？" @confirm="toggle(row)" />
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" title="分类信息">
      <el-form :model="form" label-width="90px">
        <el-form-item label="父分类">
          <el-select v-model="form.parentId" clearable placeholder="不选择则创建一级分类" @change="handleParentChange">
            <el-option v-for="item in parentCategoryOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="名称">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="层级">
          <el-input-number v-model="form.level" :min="1" :max="5" disabled />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :min="1" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
:deep(.category-row-level-1) {
  --el-table-tr-bg-color: #f8fbff;
}

:deep(.category-row-level-2) {
  --el-table-tr-bg-color: #f8fffb;
}

:deep(.category-row-level-3) {
  --el-table-tr-bg-color: #fffaf2;
}

.category-name {
  display: inline-flex;
  align-items: center;
  font-weight: 500;
}

.category-name-level-1 {
  color: #1d4ed8;
  font-size: 15px;
  font-weight: 700;
  /* 一级分类按 4 个中文字符作为对齐基准，短名称向右贴齐，避免“食品”“数码”显得偏左。 */
  min-width: 4em;
  padding-left: 0;
  text-align: right;
}

.category-name-level-2 {
  color: #059669;
  font-size: 14px;
  font-weight: 600;
  padding-left: 0;
}

.category-name-level-3 {
  color: #d97706;
  font-size: 13.5px;
  font-weight: 500;
  padding-left: 8px;
}

.category-name-level-4 {
  color: #7c3aed;
  font-size: 13px;
  font-weight: 400;
  padding-left: 16px;
}

.category-name-level-5 {
  color: #dc2626;
  font-size: 12.5px;
  font-weight: 400;
  padding-left: 24px;
}

:deep(.category-level-tag-2 .el-tag__content) {
  color: #059669;
}

:deep(.category-level-tag-3 .el-tag__content) {
  color: #d97706;
}

:deep(.category-level-tag-4 .el-tag__content) {
  color: #7c3aed;
}

:deep(.category-level-tag-5 .el-tag__content) {
  color: #dc2626;
}
</style>
