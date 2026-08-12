<script setup lang="ts">
import { reactive, watch, useTemplateRef } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import type { CreateShopRequest, PlatformShopView, UpdateShopRequest } from '@/types/admin'

interface ShopFormModel {
  shopName: string
  logoUrl: string
  description: string
  contactName: string
  contactPhone: string
  adminUsername: string
}

const props = defineProps<{
  mode: 'create' | 'edit'
  initialValue?: PlatformShopView | null
  submitting?: boolean
}>()

const emit = defineEmits<{
  submit: [payload: CreateShopRequest | UpdateShopRequest]
  cancel: []
}>()

const formRef = useTemplateRef<FormInstance>('formRef')
const form = reactive<ShopFormModel>({
  shopName: '',
  logoUrl: '',
  description: '',
  contactName: '',
  contactPhone: '',
  adminUsername: ''
})

const rules: FormRules<ShopFormModel> = {
  shopName: [
    { required: true, whitespace: true, message: '请输入店铺名称', trigger: 'blur' },
    { max: 128, message: '店铺名称不能超过 128 个字符', trigger: 'blur' }
  ],
  logoUrl: [{ max: 1024, message: 'Logo 地址不能超过 1024 个字符', trigger: 'blur' }],
  description: [{ max: 500, message: '店铺描述不能超过 500 个字符', trigger: 'blur' }],
  contactName: [{ max: 64, message: '联系人不能超过 64 个字符', trigger: 'blur' }],
  contactPhone: [{ max: 32, message: '联系电话不能超过 32 个字符', trigger: 'blur' }],
  adminUsername: [
    { required: true, whitespace: true, message: '请输入商家账号', trigger: 'blur' }
  ]
}

watch(
  () => props.initialValue,
  (value) => {
    Object.assign(form, {
      shopName: value?.shop.shopName ?? '',
      logoUrl: value?.shop.logoUrl ?? '',
      description: value?.description ?? '',
      contactName: value?.contactName ?? '',
      contactPhone: value?.contactPhone ?? '',
      adminUsername: ''
    })
    formRef.value?.clearValidate()
  },
  { immediate: true }
)

function nullable(value: string) {
  return value.trim() || null
}

async function submit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  const common: UpdateShopRequest = {
    shopName: form.shopName.trim(),
    logoUrl: nullable(form.logoUrl),
    description: nullable(form.description),
    contactName: nullable(form.contactName),
    contactPhone: nullable(form.contactPhone)
  }
  emit('submit', props.mode === 'create' ? { ...common, adminUsername: form.adminUsername.trim() } : common)
}
</script>

<template>
  <el-card class="sg-card form-card" shadow="never">
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @submit.prevent="submit">
      <div class="form-grid">
        <el-form-item label="店铺名称" prop="shopName">
          <el-input v-model="form.shopName" clearable maxlength="128" />
        </el-form-item>
        <el-form-item v-if="mode === 'create'" label="商家账号" prop="adminUsername">
          <el-input v-model="form.adminUsername" clearable maxlength="64" placeholder="填写已注册商家账号的 username" />
        </el-form-item>
        <el-form-item label="Logo 地址" prop="logoUrl" class="full-width">
          <el-input v-model="form.logoUrl" clearable maxlength="1024" placeholder="https://..." />
        </el-form-item>
        <el-form-item label="联系人" prop="contactName">
          <el-input v-model="form.contactName" clearable maxlength="64" />
        </el-form-item>
        <el-form-item label="联系电话" prop="contactPhone">
          <el-input v-model="form.contactPhone" clearable maxlength="32" />
        </el-form-item>
        <el-form-item label="店铺描述" prop="description" class="full-width">
          <el-input v-model="form.description" type="textarea" :rows="5" maxlength="500" show-word-limit />
        </el-form-item>
      </div>
      <div class="form-actions">
        <el-button :disabled="submitting" @click="emit('cancel')">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submit">保存</el-button>
      </div>
    </el-form>
  </el-card>
</template>

<style scoped lang="scss">
.form-card { max-width: 920px; }
.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 24px; }
.full-width { grid-column: 1 / -1; }
.form-actions { display: flex; justify-content: flex-end; gap: 8px; padding-top: 8px; border-top: 1px solid var(--sg-divider); }
</style>
