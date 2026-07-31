<script setup lang="ts">
defineProps<{ title: string; description?: string }>()
</script>

<template>
  <section class="page-header">
    <div>
      <h1 class="page-title">{{ title }}</h1>
      <p v-if="description" class="page-desc">{{ description }}</p>
    </div>
    <div v-if="$slots.actions" class="page-actions"><slot name="actions" /></div>
  </section>
</template>

<style scoped lang="scss">
.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.page-title { margin: 0; color: var(--sg-text-primary); font-size: 20px; font-weight: 600; }
.page-desc { margin: 8px 0 0; color: var(--sg-text-secondary); font-size: 13px; }
.page-actions { display: flex; gap: 8px; }
</style>
