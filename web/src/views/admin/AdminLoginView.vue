<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, type FormRules } from 'element-plus'
import logoUrl from '@/assets/shiguang-logo.png'
import { loginAdmin } from '@/api/admin/auth'
import { useAdminAuthStore } from '@/stores/adminAuth'

const route = useRoute()
const router = useRouter()
const auth = useAdminAuthStore()
const loading = ref(false)
const form = reactive({ username: 'admin', password: 'admin123' })
const rules: FormRules = { username: [{ required: true, message: '请输入账号', trigger: 'blur' }], password: [{ required: true, message: '请输入密码', trigger: 'blur' }] }

async function submit() {
  loading.value = true
  try {
    const { token, user } = await loginAdmin(form.username.trim(), form.password)
    auth.setSession(token, user)
    await router.replace(user.role === 'MERCHANT' ? '/merchant' : String(route.query.redirect || '/admin'))
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '登录失败')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="login-page">
    <el-card class="login-card sg-card" shadow="never">
      <div class="login-brand"><img :src="logoUrl" alt="时光电商平台" /><div><h1>平台管理员登录</h1><p>账号 admin / admin123；商家隔离账号 merchant / merchant123</p></div></div>
      <el-form :model="form" :rules="rules" label-position="top" @keyup.enter="submit">
        <el-form-item label="账号" prop="username"><el-input v-model="form.username" placeholder="请输入管理员账号" /></el-form-item>
        <el-form-item label="密码" prop="password"><el-input v-model="form.password" type="password" show-password placeholder="请输入密码" /></el-form-item>
        <el-button type="primary" :loading="loading" class="login-button" @click="submit">登录平台后台</el-button>
      </el-form>
    </el-card>
  </main>
</template>

<style scoped lang="scss">
.login-page { display: grid; min-height: 100vh; place-items: center; background: var(--sg-page-bg); }
.login-card { width: 420px; padding: 10px; }
.login-brand { display: flex; gap: 14px; align-items: center; margin-bottom: 24px; }
.login-brand img { width: 44px; height: 44px; border-radius: 10px; }
h1 { margin: 0; font-size: 22px; } p { margin: 6px 0 0; color: var(--sg-text-secondary); font-size: 13px; }
.login-button { width: 100%; }
</style>
