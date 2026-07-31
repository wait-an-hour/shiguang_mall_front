<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <main class="result-page">
    <el-result icon="warning" title="无权访问" sub-title="当前账号没有访问该页面或店铺的权限。">
      <template #extra>
        <el-button type="primary" @click="router.push('/merchant/shops')">返回店铺选择</el-button>
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
