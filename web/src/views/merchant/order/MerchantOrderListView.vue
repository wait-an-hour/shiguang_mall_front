<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { getMerchantOrders, shipMerchantOrder } from '../../../api/merchant/orders'
import {
  ORDER_PAYMENT_STATUS_LABELS,
  ORDER_PAYMENT_STATUS_TAG_TYPES,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_TAG_TYPES
} from '../../../constants/merchant'
import { ROUTE_NAME } from '../../../constants/routes'
import type { PageView } from '../../../types/common'
import type { OrderPaymentStatus, OrderStatus, ShipOrderRequest, ShopOrderSummaryView } from '../../../types/merchant'

const route = useRoute()
const router = useRouter()
const shopId = computed(() => String(route.params.shopId))
const loading = ref(false)
const submitting = ref(false)
const shipDialogVisible = ref(false)
const currentOrder = ref<ShopOrderSummaryView | null>(null)
const formRef = ref<FormInstance>()
const pageData = ref<PageView<ShopOrderSummaryView>>({ items: [], page: 1, pageSize: 10, total: 0, totalPages: 1 })
const filters = reactive({
  keyword: String(route.query.keyword ?? ''),
  orderStatus: String(route.query.orderStatus ?? '') as OrderStatus | '',
  paymentStatus: String(route.query.paymentStatus ?? '') as OrderPaymentStatus | '',
  createdFrom: String(route.query.createdFrom ?? ''),
  createdTo: String(route.query.createdTo ?? ''),
  page: Number(route.query.page ?? 1),
  pageSize: Number(route.query.pageSize ?? 10)
})
const shipForm = reactive<ShipOrderRequest>({ carrierCode: '', carrierName: '', trackingNo: '' })
const rules: FormRules<ShipOrderRequest> = {
  carrierCode: [{ required: true, message: '请输入承运商代码', trigger: 'blur' }],
  carrierName: [{ required: true, message: '请输入承运商名称', trigger: 'blur' }],
  trackingNo: [{ required: true, message: '请输入运单号', trigger: 'blur' }]
}
const orderStatusOptions = computed(() => Object.entries(ORDER_STATUS_LABELS) as Array<[OrderStatus, string]>)
const paymentStatusOptions = computed(() => Object.entries(ORDER_PAYMENT_STATUS_LABELS) as Array<[OrderPaymentStatus, string]>)
function getOrderStatusLabel(status: OrderStatus) { return ORDER_STATUS_LABELS[status] }
function getOrderStatusTagType(status: OrderStatus) { return ORDER_STATUS_TAG_TYPES[status] }
function getPaymentStatusLabel(status: OrderPaymentStatus) { return ORDER_PAYMENT_STATUS_LABELS[status] }
function getPaymentStatusTagType(status: OrderPaymentStatus) { return ORDER_PAYMENT_STATUS_TAG_TYPES[status] }

async function loadOrders() {
  loading.value = true
  try {
    pageData.value = await getMerchantOrders(shopId.value, filters)
  } finally {
    loading.value = false
  }
}

function syncQuery() {
  router.replace({
    name: ROUTE_NAME.MerchantOrderList,
    params: { shopId: shopId.value },
    query: {
      keyword: filters.keyword || undefined,
      orderStatus: filters.orderStatus || undefined,
      paymentStatus: filters.paymentStatus || undefined,
      createdFrom: filters.createdFrom || undefined,
      createdTo: filters.createdTo || undefined,
      page: String(filters.page),
      pageSize: String(filters.pageSize)
    }
  })
}

function search() {
  filters.page = 1
  syncQuery()
  loadOrders()
}

function resetFilters() {
  filters.keyword = ''
  filters.orderStatus = ''
  filters.paymentStatus = ''
  filters.createdFrom = ''
  filters.createdTo = ''
  search()
}

function goDetail(row: ShopOrderSummaryView) {
  router.push({ name: ROUTE_NAME.MerchantOrderDetail, params: { shopId: shopId.value, orderId: row.id } })
}

function openShipDialog(row: ShopOrderSummaryView) {
  currentOrder.value = row
  shipForm.carrierCode = ''
  shipForm.carrierName = ''
  shipForm.trackingNo = ''
  shipDialogVisible.value = true
}

async function submitShip() {
  if (!currentOrder.value) return
  await formRef.value?.validate()
  submitting.value = true
  try {
    await shipMerchantOrder(shopId.value, currentOrder.value.id, {
      carrierCode: shipForm.carrierCode.trim(),
      carrierName: shipForm.carrierName.trim(),
      trackingNo: shipForm.trackingNo.trim()
    })
    ElMessage.success('发货成功')
    shipDialogVisible.value = false
    await loadOrders()
  } finally {
    submitting.value = false
  }
}

watch(() => [filters.page, filters.pageSize], () => {
  syncQuery()
  loadOrders()
})

onMounted(loadOrders)
</script>

<template>
  <div class="order-page">
    <section class="page-header">
      <div>
        <h1 class="page-title">订单履约</h1>
        <p class="page-description">查看店铺订单状态，并处理待发货订单。</p>
      </div>
    </section>

    <el-card class="page-card" shadow="never">
      <el-form :model="filters" inline>
        <el-form-item label="关键词"><el-input v-model="filters.keyword" clearable placeholder="订单号 / 买家 / 商品" @keyup.enter="search" /></el-form-item>
        <el-form-item label="订单状态"><el-select v-model="filters.orderStatus" clearable placeholder="全部" style="width: 150px"><el-option v-for="[value, label] in orderStatusOptions" :key="value" :label="label" :value="value" /></el-select></el-form-item>
        <el-form-item label="支付状态"><el-select v-model="filters.paymentStatus" clearable placeholder="全部" style="width: 150px"><el-option v-for="[value, label] in paymentStatusOptions" :key="value" :label="label" :value="value" /></el-select></el-form-item>
        <el-form-item label="创建时间"><el-date-picker v-model="filters.createdFrom" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss.SSSZ" placeholder="开始时间" style="width: 190px" /><span class="range-separator">至</span><el-date-picker v-model="filters.createdTo" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss.SSSZ" placeholder="结束时间" style="width: 190px" /></el-form-item>
        <el-form-item><el-button type="primary" @click="search">查询</el-button><el-button @click="resetFilters">重置</el-button></el-form-item>
      </el-form>
    </el-card>

    <el-card class="page-card" shadow="never" v-loading="loading">
      <el-table :data="pageData.items" row-key="id">
        <el-table-column label="订单" min-width="220"><template #default="{ row }"><div class="name">{{ row.orderNo }}</div><div class="meta">{{ row.tradeNo }}</div></template></el-table-column>
        <el-table-column label="买家" width="120"><template #default="{ row }"><div>{{ row.buyer.nickname }}</div><div class="meta">{{ row.buyer.username }}</div></template></el-table-column>
        <el-table-column label="商品摘要" min-width="260"><template #default="{ row }"><div v-for="item in row.itemSummary" :key="item.productName + item.skuName" class="item-line">{{ item.productName }} · {{ item.skuName }} x{{ item.quantity }}</div></template></el-table-column>
        <el-table-column label="订单状态" width="110"><template #default="{ row }"><el-tag :type="getOrderStatusTagType(row.orderStatus)" effect="light">{{ getOrderStatusLabel(row.orderStatus) }}</el-tag></template></el-table-column>
        <el-table-column label="支付状态" width="110"><template #default="{ row }"><el-tag :type="getPaymentStatusTagType(row.paymentStatus)" effect="light">{{ getPaymentStatusLabel(row.paymentStatus) }}</el-tag></template></el-table-column>
        <el-table-column prop="payableAmount" label="应付金额" width="110" />
        <el-table-column prop="refundAmount" label="退款金额" width="110" />
        <el-table-column prop="createdAt" label="创建时间" width="210" />
        <el-table-column label="操作" fixed="right" width="150"><template #default="{ row }"><el-button text type="primary" @click="goDetail(row)">查看</el-button><el-button v-if="row.orderStatus === 'PENDING_SHIPMENT' && row.availableActions.includes('SHIP')" text type="success" @click="openShipDialog(row)">发货</el-button></template></el-table-column>
      </el-table>
      <el-empty v-if="!loading && pageData.items.length === 0" description="暂无订单记录" />
      <div class="pagination"><el-pagination v-model:current-page="filters.page" v-model:page-size="filters.pageSize" layout="total, sizes, prev, pager, next" :total="pageData.total" /></div>
    </el-card>

    <el-dialog v-model="shipDialogVisible" title="订单发货" width="520px">
      <el-form ref="formRef" :model="shipForm" :rules="rules" label-width="100px">
        <el-form-item label="订单号">{{ currentOrder?.orderNo }}</el-form-item>
        <el-form-item label="承运商代码" prop="carrierCode"><el-input v-model="shipForm.carrierCode" placeholder="SF" /></el-form-item>
        <el-form-item label="承运商名称" prop="carrierName"><el-input v-model="shipForm.carrierName" placeholder="顺丰速运" /></el-form-item>
        <el-form-item label="运单号" prop="trackingNo"><el-input v-model="shipForm.trackingNo" placeholder="请输入运单号" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="shipDialogVisible = false">取消</el-button><el-button type="primary" :loading="submitting" @click="submitShip">确认发货</el-button></template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.order-page { display: flex; flex-direction: column; gap: 16px; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.page-title { margin: 0; color: #111827; font-size: 20px; font-weight: 600; }
.page-description { margin: 8px 0 0; color: #6b7280; font-size: 13px; }
.page-card { border: 1px solid #e5e7eb; border-radius: 10px; }
.name { color: #111827; font-weight: 600; }
.meta { margin-top: 4px; color: #6b7280; font-size: 12px; }
.item-line { color: #374151; line-height: 1.7; }
.range-separator { margin: 0 8px; color: #9ca3af; }
.pagination { display: flex; justify-content: flex-end; margin-top: 16px; }
</style>
