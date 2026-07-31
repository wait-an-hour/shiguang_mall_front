<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import PageHeader from '@/components/common/PageHeader.vue'
import StatusTag from '@/components/common/StatusTag.vue'
import ConfirmActionButton from '@/components/common/ConfirmActionButton.vue'
import { listCategories, saveCategory, setCategoryStatus } from '@/api/admin/catalog'
import type { CategoryRecord } from '@/types/admin'

const loading = ref(false)
const rows = ref<CategoryRecord[]>([])
const dialogVisible = ref(false)
const form = reactive<CategoryRecord>({ id: '', name: '', level: 1, sort: 1, status: 'ENABLED' })
async function loadData() { loading.value = true; rows.value = await listCategories(); loading.value = false }
function openEdit(row?: CategoryRecord) { Object.assign(form, row ?? { id: '', name: '', level: 1, sort: 1, status: 'ENABLED' }); dialogVisible.value = true }
async function submit() { await saveCategory({ ...form }); ElMessage.success('分类已保存'); dialogVisible.value = false; loadData() }
async function toggle(row: CategoryRecord) { await setCategoryStatus(row.id, row.status === 'ENABLED' ? 'DISABLED' : 'ENABLED'); ElMessage.success('分类状态已更新'); loadData() }
onMounted(loadData)
</script>
<template><div class="page-view"><PageHeader title="分类管理" description="维护全平台商品类目树，所有商家商品发布共用同一套分类基础数据。"><template #actions><el-button type="primary" @click="openEdit()">新增分类</el-button></template></PageHeader><el-card class="sg-card" shadow="never" v-loading="loading"><el-table :data="rows" row-key="id" default-expand-all><el-table-column prop="name" label="分类名称" /><el-table-column prop="level" label="层级" /><el-table-column prop="sort" label="排序" /><el-table-column label="状态"><template #default="{ row }"><StatusTag :label="row.status === 'ENABLED' ? '启用' : '停用'" :type="row.status === 'ENABLED' ? 'success' : 'danger'" /></template></el-table-column><el-table-column label="操作"><template #default="{ row }"><div class="table-actions"><el-button link type="primary" @click="openEdit(row)">编辑</el-button><ConfirmActionButton :text="row.status === 'ENABLED' ? '停用' : '启用'" confirm-text="确认变更该分类状态？" @confirm="toggle(row)" /></div></template></el-table-column></el-table></el-card><el-dialog v-model="dialogVisible" title="分类信息"><el-form :model="form" label-width="90px"><el-form-item label="名称"><el-input v-model="form.name" /></el-form-item><el-form-item label="层级"><el-input-number v-model="form.level" :min="1" :max="3" /></el-form-item><el-form-item label="排序"><el-input-number v-model="form.sort" :min="1" /></el-form-item></el-form><template #footer><el-button @click="dialogVisible=false">取消</el-button><el-button type="primary" @click="submit">保存</el-button></template></el-dialog></div></template>
