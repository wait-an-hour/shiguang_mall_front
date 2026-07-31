<script setup lang="ts">
const props = defineProps<{ label: string; type?: 'success' | 'warning' | 'danger' | 'info' }>()
</script>

<template>
  <span class="status-tag" :class="`is-${props.type ?? 'info'}`">{{ label }}</span>
</template>

<style scoped lang="scss">
.status-tag { display: inline-flex; align-items: center; min-height: 24px; padding: 0 9px; border-radius: 999px; font-size: 12px; }
.is-success { background: var(--sg-success-soft); color: var(--sg-success); }
.is-warning { background: var(--sg-warning-soft); color: var(--sg-warning); }
.is-danger { background: var(--sg-danger-soft); color: var(--sg-danger); }
.is-info { background: var(--sg-primary-soft); color: var(--sg-info); }
</style>
