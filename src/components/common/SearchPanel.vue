<template>
  <el-card class="sg-card search-panel" shadow="never">
    <!-- 搜索区统一包裹 Element Plus 表单，保证所有后台列表过滤栏间距、卡片边框与 demo 商家端一致。 -->
    <slot />
  </el-card>
</template>

<style scoped lang="scss">
.search-panel :deep(.el-form) { display: flex; flex-wrap: wrap; gap: 12px 16px; align-items: center; }
.search-panel :deep(.el-form-item) { margin-bottom: 0; }
</style>
