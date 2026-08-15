<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowDown } from '@element-plus/icons-vue'
import { useRoute } from 'vue-router'
import PageHeader from '@/components/common/PageHeader.vue'
import AppPagination from '@/components/common/AppPagination.vue'
import StatusTag from '@/components/common/StatusTag.vue'
import { SHOP_PERMISSION } from '@/constants/merchant'
import { useCouponScopeCategories } from '@/composables/useCouponScopeCategories'
import { useCouponScopeProducts } from '@/composables/useCouponScopeProducts'
import { useAuthStore } from '@/stores/auth'
import { useMerchantStore } from '@/stores/merchant'
import {
  activateMerchantCouponTemplate, archiveMerchantCouponTemplate, copyMerchantCouponTemplate, createMerchantCouponActivity,
  createMerchantCouponTemplate, createMerchantRecurringCouponActivity, createMerchantRedeemCodeBatch, decideMerchantFundingInvitation,
  endMerchantCouponTemplate, getMerchantCouponActivitySchedule, getMerchantCouponTemplate, grantMerchantCoupons,
  listMerchantCouponActivities, listMerchantCouponTemplates, listMerchantFundingInvitations, listMerchantRedeemCodeBatches,
  merchantCouponActivityAction, pauseMerchantCouponTemplate, resumeMerchantCouponTemplate, updateMerchantCouponActivity,
  updateMerchantCouponActivitySchedule, updateMerchantCouponTemplate
} from '@/api/merchant/coupons'
import { getMerchantProductDetail, getMerchantProducts } from '@/api/merchant/products'
import type {
  CouponActivity, CouponActivityStatus, CouponActivityType, CouponCodeBatchSummaryView, CouponDistributionType,
  CouponFundingParticipation, CouponRecurrenceType, CouponTemplateDetail, CouponTemplateScopeType, CouponTemplateStatus, CouponTemplateSummary,
  CouponType, CreateCouponTemplateRequest, RecurringCouponSchedule
} from '@/types/coupon'

const route = useRoute()
const authStore = useAuthStore()
const merchantStore = useMerchantStore()
const { categoryTree, categoriesLoading, loadCategories } = useCouponScopeCategories()
const shopId = computed(() => String(route.params.shopId))
const {
  productOptions,
  skuOptions,
  productsLoading,
  skusLoading,
  addProductOptions,
  addSkuOptions,
  searchProducts,
  searchSkus
} = useCouponScopeProducts({
  async listProducts(keyword, pageSize) {
    const page = await getMerchantProducts(shopId.value, { keyword, page: 1, pageSize })
    return page.items.map((product) => ({ id: product.id, productNo: product.spuNo, productName: product.productName }))
  },
  async getProductDetail(productId) {
    const product = await getMerchantProductDetail(shopId.value, productId)
    return {
      id: product.id,
      productNo: product.spuNo,
      productName: product.productName,
      skus: product.skus.map((sku) => ({ id: sku.id, skuNo: sku.skuNo, skuName: sku.skuName, productId: product.id, productName: product.productName }))
    }
  }
})
const activeTab = ref('activities')
const loading = ref(false)
const errorMessage = ref('')
const activityRows = ref<CouponActivity[]>([])
const availableActivityRows = computed(() => activityRows.value.filter((activity) => !['ENDED', 'CANCELLED'].includes(activity.status)))
const templateRows = ref<CouponTemplateSummary[]>([])
const codeRows = ref<CouponCodeBatchSummaryView[]>([])
const fundingRows = ref<CouponFundingParticipation[]>([])
const activityTotal = ref(0)
const templateTotal = ref(0)
const codeTotal = ref(0)
const fundingTotal = ref(0)
const canRead = computed(() => merchantStore.hasShopPermission(SHOP_PERMISSION.CouponRead))
const canManage = computed(() => merchantStore.hasShopPermission(SHOP_PERMISSION.CouponManage))
const canGrant = computed(() => merchantStore.hasShopPermission(SHOP_PERMISSION.CouponGrant))
const canFundingApprove = computed(() => merchantStore.hasShopPermission(SHOP_PERMISSION.CouponFundingApprove))

const activityQuery = reactive({ keyword: '', status: '' as CouponActivityStatus | '', page: 1, pageSize: 20 })
const templateQuery = reactive({ keyword: '', status: '' as CouponTemplateStatus | '', couponType: '' as CouponType | '', distributionType: '' as CouponDistributionType | '', page: 1, pageSize: 20 })
const codeQuery = reactive({ batchNo: '', status: '', page: 1, pageSize: 20 })
const fundingQuery = reactive({ status: '', page: 1, pageSize: 20 })

const activityDialogVisible = ref(false)
const editingActivity = ref<CouponActivity | null>(null)
const activityDialogLoading = ref(false)
const activityScheduleMode = ref<'ONCE' | 'RECURRING'>('ONCE')
const activityForm = reactive({ activityName: '', subtitle: '', bannerUrl: '', activityType: 'COUPON_CENTER' as CouponActivityType, startsAt: '', endsAt: '' })
const recurrenceForm = reactive<RecurringCouponSchedule>({ recurrenceType: 'WEEKLY', weekdays: [5, 6, 7], monthDays: null, dailyStartsAt: '20:00:00', windowDurationMinutes: 30, recurrenceStartsAt: '', recurrenceEndsAt: '', timezone: 'Asia/Shanghai' })
const activityScheduleVersion = ref(0)
const scheduleOnlyActivity = ref<CouponActivity | null>(null)

const templateDialogVisible = ref(false)
const editingTemplate = ref<CouponTemplateDetail | null>(null)
const templateDialogLoading = ref(false)
const templateActivityScheduleType = ref<'ONCE' | 'RECURRING' | null>(null)
const templateForm = reactive<CreateCouponTemplateRequest>({
  activityId: null, couponName: '', description: null, couponType: 'THRESHOLD_REDUCTION', thresholdAmount: '200.00', discountAmount: '30.00', percentageOff: null, maximumDiscountAmount: null,
  scope: { version: 0, scopeType: 'ALL', shopIds: null, categoryIds: null, spuIds: null, skuIds: null }, distributionType: 'PUBLIC_CLAIM', audienceType: 'ALL_USERS', newUserWithinDays: null,
  claimStartsAt: null, claimEndsAt: null, validity: { validityType: 'RELATIVE_AFTER_CLAIM', validFrom: null, validTo: null, effectiveDelayMinutes: 0, validForHours: 168 }, totalIssueLimit: 1000, perUserLimit: 1,
  stackMode: 'CROSS_OWNER', refundRestorePolicy: 'FULL_TRADE_ONLY', budgetAmount: '30000.00', sortOrder: 10
})
const grantDialogVisible = ref(false)
const grantTemplate = ref<CouponTemplateSummary | null>(null)
const grantForm = reactive({ userIds: '', reason: '', externalReference: '' })
const codeDialogVisible = ref(false)
const codeTemplate = ref<CouponTemplateSummary | null>(null)
const codeForm = reactive({ quantity: 100, codePrefix: '', reason: '' })
const grantResult = ref<string[]>([])
const generatedCodes = ref<string[]>([])
const templateActivityOptions = computed(() => {
  const rows = [...availableActivityRows.value]
  const current = editingTemplate.value?.activity
  if (current && !rows.some((activity) => String(activity.id) === String(current.id))) rows.unshift(current)
  return rows
})

const activityStatusLabels: Record<string, string> = { DRAFT: '草稿', SCHEDULED: '已排期', RUNNING: '进行中', PAUSED: '已暂停', ENDED: '已结束', CANCELLED: '已取消' }
const templateStatusLabels: Record<string, string> = { DRAFT: '草稿', ACTIVE: '生效中', PAUSED: '已暂停', ENDED: '已结束', ARCHIVED: '已归档' }
const activityTypeLabels: Record<string, string> = { COUPON_CENTER: '领券中心', FLASH_CLAIM: '限时抢券', NEW_USER_WELCOME: '新客欢迎', TARGETED_CAMPAIGN: '定向活动' }
const couponTypeLabels: Record<string, string> = { PERCENTAGE: '折扣券', THRESHOLD_REDUCTION: '满减券', CASH_RED_PACKET: '现金红包' }
const distributionTypeLabels: Record<string, string> = { PUBLIC_CLAIM: '公开领取', FLASH_CLAIM: '限时抢券', REDEEM_CODE: '兑换码', DIRECT_GRANT: '定向发券' }
const scopeTypeLabels: Record<Exclude<CouponTemplateScopeType, 'SHOP'>, string> = { ALL: '全店商品', CATEGORY: '指定分类', SPU: '指定 SPU', SKU: '指定 SKU' }
const recurrenceTypeLabels: Record<CouponRecurrenceType, string> = { DAILY: '每天', WEEKLY: '每周', MONTHLY: '每月' }
const actionAvailable = (row: { availableActions?: string[]; status: string }, action: string) => row.availableActions === undefined || row.availableActions.includes(action)
const hasActivityMenuActions = (row: CouponActivity) => row.availableActions.some((action) => action !== 'EDIT')
const canEditActivity = (row: CouponActivity) => canManage.value && actionAvailable(row, 'EDIT')
const canEditTemplate = (row: CouponTemplateSummary) => canManage.value && row.status === 'DRAFT'
const formatDate = (value?: string | null) => value ? new Date(value).toLocaleString('zh-CN') : '-'
const toInputTime = (value?: string | null) => value ? value.slice(0, 16) : ''
function toApiTime(value: string) {
  if (!value) return ''
  if (/([+-]\d{2}:\d{2}|Z)$/.test(value)) return value
  const normalized = value.replace(' ', 'T')
  return `${normalized.length === 16 ? `${normalized}:00` : normalized}+08:00`
}

function resetActivity() { Object.assign(activityForm, { activityName: '', subtitle: '', bannerUrl: '', activityType: 'COUPON_CENTER', startsAt: '', endsAt: '' }); activityScheduleMode.value = 'ONCE'; Object.assign(recurrenceForm, { recurrenceType: 'WEEKLY', weekdays: [5, 6, 7], monthDays: null, dailyStartsAt: '20:00:00', windowDurationMinutes: 30, recurrenceStartsAt: '', recurrenceEndsAt: '', timezone: 'Asia/Shanghai' }) }
function resetTemplate() { templateActivityScheduleType.value = null; Object.assign(templateForm, { activityId: null, couponName: '', description: null, couponType: 'THRESHOLD_REDUCTION', thresholdAmount: '200.00', discountAmount: '30.00', percentageOff: null, maximumDiscountAmount: null, scope: { version: 0, scopeType: 'ALL', shopIds: null, categoryIds: null, spuIds: null, skuIds: null }, distributionType: 'PUBLIC_CLAIM', audienceType: 'ALL_USERS', newUserWithinDays: null, claimStartsAt: null, claimEndsAt: null, validity: { validityType: 'RELATIVE_AFTER_CLAIM', validFrom: null, validTo: null, effectiveDelayMinutes: 0, validForHours: 168 }, totalIssueLimit: 1000, perUserLimit: 1, stackMode: 'CROSS_OWNER', refundRestorePolicy: 'FULL_TRADE_ONLY', budgetAmount: '30000.00', sortOrder: 10 }) }
function selectedScopeIds() { const scope = templateForm.scope; return scope.scopeType === 'CATEGORY' ? scope.categoryIds : scope.scopeType === 'SPU' ? scope.spuIds : scope.scopeType === 'SKU' ? scope.skuIds : null }
async function loadCategoryOptions() {
  try {
    await loadCategories()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '分类列表加载失败')
  }
}
async function loadProductOptions() {
  try {
    await searchProducts()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '商品列表加载失败')
  }
}
async function loadSkuOptions() {
  try {
    await searchSkus()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : 'SKU 列表加载失败')
  }
}
function handleProductOptionsVisible(visible: boolean) {
  if (visible) void loadProductOptions()
}
function handleSkuOptionsVisible(visible: boolean) {
  if (visible) void loadSkuOptions()
}
function hydrateScopeTargetOptions(scope: CouponTemplateDetail['scope']) {
  const targets = scope.targets ?? []
  if (scope.scopeType === 'SPU') {
    addProductOptions(targets.map((target) => ({ id: target.targetId, productNo: target.targetNo ?? target.targetId, productName: target.targetName ?? target.targetId })))
  }
  if (scope.scopeType === 'SKU') {
    addSkuOptions(targets.map((target) => ({ id: target.targetId, skuNo: target.targetNo ?? target.targetId, skuName: target.targetName ?? target.targetId, productId: target.targetId, productName: '' })))
  }
}
function handleScopeTypeChange(scopeType: Exclude<CouponTemplateScopeType, 'SHOP'>) {
  if (scopeType === 'CATEGORY') void loadCategoryOptions()
  if (scopeType === 'SPU') void loadProductOptions()
  if (scopeType === 'SKU') void loadSkuOptions()
}
function amount(value: string | null) { return Number(value ?? '') }
function scopeIdsFromDetail(scope: CouponTemplateDetail['scope']) {
  const ids = scope.targets?.map((target) => target.targetId) ?? []
  return {
    categoryIds: scope.scopeType === 'CATEGORY' ? ids : null,
    spuIds: scope.scopeType === 'SPU' ? ids : null,
    skuIds: scope.scopeType === 'SKU' ? ids : null
  }
}
function recurrenceError() {
  if (!recurrenceForm.recurrenceStartsAt || !recurrenceForm.recurrenceEndsAt) return '请填写周期起止时间'
  const startsAt = new Date(recurrenceForm.recurrenceStartsAt).getTime()
  const endsAt = new Date(recurrenceForm.recurrenceEndsAt).getTime()
  if (startsAt >= endsAt) return '周期结束时间必须晚于开始时间'
  if (endsAt - startsAt > 366 * 24 * 60 * 60 * 1000) return '周期活动跨度不能超过 366 天'
  if (recurrenceForm.windowDurationMinutes < 1 || recurrenceForm.windowDurationMinutes > 1440) return '单次领取窗口必须为 1 到 1440 分钟'
  if (recurrenceForm.recurrenceType === 'WEEKLY' && !recurrenceForm.weekdays?.length) return '请选择每周开抢日期'
  if (recurrenceForm.recurrenceType === 'MONTHLY' && !recurrenceForm.monthDays?.length) return '请选择每月开抢日期'
  return ''
}
function recurrencePayload(): RecurringCouponSchedule {
  return {
    ...recurrenceForm,
    weekdays: recurrenceForm.recurrenceType === 'WEEKLY' ? [...new Set(recurrenceForm.weekdays ?? [])].sort((a, b) => a - b) : null,
    monthDays: recurrenceForm.recurrenceType === 'MONTHLY' ? [...new Set(recurrenceForm.monthDays ?? [])].sort((a, b) => a - b) : null,
    dailyStartsAt: recurrenceForm.dailyStartsAt.length === 5 ? `${recurrenceForm.dailyStartsAt}:00` : recurrenceForm.dailyStartsAt,
    recurrenceStartsAt: toApiTime(recurrenceForm.recurrenceStartsAt),
    recurrenceEndsAt: toApiTime(recurrenceForm.recurrenceEndsAt)
  }
}

function validateTemplate() {
  if (!templateForm.couponName.trim()) return '请输入优惠券名称'
  if (templateForm.couponType === 'THRESHOLD_REDUCTION' && !(amount(templateForm.thresholdAmount) > 0 && amount(templateForm.discountAmount) > 0 && amount(templateForm.discountAmount) < amount(templateForm.thresholdAmount))) return '满减券必须满足门槛大于 0、优惠大于 0 且小于门槛'
  if (templateForm.couponType === 'CASH_RED_PACKET' && !(amount(templateForm.thresholdAmount) === 0 && amount(templateForm.discountAmount) > 0)) return '现金红包门槛必须为 0 且优惠金额大于 0'
  if (templateForm.couponType === 'PERCENTAGE' && !(amount(templateForm.percentageOff) > 0 && amount(templateForm.percentageOff) < 100 && amount(templateForm.maximumDiscountAmount) > 0)) return '折扣券必须填写 0 到 100 之间的折扣比例和最高优惠金额'
  if (templateForm.scope.scopeType === 'SHOP') return '店铺模板不能选择指定店铺范围'
  if (templateForm.scope.scopeType !== 'ALL' && !(selectedScopeIds()?.length)) return '请填写适用范围 ID'
  if (templateForm.audienceType === 'SPECIFIED_USERS' && templateForm.distributionType !== 'DIRECT_GRANT') return '指定用户人群只允许定向发券'
  if (['PUBLIC_CLAIM', 'FLASH_CLAIM'].includes(templateForm.distributionType) && (!templateForm.activityId || !templateForm.claimStartsAt || !templateForm.claimEndsAt)) return '公开领取和限时抢券必须关联活动并填写领取窗口'
  if (templateForm.claimStartsAt && templateForm.claimEndsAt && new Date(templateForm.claimStartsAt) >= new Date(templateForm.claimEndsAt)) return '领取结束时间必须晚于开始时间'
  const activity = templateActivityOptions.value.find((item) => String(item.id) === String(templateForm.activityId))
  if (templateForm.distributionType === 'FLASH_CLAIM' && activity?.activityType !== 'FLASH_CLAIM') return '限时抢券模板必须关联限时抢券活动'
  if (activity && templateForm.claimStartsAt && templateForm.claimEndsAt) {
    const startsAt = new Date(templateForm.claimStartsAt).getTime()
    const endsAt = new Date(templateForm.claimEndsAt).getTime()
    const outsideWindow = templateActivityScheduleType.value === 'RECURRING'
      ? startsAt > new Date(activity.startsAt).getTime() || endsAt < new Date(activity.endsAt).getTime()
      : startsAt < new Date(activity.startsAt).getTime() || endsAt > new Date(activity.endsAt).getTime()
    if (outsideWindow) return templateActivityScheduleType.value === 'RECURRING' ? '周期活动的领取窗口必须覆盖完整活动周期' : '领取窗口必须位于活动时间范围内'
  }
  if (templateForm.audienceType === 'NEW_USERS' && (!templateForm.newUserWithinDays || templateForm.newUserWithinDays > 365)) return '新用户注册天数必须为 1 到 365'
  if (templateForm.perUserLimit < 1 || templateForm.perUserLimit > 99) return '单用户限领必须为 1 到 99'
  if (templateForm.validity.validityType === 'FIXED_RANGE') {
    if (!templateForm.validity.validFrom || !templateForm.validity.validTo) return '请填写固定有效期'
    if (new Date(templateForm.validity.validFrom) >= new Date(templateForm.validity.validTo)) return '固定有效期结束时间必须晚于开始时间'
    if (['PUBLIC_CLAIM', 'FLASH_CLAIM'].includes(templateForm.distributionType) && templateForm.claimEndsAt && new Date(templateForm.validity.validTo).getTime() - new Date(templateForm.claimEndsAt).getTime() < 60 * 60 * 1000) return '固定有效期结束时间至少晚于领取结束 1 小时'
  } else if (!templateForm.validity.validForHours || templateForm.validity.validForHours > 8760 || templateForm.validity.effectiveDelayMinutes === null || templateForm.validity.effectiveDelayMinutes > 10080) return '相对有效期必须填写有效小时数 1 到 8760，延迟 0 到 10080 分钟'
  const liability = templateForm.couponType === 'PERCENTAGE' ? amount(templateForm.maximumDiscountAmount) : amount(templateForm.discountAmount)
  if (amount(templateForm.budgetAmount) < liability * templateForm.totalIssueLimit) return '预算金额不能小于单券最大责任乘以发行上限'
  return ''
}
async function handleTemplateActivityChange(activityId: string | number | null) {
  templateActivityScheduleType.value = null
  const activity = availableActivityRows.value.find((item) => String(item.id) === String(activityId))
  if (!activity) return
  if (activity.activityType === 'FLASH_CLAIM') templateForm.distributionType = 'FLASH_CLAIM'
  if (['PUBLIC_CLAIM', 'FLASH_CLAIM'].includes(templateForm.distributionType)) {
    templateForm.claimStartsAt = toInputTime(activity.startsAt)
    templateForm.claimEndsAt = toInputTime(activity.endsAt)
  }
  try {
    templateActivityScheduleType.value = (await getMerchantCouponActivitySchedule(shopId.value, activity.id)).scheduleType
  } catch {
    templateActivityScheduleType.value = 'ONCE'
  }
}
function templatePayload(): CreateCouponTemplateRequest {
  const scope = { ...templateForm.scope, shopIds: null, categoryIds: templateForm.scope.scopeType === 'CATEGORY' ? templateForm.scope.categoryIds : null, spuIds: templateForm.scope.scopeType === 'SPU' ? templateForm.scope.spuIds : null, skuIds: templateForm.scope.scopeType === 'SKU' ? templateForm.scope.skuIds : null }
  const validity = templateForm.validity.validityType === 'FIXED_RANGE'
    ? { validityType: 'FIXED_RANGE' as const, validFrom: templateForm.validity.validFrom ? toApiTime(templateForm.validity.validFrom) : null, validTo: templateForm.validity.validTo ? toApiTime(templateForm.validity.validTo) : null, effectiveDelayMinutes: null, validForHours: null }
    : { validityType: 'RELATIVE_AFTER_CLAIM' as const, validFrom: null, validTo: null, effectiveDelayMinutes: templateForm.validity.effectiveDelayMinutes, validForHours: templateForm.validity.validForHours }
  const requiresClaimWindow = ['PUBLIC_CLAIM', 'FLASH_CLAIM'].includes(templateForm.distributionType)
  return { activityId: templateForm.activityId, couponName: templateForm.couponName.trim(), description: templateForm.description?.trim() || null, couponType: templateForm.couponType, thresholdAmount: templateForm.couponType === 'CASH_RED_PACKET' ? '0.00' : templateForm.thresholdAmount?.trim() || '0.00', discountAmount: ['THRESHOLD_REDUCTION', 'CASH_RED_PACKET'].includes(templateForm.couponType) ? templateForm.discountAmount?.trim() || null : null, percentageOff: templateForm.couponType === 'PERCENTAGE' ? templateForm.percentageOff?.trim() || null : null, maximumDiscountAmount: templateForm.couponType === 'PERCENTAGE' ? templateForm.maximumDiscountAmount?.trim() || null : null, scope, distributionType: templateForm.distributionType, audienceType: templateForm.audienceType, newUserWithinDays: templateForm.audienceType === 'NEW_USERS' ? templateForm.newUserWithinDays : null, claimStartsAt: requiresClaimWindow && templateForm.claimStartsAt ? toApiTime(templateForm.claimStartsAt) : null, claimEndsAt: requiresClaimWindow && templateForm.claimEndsAt ? toApiTime(templateForm.claimEndsAt) : null, validity, totalIssueLimit: templateForm.totalIssueLimit, perUserLimit: templateForm.perUserLimit, stackMode: templateForm.stackMode, refundRestorePolicy: templateForm.refundRestorePolicy, budgetAmount: templateForm.budgetAmount.trim(), sortOrder: templateForm.sortOrder }
}

async function loadTab() {
  loading.value = true; errorMessage.value = ''
  try {
    if (activeTab.value === 'activities') { const page = await listMerchantCouponActivities(shopId.value, activityQuery); activityRows.value = page.items; activityTotal.value = page.total }
    else if (activeTab.value === 'templates') { const page = await listMerchantCouponTemplates(shopId.value, templateQuery); templateRows.value = page.items; templateTotal.value = page.total }
    else if (activeTab.value === 'codes') { const page = await listMerchantRedeemCodeBatches(shopId.value, codeQuery); codeRows.value = page.items; codeTotal.value = page.total }
    else { const page = await listMerchantFundingInvitations(shopId.value, fundingQuery); fundingRows.value = page.items; fundingTotal.value = page.total }
  } catch (error) { errorMessage.value = error instanceof Error ? error.message : '优惠券数据加载失败' } finally { loading.value = false }
}
function search() { activityQuery.page = 1; templateQuery.page = 1; codeQuery.page = 1; fundingQuery.page = 1; void loadTab() }
function pageChange(value: { page: number; pageSize: number }) { const query = activeTab.value === 'activities' ? activityQuery : activeTab.value === 'templates' ? templateQuery : activeTab.value === 'codes' ? codeQuery : fundingQuery; Object.assign(query, value); void loadTab() }

function requireCouponManage() {
  if (canManage.value) return true
  ElMessage.warning('当前账号没有优惠券管理权限')
  return false
}
function openActivity(row?: CouponActivity) { if (!requireCouponManage() || (row && !actionAvailable(row, 'EDIT'))) return; editingActivity.value = row ?? null; scheduleOnlyActivity.value = null; resetActivity(); if (row) Object.assign(activityForm, { activityName: row.activityName, subtitle: row.subtitle ?? '', bannerUrl: row.bannerUrl ?? '', activityType: row.activityType, startsAt: toInputTime(row.startsAt), endsAt: toInputTime(row.endsAt) }); activityDialogVisible.value = true }
async function saveActivity() {
  if (!requireCouponManage()) return
  if (scheduleOnlyActivity.value) return saveSchedule(scheduleOnlyActivity.value)
  if (!activityForm.activityName.trim()) return ElMessage.warning('请输入活动名称')
  if (activityScheduleMode.value === 'ONCE' && (!activityForm.startsAt || !activityForm.endsAt || new Date(activityForm.startsAt) >= new Date(activityForm.endsAt))) return ElMessage.warning('请填写有效的活动时间范围')
  const recurrenceMessage = activityScheduleMode.value === 'RECURRING' ? recurrenceError() : ''
  if (recurrenceMessage) return ElMessage.warning(recurrenceMessage)
  activityDialogLoading.value = true
  try {
    if (editingActivity.value) {
      await updateMerchantCouponActivity(shopId.value, editingActivity.value.id, { ...activityForm, activityName: activityForm.activityName.trim(), startsAt: toApiTime(activityForm.startsAt), endsAt: toApiTime(activityForm.endsAt), version: editingActivity.value.version })
    } else if (activityScheduleMode.value === 'RECURRING') {
      await createMerchantRecurringCouponActivity(shopId.value, { activityName: activityForm.activityName.trim(), subtitle: activityForm.subtitle.trim() || null, bannerUrl: activityForm.bannerUrl.trim() || null, recurrence: recurrencePayload() })
    } else {
      await createMerchantCouponActivity(shopId.value, { ...activityForm, activityName: activityForm.activityName.trim(), startsAt: toApiTime(activityForm.startsAt), endsAt: toApiTime(activityForm.endsAt) })
    }
    ElMessage.success('活动已保存')
    activityDialogVisible.value = false
    await loadTab()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '活动保存失败')
  } finally {
    activityDialogLoading.value = false
  }
}
async function runActivityAction(row: CouponActivity, action: 'publish' | 'pause' | 'resume' | 'end' | 'cancel') { if (!canManage.value || !actionAvailable(row, action.toUpperCase())) return; const reason = ['pause', 'end', 'cancel'].includes(action) ? await promptReason(action) : ''; if (['pause', 'end', 'cancel'].includes(action) && !reason) return; try { await merchantCouponActivityAction(shopId.value, row.id, action, ['pause', 'end', 'cancel'].includes(action) ? { reason, version: row.version } : { version: row.version }); ElMessage.success('活动状态已更新'); await loadTab() } catch (error) { ElMessage.error(error instanceof Error ? error.message : '活动操作失败') } }
async function openSchedule(row: CouponActivity) { if (!requireCouponManage() || !actionAvailable(row, 'EDIT')) return; try { const schedule = await getMerchantCouponActivitySchedule(shopId.value, row.id); if (schedule.scheduleType !== 'RECURRING' || !schedule.recurrence) return ElMessage.warning('该活动不是周期抢券活动'); resetActivity(); editingActivity.value = row; scheduleOnlyActivity.value = row; Object.assign(activityForm, { activityName: row.activityName, subtitle: row.subtitle ?? '', bannerUrl: row.bannerUrl ?? '', activityType: row.activityType, startsAt: toInputTime(row.startsAt), endsAt: toInputTime(row.endsAt) }); activityScheduleVersion.value = schedule.version; Object.assign(recurrenceForm, schedule.recurrence); activityScheduleMode.value = 'RECURRING'; activityDialogVisible.value = true } catch (error) { ElMessage.error(error instanceof Error ? error.message : '排期加载失败') } }
async function saveSchedule(row: CouponActivity) {
  const message = recurrenceError()
  if (message) return ElMessage.warning(message)
  activityDialogLoading.value = true
  try {
    await updateMerchantCouponActivitySchedule(shopId.value, row.id, { scheduleType: 'RECURRING', recurrence: recurrencePayload(), version: activityScheduleVersion.value })
    ElMessage.success('排期已保存')
    activityDialogVisible.value = false
    await loadTab()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '排期保存失败')
  } finally {
    activityDialogLoading.value = false
  }
}

async function openTemplate(row?: CouponTemplateSummary) {
  if (!requireCouponManage()) return
  void loadCategoryOptions()
  resetTemplate()
  editingTemplate.value = null
  if (row) {
    templateDialogLoading.value = true
    try {
      const detail = await getMerchantCouponTemplate(shopId.value, row.id)
      if (detail.status !== 'DRAFT' || !detail.availableActions.includes('EDIT')) return ElMessage.warning('当前模板不允许编辑')
      if (detail.scope.scopeType === 'SHOP') return ElMessage.warning('店铺模板不支持指定店铺范围，请联系管理员检查数据')
      const scopeIds = scopeIdsFromDetail(detail.scope)
      hydrateScopeTargetOptions(detail.scope)
      editingTemplate.value = detail
      Object.assign(templateForm, {
        activityId: detail.activity?.id ?? null,
        couponName: detail.couponName,
        description: detail.description,
        couponType: detail.couponType,
        thresholdAmount: detail.benefit.thresholdAmount ?? '0.00',
        discountAmount: detail.benefit.discountAmount ?? '',
        percentageOff: detail.benefit.percentageOff,
        maximumDiscountAmount: detail.benefit.maximumDiscountAmount,
        scope: {
          version: detail.version,
          scopeType: detail.scope.scopeType,
          shopIds: null,
          categoryIds: detail.scope.categoryIds ?? scopeIds.categoryIds,
          spuIds: detail.scope.spuIds ?? scopeIds.spuIds,
          skuIds: detail.scope.skuIds ?? scopeIds.skuIds
        },
        distributionType: detail.distributionType,
        audienceType: detail.audienceType,
        newUserWithinDays: detail.newUserWithinDays,
        claimStartsAt: toInputTime(detail.claimStartsAt),
        claimEndsAt: toInputTime(detail.claimEndsAt),
        validity: {
          validityType: detail.validity.validityType,
          validFrom: toInputTime(detail.validity.validFrom),
          validTo: toInputTime(detail.validity.validTo),
          effectiveDelayMinutes: detail.validity.effectiveDelayMinutes,
          validForHours: detail.validity.validForHours
        },
        totalIssueLimit: detail.totalIssueLimit,
        perUserLimit: detail.perUserLimit,
        stackMode: detail.stackMode,
        refundRestorePolicy: detail.refundRestorePolicy,
        budgetAmount: detail.budgetAmount,
        sortOrder: detail.sortOrder
      })
      if (detail.activity) {
        try {
          templateActivityScheduleType.value = (await getMerchantCouponActivitySchedule(shopId.value, detail.activity.id)).scheduleType
        } catch {
          templateActivityScheduleType.value = 'ONCE'
        }
      }
    } catch (error) {
      ElMessage.error(error instanceof Error ? error.message : '模板详情加载失败')
      return
    } finally {
      templateDialogLoading.value = false
    }
  }
  templateDialogVisible.value = true
}
async function saveTemplate() { if (!requireCouponManage()) return; const message = validateTemplate(); if (message) return ElMessage.warning(message); templateDialogLoading.value = true; try { const payload = templatePayload(); if (editingTemplate.value) await updateMerchantCouponTemplate(shopId.value, editingTemplate.value.id, { ...payload, version: editingTemplate.value.version }); else await createMerchantCouponTemplate(shopId.value, payload); ElMessage.success('模板已保存'); templateDialogVisible.value = false; await loadTab() } catch (error) { ElMessage.error(error instanceof Error ? error.message : '模板保存失败') } finally { templateDialogLoading.value = false } }
async function templateAction(row: CouponTemplateSummary, action: 'activate' | 'resume' | 'pause' | 'end' | 'archive') { if (!canManage.value) return; try { const latest = await getMerchantCouponTemplate(shopId.value, row.id); if (action === 'activate') await activateMerchantCouponTemplate(shopId.value, row.id, { version: latest.version }); else if (action === 'resume') await resumeMerchantCouponTemplate(shopId.value, row.id, { version: latest.version }); else { const reason = await promptReason(action); if (!reason) return; if (action === 'pause') await pauseMerchantCouponTemplate(shopId.value, row.id, { reason, version: latest.version }); else if (action === 'end') await endMerchantCouponTemplate(shopId.value, row.id, { reason, version: latest.version }); else await archiveMerchantCouponTemplate(shopId.value, row.id, { reason, version: latest.version }) } ElMessage.success('模板状态已更新'); await loadTab() } catch (error) { if (error instanceof Error && error.message !== 'cancel') ElMessage.error(error.message) } }
async function promptReason(action: string) { try { const result = await ElMessageBox.prompt(action === 'archive' ? '请输入归档原因' : '请输入操作原因', '确认操作', { inputPattern: /\S+/, inputErrorMessage: '原因不能为空', confirmButtonText: '确认', cancelButtonText: '取消' }); return result.value.trim() } catch { return '' } }
async function copyTemplate(row: CouponTemplateSummary) { try { const result = await ElMessageBox.prompt('请输入新模板名称', '复制优惠券模板', { inputValue: `${row.couponName}（副本）`, inputValidator: (value) => Boolean(value.trim()) || '模板名称不能为空' }); const latest = await getMerchantCouponTemplate(shopId.value, row.id); await copyMerchantCouponTemplate(shopId.value, row.id, { couponName: result.value.trim(), activityId: latest.activity?.id ?? null, copyScope: true, version: latest.version }); ElMessage.success('模板已复制'); await loadTab() } catch (error) { if (error instanceof Error && error.message !== 'cancel') ElMessage.error(error.message) } }
function openGrant(row: CouponTemplateSummary) { grantTemplate.value = row; Object.assign(grantForm, { userIds: '', reason: '', externalReference: '' }); grantResult.value = []; grantDialogVisible.value = true }
async function submitGrant() { if (!grantTemplate.value || !grantForm.reason.trim()) return ElMessage.warning('请输入发券原因'); const userIds = [...new Set(grantForm.userIds.split(/[,\n]/).map((value) => value.trim()).filter(Boolean))]; if (!userIds.length || userIds.length > 100) return ElMessage.warning('用户 ID 需为 1 到 100 个'); try { const result = await grantMerchantCoupons(shopId.value, grantTemplate.value.id, { userIds, reason: grantForm.reason.trim(), externalReference: grantForm.externalReference.trim() || null }); grantResult.value = result.results.map((item) => `${item.userId}: ${item.success ? '成功' : item.errorCode ?? '失败'}`); ElMessage.success(`已处理 ${result.requested} 个用户`); await loadTab() } catch (error) { ElMessage.error(error instanceof Error ? error.message : '定向发券失败') } }
function openCodes(row: CouponTemplateSummary) { codeTemplate.value = row; Object.assign(codeForm, { quantity: 100, codePrefix: '', reason: '' }); generatedCodes.value = []; codeDialogVisible.value = true }
async function submitCodes() { if (!codeTemplate.value || !codeForm.reason.trim() || codeForm.quantity < 1 || codeForm.quantity > 500) return ElMessage.warning('请输入 1 到 500 的数量和原因'); try { const result = await createMerchantRedeemCodeBatch(shopId.value, codeTemplate.value.id, { quantity: codeForm.quantity, codePrefix: codeForm.codePrefix.trim(), reason: codeForm.reason.trim() }); generatedCodes.value = result.codes; ElMessage.success('兑换码批次已生成'); await loadTab() } catch (error) { ElMessage.error(error instanceof Error ? error.message : '兑换码生成失败') } }
async function decideFunding(row: CouponFundingParticipation, decision: 'ACCEPT' | 'REJECT') { if (!canFundingApprove.value) return; const reason = decision === 'REJECT' ? await promptReason('reject') : null; if (decision === 'REJECT' && !reason) return; try { await decideMerchantFundingInvitation(shopId.value, row.id, { decision, reason, version: row.version }); ElMessage.success('联合承担邀请已处理'); await loadTab() } catch (error) { ElMessage.error(error instanceof Error ? error.message : '邀请处理失败') } }

async function initializePage() {
  try {
    await authStore.refreshCurrentUser()
  } catch {
    errorMessage.value = '账号权限同步失败，请重新登录后重试'
  }

  if (!merchantStore.ensureShop(shopId.value)) {
    errorMessage.value = '当前账号不再具备该店铺的访问权限'
    return
  }

  activeTab.value = canRead.value ? 'activities' : canGrant.value ? 'codes' : 'funding'
  await loadTab()
}

onMounted(() => {
  void initializePage()
})
</script>

<template>
  <div class="page-view coupon-page">
    <PageHeader title="优惠券管理" description="管理当前店铺的活动、优惠券模板、定向发券和兑换码。">
      <template #actions><el-button v-if="canRead && canManage && activeTab === 'activities'" type="primary" @click="openActivity()">新建活动</el-button><el-button v-if="canRead && canManage && activeTab === 'templates'" type="primary" @click="openTemplate()">新建模板</el-button></template>
    </PageHeader>
    <el-alert v-if="errorMessage" type="error" :title="errorMessage" show-icon closable @close="errorMessage = ''" />
    <el-card class="sg-card" shadow="never">
      <el-form class="filter-form" inline @submit.prevent="search">
        <el-form-item v-if="activeTab === 'activities'" label="活动名称"><el-input v-model="activityQuery.keyword" clearable placeholder="请输入活动名称" /></el-form-item>
        <el-form-item v-if="activeTab === 'activities'" label="状态"><el-select v-model="activityQuery.status" clearable placeholder="全部"><el-option v-for="(label, value) in activityStatusLabels" :key="value" :label="label" :value="value" /></el-select></el-form-item>
        <template v-if="activeTab === 'templates'"><el-form-item label="模板名称"><el-input v-model="templateQuery.keyword" clearable placeholder="请输入模板名称" /></el-form-item><el-form-item label="券种"><el-select v-model="templateQuery.couponType" clearable placeholder="全部"><el-option v-for="(label, value) in couponTypeLabels" :key="value" :label="label" :value="value" /></el-select></el-form-item><el-form-item label="领取方式"><el-select v-model="templateQuery.distributionType" clearable placeholder="全部"><el-option v-for="(label, value) in distributionTypeLabels" :key="value" :label="label" :value="value" /></el-select></el-form-item></template>
        <el-form-item v-if="activeTab === 'codes'" label="批次号"><el-input v-model="codeQuery.batchNo" clearable /></el-form-item>
        <el-form-item><el-button type="primary" @click="search">查询</el-button></el-form-item>
      </el-form>
      <el-tabs v-model="activeTab" @tab-change="loadTab">
        <el-tab-pane v-if="canRead" label="活动管理" name="activities">
          <el-table v-loading="loading" :data="activityRows" empty-text="暂无活动">
            <el-table-column prop="activityNo" label="活动编号" min-width="150" />
            <el-table-column prop="activityName" label="活动名称" min-width="180" />
            <el-table-column label="类型" width="110"><template #default="{ row }">{{ activityTypeLabels[row.activityType] }}</template></el-table-column>
            <el-table-column label="状态" width="100"><template #default="{ row }"><StatusTag :label="activityStatusLabels[row.status]" type="info" /></template></el-table-column>
            <el-table-column label="活动周期" min-width="250"><template #default="{ row }">{{ formatDate(row.startsAt) }} 至 {{ formatDate(row.endsAt) }}</template></el-table-column>
            <el-table-column prop="templateCount" label="模板数" width="80" />
            <el-table-column label="操作" fixed="right" width="170">
              <template #default="{ row }">
                <el-button v-if="canEditActivity(row)" link type="primary" @click="openActivity(row)">编辑</el-button>
                <el-button v-if="canEditActivity(row) && row.activityType === 'FLASH_CLAIM'" link type="primary" @click="openSchedule(row)">排期</el-button>
                <el-dropdown v-if="canManage && hasActivityMenuActions(row)" trigger="click">
                  <el-button link type="primary">更多<el-icon><ArrowDown /></el-icon></el-button>
                  <template #dropdown><el-dropdown-menu>
                    <el-dropdown-item v-if="actionAvailable(row, 'PUBLISH')" @click="runActivityAction(row, 'publish')">发布</el-dropdown-item>
                    <el-dropdown-item v-if="actionAvailable(row, 'PAUSE')" @click="runActivityAction(row, 'pause')">暂停</el-dropdown-item>
                    <el-dropdown-item v-if="actionAvailable(row, 'RESUME')" @click="runActivityAction(row, 'resume')">恢复</el-dropdown-item>
                    <el-dropdown-item v-if="actionAvailable(row, 'END')" @click="runActivityAction(row, 'end')">结束</el-dropdown-item>
                    <el-dropdown-item v-if="actionAvailable(row, 'CANCEL')" divided @click="runActivityAction(row, 'cancel')">取消活动</el-dropdown-item>
                  </el-dropdown-menu></template>
                </el-dropdown>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane v-if="canRead" label="模板管理" name="templates"><el-table v-loading="loading" :data="templateRows" empty-text="暂无模板"><el-table-column prop="templateNo" label="模板编号" min-width="150" /><el-table-column prop="couponName" label="优惠券名称" min-width="180" /><el-table-column label="券种" width="110"><template #default="{ row }">{{ couponTypeLabels[row.couponType] }}</template></el-table-column><el-table-column label="领取方式" width="110"><template #default="{ row }">{{ distributionTypeLabels[row.distributionType] }}</template></el-table-column><el-table-column label="状态" width="100"><template #default="{ row }"><StatusTag :label="templateStatusLabels[row.status]" type="info" /></template></el-table-column><el-table-column prop="issuedCount" label="已发行" width="90" /><el-table-column prop="totalIssueLimit" label="发行上限" width="100" /><el-table-column prop="budgetAmount" label="预算" width="120" /><el-table-column label="操作" fixed="right" width="220"><template #default="{ row }"><el-button v-if="canEditTemplate(row)" link type="primary" @click="openTemplate(row)">编辑</el-button><el-button v-if="canGrant && row.status === 'ACTIVE' && row.distributionType === 'DIRECT_GRANT'" link type="primary" @click="openGrant(row)">发券</el-button><el-button v-if="canGrant && row.status === 'ACTIVE' && row.distributionType === 'REDEEM_CODE'" link type="primary" @click="openCodes(row)">生成兑换码</el-button><el-dropdown v-if="canManage" trigger="click"><el-button link type="primary">更多<el-icon><ArrowDown /></el-icon></el-button><template #dropdown><el-dropdown-menu><el-dropdown-item v-if="row.status === 'DRAFT'" @click="templateAction(row, 'activate')">激活</el-dropdown-item><el-dropdown-item v-if="row.status === 'PAUSED'" @click="templateAction(row, 'resume')">恢复</el-dropdown-item><el-dropdown-item v-if="row.status === 'ACTIVE'" @click="templateAction(row, 'pause')">暂停</el-dropdown-item><el-dropdown-item v-if="row.status === 'ACTIVE' || row.status === 'PAUSED'" @click="templateAction(row, 'end')">结束</el-dropdown-item><el-dropdown-item v-if="row.status === 'DRAFT' || row.status === 'ENDED'" @click="templateAction(row, 'archive')">归档</el-dropdown-item><el-dropdown-item @click="copyTemplate(row)">复制</el-dropdown-item></el-dropdown-menu></template></el-dropdown></template></el-table-column></el-table></el-tab-pane>
        <el-tab-pane v-if="canGrant" label="兑换码批次" name="codes"><el-table v-loading="loading" :data="codeRows" empty-text="暂无兑换码批次"><el-table-column prop="batchNo" label="批次号" min-width="180" /><el-table-column prop="templateId" label="模板 ID" width="120" /><el-table-column prop="total" label="总数" width="80" /><el-table-column prop="active" label="可用" width="80" /><el-table-column prop="redeemed" label="已兑换" width="90" /><el-table-column prop="createdAt" label="创建时间" min-width="180" /></el-table></el-tab-pane>
        <el-tab-pane v-if="canFundingApprove" label="联合承担邀请" name="funding"><el-table v-loading="loading" :data="fundingRows" empty-text="暂无联合承担邀请"><el-table-column prop="templateNo" label="模板编号" min-width="150" /><el-table-column prop="shop.shopName" label="店铺" min-width="140" /><el-table-column prop="platformShareRate" label="平台承担" width="100" /><el-table-column prop="shopShareRate" label="店铺承担" width="100" /><el-table-column prop="status" label="状态" width="110" /><el-table-column label="操作" width="150"><template #default="{ row }"><el-button v-if="row.status === 'PENDING'" link type="success" @click="decideFunding(row, 'ACCEPT')">接受</el-button><el-button v-if="row.status === 'PENDING'" link type="danger" @click="decideFunding(row, 'REJECT')">拒绝</el-button></template></el-table-column></el-table></el-tab-pane>
      </el-tabs>
      <AppPagination v-if="activeTab === 'activities'" :page="activityQuery.page" :page-size="activityQuery.pageSize" :total="activityTotal" @change="pageChange" /><AppPagination v-else-if="activeTab === 'templates'" :page="templateQuery.page" :page-size="templateQuery.pageSize" :total="templateTotal" @change="pageChange" /><AppPagination v-else-if="activeTab === 'codes'" :page="codeQuery.page" :page-size="codeQuery.pageSize" :total="codeTotal" @change="pageChange" /><AppPagination v-else :page="fundingQuery.page" :page-size="fundingQuery.pageSize" :total="fundingTotal" @change="pageChange" />
    </el-card>

    <el-dialog v-model="activityDialogVisible" :title="scheduleOnlyActivity ? '编辑周期排期' : editingActivity ? '编辑活动' : '新建活动'" width="680px">
      <el-form label-width="110px">
        <el-form-item label="活动名称" required><el-input v-model="activityForm.activityName" maxlength="128" :disabled="Boolean(scheduleOnlyActivity)" /></el-form-item>
        <el-form-item label="副标题"><el-input v-model="activityForm.subtitle" maxlength="255" :disabled="Boolean(scheduleOnlyActivity)" /></el-form-item>
        <el-form-item label="模式" required><el-radio-group v-model="activityScheduleMode" :disabled="Boolean(editingActivity)"><el-radio value="ONCE">一次性活动</el-radio><el-radio value="RECURRING">周期抢券</el-radio></el-radio-group></el-form-item>
        <template v-if="activityScheduleMode === 'ONCE'"><el-form-item label="活动类型" required><el-select v-model="activityForm.activityType"><el-option v-for="(label, value) in activityTypeLabels" :key="value" :label="label" :value="value" /></el-select></el-form-item><el-form-item label="开始时间" required><el-date-picker v-model="activityForm.startsAt" type="datetime" value-format="YYYY-MM-DDTHH:mm" /></el-form-item><el-form-item label="结束时间" required><el-date-picker v-model="activityForm.endsAt" type="datetime" value-format="YYYY-MM-DDTHH:mm" /></el-form-item></template>
        <template v-else>
          <el-form-item label="重复类型" required><el-select v-model="recurrenceForm.recurrenceType"><el-option v-for="(label, value) in recurrenceTypeLabels" :key="value" :label="label" :value="value" /></el-select></el-form-item>
          <el-form-item v-if="recurrenceForm.recurrenceType === 'WEEKLY'" label="每周日期" required><el-checkbox-group v-model="recurrenceForm.weekdays"><el-checkbox v-for="(label, day) in { 1: '周一', 2: '周二', 3: '周三', 4: '周四', 5: '周五', 6: '周六', 7: '周日' }" :key="day" :value="Number(day)">{{ label }}</el-checkbox></el-checkbox-group></el-form-item>
          <el-form-item v-if="recurrenceForm.recurrenceType === 'MONTHLY'" label="每月日期" required><el-select v-model="recurrenceForm.monthDays" multiple collapse-tags><el-option v-for="day in 31" :key="day" :label="`${day} 日`" :value="day" /></el-select></el-form-item>
          <el-form-item label="开抢时刻" required><el-time-picker v-model="recurrenceForm.dailyStartsAt" value-format="HH:mm:ss" format="HH:mm" /></el-form-item>
          <el-form-item label="窗口时长" required><el-input-number v-model="recurrenceForm.windowDurationMinutes" :min="1" :max="1440" /><span class="unit">分钟</span></el-form-item>
          <el-form-item label="周期开始" required><el-date-picker v-model="recurrenceForm.recurrenceStartsAt" type="datetime" value-format="YYYY-MM-DDTHH:mm" /></el-form-item>
          <el-form-item label="周期结束" required><el-date-picker v-model="recurrenceForm.recurrenceEndsAt" type="datetime" value-format="YYYY-MM-DDTHH:mm" /></el-form-item>
        </template>
        <el-form-item v-if="!scheduleOnlyActivity" label="横幅地址"><el-input v-model="activityForm.bannerUrl" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="activityDialogVisible = false">取消</el-button><el-button type="primary" :loading="activityDialogLoading" @click="saveActivity">保存</el-button></template>
    </el-dialog>
    <el-dialog v-model="templateDialogVisible" :title="editingTemplate ? '编辑优惠券模板' : '新建优惠券模板'" width="760px">
      <el-form label-width="125px">
        <el-form-item label="优惠券名称" required><el-input v-model="templateForm.couponName" maxlength="128" /></el-form-item>
        <el-form-item label="描述"><el-input v-model="templateForm.description" type="textarea" maxlength="500" /></el-form-item>
        <el-form-item label="券种" required><el-select v-model="templateForm.couponType"><el-option v-for="(label, value) in couponTypeLabels" :key="value" :label="label" :value="value" /></el-select></el-form-item>
        <el-form-item v-if="templateForm.couponType !== 'PERCENTAGE'" label="门槛金额" required><el-input v-model="templateForm.thresholdAmount" /></el-form-item>
        <el-form-item v-if="templateForm.couponType !== 'PERCENTAGE'" label="优惠金额" required><el-input v-model="templateForm.discountAmount" /></el-form-item>
        <el-form-item v-if="templateForm.couponType === 'PERCENTAGE'" label="折扣比例" required><el-input v-model="templateForm.percentageOff"><template #append>%</template></el-input></el-form-item>
        <el-form-item v-if="templateForm.couponType === 'PERCENTAGE'" label="最高优惠" required><el-input v-model="templateForm.maximumDiscountAmount" /></el-form-item>
        <el-form-item label="适用范围" required><el-select v-model="templateForm.scope.scopeType" @change="handleScopeTypeChange"><el-option v-for="(label, value) in scopeTypeLabels" :key="value" :label="label" :value="value" /></el-select></el-form-item>
        <el-form-item v-if="templateForm.scope.scopeType === 'CATEGORY'" label="指定分类" required><el-tree-select v-model="templateForm.scope.categoryIds" :data="categoryTree" :loading="categoriesLoading" :props="{ value: 'id', label: 'categoryName', children: 'children' }" clearable filterable multiple show-checkbox check-strictly default-expand-all placeholder="选择适用分类" style="width: 100%"><template #default="{ data }">{{ data.categoryName }}（{{ data.categoryCode }}）</template></el-tree-select></el-form-item>
        <el-form-item v-else-if="templateForm.scope.scopeType === 'SPU'" label="指定商品" required><el-select v-model="templateForm.scope.spuIds" :loading="productsLoading" clearable filterable multiple remote reserve-keyword placeholder="输入商品名称或 SPU 编号搜索" style="width: 100%" :remote-method="searchProducts" @visible-change="handleProductOptionsVisible"><el-option v-for="product in productOptions" :key="product.id" :label="`${product.productName}（${product.productNo}）`" :value="product.id" /></el-select></el-form-item>
        <el-form-item v-else-if="templateForm.scope.scopeType === 'SKU'" label="指定 SKU" required><el-select v-model="templateForm.scope.skuIds" :loading="skusLoading" clearable filterable multiple remote reserve-keyword placeholder="输入商品名称或 SPU 编号筛选 SKU" style="width: 100%" :remote-method="searchSkus" @visible-change="handleSkuOptionsVisible"><el-option v-for="sku in skuOptions" :key="sku.id" :label="`${sku.productName ? `${sku.productName} - ` : ''}${sku.skuName}（${sku.skuNo}）`" :value="sku.id" /></el-select></el-form-item>
        <el-form-item label="领取方式" required><el-select v-model="templateForm.distributionType"><el-option v-for="(label, value) in distributionTypeLabels" :key="value" :label="label" :value="value" /></el-select></el-form-item>
        <el-form-item label="领取人群" required><el-select v-model="templateForm.audienceType"><el-option label="全部用户" value="ALL_USERS" /><el-option label="新用户" value="NEW_USERS" /><el-option label="首单用户" value="FIRST_ORDER_USERS" /><el-option label="指定用户" value="SPECIFIED_USERS" /></el-select></el-form-item>
        <el-form-item v-if="templateForm.audienceType === 'NEW_USERS'" label="注册后天数" required><el-input-number v-model="templateForm.newUserWithinDays" :min="1" :max="365" /></el-form-item>
        <el-form-item label="关联活动" :required="['PUBLIC_CLAIM', 'FLASH_CLAIM'].includes(templateForm.distributionType)"><el-select v-model="templateForm.activityId" clearable placeholder="公开领取和限时抢券必须选择" @change="handleTemplateActivityChange"><el-option v-for="activity in templateActivityOptions" :key="activity.id" :label="activity.activityName" :value="activity.id" /></el-select></el-form-item>
        <template v-if="['PUBLIC_CLAIM', 'FLASH_CLAIM'].includes(templateForm.distributionType)"><el-form-item label="领取开始" required><el-date-picker v-model="templateForm.claimStartsAt" type="datetime" value-format="YYYY-MM-DDTHH:mm" /></el-form-item><el-form-item label="领取结束" required><el-date-picker v-model="templateForm.claimEndsAt" type="datetime" value-format="YYYY-MM-DDTHH:mm" /></el-form-item></template>
        <el-form-item label="有效期类型" required><el-radio-group v-model="templateForm.validity.validityType"><el-radio value="RELATIVE_AFTER_CLAIM">领取后有效</el-radio><el-radio value="FIXED_RANGE">固定时间</el-radio></el-radio-group></el-form-item>
        <template v-if="templateForm.validity.validityType === 'RELATIVE_AFTER_CLAIM'"><el-form-item label="生效延迟"><el-input-number v-model="templateForm.validity.effectiveDelayMinutes" :min="0" :max="10080" /></el-form-item><el-form-item label="有效小时"><el-input-number v-model="templateForm.validity.validForHours" :min="1" :max="8760" /></el-form-item></template>
        <template v-else><el-form-item label="固定开始" required><el-date-picker v-model="templateForm.validity.validFrom" type="datetime" value-format="YYYY-MM-DDTHH:mm" /></el-form-item><el-form-item label="固定结束" required><el-date-picker v-model="templateForm.validity.validTo" type="datetime" value-format="YYYY-MM-DDTHH:mm" /></el-form-item></template>
        <el-form-item label="发行上限" required><el-input-number v-model="templateForm.totalIssueLimit" :min="1" /></el-form-item>
        <el-form-item label="单用户限领" required><el-input-number v-model="templateForm.perUserLimit" :min="1" :max="99" /></el-form-item>
        <el-form-item label="预算金额" required><el-input v-model="templateForm.budgetAmount" placeholder="不低于最大单券责任 × 发行上限" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="templateDialogVisible = false">取消</el-button><el-button type="primary" :loading="templateDialogLoading" @click="saveTemplate">保存模板</el-button></template>
    </el-dialog>
    <el-dialog v-model="grantDialogVisible" title="定向发券" width="560px"><el-form label-width="110px"><el-form-item label="用户 ID" required><el-input v-model="grantForm.userIds" type="textarea" placeholder="多个 ID 用逗号或换行分隔" /></el-form-item><el-form-item label="发券原因" required><el-input v-model="grantForm.reason" type="textarea" maxlength="500" /></el-form-item><el-form-item label="外部单号"><el-input v-model="grantForm.externalReference" maxlength="128" /></el-form-item></el-form><el-alert v-if="grantResult.length" type="info" :title="grantResult.join('；')" /><template #footer><el-button @click="grantDialogVisible = false">关闭</el-button><el-button type="primary" @click="submitGrant">提交发券</el-button></template></el-dialog>
    <el-dialog v-model="codeDialogVisible" title="生成兑换码" width="560px"><el-form label-width="110px"><el-form-item label="数量" required><el-input-number v-model="codeForm.quantity" :min="1" :max="500" /></el-form-item><el-form-item label="编码前缀"><el-input v-model="codeForm.codePrefix" maxlength="16" /></el-form-item><el-form-item label="生成原因" required><el-input v-model="codeForm.reason" type="textarea" maxlength="500" /></el-form-item></el-form><el-alert v-if="generatedCodes.length" type="success" title="明文兑换码仅展示本次结果，请立即保存" /><el-input v-if="generatedCodes.length" :model-value="generatedCodes.join('\n')" type="textarea" :rows="8" readonly /><template #footer><el-button @click="codeDialogVisible = false">关闭</el-button><el-button type="primary" @click="submitCodes">生成兑换码</el-button></template></el-dialog>
  </div>
</template>

<style scoped lang="scss">
.coupon-page { display: flex; flex-direction: column; gap: 16px; }
.filter-form { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; }
.filter-form :deep(.el-form-item) { margin: 0; }
.filter-form :deep(.el-select) { width: 150px; }
.unit { margin-left: 8px; color: #6b7280; }
</style>
