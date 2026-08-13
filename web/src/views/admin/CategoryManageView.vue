<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import PageHeader from '@/components/common/PageHeader.vue'
import StatusTag from '@/components/common/StatusTag.vue'
import ConfirmActionButton from '@/components/common/ConfirmActionButton.vue'
import {
  createCategoryAttribute,
  listCategories,
  listCategoryAttributes,
  saveCategory,
  setCategoryAttributeStatus,
  setCategoryStatus,
  updateCategoryAttribute
} from '@/api/admin/catalog'
import type {
  CategoryAttributeRequest,
  CategoryAttributeValueType,
  CategoryAttributeView
} from '@/api/admin/catalog'
import type { CategoryRecord } from '@/types/admin'

interface AttributeForm extends CategoryAttributeRequest {
  id?: string
  status?: 'ENABLED' | 'DISABLED'
  optionText: string
}

const loading = ref(false)
const submitting = ref(false)
const rows = ref<CategoryRecord[]>([])
const dialogVisible = ref(false)
const form = reactive<CategoryRecord>({ id: '', name: '', parentId: '', level: 1, sort: 1, status: 'ENABLED' })
const draftAttributes = ref<AttributeForm[]>([])

const attributeDialogVisible = ref(false)
const attributeLoading = ref(false)
const attributeSubmitting = ref(false)
const currentCategory = ref<CategoryRecord | null>(null)
const attributes = ref<CategoryAttributeView[]>([])
const attributeEditorVisible = ref(false)
const attributeForm = reactive<AttributeForm>(createEmptyAttribute())

const valueTypeOptions: Array<{ label: string; value: CategoryAttributeValueType }> = [
  { label: '文本', value: 'TEXT' },
  { label: '数字', value: 'NUMBER' },
  { label: '是/否', value: 'BOOLEAN' },
  { label: '选项', value: 'OPTION' }
]

const parentCategoryOptions = computed(() => {
  const options: Array<{ label: string; value: string }> = []
  const walk = (items: CategoryRecord[], prefix = '') => {
    items.forEach((item) => {
      if (item.id !== form.id && item.level < 5) {
        options.push({ label: `${prefix}${item.name}`, value: item.id })
      }
      if (item.children?.length) walk(item.children, `${prefix}└─ `)
    })
  }
  walk(rows.value)
  return options
})

function createEmptyAttribute(sortOrder = 1): AttributeForm {
  return {
    attributeName: '',
    valueType: 'TEXT',
    unit: '',
    required: false,
    filterable: false,
    sortOrder,
    optionText: ''
  }
}

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
  draftAttributes.value = []
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
  Object.assign(form, {
    id: '',
    name: '',
    code: '',
    parentId: parent.id,
    level: parent.level + 1,
    sort: 1,
    status: 'ENABLED'
  })
  draftAttributes.value = []
  dialogVisible.value = true
}

function handleParentChange(parentId: string) {
  form.parentId = parentId
  const parent = findCategoryById(rows.value, parentId)
  form.level = parent ? parent.level + 1 : 1
}

function addDraftAttribute() {
  draftAttributes.value.push(createEmptyAttribute(draftAttributes.value.length + 1))
}

function getErrorMessage(error: unknown) {
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message
  }
  return '操作失败，请稍后重试'
}

function toAttributeRequest(item: AttributeForm): CategoryAttributeRequest {
  const options = item.optionText.split(/[，,\n]/).map((value) => value.trim()).filter(Boolean)
  return {
    attributeName: item.attributeName.trim(),
    valueType: item.valueType,
    unit: item.unit?.trim() || undefined,
    required: item.required,
    filterable: item.filterable,
    ...(item.valueType === 'OPTION' ? { options: [...new Set(options)] } : {}),
    sortOrder: item.sortOrder
  }
}

function validateAttribute(item: AttributeForm) {
  if (!item.attributeName.trim()) return '请填写属性名称'
  if (item.valueType === 'OPTION') {
    const options = toAttributeRequest(item).options ?? []
    if (!options.length) return `属性“${item.attributeName}”至少需要一个选项`
  }
  return ''
}

async function submit() {
  if (!form.name.trim()) {
    ElMessage.warning('请填写分类名称')
    return
  }
  for (const item of draftAttributes.value) {
    const error = validateAttribute(item)
    if (error) {
      ElMessage.warning(error)
      return
    }
  }

  submitting.value = true
  try {
    const saved = await saveCategory({ ...form })
    if (!form.id && draftAttributes.value.length) {
      try {
        for (const item of draftAttributes.value) {
          await createCategoryAttribute(saved.id, toAttributeRequest(item))
        }
      } catch (error) {
        ElMessage.warning(`分类已创建，但部分属性保存失败：${getErrorMessage(error)}`)
        dialogVisible.value = false
        await loadData()
        return
      }
    }
    ElMessage.success('分类已保存')
    dialogVisible.value = false
    await loadData()
  } catch (error) {
    ElMessage.error(getErrorMessage(error))
  } finally {
    submitting.value = false
  }
}

async function toggle(row: CategoryRecord) {
  await setCategoryStatus(row.id, row.status === 'ENABLED' ? 'DISABLED' : 'ENABLED')
  ElMessage.success('分类状态已更新')
  await loadData()
}

async function openAttributeManage(row: CategoryRecord) {
  currentCategory.value = row
  attributeDialogVisible.value = true
  await loadAttributes()
}

async function loadAttributes() {
  if (!currentCategory.value) return
  attributeLoading.value = true
  try {
    attributes.value = await listCategoryAttributes(currentCategory.value.id)
  } catch (error) {
    ElMessage.error(getErrorMessage(error))
  } finally {
    attributeLoading.value = false
  }
}

function openAttributeEditor(item?: CategoryAttributeView) {
  Object.assign(
    attributeForm,
    item
      ? {
          id: item.id,
          status: item.status,
          attributeName: item.attributeName,
          valueType: item.valueType,
          unit: item.unit ?? '',
          required: item.required,
          filterable: item.filterable,
          sortOrder: item.sortOrder,
          // 非选项类属性没有可选值，接口为空时这里保持空字符串，确保编辑弹窗可以正常打开。
          optionText: item.options?.join('\n') ?? ''
        }
      : createEmptyAttribute(attributes.value.length + 1)
  )
  attributeEditorVisible.value = true
}

async function submitAttribute() {
  if (!currentCategory.value) return
  const error = validateAttribute(attributeForm)
  if (error) {
    ElMessage.warning(error)
    return
  }
  attributeSubmitting.value = true
  try {
    const payload = toAttributeRequest(attributeForm)
    if (attributeForm.id) {
      await updateCategoryAttribute(currentCategory.value.id, attributeForm.id, payload)
    } else {
      await createCategoryAttribute(currentCategory.value.id, payload)
    }
    ElMessage.success('类目属性已保存')
    attributeEditorVisible.value = false
    await loadAttributes()
  } catch (submitError) {
    ElMessage.error(getErrorMessage(submitError))
  } finally {
    attributeSubmitting.value = false
  }
}

async function toggleAttribute(item: CategoryAttributeView) {
  if (!currentCategory.value) return
  const targetStatus = item.status === 'ENABLED' ? 'DISABLED' : 'ENABLED'
  try {
    await setCategoryAttributeStatus(currentCategory.value.id, item.id, targetStatus)
    ElMessage.success('属性状态已更新')
    await loadAttributes()
  } catch (error) {
    ElMessage.error(getErrorMessage(error))
  }
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

function getValueTypeLabel(valueType: CategoryAttributeValueType) {
  return valueTypeOptions.find((item) => item.value === valueType)?.label ?? valueType
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
      <el-table :data="rows" row-key="id" default-expand-all :indent="12" :row-class-name="getCategoryRowClassName">
        <el-table-column label="分类名称" min-width="220">
          <template #default="{ row }">
            <span class="category-name" :class="`category-name-level-${row.level}`">{{ row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column label="层级" width="100">
          <template #default="{ row }">
            <el-tag :type="getLevelTagType(row.level)" effect="light" :class="`category-level-tag-${row.level}`">{{ row.level }} 级</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="90" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <StatusTag :label="row.status === 'ENABLED' ? '启用' : '停用'" :type="row.status === 'ENABLED' ? 'success' : 'danger'" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="300">
          <template #default="{ row }">
            <div class="table-actions">
              <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
              <el-button v-if="!row.children?.length" link type="primary" @click="openAttributeManage(row)">属性管理</el-button>
              <el-button v-if="row.level < 5" link type="primary" @click="openCreateChild(row)">添加子类</el-button>
              <ConfirmActionButton :text="row.status === 'ENABLED' ? '停用' : '启用'" confirm-text="确认变更该分类状态？" @confirm="toggle(row)" />
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑分类' : '新增分类'" width="760px">
      <el-form :model="form" label-width="90px">
        <el-form-item label="父分类">
          <el-select v-model="form.parentId" clearable placeholder="不选择则创建一级分类" @change="handleParentChange">
            <el-option v-for="item in parentCategoryOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="名称" required><el-input v-model="form.name" maxlength="64" /></el-form-item>
        <el-form-item label="层级"><el-input-number v-model="form.level" :min="1" :max="5" disabled /></el-form-item>
        <el-form-item label="排序"><el-input-number v-model="form.sort" :min="1" /></el-form-item>
      </el-form>

      <section v-if="!form.id" class="attribute-draft-section">
        <div class="section-header">
          <div>
            <h3>类目属性</h3>
            <p>分类创建成功后自动保存。若后续添加子类，该分类将不再允许维护属性。</p>
          </div>
          <el-button @click="addDraftAttribute">添加属性</el-button>
        </div>
        <el-empty v-if="!draftAttributes.length" :image-size="56" description="暂未配置类目属性" />
        <div v-for="(item, index) in draftAttributes" :key="index" class="attribute-draft-row">
          <el-input v-model="item.attributeName" maxlength="64" placeholder="属性名称" />
          <el-select v-model="item.valueType">
            <el-option v-for="option in valueTypeOptions" :key="option.value" :label="option.label" :value="option.value" />
          </el-select>
          <el-input v-model="item.unit" maxlength="32" placeholder="单位（可选）" />
          <el-checkbox v-model="item.required">必填</el-checkbox>
          <el-checkbox v-model="item.filterable">可筛选</el-checkbox>
          <el-button text type="danger" @click="draftAttributes.splice(index, 1)">移除</el-button>
          <el-input v-if="item.valueType === 'OPTION'" v-model="item.optionText" class="option-input" type="textarea" :rows="2" placeholder="每行或逗号分隔一个选项" />
        </div>
      </section>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submit">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="attributeDialogVisible" :title="`${currentCategory?.name ?? ''} · 属性管理`" width="860px">
      <div class="attribute-toolbar">
        <span>只有叶子类目允许维护属性模板。</span>
        <el-button type="primary" @click="openAttributeEditor()">新增属性</el-button>
      </div>
      <el-table v-loading="attributeLoading" :data="attributes">
        <el-table-column prop="attributeName" label="属性名称" min-width="140" />
        <el-table-column label="类型" width="90"><template #default="{ row }">{{ getValueTypeLabel(row.valueType) }}</template></el-table-column>
        <el-table-column prop="unit" label="单位" width="90"><template #default="{ row }">{{ row.unit || '-' }}</template></el-table-column>
        <el-table-column label="规则" min-width="150">
          <template #default="{ row }">
            <el-tag v-if="row.required" size="small" type="warning">必填</el-tag>
            <el-tag v-if="row.filterable" size="small" type="info">可筛选</el-tag>
            <span v-if="!row.required && !row.filterable">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="sortOrder" label="排序" width="80" />
        <el-table-column label="状态" width="90"><template #default="{ row }"><StatusTag :label="row.status === 'ENABLED' ? '启用' : '停用'" :type="row.status === 'ENABLED' ? 'success' : 'danger'" /></template></el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button link type="primary" @click="openAttributeEditor(row)">编辑</el-button>
            <el-button link :type="row.status === 'ENABLED' ? 'danger' : 'success'" @click="toggleAttribute(row)">{{ row.status === 'ENABLED' ? '停用' : '启用' }}</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!attributeLoading && !attributes.length" :image-size="64" description="暂无类目属性" />
    </el-dialog>

    <el-dialog v-model="attributeEditorVisible" :title="attributeForm.id ? '编辑属性' : '新增属性'" width="560px" append-to-body>
      <el-form :model="attributeForm" label-width="90px">
        <el-form-item label="属性名称" required><el-input v-model="attributeForm.attributeName" maxlength="64" /></el-form-item>
        <el-form-item label="属性类型" required>
          <el-select v-model="attributeForm.valueType">
            <el-option v-for="item in valueTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="单位"><el-input v-model="attributeForm.unit" maxlength="32" placeholder="如 cm、kg" /></el-form-item>
        <el-form-item v-if="attributeForm.valueType === 'OPTION'" label="可选值" required>
          <el-input v-model="attributeForm.optionText" type="textarea" :rows="4" placeholder="每行或逗号分隔一个选项" />
        </el-form-item>
        <el-form-item label="属性规则">
          <el-checkbox v-model="attributeForm.required">商家必填</el-checkbox>
          <el-checkbox v-model="attributeForm.filterable">可用于筛选</el-checkbox>
        </el-form-item>
        <el-form-item label="排序"><el-input-number v-model="attributeForm.sortOrder" :min="1" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="attributeEditorVisible = false">取消</el-button>
        <el-button type="primary" :loading="attributeSubmitting" @click="submitAttribute">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
:deep(.category-row-level-1) { --el-table-tr-bg-color: #f8fbff; }
:deep(.category-row-level-2) { --el-table-tr-bg-color: #f8fffb; }
:deep(.category-row-level-3) { --el-table-tr-bg-color: #fffaf2; }
.category-name { display: inline-flex; align-items: center; min-width: 0; font-weight: 500; }
.category-name-level-1 { color: #1d4ed8; font-size: 15px; font-weight: 700; }
.category-name-level-2 { color: #059669; font-size: 14px; font-weight: 600; }
.category-name-level-3 { color: #d97706; font-size: 13.5px; }
.category-name-level-4 { color: #7c3aed; font-size: 13px; }
.category-name-level-5 { color: #dc2626; font-size: 12.5px; }
:deep(.category-level-tag-2 .el-tag__content) { color: #059669; }
:deep(.category-level-tag-3 .el-tag__content) { color: #d97706; }
:deep(.category-level-tag-4 .el-tag__content) { color: #7c3aed; }
:deep(.category-level-tag-5 .el-tag__content) { color: #dc2626; }
.table-actions { display: flex; align-items: center; gap: 8px; white-space: nowrap; }
.attribute-draft-section { margin-top: 8px; padding-top: 16px; border-top: 1px solid #e5e7eb; }
.section-header, .attribute-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.section-header h3 { margin: 0; color: #111827; font-size: 16px; }
.section-header p, .attribute-toolbar span { margin: 4px 0 0; color: #6b7280; font-size: 13px; }
.attribute-draft-row { display: grid; grid-template-columns: 1.5fr 110px 110px auto auto auto; gap: 8px; align-items: center; margin-top: 12px; padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; }
.option-input { grid-column: 1 / -1; }
.attribute-toolbar { margin-bottom: 16px; }
:deep(.el-tag + .el-tag) { margin-left: 4px; }
</style>
