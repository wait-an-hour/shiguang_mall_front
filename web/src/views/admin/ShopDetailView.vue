<script setup lang="ts">
import { computed, onMounted, reactive, shallowRef, useTemplateRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import PageHeader from '@/components/common/PageHeader.vue'
import StatusTag from '@/components/common/StatusTag.vue'
import { getPlatformShopDetail, setPlatformShopStatus } from '@/api/admin/shops'
import { ROUTE_NAME } from '@/constants/routes'
import type { PlatformShopView, ShopStatus } from '@/types/admin'
import { SHOP_STATUS_LABEL, SHOP_STATUS_TYPE } from '@/utils/labels'

const route = useRoute()
const router = useRouter()
const shopId = route.params.shopId as string
const detail = shallowRef<PlatformShopView | null>(null)
const loading = shallowRef(false)
const errorMessage = shallowRef('')
const statusVisible = shallowRef(false)
const statusSubmitting = shallowRef(false)
const statusFormRef = useTemplateRef<FormInstance>('statusFormRef')
const statusForm = reactive({ targetStatus: 'ACTIVE' as ShopStatus, reason: '' })
const transitions: Record<ShopStatus, ShopStatus[]> = { PENDING: ['ACTIVE', 'CLOSED'], ACTIVE: ['SUSPENDED', 'CLOSED'], SUSPENDED: ['ACTIVE', 'CLOSED'], CLOSED: [] }
const availableStatuses = computed(() => detail.value ? transitions[detail.value.shop.status] : [])
const statusRules: FormRules<typeof statusForm> = { reason: [{ required: true, whitespace: true, message: '请输入状态变更原因', trigger: 'blur' }, { max: 500, message: '原因不能超过 500 个字符', trigger: 'blur' }] }

function formatDate(value: string) { return new Date(value).toLocaleString('zh-CN') }
async function loadDetail() { loading.value = true; errorMessage.value = ''; try { detail.value = await getPlatformShopDetail(shopId) } catch (error) { errorMessage.value = error instanceof Error ? error.message : '店铺详情加载失败' } finally { loading.value = false } }
function openStatus(targetStatus: ShopStatus) { statusForm.targetStatus = targetStatus; statusForm.reason = ''; statusFormRef.value?.clearValidate(); statusVisible.value = true }

async function submitStatus() {
  if (!detail.value || !(await statusFormRef.value?.validate().catch(() => false))) return
  const confirmed = await ElMessageBox.confirm(`确认将店铺状态变更为“${SHOP_STATUS_LABEL[statusForm.targetStatus]}”吗？`, '确认状态变更', { type: 'warning' }).then(() => true).catch(() => false)
  if (!confirmed) return
  statusSubmitting.value = true
  try {
    await setPlatformShopStatus(shopId, statusForm.targetStatus, statusForm.reason.trim())
    ElMessage.success('店铺状态已更新')
    statusVisible.value = false
    await loadDetail()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '店铺状态更新失败')
  } finally { statusSubmitting.value = false }
}

onMounted(loadDetail)
</script>

<template>
  <div class="page-view">
    <PageHeader :title="detail?.shop.shopName || '店铺详情'" :description="detail ? `${detail.shop.shopNo} · 平台店铺资料与治理入口` : '平台店铺资料与治理入口'">
      <template #actions>
        <el-button @click="router.push({ name: ROUTE_NAME.AdminShops })">返回列表</el-button>
        <el-button v-if="detail" @click="router.push({ name: ROUTE_NAME.AdminShopMembers, query: { shopId } })">成员管理</el-button>
        <el-button v-if="detail" type="primary" @click="router.push({ name: ROUTE_NAME.AdminShopEdit, params: { shopId } })">编辑店铺</el-button>
      </template>
    </PageHeader>
    <el-card v-if="errorMessage" class="sg-card" shadow="never"><el-result icon="error" title="店铺详情加载失败" :sub-title="errorMessage"><template #extra><el-button type="primary" @click="loadDetail">重试</el-button></template></el-result></el-card>
    <template v-else-if="detail">
      <el-card class="sg-card" shadow="never" v-loading="loading">
        <div class="summary-head"><div class="shop-identity"><el-avatar shape="square" :size="64" :src="detail.shop.logoUrl || undefined">{{ detail.shop.shopName.slice(0, 1) }}</el-avatar><div><div class="shop-title">{{ detail.shop.shopName }}</div><div class="shop-no">{{ detail.shop.shopNo }}</div></div></div><StatusTag :label="SHOP_STATUS_LABEL[detail.shop.status]" :type="SHOP_STATUS_TYPE[detail.shop.status]" /></div>
        <el-descriptions :column="2" border class="descriptions"><el-descriptions-item label="联系人">{{ detail.contactName || '-' }}</el-descriptions-item><el-descriptions-item label="联系电话">{{ detail.contactPhone || '-' }}</el-descriptions-item><el-descriptions-item label="成员总数">{{ detail.membersCount }}</el-descriptions-item><el-descriptions-item label="正常成员">{{ detail.activeMembersCount }}</el-descriptions-item><el-descriptions-item label="创建时间">{{ formatDate(detail.createdAt) }}</el-descriptions-item><el-descriptions-item label="更新时间">{{ formatDate(detail.updatedAt) }}</el-descriptions-item><el-descriptions-item label="店铺描述" :span="2">{{ detail.description || '-' }}</el-descriptions-item></el-descriptions>
      </el-card>
      <el-card class="sg-card" shadow="never"><template #header><div class="section-title">状态管理</div></template><div v-if="availableStatuses.length" class="status-actions"><el-button v-for="status in availableStatuses" :key="status" :type="status === 'ACTIVE' ? 'success' : status === 'CLOSED' ? 'danger' : 'warning'" @click="openStatus(status)">变更为{{ SHOP_STATUS_LABEL[status] }}</el-button></div><el-empty v-else :image-size="64" description="店铺已关闭，无可用状态操作" /></el-card>
    </template>
    <el-card v-else class="sg-card" shadow="never" v-loading="loading"><div class="loading-space" /></el-card>
    <el-dialog v-model="statusVisible" title="变更店铺状态" width="520px" :close-on-click-modal="false"><el-form ref="statusFormRef" :model="statusForm" :rules="statusRules" label-width="100px"><el-form-item label="目标状态"><StatusTag :label="SHOP_STATUS_LABEL[statusForm.targetStatus]" :type="SHOP_STATUS_TYPE[statusForm.targetStatus]" /></el-form-item><el-form-item label="变更原因" prop="reason"><el-input v-model="statusForm.reason" type="textarea" :rows="4" maxlength="500" show-word-limit /></el-form-item></el-form><template #footer><el-button :disabled="statusSubmitting" @click="statusVisible = false">取消</el-button><el-button type="primary" :loading="statusSubmitting" @click="submitStatus">提交变更</el-button></template></el-dialog>
  </div>
</template>

<style scoped lang="scss">
.summary-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.shop-identity { display: flex; align-items: center; gap: 16px; }
.shop-title { font-size: 18px; font-weight: 600; }
.shop-no { margin-top: 6px; color: var(--sg-text-muted); font-size: 13px; }
.descriptions { margin-top: 20px; }
.section-title { font-weight: 600; }
.status-actions { display: flex; gap: 8px; }
.loading-space { min-height: 280px; }
</style>
