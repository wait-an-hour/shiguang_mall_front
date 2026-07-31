<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminAuthStore } from '@/stores/adminAuth'

const router = useRouter()
const adminAuth = useAdminAuthStore()

const backTarget = computed(() => adminAuth.isLoggedIn ? '/admin' : '/merchant/shops')
const backText = computed(() => adminAuth.isLoggedIn ? '返回后台首页' : '返回店铺选择')
</script>

<template>
  <main class="result-page">
    <el-result icon="warning" title="无权访问" sub-title="当前账号没有访问该页面或店铺的权限。">
      <template #extra>
        <el-button type="primary" @click="router.push(backTarget)">{{ backText }}</el-button>
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
