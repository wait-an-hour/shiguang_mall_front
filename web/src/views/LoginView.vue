<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, type FormRules } from 'element-plus'
import logoUrl from '@/assets/shiguang-logo.png'
import { ROUTE_NAME } from '@/constants/routes'
import { useAdminAuthStore } from '@/stores/adminAuth'
import { useAuthStore } from '@/stores/auth'
import { useMerchantStore } from '@/stores/merchant'
import type { PlatformUser } from '@/types/admin'

type LoginRole = 'SUPER_ADMIN' | 'MERCHANT'

interface LoginForm {
  role: LoginRole
  username: string
  password: string
}

const route = useRoute()
const router = useRouter()
const adminAuth = useAdminAuthStore()
const merchantAuth = useAuthStore()
const merchantStore = useMerchantStore()
const loading = ref(false)

const form = reactive<LoginForm>({
  role: 'SUPER_ADMIN',
  username: 'admin',
  password: 'admin123'
})

const rules: FormRules<LoginForm> = {
  role: [{ required: true, message: '请选择登录身份', trigger: 'change' }],
  username: [
    { required: true, message: '请输入账号', trigger: 'blur' },
    { min: 3, max: 20, message: '账号长度需为 3-20 位', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度需为 6-20 位', trigger: 'blur' }
  ]
}

function createMockAdminUser(): PlatformUser {
  // 登录页只做前端演示鉴权：管理员身份写入管理端独立 store，避免影响商家端 mock auth。
  return {
    id: 'mock-admin',
    username: form.username,
    displayName: '平台管理员',
    role: 'SUPER_ADMIN',
    permissions: [
      'admin:dashboard:view',
      'admin:rbac:role',
      'admin:rbac:account',
      'admin:catalog:category',
      'admin:catalog:brand',
      'admin:product:view',
      'admin:product:audit',
      'admin:inventory:view',
      'admin:order:view',
      'admin:after-sale:audit'
    ],
    status: 'ACTIVE'
  }
}

function validateMockAccount() {
  // Mock 账号规则保持简单明确，方便课堂演示：管理员 admin/admin123，商家 merchant/merchant123。
  if (form.role === 'SUPER_ADMIN') return form.username === 'admin' && form.password === 'admin123'
  return form.username === 'merchant' && form.password === 'merchant123'
}

async function submit() {
  loading.value = true
  try {
    await new Promise((resolve) => window.setTimeout(resolve, 240))
    if (!validateMockAccount()) throw new Error('账号、密码或身份选择不正确')

    if (form.role === 'MERCHANT') {
      merchantAuth.setMockMerchantSession()
      merchantStore.setCurrentShop('SHOP202607260001')
      ElMessage.success('登录成功')
      await router.replace({ name: ROUTE_NAME.MerchantEntry })
      return
    }

    const token = `mock-token-${form.role.toLowerCase()}-${Date.now()}`
    adminAuth.setSession(token, createMockAdminUser())
    ElMessage.success('登录成功')
    await router.replace(String(route.query.redirect || '/admin'))
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '登录失败')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="auth-page">
    <el-card class="auth-card sg-card" shadow="never">
      <section class="auth-brand">
        <img :src="logoUrl" alt="时光电商平台" />
        <div>
          <h1>时光管理中心</h1>
          <p>请选择管理员或商家身份登录</p>
        </div>
      </section>

      <el-form :model="form" :rules="rules" label-position="top" @keyup.enter="submit">
        <el-form-item label="登录身份" prop="role">
          <el-radio-group v-model="form.role">
            <el-radio-button label="SUPER_ADMIN">管理员</el-radio-button>
            <el-radio-button label="MERCHANT">商家</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="账号" prop="username">
          <el-input v-model="form.username" clearable placeholder="管理员 admin；商家 merchant" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" show-password placeholder="管理员 admin123；商家 merchant123" />
        </el-form-item>
        <el-button type="primary" :loading="loading" class="auth-button" @click="submit">登录</el-button>
      </el-form>

      <div class="auth-footer">
        <span>还没有商家账号？</span>
        <router-link to="/register">立即注册</router-link>
      </div>
    </el-card>
  </main>
</template>

<style scoped lang="scss">
.auth-page {
  position: relative;
  display: grid;
  min-height: 100vh;
  place-items: center;
  overflow: hidden;
  padding: 24px;
  background:
    radial-gradient(circle at 18% 22%, rgba(96, 165, 250, 0.18), transparent 28%),
    radial-gradient(circle at 82% 18%, rgba(251, 191, 36, 0.14), transparent 24%),
    linear-gradient(135deg, #f8fbff 0%, #eef6ff 42%, #f7fbff 100%);
}

.auth-page::before {
  // 底层虚化光晕用于营造晨昏交替的柔和时光感，透明度较低，不干扰登录卡片阅读。
  position: absolute;
  inset: -18%;
  z-index: 0;
  background:
    radial-gradient(circle at 30% 35%, rgba(37, 99, 235, 0.16), transparent 30%),
    radial-gradient(circle at 70% 68%, rgba(14, 165, 233, 0.12), transparent 32%),
    radial-gradient(circle at 52% 45%, rgba(250, 204, 21, 0.1), transparent 26%);
  filter: blur(34px);
  content: '';
}

.auth-page::after {
  // 细密点阵与刻度线隐喻时间流转，层级放在背景最底部，仅提供轻量装饰。
  position: absolute;
  inset: 0;
  z-index: 0;
  background-image:
    radial-gradient(circle, rgba(37, 99, 235, 0.12) 1px, transparent 1px),
    linear-gradient(90deg, rgba(37, 99, 235, 0.055) 1px, transparent 1px),
    linear-gradient(180deg, rgba(37, 99, 235, 0.04) 1px, transparent 1px);
  background-position: 0 0, center, center;
  background-size: 28px 28px, 96px 96px, 96px 96px;
  mask-image: linear-gradient(120deg, transparent 0%, #000 20%, #000 72%, transparent 100%);
  content: '';
}

.auth-card {
  position: relative;
  z-index: 1;
  width: 430px;
  padding: 12px;
  border-color: rgba(226, 232, 240, 0.9);
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 18px 48px rgba(37, 99, 235, 0.12), 0 6px 20px rgba(15, 23, 42, 0.08);
  backdrop-filter: blur(12px);
}

.auth-brand { display: flex; align-items: center; gap: 14px; margin-bottom: 24px; }
.auth-brand img { width: 46px; height: 46px; border-radius: 10px; object-fit: cover; }
h1 { margin: 0; font-size: 24px; font-weight: 700; }
p { margin: 6px 0 0; color: var(--sg-text-secondary); font-size: 13px; }
.auth-button { width: 100%; }
.auth-footer { display: flex; justify-content: center; gap: 8px; margin-top: 18px; color: var(--sg-text-secondary); }
.auth-footer a { color: var(--sg-primary); font-weight: 600; }
</style>
