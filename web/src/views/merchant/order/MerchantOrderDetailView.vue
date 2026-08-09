<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { getMerchantOrderDetail, shipMerchantOrder } from '../../../api/merchant/orders'
import { ORDER_PAYMENT_STATUS_LABELS, ORDER_PAYMENT_STATUS_TAG_TYPES, ORDER_STATUS_LABELS, ORDER_STATUS_TAG_TYPES } from '../../../constants/merchant'
import { ROUTE_NAME } from '../../../constants/routes'
import type { OrderDetailView, ShipOrderRequest } from '../../../types/merchant'

const route = useRoute()
const router = useRouter()
const shopId = computed(() => String(route.params.shopId))
const orderId = computed(() => String(route.params.orderId))
const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const detail = ref<OrderDetailView | null>(null)
const formRef = ref<FormInstance>()
const shipForm = reactive<ShipOrderRequest>({ carrierCode: '', carrierName: '', trackingNo: '' })
const rules: FormRules<ShipOrderRequest> = {
  carrierCode: [{ required: true, message: '请输入承运商代码', trigger: 'blur' }],
  carrierName: [{ required: true, message: '请输入承运商名称', trigger: 'blur' }],
  trackingNo: [{ required: true, message: '请输入运单号', trigger: 'blur' }]
}
const canShip = computed(() => detail.value?.orderStatus === 'PENDING_SHIPMENT' && detail.value.availableActions.includes('SHIP'))

async function loadDetail() {
  loading.value = true
  detail.value = null
  try {
    detail.value = await getMerchantOrderDetail(shopId.value, orderId.value)
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '订单详情加载失败')
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.push({ name: ROUTE_NAME.MerchantOrderList, params: { shopId: shopId.value } })
}

function openShipDialog() {
  shipForm.carrierCode = ''
  shipForm.carrierName = ''
  shipForm.trackingNo = ''
  dialogVisible.value = true
}

async function submitShip() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  try {
    detail.value = await shipMerchantOrder(shopId.value, orderId.value, {
      carrierCode: shipForm.carrierCode.trim(),
      carrierName: shipForm.carrierName.trim(),
      trackingNo: shipForm.trackingNo.trim()
    })
    ElMessage.success('发货成功')
    dialogVisible.value = false
    await loadDetail()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '发货失败')
  } finally {
    submitting.value = false
  }
}

onMounted(loadDetail)
</script>

<template>
  <div class="order-detail-page" v-loading="loading">
    <section class="page-header">
      <div>
        <el-button :icon="ArrowLeft" text @click="goBack">返回订单列表</el-button>
        <h1 class="page-title">订单详情</h1>
        <p class="page-description">查看订单履约资料、物流和状态历史。</p>
      </div>
      <el-button v-if="canShip" type="primary" @click="openShipDialog">发货</el-button>
    </section>

    <template v-if="detail">
      <el-card class="page-card" shadow="never">
        <div class="summary-grid">
          <div><div class="label">订单号</div><div class="value">{{ detail.orderNo }}</div></div>
          <div><div class="label">交易号</div><div class="value">{{ detail.tradeNo }}</div></div>
          <div><div class="label">订单状态</div><el-tag :type="ORDER_STATUS_TAG_TYPES[detail.orderStatus]" effect="light">{{ ORDER_STATUS_LABELS[detail.orderStatus] }}</el-tag></div>
          <div><div class="label">支付状态</div><el-tag :type="ORDER_PAYMENT_STATUS_TAG_TYPES[detail.paymentStatus]" effect="light">{{ ORDER_PAYMENT_STATUS_LABELS[detail.paymentStatus] }}</el-tag></div>
          <div><div class="label">商品金额</div><div class="value">{{ detail.itemAmount }}</div></div>
          <div><div class="label">运费</div><div class="value">{{ detail.freightAmount }}</div></div>
          <div><div class="label">应付金额</div><div class="value amount">{{ detail.payableAmount }}</div></div>
          <div><div class="label">退款金额</div><div class="value">{{ detail.refundAmount }}</div></div>
        </div>
      </el-card>

      <el-row :gutter="16">
        <el-col :span="12"><el-card class="page-card" shadow="never"><template #header>买家信息</template><el-descriptions :column="1" border><el-descriptions-item label="买家">{{ detail.buyer ? `${detail.buyer.nickname}（${detail.buyer.username}）` : '暂无买家信息' }}</el-descriptions-item><el-descriptions-item label="买家备注">{{ detail.buyerRemark || '无' }}</el-descriptions-item></el-descriptions></el-card></el-col>
        <el-col :span="12"><el-card class="page-card" shadow="never"><template #header>收货地址</template><el-descriptions :column="1" border><el-descriptions-item label="收件人">{{ detail.address.recipientName }} {{ detail.address.recipientPhone }}</el-descriptions-item><el-descriptions-item label="地址">{{ detail.address.provinceName }}{{ detail.address.cityName }}{{ detail.address.districtName }}{{ detail.address.detailAddress }}</el-descriptions-item></el-descriptions></el-card></el-col>
      </el-row>

      <el-card class="page-card" shadow="never">
        <template #header>商品明细</template>
        <el-table :data="detail.items" row-key="id">
          <el-table-column label="商品" min-width="280"><template #default="{ row }"><div class="product-cell"><el-image class="cover" :src="row.imageUrl" fit="cover" /><div><div class="name">{{ row.productName }}</div><div class="meta">{{ row.skuName }} · {{ row.skuNo }}</div></div></div></template></el-table-column>
          <el-table-column prop="unitPrice" label="单价" width="110" />
          <el-table-column prop="quantity" label="数量" width="80" />
          <el-table-column prop="payableAmount" label="实付" width="110" />
          <el-table-column prop="refundedAmount" label="已退" width="110" />
          <el-table-column prop="reservationStatus" label="库存预留" width="120" />
        </el-table>
      </el-card>

      <el-row :gutter="16">
        <el-col :span="12"><el-card class="page-card" shadow="never"><template #header>物流信息</template><el-empty v-if="!detail.shipping" description="暂无物流信息" /><el-descriptions v-else :column="1" border><el-descriptions-item label="承运商">{{ detail.shipping.carrierName }}（{{ detail.shipping.carrierCode }}）</el-descriptions-item><el-descriptions-item label="运单号">{{ detail.shipping.trackingNo }}</el-descriptions-item><el-descriptions-item label="发货时间">{{ detail.shipping.shippedAt }}</el-descriptions-item></el-descriptions></el-card></el-col>
        <el-col :span="12"><el-card class="page-card" shadow="never"><template #header>状态历史</template><el-timeline><el-timeline-item v-for="item in detail.history" :key="item.createdAt + item.toStatus" :timestamp="item.createdAt"><div class="name">{{ ORDER_STATUS_LABELS[item.toStatus] }}</div><div class="meta">{{ item.remark || item.operationType }} · {{ item.operatorType }}</div></el-timeline-item></el-timeline></el-card></el-col>
      </el-row>
    </template>

    <el-empty v-else-if="!loading" description="订单不存在" />

    <el-dialog v-model="dialogVisible" title="订单发货" width="520px">
      <el-form ref="formRef" :model="shipForm" :rules="rules" label-width="100px">
        <el-form-item label="承运商代码" prop="carrierCode"><el-input v-model="shipForm.carrierCode" placeholder="SF" /></el-form-item>
        <el-form-item label="承运商名称" prop="carrierName"><el-input v-model="shipForm.carrierName" placeholder="顺丰速运" /></el-form-item>
        <el-form-item label="运单号" prop="trackingNo"><el-input v-model="shipForm.trackingNo" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="dialogVisible = false">取消</el-button><el-button type="primary" :loading="submitting" @click="submitShip">确认发货</el-button></template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.order-detail-page { display: flex; flex-direction: column; gap: 16px; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.page-title { margin: 8px 0 0; color: #111827; font-size: 20px; font-weight: 600; }
.page-description { margin: 8px 0 0; color: #6b7280; font-size: 13px; }
.page-card { border: 1px solid #e5e7eb; border-radius: 10px; }
.summary-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; }
.label { margin-bottom: 6px; color: #6b7280; font-size: 12px; }
.value, .name { color: #111827; font-weight: 600; }
.amount { color: #2563eb; }
.meta { margin-top: 4px; color: #6b7280; font-size: 12px; }
.product-cell { display: flex; align-items: center; gap: 12px; }
.cover { width: 48px; height: 48px; border-radius: 8px; background: #f1f5f9; }
</style>
