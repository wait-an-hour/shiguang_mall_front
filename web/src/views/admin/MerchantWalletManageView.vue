<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import PageHeader from '@/components/common/PageHeader.vue'
import AppPagination from '@/components/common/AppPagination.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { getPlatformMerchantWallets, getPlatformMerchantWalletTransactions } from '@/api/admin/merchantWallet'
import type { MerchantWalletTransactionView, MerchantWalletView } from '@/types/merchantWallet'

const activeTab = ref('wallets')
const loading = ref(false)
const walletRows = ref<MerchantWalletView[]>([])
const transactionRows = ref<MerchantWalletTransactionView[]>([])
const walletTotal = ref(0)
const transactionTotal = ref(0)
const walletPage = reactive({ page: 1, pageSize: 20 })
const transactionPage = reactive({ page: 1, pageSize: 20 })
const shopId = ref('')
const errorMessage = ref('')

async function loadWallets() {
  loading.value = true
  errorMessage.value = ''
  try {
    const data = await getPlatformMerchantWallets({ shopId: shopId.value || undefined, ...walletPage })
    walletRows.value = data.items
    walletTotal.value = data.total
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '钱包列表加载失败'
  } finally {
    loading.value = false
  }
}

async function loadTransactions() {
  loading.value = true
  errorMessage.value = ''
  try {
    const data = await getPlatformMerchantWalletTransactions({ shopId: shopId.value || undefined, ...transactionPage })
    transactionRows.value = data.items
    transactionTotal.value = data.total
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '钱包流水加载失败'
  } finally {
    loading.value = false
  }
}

function search() {
  walletPage.page = 1
  transactionPage.page = 1
  void (activeTab.value === 'wallets' ? loadWallets() : loadTransactions())
}

function changeWalletPage(value: { page: number; pageSize: number }) {
  Object.assign(walletPage, value)
  void loadWallets()
}

function changeTransactionPage(value: { page: number; pageSize: number }) {
  Object.assign(transactionPage, value)
  void loadTransactions()
}

function formatOperator(operator: MerchantWalletTransactionView['operator']) {
  return operator ? `${operator.nickname}（${operator.username}）` : '-'
}

onMounted(() => void loadWallets())
</script>

<template>
  <div class="page-view">
    <PageHeader title="商家钱包" description="查看各店铺钱包余额、资金流水、结算和提现状态。" />
    <el-card class="sg-card" shadow="never">
      <el-form class="wallet-query-form" inline @submit.prevent="search">
        <el-form-item label="店铺 ID"><el-input v-model="shopId" clearable placeholder="全部店铺" /></el-form-item>
        <el-form-item>
          <el-button type="primary" @click="search">查询</el-button>
        </el-form-item>
      </el-form>
      <el-alert v-if="errorMessage" :title="errorMessage" type="error" :closable="false" show-icon />
      <el-tabs v-model="activeTab" @tab-change="(name: string) => name === 'wallets' ? loadWallets() : loadTransactions()">
        <el-tab-pane label="钱包概览" name="wallets">
          <el-table v-loading="loading" :data="walletRows" row-key="walletId">
            <el-table-column prop="shopId" label="店铺 ID" width="100" />
            <el-table-column prop="walletId" label="钱包 ID" width="110" />
            <el-table-column prop="status" label="状态" width="110" />
            <el-table-column prop="pendingBalance" label="待结算" width="130" />
            <el-table-column prop="availableBalance" label="可提现" width="130" />
            <el-table-column prop="frozenBalance" label="冻结" width="120" />
            <el-table-column prop="lifetimeGrossIncome" label="累计收入" width="130" />
            <el-table-column prop="updatedAt" label="更新时间" min-width="190" />
          </el-table>
          <EmptyState v-if="!loading && !walletRows.length" description="暂无商家钱包" />
          <AppPagination :page="walletPage.page" :page-size="walletPage.pageSize" :total="walletTotal" @change="changeWalletPage" />
        </el-tab-pane>
        <el-tab-pane label="钱包流水" name="transactions">
          <el-table v-loading="loading" :data="transactionRows" row-key="id">
            <el-table-column prop="transactionNo" label="流水号" min-width="170" />
            <el-table-column prop="businessNo" label="业务单号" min-width="170" />
            <el-table-column prop="transactionType" label="类型" min-width="180" />
            <el-table-column prop="direction" label="方向" width="90" />
            <el-table-column prop="amount" label="金额" width="120" />
            <el-table-column label="操作者" min-width="160"><template #default="{ row }">{{ formatOperator(row.operator) }}</template></el-table-column>
            <el-table-column prop="businessNo" label="业务单号" min-width="170" />
            <el-table-column prop="createdAt" label="时间" min-width="190" />
          </el-table>
          <EmptyState v-if="!loading && !transactionRows.length" description="暂无钱包流水" />
          <AppPagination :page="transactionPage.page" :page-size="transactionPage.pageSize" :total="transactionTotal" @change="changeTransactionPage" />
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<style scoped>
.wallet-query-form {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 48px;
}

.wallet-query-form :deep(.el-form-item) {
  margin: 0;
}
</style>
