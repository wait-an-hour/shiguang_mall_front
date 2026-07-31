<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
const auth=useAuthStore(); const router=useRouter()
function logout(){auth.clearSession();router.replace('/shop/login')}
</script>
<template><main class="shop-placeholder"><el-card class="sg-card" shadow="never"><h1>商家端占位</h1><p>当前账号已被隔离到 /shop，不能访问 /admin 平台管理员后台。</p><el-button type="primary" @click="logout">退出商家账号</el-button></el-card></main></template>
<style scoped lang="scss">.shop-placeholder{display:grid;min-height:100vh;place-items:center;padding:24px;}h1{margin-top:0;}</style>
