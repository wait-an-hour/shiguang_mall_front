<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormRules } from 'element-plus'
import logoUrl from '@/assets/图标.png'

interface RegisterForm {
  shopName: string
  username: string
  phone: string
  password: string
  confirmPassword: string
}

const router = useRouter()
const loading = ref(false)

const form = reactive<RegisterForm>({
  shopName: '',
  username: '',
  phone: '',
  password: '',
  confirmPassword: ''
})

const rules: FormRules<RegisterForm> = {
  shopName: [{ required: true, message: '请输入店铺名称', trigger: 'blur' }],
  username: [
    { required: true, message: '请输入商家账号', trigger: 'blur' },
    { pattern: /^[a-zA-Z][a-zA-Z0-9_]{2,19}$/, message: '账号需以字母开头，支持字母数字下划线，3-20 位', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度需为 6-20 位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    {
      validator: (_rule, value: string, callback) => {
        // 注册页只开放商家账号注册，因此这里仅校验两次密码一致，不生成管理员身份。
        if (value !== form.password) callback(new Error('两次输入的密码不一致'))
        else callback()
      },
      trigger: 'blur'
    }
  ]
}

async function submit() {
  loading.value = true
  try {
    await new Promise((resolve) => window.setTimeout(resolve, 240))
    localStorage.setItem('shiguang-merchant-register-demo', JSON.stringify({ shopName: form.shopName, username: form.username, phone: form.phone }))
    ElMessage.success('商家账号注册成功，请返回登录页使用商家身份登录')
    router.replace('/login')
  } catch {
    ElMessage.error('注册失败，请稍后再试')
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
          <h1>商家账号注册</h1>
          <p>管理员账号由平台线下分配，前端仅开放商家注册</p>
        </div>
      </section>

      <el-form :model="form" :rules="rules" label-position="top" @keyup.enter="submit">
        <el-form-item label="店铺名称" prop="shopName">
          <el-input v-model="form.shopName" clearable placeholder="请输入店铺名称" />
        </el-form-item>
        <el-form-item label="商家账号" prop="username">
          <el-input v-model="form.username" clearable placeholder="字母开头，3-20 位" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" clearable maxlength="11" placeholder="请输入负责人手机号" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" show-password placeholder="请输入 6-20 位密码" />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="form.confirmPassword" type="password" show-password placeholder="请再次输入密码" />
        </el-form-item>
        <el-button type="primary" :loading="loading" class="auth-button" @click="submit">注册商家账号</el-button>
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
  // 底层虚化光晕延续登录页的晨昏时光氛围，保持低透明度，避免影响注册表单填写。
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
  // 点阵与淡刻度统一登录页视觉，表达时间流转，同时放在底层不遮挡卡片。
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
