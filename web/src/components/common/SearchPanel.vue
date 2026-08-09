<template>
  <el-card class="sg-card search-panel" shadow="never">
    <!-- 搜索区统一包裹 Element Plus 表单，保证所有后台列表过滤栏间距、卡片边框与 demo 商家端一致。 -->
    <slot />
  </el-card>
</template>

<style scoped lang="scss">
.search-panel :deep(.el-form) {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 16px;
  align-items: center;
}

.search-panel :deep(.el-form-item) {
  margin-bottom: 0;
}

.search-panel :deep(.el-select) {
  /* 筛选区的状态下拉如果没有明确宽度，会在横向表单布局里被压缩到只剩清除图标；这里给统一的最小宽度，保证选中值能正常显示。 */
  min-width: 140px;
}
</style>
