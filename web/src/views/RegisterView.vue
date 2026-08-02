<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import logoUrl from '@/assets/shiguang-logo.png'
import { useAuthStore } from '@/stores/auth'

interface RegisterForm {
  nickname: string
  username: string
  phone: string
  email: string
  password: string
  confirmPassword: string
}

const router = useRouter()
const authStore = useAuthStore()
const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive<RegisterForm>({
  nickname: '',
  username: '',
  phone: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const rules: FormRules<RegisterForm> = {
  nickname: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
  username: [
    { required: true, message: '请输入账号', trigger: 'blur' },
    { pattern: /^[a-zA-Z][a-zA-Z0-9_]{3,63}$/, message: '账号需以字母开头，支持字母数字下划线，4-64 位', trigger: 'blur' }
  ],
  phone: [{ min: 6, max: 32, message: '手机号长度需为 6-32 位', trigger: 'blur' }],
  email: [{ type: 'email', message: '请输入正确的邮箱', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 8, max: 72, message: '密码长度需为 8-72 位', trigger: 'blur' },
    { pattern: /^(?=.*[A-Za-z])(?=.*[0-9]).+$/, message: '密码需同时包含字母和数字', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    {
      validator: (_rule, value: string, callback) => {
        if (value !== form.password) callback(new Error('两次输入的密码不一致'))
        else callback()
      },
      trigger: 'blur'
    }
  ]
}

async function submit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    await authStore.register({
      username: form.username.trim(),
      password: form.password,
      nickname: form.nickname.trim(),
      phone: form.phone.trim() || undefined,
      email: form.email.trim() || undefined
    })
    ElMessage.success('账号注册成功，请返回登录页登录')
    router.replace('/login')
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '注册失败，请稍后再试')
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
          <h1>账号注册</h1>
          <p>注册后可登录，商家店铺由平台开通或分配</p>
        </div>
      </section>

      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @keyup.enter="submit">
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="form.nickname" clearable placeholder="请输入昵称" />
        </el-form-item>
        <el-form-item label="账号" prop="username">
          <el-input v-model="form.username" clearable placeholder="字母开头，4-64 位" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" clearable placeholder="可选，6-32 位" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" clearable placeholder="可选，用于账号联系" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" show-password placeholder="8-72 位，需包含字母和数字" />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="form.confirmPassword" type="password" show-password placeholder="请再次输入密码" />
        </el-form-item>
        <el-button type="primary" :loading="loading" class="auth-button" @click="submit">注册账号</el-button>
      </el-form>

      <div class="auth-footer">
        <span>已有账号？</span>
        <router-link to="/login">返回登录</router-link>
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
