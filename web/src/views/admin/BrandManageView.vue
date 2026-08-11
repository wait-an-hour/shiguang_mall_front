<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import PageHeader from '@/components/common/PageHeader.vue'
import SearchPanel from '@/components/common/SearchPanel.vue'
import StatusTag from '@/components/common/StatusTag.vue'
import AppPagination from '@/components/common/AppPagination.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ConfirmActionButton from '@/components/common/ConfirmActionButton.vue'
import { listBrands, saveBrand, setBrandStatus } from '@/api/admin/catalog'
import { useAdminFiltersStore } from '@/stores/adminFilters'
import type { BrandRecord } from '@/types/admin'
const key='brands'; const fs=useAdminFiltersStore(); const query=reactive(fs.getFilter(key)); const loading=ref(false); const total=ref(0); const rows=ref<BrandRecord[]>([]); const dialogVisible=ref(false); const form=reactive<BrandRecord>({id:'',name:'',initial:'',status:'ENABLED',createdAt:''})
async function loadData(){loading.value=true;fs.setFilter(key,query);const data=await listBrands(query);rows.value=data.items;total.value=data.total;loading.value=false}
function openEdit(row?:BrandRecord){Object.assign(form,row??{id:'',name:'',initial:'',status:'ENABLED',createdAt:''});dialogVisible.value=true}
async function submit(){await saveBrand({...form});ElMessage.success('品牌已保存');dialogVisible.value=false;loadData()}
async function toggle(row:BrandRecord){await setBrandStatus(row.id,row.status==='ENABLED'?'DISABLED':'ENABLED');ElMessage.success('品牌状态已更新');loadData()}
onMounted(loadData)
</script>
<template><div class="page-view"><PageHeader title="品牌管理" description="维护平台统一品牌库，减少商家重复录入并保证商品筛选口径一致。"><template #actions><el-button type="primary" @click="openEdit()">新增品牌</el-button></template></PageHeader><SearchPanel><el-form><el-form-item label="关键词"><el-input v-model="query.keyword" clearable placeholder="品牌名/品牌编码" /></el-form-item><el-form-item label="状态"><el-select v-model="query.status" clearable><el-option label="启用" value="ENABLED"/><el-option label="停用" value="DISABLED"/></el-select></el-form-item><el-button type="primary" @click="loadData">查询</el-button></el-form></SearchPanel><el-card class="sg-card" shadow="never" v-loading="loading"><el-table v-if="rows.length" :data="rows"><el-table-column prop="name" label="品牌名称"/><el-table-column prop="code" label="品牌编码"/><el-table-column label="状态"><template #default="{row}"><StatusTag :label="row.status==='ENABLED'?'启用':'停用'" :type="row.status==='ENABLED'?'success':'danger'"/></template></el-table-column><el-table-column label="操作"><template #default="{row}"><div class="table-actions"><el-button link type="primary" @click="openEdit(row)">编辑</el-button><ConfirmActionButton :text="row.status==='ENABLED'?'停用':'启用'" confirm-text="确认变更该品牌状态？" @confirm="toggle(row)"/></div></template></el-table-column></el-table><EmptyState v-else description="暂无品牌，请调整筛选条件"/><AppPagination :page="query.page!" :page-size="query.pageSize!" :total="total" @change="Object.assign(query,$event);loadData()"/></el-card><el-dialog v-model="dialogVisible" title="品牌信息"><el-form :model="form" label-width="90px"><el-form-item label="品牌名" required><el-input v-model="form.name" maxlength="64"/></el-form-item><el-form-item label="品牌编码" required><el-input v-model="form.code" :formatter="formatBrandCode" maxlength="64" placeholder="例如 TEST_BRAND" :disabled="Boolean(form.id)"/></el-form-item></el-form><template #footer><el-button @click="dialogVisible=false">取消</el-button><el-button type="primary" @click="submit">保存</el-button></template></el-dialog></div></template>
