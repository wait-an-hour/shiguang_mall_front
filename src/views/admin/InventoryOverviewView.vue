<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import PageHeader from '@/components/common/PageHeader.vue'
import SearchPanel from '@/components/common/SearchPanel.vue'
import StatusTag from '@/components/common/StatusTag.vue'
import AppPagination from '@/components/common/AppPagination.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { listInventories } from '@/api/admin/products'
import { useAdminFiltersStore } from '@/stores/adminFilters'
import type { SkuInventory } from '@/types/admin'
const key='inventory'; const fs=useAdminFiltersStore(); const query=reactive(fs.getFilter(key)); const loading=ref(false); const total=ref(0); const rows=ref<SkuInventory[]>([])
async function loadData(){loading.value=true;fs.setFilter(key,query);const data=await listInventories(query);rows.value=data.items;total.value=data.total;loading.value=false}
onMounted(loadData)
</script>
<template><div class="page-view"><PageHeader title="库存总览" description="汇总所有商家 SKU 库存，低于预警线或缺货时突出提醒平台运营关注。"/><SearchPanel><el-form><el-form-item label="关键词"><el-input v-model="query.keyword" placeholder="商品/SKU/商家" clearable/></el-form-item><el-button type="primary" @click="loadData">查询</el-button></el-form></SearchPanel><el-card class="sg-card" shadow="never" v-loading="loading"><el-table v-if="rows.length" :data="rows"><el-table-column prop="productName" label="商品"/><el-table-column prop="skuName" label="SKU"/><el-table-column prop="shopName" label="商家"/><el-table-column prop="stock" label="可售库存"/><el-table-column prop="lockedStock" label="锁定库存"/><el-table-column label="库存状态"><template #default="{row}"><StatusTag v-if="row.stock===0" label="缺货" type="danger"/><StatusTag v-else-if="row.stock<=row.warningStock" label="库存预警" type="warning"/><StatusTag v-else label="充足" type="success"/></template></el-table-column></el-table><EmptyState v-else description="暂无 SKU 库存记录"/><AppPagination :page="query.page!" :page-size="query.pageSize!" :total="total" @change="Object.assign(query,$event);loadData()"/></el-card></div></template>
