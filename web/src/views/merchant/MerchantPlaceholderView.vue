<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const pageTitle = computed(() => route.meta.title || '商家模块')
</script>

<template>
  <div class="page-view">
    <section class="page-header">
      <div>
        <h1 class="page-title">{{ pageTitle }}</h1>
        <p class="page-description">该模块已接入商家端框架、路由和权限控制，后续可按后端接口继续开发。</p>
      </div>
    </section>

    <el-card class="page-card" shadow="never">
      <el-empty description="页面功能开发中" />
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.page-view {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.page-title {
  margin: 0;
  color: #111827;
  font-size: 20px;
  font-weight: 600;
}

.page-description {
  margin: 8px 0 0;
  color: #6b7280;
  font-size: 13px;
}

.page-card {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
}
</style>
