<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { createMerchantWithdrawal, getMerchantSettlements, getMerchantWallet, getMerchantWalletTransactions, getMerchantWithdrawals } from '@/api/merchant/wallet'
import { SHOP_PERMISSION } from '@/constants/merchant'
import { ApiRequestError } from '@/utils/request'
import { useMerchantStore } from '@/stores/merchant'
import type { PageView } from '@/types/common'
import type { MerchantSettlementView, MerchantSettlementStatus, MerchantWalletBucket, MerchantWalletTransactionType, MerchantWalletTransactionView, MerchantWalletView, MerchantWithdrawalStatus, MerchantWithdrawalView } from '@/types/merchantWallet'

const route = useRoute()
const router = useRouter()
const merchantStore = useMerchantStore()
const shopId = computed(() => String(route.params.shopId))
const loading = ref(false)
const errorMessage = ref('')
const dialogVisible = ref(false)
const withdrawing = ref(false)
const activeTab = ref('transactions')
const wallet = ref<MerchantWalletView | null>(null)
const transactionPage = ref<PageView<MerchantWalletTransactionView>>({ items: [], page: 1, pageSize: 10, total: 0, totalPages: 1 })
const settlementPage = ref<PageView<MerchantSettlementView>>({ items: [], page: 1, pageSize: 10, total: 0, totalPages: 1 })
const withdrawalPage = ref<PageView<MerchantWithdrawalView>>({ items: [], page: 1, pageSize: 10, total: 0, totalPages: 1 })
const filters = reactive({ transactionType: '' as MerchantWalletTransactionType | '', bucket: '' as MerchantWalletBucket | '', businessType: '', businessNo: '', settlementOrderNo: '', settlementStatus: '' as MerchantSettlementStatus | '', withdrawalStatus: '' as MerchantWithdrawalStatus | '', createdFrom: '', createdTo: '', page: 1, pageSize: 10 })
const form = reactive({ amount: '', destinationAccount: '', remark: '' })
const canWithdraw = computed(() => merchantStore.hasShopPermission(SHOP_PERMISSION.WalletWithdraw))
const transactionTypes = ['ORDER_PENDING_CREDIT', 'SETTLEMENT_RELEASE', 'COMMISSION_DEBIT', 'REFUND_DEBIT', 'WITHDRAW_FREEZE', 'WITHDRAW_SUCCESS', 'WITHDRAW_FAILED', 'WITHDRAW_REJECT', 'PLATFORM_ADJUST']
const buckets = ['PENDING', 'AVAILABLE', 'FROZEN']
const settlementStatuses = ['PENDING', 'READY', 'SETTLED', 'REFUNDED', 'RECOVERY_REQUIRED']
const withdrawalStatuses = ['PROCESSING', 'SUCCESS', 'FAILED', 'REJECTED']

async function load() {
  loading.value = true
  errorMessage.value = ''
  try {
    const [walletData, transactions, settlements, withdrawals] = await Promise.all([
      getMerchantWallet(shopId.value),
      getMerchantWalletTransactions(shopId.value, { transactionType: filters.transactionType || undefined, bucket: filters.bucket || undefined, businessType: filters.businessType || undefined, businessNo: filters.businessNo || undefined, createdFrom: filters.createdFrom || undefined, createdTo: filters.createdTo || undefined, page: filters.page, pageSize: filters.pageSize }),
      getMerchantSettlements(shopId.value, { orderNo: filters.settlementOrderNo || undefined, settlementStatus: filters.settlementStatus || undefined, createdFrom: filters.createdFrom || undefined, createdTo: filters.createdTo || undefined, page: filters.page, pageSize: filters.pageSize }),
      getMerchantWithdrawals(shopId.value, { status: filters.withdrawalStatus || undefined, createdFrom: filters.createdFrom || undefined, createdTo: filters.createdTo || undefined, page: filters.page, pageSize: filters.pageSize })
    ])
    wallet.value = walletData
    transactionPage.value = transactions
    settlementPage.value = settlements
    withdrawalPage.value = withdrawals
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '钱包数据加载失败'
  } finally { loading.value = false }
}

function search() { filters.page = 1; syncQuery(); void load() }
function resetFilters() { Object.assign(filters, { transactionType: '', bucket: '', businessType: '', businessNo: '', settlementOrderNo: '', settlementStatus: '', withdrawalStatus: '', createdFrom: '', createdTo: '', page: 1 }); search() }
function syncQuery() { router.replace({ name: route.name, params: { shopId: shopId.value }, query: { page: String(filters.page), pageSize: String(filters.pageSize) } }) }
function changePage(value: { page: number; pageSize: number }) { filters.page = value.page; filters.pageSize = value.pageSize; syncQuery(); void load() }
function openWithdraw() { Object.assign(form, { amount: '', destinationAccount: '', remark: '' }); dialogVisible.value = true }
async function submitWithdraw() {
  if (!/^\d+\.\d{2}$/.test(form.amount) || Number(form.amount) <= 0) { ElMessage.warning('提现金额需为大于 0 的两位小数'); return }
  if (!form.destinationAccount.trim()) { ElMessage.warning('请输入虚拟账户'); return }
  await ElMessageBox.confirm(`确认提现 ${form.amount} 元？`, '提交提现', { type: 'warning' })
  withdrawing.value = true
  try { await createMerchantWithdrawal(shopId.value, { amount: form.amount, destinationType: 'VIRTUAL_ACCOUNT', destinationAccount: form.destinationAccount.trim(), remark: form.remark.trim() || undefined }); ElMessage.success('提现申请已提交'); dialogVisible.value = false; await load() }
  catch (error) { ElMessage.error(error instanceof ApiRequestError ? error.message : '提现失败，请稍后重试') }
  finally { withdrawing.value = false }
}
watch(() => [filters.page, filters.pageSize], syncQuery)
onMounted(() => { filters.page = Number(route.query.page ?? 1); filters.pageSize = Number(route.query.pageSize ?? 10); void load() })
</script>

<template>
  <div class="wallet-page">
    <section class="page-header"><div><h1 class="page-title">商家钱包</h1><p class="page-description">查看店铺收入余额、钱包流水、结算记录和虚拟提现。</p></div><el-button v-if="canWithdraw" type="primary" @click="openWithdraw">申请提现</el-button></section>
    <el-result v-if="errorMessage" icon="error" title="加载失败" :sub-title="errorMessage"><template #extra><el-button type="primary" @click="load">重试</el-button></template></el-result>
    <template v-else>
      <el-card v-loading="loading" class="page-card" shadow="never"><div class="balances"><div v-for="item in [{ label: '待结算余额', value: wallet?.pendingBalance }, { label: '可提现余额', value: wallet?.availableBalance }, { label: '冻结余额', value: wallet?.frozenBalance } ]" :key="item.label"><span>{{ item.label }}</span><strong>¥ {{ item.value ?? '0.00' }}</strong></div></div></el-card>
      <el-card class="page-card" shadow="never"><el-tabs v-model="activeTab"><el-tab-pane label="钱包流水" name="transactions"><el-form :model="filters" inline><el-form-item label="流水类型"><el-select v-model="filters.transactionType" clearable placeholder="全部" style="width: 180px"><el-option v-for="item in transactionTypes" :key="item" :label="item" :value="item" /></el-select></el-form-item><el-form-item label="余额区"><el-select v-model="filters.bucket" clearable placeholder="全部" style="width: 130px"><el-option v-for="item in buckets" :key="item" :label="item" :value="item" /></el-select></el-form-item><el-form-item label="业务单号"><el-input v-model="filters.businessNo" clearable /></el-form-item><el-form-item><el-button type="primary" @click="search">查询</el-button><el-button @click="resetFilters">重置</el-button></el-form-item></el-form><el-table v-loading="loading" :data="transactionPage.items" row-key="id"><el-table-column prop="transactionNo" label="流水号" min-width="180" /><el-table-column prop="transactionType" label="类型" min-width="180" /><el-table-column prop="direction" label="方向" width="90" /><el-table-column prop="amount" label="金额" width="120" /><el-table-column prop="businessNo" label="业务单号" min-width="170" /><el-table-column prop="remark" label="备注" min-width="180" /><el-table-column prop="createdAt" label="时间" min-width="190" /></el-table><el-empty v-if="!loading && !transactionPage.items.length" description="暂无钱包流水" /><AppPagination :page="transactionPage.page" :page-size="transactionPage.pageSize" :total="transactionPage.total" @change="changePage" /></el-tab-pane>
      <el-tab-pane label="结算记录" name="settlements"><el-form :model="filters" inline><el-form-item label="订单号"><el-input v-model="filters.settlementOrderNo" clearable /></el-form-item><el-form-item label="结算状态"><el-select v-model="filters.settlementStatus" clearable placeholder="全部" style="width: 160px"><el-option v-for="item in settlementStatuses" :key="item" :label="item" :value="item" /></el-select></el-form-item><el-form-item><el-button type="primary" @click="search">查询</el-button><el-button @click="resetFilters">重置</el-button></el-form-item></el-form><el-table v-loading="loading" :data="settlementPage.items" row-key="settlementId"><el-table-column prop="settlementId" label="结算号" min-width="150" /><el-table-column prop="orderNo" label="订单号" min-width="180" /><el-table-column prop="status" label="状态" width="140" /><el-table-column prop="grossAmount" label="订单收入" width="120" /><el-table-column prop="netAmount" label="净收入" width="120" /><el-table-column prop="pendingAmount" label="待结算" width="120" /><el-table-column prop="createdAt" label="创建时间" min-width="190" /></el-table><el-empty v-if="!loading && !settlementPage.items.length" description="暂无结算记录" /><AppPagination :page="settlementPage.page" :page-size="settlementPage.pageSize" :total="settlementPage.total" @change="changePage" /></el-tab-pane>
      <el-tab-pane label="提现记录" name="withdrawals"><el-form :model="filters" inline><el-form-item label="状态"><el-select v-model="filters.withdrawalStatus" clearable placeholder="全部" style="width: 150px"><el-option v-for="item in withdrawalStatuses" :key="item" :label="item" :value="item" /></el-select></el-form-item><el-form-item><el-button type="primary" @click="search">查询</el-button><el-button @click="resetFilters">重置</el-button></el-form-item></el-form><el-table v-loading="loading" :data="withdrawalPage.items" row-key="withdrawalId"><el-table-column prop="withdrawalNo" label="申请单号" min-width="180" /><el-table-column prop="amount" label="提现金额" width="120" /><el-table-column prop="status" label="状态" width="110" /><el-table-column prop="destinationAccountMasked" label="账户" min-width="180" /><el-table-column prop="requestedAt" label="申请时间" min-width="190" /><el-table-column prop="completedAt" label="完成时间" min-width="190" /></el-table><el-empty v-if="!loading && !withdrawalPage.items.length" description="暂无提现记录" /><AppPagination :page="withdrawalPage.page" :page-size="withdrawalPage.pageSize" :total="withdrawalPage.total" @change="changePage" /></el-tab-pane></el-tabs></el-card>
    </template>
    <el-dialog v-model="dialogVisible" title="申请虚拟提现" width="460px"><el-form label-width="110px"><el-form-item label="提现金额"><el-input v-model="form.amount" placeholder="例如 500.00" /></el-form-item><el-form-item label="虚拟账户"><el-input v-model="form.destinationAccount" /></el-form-item><el-form-item label="备注"><el-input v-model="form.remark" type="textarea" :rows="3" /></el-form-item></el-form><template #footer><el-button @click="dialogVisible = false">取消</el-button><el-button type="primary" :loading="withdrawing" @click="submitWithdraw">提交</el-button></template></el-dialog>
  </div>
</template>

<style scoped lang="scss">
.wallet-page { display: flex; flex-direction: column; gap: 16px; }.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }.page-title { margin: 0; color: #111827; font-size: 20px; font-weight: 600; }.page-description { margin: 8px 0 0; color: #6b7280; font-size: 13px; }.page-card { border: 1px solid #e5e7eb; border-radius: 10px; }.balances { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }.balances div { display: flex; flex-direction: column; gap: 10px; padding: 16px; background: #f8fafc; border-radius: 8px; }.balances span { color: #6b7280; font-size: 13px; }.balances strong { color: #111827; font-size: 22px; }
</style>
