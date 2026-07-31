<template>
  <main class="result-page">
    <el-result icon="info" title="页面不存在" sub-title="请检查地址是否正确，或返回商家端继续操作。">
      <template #extra>
        <el-button type="primary" @click="$router.push('/merchant')">返回商家端</el-button>
      </template>
    </el-result>
  </main>
</template>

<style scoped lang="scss">
.result-page {
  display: grid;
  min-height: 100vh;
  place-items: center;
  background: #f7f8fa;
}
</style>
