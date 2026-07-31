<script setup lang="ts">
defineProps<{ page: number; pageSize: number; total: number }>()
const emit = defineEmits<{ change: [value: { page: number; pageSize: number }] }>()
</script>

<template>
  <div class="pagination-wrap">
    <el-pagination background layout="total, sizes, prev, pager, next" :current-page="page" :page-size="pageSize" :total="total" @update:current-page="(nextPage: number) => emit('change', { page: nextPage, pageSize })" @update:page-size="(nextSize: number) => emit('change', { page: 1, pageSize: nextSize })" />
  </div>
</template>

<style scoped lang="scss">
.pagination-wrap { display: flex; justify-content: flex-end; padding-top: 16px; }
</style>
