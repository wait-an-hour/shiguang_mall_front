<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { useAdminAuthStore } from '@/stores/adminAuth'
import { useCouponScopeCategories } from '@/composables/useCouponScopeCategories'
import { useCouponScopeProducts } from '@/composables/useCouponScopeProducts'
import { getProductDetail as getPlatformProductDetail, listProducts as listPlatformProducts } from '@/api/admin/products'
import PageHeader from '@/components/common/PageHeader.vue'
import AppPagination from '@/components/common/AppPagination.vue'
import StatusTag from '@/components/common/StatusTag.vue'
import {
  couponActivityAction,
  createCouponActivity,
  createRecurringCouponActivity,
  activateCouponTemplate,
  resumeCouponTemplate,
  archiveCouponTemplate,
  copyCouponTemplate,
  createRedeemCodeBatch,
  endCouponTemplate,
  pauseCouponTemplate,
  createCouponTemplate,
  getCouponTemplate,
  governCouponActivity,
  getCouponActivitySchedule,
  grantCoupons,
  inviteCouponFunding,
  listCouponActivities,
  listCouponRedemptions,
  listCouponTemplates,
  listCouponUsers,
  updateCouponActivity,
  updateCouponActivitySchedule,
  updateCouponTemplate,
  type CouponActivity,
  type CouponActivityQuery,
  type CouponActivityStatus,
  type CouponRecurrenceType,
  type CouponRedemptionRecord,
  type CouponTemplate,
  type CouponTemplateSummary,
  type CouponTemplateQuery,
  type CouponUserRecord,
  type CouponUserQuery,
  type CouponRedemptionQuery,
  type CreateActivityRequest,
  type CreateCouponTemplateRequest,
  type CouponTemplateScopeRequest
} from '@/api/admin/coupons'

const auth = useAdminAuthStore()
const { categoryTree, categoriesLoading, loadCategories } = useCouponScopeCategories()
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
    const page = await listPlatformProducts({ keyword, page: 1, pageSize })
    return page.items.map((product) => ({ id: product.id, productNo: product.spuNo ?? product.id, productName: product.name }))
  },
  async getProductDetail(productId) {
    const product = await getPlatformProductDetail(productId)
    return {
      id: product.id,
      productNo: product.spuNo ?? product.id,
      productName: product.name,
      skus: (product.skus ?? []).map((sku) => ({ id: sku.id, skuNo: sku.skuNo, skuName: sku.skuName, productId: product.id, productName: product.name }))
    }
  }
})
const activeTab = ref('activities')
const loading = ref(false)
const canManage = computed(() => auth.hasPermissions(['platform:coupon:manage']))
const canGovern = computed(() => auth.hasPermissions(['platform:coupon:governance']))
const dialogVisible = ref(false)
const dialogLoading = ref(false)
const editingActivity = ref<CouponActivity | null>(null)
const schedulingActivity = ref<CouponActivity | null>(null)
const scheduleDialogVisible = ref(false)
const scheduleDialogLoading = ref(false)
const scheduleVersion = ref(0)
const activityRows = ref<CouponActivity[]>([])
const activityTemplateCounts = ref<Record<string, number>>({})
const templateActivityScheduleType = ref<'ONCE' | 'RECURRING' | null>(null)
const availableActivityRows = computed(() => activityRows.value.filter((activity) => !['CANCELLED', 'ENDED'].includes(activity.status)))
const templateRows = ref<CouponTemplateSummary[]>([])
const userRows = ref<CouponUserRecord[]>([])
const redemptionRows = ref<CouponRedemptionRecord[]>([])
const activityTotal = ref(0)
const templateTotal = ref(0)
const userTotal = ref(0)
const redemptionTotal = ref(0)

const activityQuery = reactive<CouponActivityQuery>({ page: 1, pageSize: 20, ownerType: 'PLATFORM' })
const templateQuery = reactive<CouponTemplateQuery>({ page: 1, pageSize: 20, ownerType: 'PLATFORM' })
const userQuery = reactive<CouponUserQuery>({ page: 1, pageSize: 20 })
const redemptionQuery = reactive<CouponRedemptionQuery>({ page: 1, pageSize: 20 })
const activityScheduleMode = ref<'ONCE' | 'RECURRING'>('ONCE')
const activityForm = reactive<CreateActivityRequest>({ activityName: '', subtitle: '', bannerUrl: '', activityType: 'COUPON_CENTER', startsAt: '', endsAt: '' })
const recurrenceForm = reactive({ recurrenceType: 'WEEKLY' as CouponRecurrenceType, weekdays: [5, 6, 7], monthDays: [1], dailyStartsAt: '20:00', windowDurationMinutes: 30, recurrenceStartsAt: '', recurrenceEndsAt: '', timezone: 'Asia/Shanghai' as const })
const templateDialogVisible = ref(false)
const templateDialogLoading = ref(false)
const templateFormRef = ref<FormInstance>()
const editingTemplate = ref<CouponTemplate | null>(null)
const templateForm = reactive<CreateCouponTemplateRequest>({
  ownerType: 'PLATFORM', activityId: null, couponName: '', description: null, couponType: 'THRESHOLD_REDUCTION',
  thresholdAmount: '200.00', discountAmount: '30.00', percentageOff: null, maximumDiscountAmount: null,
  fundingType: 'PLATFORM', platformShareRate: '100.0000',
  scope: { version: 0, scopeType: 'ALL', shopIds: null, categoryIds: null, spuIds: null, skuIds: null },
  distributionType: 'PUBLIC_CLAIM', audienceType: 'ALL_USERS', newUserWithinDays: null,
  claimStartsAt: '', claimEndsAt: '', validity: { validityType: 'RELATIVE_AFTER_CLAIM', validFrom: null, validTo: null, effectiveDelayMinutes: 0, validForHours: 168 },
  totalIssueLimit: 1000, perUserLimit: 1, stackMode: 'CROSS_OWNER', refundRestorePolicy: 'FULL_TRADE_ONLY', budgetAmount: '30000.00', sortOrder: 10
})
watch(() => templateForm.couponType, (couponType) => {
  if (couponType === 'CASH_RED_PACKET') templateForm.thresholdAmount = '0.00'
  if (couponType === 'THRESHOLD_REDUCTION' && !templateForm.thresholdAmount) templateForm.thresholdAmount = '200.00'
  if ((couponType === 'THRESHOLD_REDUCTION' || couponType === 'CASH_RED_PACKET') && !templateForm.discountAmount) templateForm.discountAmount = '30.00'
})

const positiveAmountPattern = /^(?:[1-9]\d*|0?\.\d*[1-9]\d*)(?:\.\d{1,2})?$/
const nonNegativeAmountPattern = /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/
function amountValue(value: unknown) { return Number(String(value ?? '').trim()) }
const templateActivityOptions = computed(() => {
  const rows = [...availableActivityRows.value]
  const current = editingTemplate.value?.activity
  if (current && !rows.some((activity) => String(activity.id) === String(current.id))) rows.unshift(current)
  return rows
})
const selectedTemplateActivity = computed(() => templateActivityOptions.value.find((activity) => String(activity.id) === String(templateForm.activityId)))
const isTemplateRecurringActivity = computed(() => templateActivityScheduleType.value === 'RECURRING')
const requiresClaimWindow = computed(() => ['PUBLIC_CLAIM', 'FLASH_CLAIM'].includes(templateForm.distributionType))
const timeValue = (value?: string | null) => value ? new Date(value).getTime() : Number.NaN
watch(() => templateForm.fundingType, (fundingType) => {
  if (fundingType === 'PLATFORM') templateForm.platformShareRate = '100.0000'
  if (fundingType === 'SHOP') templateForm.platformShareRate = '0.0000'
})
const templateFormRules: FormRules<CreateCouponTemplateRequest> = {
  couponName: [{ required: true, whitespace: true, message: '请输入券名称', trigger: 'blur' }],
  thresholdAmount: [{ validator: (_rule, value, callback) => {
    if (templateForm.couponType === 'THRESHOLD_REDUCTION' && (!positiveAmountPattern.test(String(value)) || amountValue(value) <= 0)) callback(new Error('满减券门槛金额必须大于 0'))
    else if (!nonNegativeAmountPattern.test(String(value))) callback(new Error('门槛金额最多保留 2 位小数'))
    else callback()
  }, trigger: 'blur' }],
  discountAmount: [{ validator: (_rule, value, callback) => {
    if (['THRESHOLD_REDUCTION', 'CASH_RED_PACKET'].includes(templateForm.couponType) && (!positiveAmountPattern.test(String(value)) || amountValue(value) <= 0)) callback(new Error('优惠金额必须大于 0'))
    else if (templateForm.couponType === 'THRESHOLD_REDUCTION' && amountValue(value) >= amountValue(templateForm.thresholdAmount)) callback(new Error('优惠金额必须小于门槛金额'))
    else callback()
  }, trigger: 'blur' }],
  percentageOff: [{ validator: (_rule, value, callback) => {
    if (templateForm.couponType !== 'PERCENTAGE') callback()
    else if (!positiveAmountPattern.test(String(value)) || amountValue(value) <= 0 || amountValue(value) >= 100) callback(new Error('折扣比例必须在 0 到 100 之间'))
    else callback()
  }, trigger: 'blur' }],
  activityId: [{ validator: (_rule, value, callback) => {
    if (['PUBLIC_CLAIM', 'FLASH_CLAIM'].includes(templateForm.distributionType) && !value) callback(new Error('公开领取和限时抢券必须关联活动'))
    else callback()
  }, trigger: 'change' }],
  distributionType: [{ validator: (_rule, value, callback) => {
    if (isTemplateRecurringActivity.value && value !== 'FLASH_CLAIM') callback(new Error('周期性活动必须选择限时抢券'))
    else callback()
  }, trigger: 'change' }],
  claimStartsAt: [{ validator: (_rule, value, callback) => {
    if ((templateForm.distributionType === 'FLASH_CLAIM' || isTemplateRecurringActivity.value) && !value) callback(new Error('请选择领取开始时间'))
    else if (isTemplateRecurringActivity.value && timeValue(value) > timeValue(selectedTemplateActivity.value?.startsAt)) callback(new Error('周期性活动的领取开始时间必须早于或等于活动开始时间'))
    else callback()
  }, trigger: 'change' }],
  claimEndsAt: [{ validator: (_rule, value, callback) => {
    if ((templateForm.distributionType === 'FLASH_CLAIM' || isTemplateRecurringActivity.value) && (!templateForm.claimStartsAt || !value)) callback(new Error('限时抢券必须填写领取开始和结束时间'))
    else if (templateForm.claimStartsAt && value && new Date(templateForm.claimStartsAt) >= new Date(String(value))) callback(new Error('领取结束时间必须晚于开始时间'))
    else if (isTemplateRecurringActivity.value && timeValue(value) < timeValue(selectedTemplateActivity.value?.endsAt)) callback(new Error('周期性活动的领取结束时间必须晚于或等于活动结束时间'))
    else callback()
  }, trigger: 'change' }],
  maximumDiscountAmount: [{ validator: (_rule, value, callback) => {
    if (templateForm.couponType === 'PERCENTAGE' && (!positiveAmountPattern.test(String(value)) || amountValue(value) <= 0)) callback(new Error('最高优惠金额必须大于 0'))
    else callback()
  }, trigger: 'blur' }],
  totalIssueLimit: [{ type: 'number', min: 1, message: '发行上限必须大于 0', trigger: 'change' }],
  perUserLimit: [{ type: 'number', min: 1, max: 99, message: '单用户限领必须为 1 到 99', trigger: 'change' }],
  budgetAmount: [{ required: true, pattern: positiveAmountPattern, message: '预算金额必须大于 0，最多保留 2 位小数', trigger: 'blur' }]
}
const activityStatusLabels: Record<string, string> = { DRAFT: '草稿', SCHEDULED: '已排期', RUNNING: '进行中', PAUSED: '已暂停', ENDED: '已结束', CANCELLED: '已取消' }
const templateStatusLabels: Record<string, string> = { DRAFT: '草稿', ACTIVE: '生效中', PAUSED: '已暂停', ENDED: '已结束', ARCHIVED: '已归档' }
const userCouponStatusLabels: Record<string, string> = { AVAILABLE: '可使用', LOCKED: '已锁定', USED: '已使用', EXPIRED: '已过期', REVOKED: '已撤销' }
const redemptionStatusLabels: Record<string, string> = { RESERVED: '已预占', CONSUMED: '已核销', RELEASED: '已释放', RESTORED: '已恢复' }
// 活动管理筛选与活动列表状态保持一致，已排期使用后端枚举值 SCHEDULED 精确查询。
const activityStatusOptions = Object.entries(activityStatusLabels)
  .map(([value, label]) => ({ value, label }))
const templateStatusOptions = Object.entries(templateStatusLabels).map(([value, label]) => ({ value, label }))
const userCouponStatusOptions = Object.entries(userCouponStatusLabels).map(([value, label]) => ({ value, label }))
const redemptionStatusOptions = Object.entries(redemptionStatusLabels).map(([value, label]) => ({ value, label }))
const activityTypeLabels: Record<string, string> = { COUPON_CENTER: '领券中心', FLASH_CLAIM: '限时抢券', NEW_USER_WELCOME: '新客欢迎', TARGETED_CAMPAIGN: '定向活动' }
const couponTypeLabels: Record<string, string> = { PERCENTAGE: '折扣券', THRESHOLD_REDUCTION: '满减券', CASH_RED_PACKET: '现金红包' }
const distributionTypeLabels: Record<string, string> = { PUBLIC_CLAIM: '公开领取', FLASH_CLAIM: '限时抢券', REDEEM_CODE: '兑换码', DIRECT_GRANT: '定向发券', SYSTEM_GRANT: '系统发放' }
const recurrenceTypeLabels: Record<CouponRecurrenceType, string> = { DAILY: '每天', WEEKLY: '每周', MONTHLY: '每月' }
const weekdayOptions = [{ label: '周一', value: 1 }, { label: '周二', value: 2 }, { label: '周三', value: 3 }, { label: '周四', value: 4 }, { label: '周五', value: 5 }, { label: '周六', value: 6 }, { label: '周日', value: 7 }]
const monthDayOptions = Array.from({ length: 31 }, (_, index) => ({ label: `${index + 1} 日`, value: index + 1 }))

function formatDate(value?: string | null) { return value ? new Date(value).toLocaleString('zh-CN') : '-' }
function activityStatusType(status: CouponActivityStatus) { return status === 'RUNNING' ? 'success' : status === 'CANCELLED' || status === 'ENDED' ? 'info' : 'warning' }
function templateStatusType(status: string) { return status === 'ACTIVE' ? 'success' : status === 'ENDED' ? 'info' : status === 'PAUSED' ? 'danger' : 'warning' }
function activeTemplateCount(row: CouponActivity) {
  // 优先使用活动列表接口返回的模板数，避免模板运营列表未返回 activityId 时把有关联的活动误算为 0。
  // 若后端未返回该字段，再使用当前页模板列表的关联匹配结果作为兜底。
  return row.templateCount ?? activityTemplateCounts.value[String(row.id)] ?? 0
}
function toApiTime(value: string) {
  if (!value) return value
  const date = new Date(value)
  if (!Number.isNaN(date.getTime())) {
    const utc = date.getTime()
    const shanghai = new Date(utc + 8 * 60 * 60 * 1000)
    const yyyy = shanghai.getUTCFullYear()
    const MM = String(shanghai.getUTCMonth() + 1).padStart(2, '0')
    const dd = String(shanghai.getUTCDate()).padStart(2, '0')
    const HH = String(shanghai.getUTCHours()).padStart(2, '0')
    const mm = String(shanghai.getUTCMinutes()).padStart(2, '0')
    const ss = String(shanghai.getUTCSeconds()).padStart(2, '0')
    return `${yyyy}-${MM}-${dd}T${HH}:${mm}:${ss}+08:00`
  }
  const localValue = String(value).trim().replace(' ', 'T').replace(/([+-]\d{2}:\d{2}|Z)$/, '').replace(/\.\d{1,9}$/, '')
  const [datePart, timePart = '00:00'] = localValue.split('T')
  const [hour = '00', minute = '00', second = '00'] = timePart.split(':')
  return `${datePart}T${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:${second.padStart(2, '0')}+08:00`
}
function toInputTime(value?: string | null) { return value ? value.slice(0, 16) : '' }
function toApiClock(value: string) { return value.length === 5 ? `${value}:00` : value }
function scopeIdsFromDetail(scope: CouponTemplate['scope']) {
  const ids = scope.targets?.map((target) => target.targetId) ?? []
  return {
    shopIds: scope.scopeType === 'SHOP' ? ids : null,
    categoryIds: scope.scopeType === 'CATEGORY' ? ids : null,
    spuIds: scope.scopeType === 'SPU' ? ids : null,
    skuIds: scope.scopeType === 'SKU' ? ids : null
  }
}
function hasActivityMenuActions(row: CouponActivity) {
  return row.availableActions.some((action) => action !== 'EDIT')
}
function resetRecurrenceForm() {
  Object.assign(recurrenceForm, { recurrenceType: 'WEEKLY', weekdays: [5, 6, 7], monthDays: [1], dailyStartsAt: '20:00', windowDurationMinutes: 30, recurrenceStartsAt: '', recurrenceEndsAt: '', timezone: 'Asia/Shanghai' })
}
function fillRecurrenceForm(recurrence: { recurrenceType: CouponRecurrenceType; weekdays: number[] | null; monthDays: number[] | null; dailyStartsAt: string; windowDurationMinutes: number; recurrenceStartsAt: string; recurrenceEndsAt: string; timezone: 'Asia/Shanghai' }) {
  Object.assign(recurrenceForm, {
    recurrenceType: recurrence.recurrenceType,
    weekdays: recurrence.weekdays ?? [],
    monthDays: recurrence.monthDays ?? [],
    dailyStartsAt: recurrence.dailyStartsAt.slice(0, 5),
    windowDurationMinutes: recurrence.windowDurationMinutes,
    recurrenceStartsAt: toInputTime(recurrence.recurrenceStartsAt),
    recurrenceEndsAt: toInputTime(recurrence.recurrenceEndsAt),
    timezone: recurrence.timezone
  })
}
function validateRecurrenceForm() {
  if (!recurrenceForm.dailyStartsAt || !recurrenceForm.recurrenceStartsAt || !recurrenceForm.recurrenceEndsAt || recurrenceForm.windowDurationMinutes < 1) { ElMessage.warning('请完整填写周期抢券规则'); return false }
  if (recurrenceForm.recurrenceType === 'WEEKLY' && !recurrenceForm.weekdays.length) { ElMessage.warning('请选择每周开抢日期'); return false }
  if (recurrenceForm.recurrenceType === 'MONTHLY' && !recurrenceForm.monthDays.length) { ElMessage.warning('请选择每月开抢日期'); return false }
  if (new Date(recurrenceForm.recurrenceStartsAt) >= new Date(recurrenceForm.recurrenceEndsAt)) { ElMessage.warning('周期结束时间必须晚于开始时间'); return false }
  if (new Date(recurrenceForm.recurrenceEndsAt).getTime() - new Date(recurrenceForm.recurrenceStartsAt).getTime() > 366 * 24 * 60 * 60 * 1000) { ElMessage.warning('周期活动跨度不能超过 366 天'); return false }
  return true
}
function buildRecurrencePayload() {
  return {
    recurrenceType: recurrenceForm.recurrenceType,
    weekdays: recurrenceForm.recurrenceType === 'WEEKLY' ? [...new Set(recurrenceForm.weekdays)].sort((a, b) => a - b) : null,
    monthDays: recurrenceForm.recurrenceType === 'MONTHLY' ? [...new Set(recurrenceForm.monthDays)].sort((a, b) => a - b) : null,
    dailyStartsAt: toApiClock(recurrenceForm.dailyStartsAt),
    windowDurationMinutes: recurrenceForm.windowDurationMinutes,
    recurrenceStartsAt: toApiTime(recurrenceForm.recurrenceStartsAt),
    recurrenceEndsAt: toApiTime(recurrenceForm.recurrenceEndsAt),
    timezone: recurrenceForm.timezone
  }
}
function recurrenceSummary(row: CouponActivity) {
  if (row.activityType !== 'FLASH_CLAIM') return '-'
  return `${formatDate(row.startsAt)} 至 ${formatDate(row.endsAt)}`
}
async function handleTemplateActivityChange(activityId: string | number | null) {
  templateActivityScheduleType.value = null
  const activity = activityRows.value.find((item) => String(item.id) === String(activityId))
  if (activity?.activityType === 'FLASH_CLAIM') {
    // 周期抢券模板默认沿用活动生命周期，避免保存出领取窗口为空或范围不足的无效模板。
    templateForm.distributionType = 'FLASH_CLAIM'
    templateForm.claimStartsAt = toInputTime(activity.startsAt)
    templateForm.claimEndsAt = toInputTime(activity.endsAt)
    try {
      const schedule = await getCouponActivitySchedule(activity.id)
      templateActivityScheduleType.value = schedule.scheduleType
    } catch {
      templateActivityScheduleType.value = 'ONCE'
    }
  }
  templateFormRef.value?.clearValidate(['distributionType', 'claimStartsAt', 'claimEndsAt'])
  void templateFormRef.value?.validateField(['distributionType', 'claimStartsAt', 'claimEndsAt'])
}
function resetTemplateForm() {
  templateActivityScheduleType.value = null
  Object.assign(templateForm, {
    ownerType: 'PLATFORM', activityId: null, couponName: '', description: null, couponType: 'THRESHOLD_REDUCTION',
    thresholdAmount: '200.00', discountAmount: '30.00', percentageOff: null, maximumDiscountAmount: null, fundingType: 'PLATFORM', platformShareRate: '100.0000',
    scope: { version: 0, scopeType: 'ALL', shopIds: null, categoryIds: null, spuIds: null, skuIds: null }, distributionType: 'PUBLIC_CLAIM', audienceType: 'ALL_USERS', newUserWithinDays: null,
    claimStartsAt: '', claimEndsAt: '', validity: { validityType: 'RELATIVE_AFTER_CLAIM', validFrom: null, validTo: null, effectiveDelayMinutes: 0, validForHours: 168 },
    totalIssueLimit: 1000, perUserLimit: 1, stackMode: 'CROSS_OWNER', refundRestorePolicy: 'FULL_TRADE_ONLY', budgetAmount: '30000.00', sortOrder: 10
  })
}
async function openTemplate(template?: CouponTemplateSummary) {
  void loadCategoryOptions()
  editingTemplate.value = null
  resetTemplateForm()
  templateDialogVisible.value = true
  if (!template) return
  templateDialogLoading.value = true
  try {
    const detail = await getCouponTemplate(template.id)
    const scope = detail.scope ?? templateForm.scope
    const scopeIds = scopeIdsFromDetail(detail.scope)
    hydrateScopeTargetOptions(scope)
    const validity = detail.validity ?? templateForm.validity
    Object.assign(templateForm, {
      ownerType: 'PLATFORM',
      // 优先使用接口直接返回的 activityId，兼容 activity 对象未展开的详情响应。
      activityId: detail.activity?.id ?? null,
      couponName: detail.couponName,
      description: detail.description,
      couponType: detail.couponType,
      thresholdAmount: detail.benefit?.thresholdAmount ?? '0.00',
      discountAmount: detail.benefit?.discountAmount ?? '30.00',
      percentageOff: detail.benefit?.percentageOff ?? null,
      maximumDiscountAmount: detail.benefit?.maximumDiscountAmount ?? null,
      fundingType: detail.fundingType,
      platformShareRate: detail.platformShareRate,
      scope: {
        version: detail.version,
        scopeType: scope.scopeType,
        shopIds: scope.shopIds ?? scopeIds.shopIds,
        categoryIds: scope.categoryIds ?? scopeIds.categoryIds,
        spuIds: scope.spuIds ?? scopeIds.spuIds,
        skuIds: scope.skuIds ?? scopeIds.skuIds
      },
      distributionType: detail.distributionType,
      audienceType: detail.audienceType,
      newUserWithinDays: detail.newUserWithinDays ?? null,
      claimStartsAt: toInputTime(detail.claimStartsAt),
      claimEndsAt: toInputTime(detail.claimEndsAt),
      validity: {
        validityType: validity.validityType,
        validFrom: toInputTime(validity.validFrom),
        validTo: toInputTime(validity.validTo),
        effectiveDelayMinutes: validity.effectiveDelayMinutes ?? 0,
        validForHours: validity.validForHours ?? 168
      },
      totalIssueLimit: detail.totalIssueLimit,
      perUserLimit: detail.perUserLimit,
      stackMode: detail.stackMode,
      refundRestorePolicy: detail.refundRestorePolicy,
      budgetAmount: detail.budgetAmount,
      sortOrder: detail.sortOrder
    })
    // 保存时必须使用详情接口返回的最新版本，列表数据只用于展示，不能作为并发校验依据。
    editingTemplate.value = detail
    if (detail.status !== 'DRAFT') {
      ElMessage.warning('只有草稿状态的模板可以编辑')
      templateDialogVisible.value = false
      return
    }
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '模板详情加载失败')
    templateDialogVisible.value = false
  } finally { templateDialogLoading.value = false }
}
function selectedScopeIds(scope: CouponTemplateScopeRequest) {
  return scope.scopeType === 'SHOP' ? scope.shopIds : scope.scopeType === 'CATEGORY' ? scope.categoryIds : scope.scopeType === 'SPU' ? scope.spuIds : scope.scopeType === 'SKU' ? scope.skuIds : null
}
function scopeInputKey(scopeType: CouponTemplateScopeRequest['scopeType']) {
  return scopeType === 'SHOP' ? 'shopIds' : scopeType === 'CATEGORY' ? 'categoryIds' : scopeType === 'SPU' ? 'spuIds' : 'skuIds'
}
function scopeInputValue() {
  return selectedScopeIds(templateForm.scope)?.join(',') ?? ''
}
function updateScopeInput(value: string) {
  const key = scopeInputKey(templateForm.scope.scopeType)
  templateForm.scope[key] = value.split(',').map((id) => id.trim()).filter(Boolean)
}
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
function hydrateScopeTargetOptions(scope: CouponTemplate['scope']) {
  const targets = scope.targets ?? []
  if (scope.scopeType === 'SPU') {
    addProductOptions(targets.map((target) => ({ id: target.targetId, productNo: target.targetNo ?? target.targetId, productName: target.targetName ?? target.targetId })))
  }
  if (scope.scopeType === 'SKU') {
    addSkuOptions(targets.map((target) => ({ id: target.targetId, skuNo: target.targetNo ?? target.targetId, skuName: target.targetName ?? target.targetId, productId: target.targetId, productName: '' })))
  }
}
function handleTemplateScopeTypeChange(scopeType: CouponTemplateScopeRequest['scopeType']) {
  if (scopeType === 'CATEGORY') void loadCategoryOptions()
  if (scopeType === 'SPU') void loadProductOptions()
  if (scopeType === 'SKU') void loadSkuOptions()
}
async function saveTemplate() {
  const valid = await templateFormRef.value?.validate().catch(() => false)
  if (!valid) return
  if (!templateForm.couponName.trim() || !templateForm.budgetAmount || templateForm.totalIssueLimit < 1 || templateForm.perUserLimit < 1) { ElMessage.warning('请填写优惠券名称、预算、发行上限和单用户限领数量'); return }
  if (templateForm.scope.scopeType !== 'ALL' && !(selectedScopeIds(templateForm.scope)?.length)) { ElMessage.warning('请填写适用范围 ID'); return }
  if (templateForm.fundingType === 'SHARED' && (!['SHOP', 'SPU', 'SKU'].includes(templateForm.scope.scopeType) || amountValue(templateForm.platformShareRate) < 0.0001 || amountValue(templateForm.platformShareRate) > 99.9999)) { ElMessage.warning('联合承担仅支持指定店铺、SPU 或 SKU 范围，平台比例须为 0.0001 到 99.9999'); return }
  if (templateForm.audienceType === 'SPECIFIED_USERS' && templateForm.distributionType !== 'DIRECT_GRANT') { ElMessage.warning('指定用户人群只允许定向发券'); return }
  if (templateForm.distributionType === 'SYSTEM_GRANT' && templateForm.audienceType !== 'NEW_USERS') { ElMessage.warning('系统发放只允许新用户人群'); return }
  if (templateForm.audienceType === 'NEW_USERS' && (!templateForm.newUserWithinDays || templateForm.newUserWithinDays > 365)) { ElMessage.warning('新用户窗口必须为 1 到 365 天'); return }
  if (requiresClaimWindow.value && (!templateForm.activityId || !templateForm.claimStartsAt || !templateForm.claimEndsAt)) { ElMessage.warning('公开领取和限时抢券必须关联活动并填写领取开始和结束时间'); return }
  if (templateForm.claimStartsAt && templateForm.claimEndsAt && new Date(templateForm.claimStartsAt) >= new Date(templateForm.claimEndsAt)) { ElMessage.warning('领取结束时间必须晚于开始时间'); return }

  const selectedActivity = selectedTemplateActivity.value
  if (templateForm.distributionType === 'FLASH_CLAIM' && selectedActivity?.activityType !== 'FLASH_CLAIM') { ElMessage.warning('限时抢券模板必须关联限时抢券活动'); return }
  if (requiresClaimWindow.value && selectedActivity && !isTemplateRecurringActivity.value) {
    if (timeValue(templateForm.claimStartsAt) < timeValue(selectedActivity.startsAt) || timeValue(templateForm.claimEndsAt) > timeValue(selectedActivity.endsAt)) { ElMessage.warning('模板领取窗口必须位于活动时间范围内'); return }
  }
  if (isTemplateRecurringActivity.value) {
    // 周期抢券的服务端发布校验要求模板必须使用限时抢券领取方式，且领取窗口覆盖整个活动生命周期。
    if (templateForm.distributionType !== 'FLASH_CLAIM') {
      ElMessage.warning('周期抢券活动只能关联限时抢券模板')
      return
    }
    if (!templateForm.claimStartsAt || !templateForm.claimEndsAt) {
      ElMessage.warning('周期抢券模板必须填写领取开始和结束时间')
      return
    }
    const claimStartsAt = new Date(templateForm.claimStartsAt).getTime()
    const claimEndsAt = new Date(templateForm.claimEndsAt).getTime()
    if (!selectedActivity) {
      ElMessage.warning('请先选择关联活动')
      return
    }
    const activityStartsAt = new Date(selectedActivity.startsAt).getTime()
    const activityEndsAt = new Date(selectedActivity.endsAt).getTime()
    if (claimStartsAt > activityStartsAt || claimEndsAt < activityEndsAt) {
      ElMessage.warning('模板领取时间必须覆盖整个活动周期')
      return
    }
  }
  if (templateForm.validity.validityType === 'FIXED_RANGE' && (!templateForm.validity.validFrom || !templateForm.validity.validTo || new Date(templateForm.validity.validFrom) >= new Date(templateForm.validity.validTo))) { ElMessage.warning('请填写有效的固定有效期'); return }
  if (templateForm.validity.validityType === 'FIXED_RANGE' && requiresClaimWindow.value && templateForm.claimEndsAt && templateForm.validity.validTo && new Date(templateForm.validity.validTo).getTime() - new Date(templateForm.claimEndsAt).getTime() < 60 * 60 * 1000) { ElMessage.warning('固定有效期结束时间至少晚于领取结束 1 小时'); return }
  if (templateForm.validity.validityType === 'RELATIVE_AFTER_CLAIM' && (!templateForm.validity.validForHours || templateForm.validity.validForHours > 8760 || (templateForm.validity.effectiveDelayMinutes ?? 0) > 10080)) { ElMessage.warning('相对有效期参数超出范围'); return }
  const maximumLiability = templateForm.couponType === 'PERCENTAGE' ? amountValue(templateForm.maximumDiscountAmount) : amountValue(templateForm.discountAmount)
  if (amountValue(templateForm.budgetAmount) < maximumLiability * templateForm.totalIssueLimit) { ElMessage.warning('预算金额不能小于单券最大责任乘以发行上限'); return }
  templateDialogLoading.value = true
  try {
    const scope = { ...templateForm.scope, shopIds: templateForm.scope.scopeType === 'SHOP' ? templateForm.scope.shopIds : null, categoryIds: templateForm.scope.scopeType === 'CATEGORY' ? templateForm.scope.categoryIds : null, spuIds: templateForm.scope.scopeType === 'SPU' ? templateForm.scope.spuIds : null, skuIds: templateForm.scope.scopeType === 'SKU' ? templateForm.scope.skuIds : null }
    const payload: CreateCouponTemplateRequest = {
      ...templateForm,
      couponName: templateForm.couponName.trim(), description: templateForm.description?.trim() || null, scope,
      thresholdAmount: templateForm.thresholdAmount?.trim() || '0.00',
      discountAmount: templateForm.couponType === 'THRESHOLD_REDUCTION' || templateForm.couponType === 'CASH_RED_PACKET' ? templateForm.discountAmount : null,
      percentageOff: templateForm.couponType === 'PERCENTAGE' ? templateForm.percentageOff : null,
      maximumDiscountAmount: templateForm.couponType === 'PERCENTAGE' ? templateForm.maximumDiscountAmount : null,
       claimStartsAt: requiresClaimWindow.value && templateForm.claimStartsAt ? toApiTime(templateForm.claimStartsAt) : null, claimEndsAt: requiresClaimWindow.value && templateForm.claimEndsAt ? toApiTime(templateForm.claimEndsAt) : null,
       validity: templateForm.validity.validityType === 'FIXED_RANGE'
         ? { validityType: 'FIXED_RANGE', validFrom: templateForm.validity.validFrom ? toApiTime(templateForm.validity.validFrom) : null, validTo: templateForm.validity.validTo ? toApiTime(templateForm.validity.validTo) : null, effectiveDelayMinutes: null, validForHours: null }
         : { validityType: 'RELATIVE_AFTER_CLAIM', validFrom: null, validTo: null, effectiveDelayMinutes: templateForm.validity.effectiveDelayMinutes ?? 0, validForHours: templateForm.validity.validForHours }
    }
    if (editingTemplate.value) await updateCouponTemplate(editingTemplate.value.id, { ...payload, version: editingTemplate.value.version })
    else await createCouponTemplate(payload)
    ElMessage.success(editingTemplate.value ? '优惠券模板已更新' : '优惠券模板已创建')
    templateDialogVisible.value = false
    await loadTemplates()
  } catch (error) { ElMessage.error(error instanceof Error ? error.message : '模板保存失败') } finally { templateDialogLoading.value = false }
}

async function loadActivities() {
  loading.value = true
  try {
    const activities = await listCouponActivities(activityQuery)
    activityRows.value = activities.items
    activityTotal.value = activities.total
    activityTemplateCounts.value = Object.fromEntries(activities.items.map((activity) => [String(activity.id), activity.templateCount]))
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '活动加载失败')
  } finally {
    loading.value = false
  }
}
async function loadTemplates() { loading.value = true; try { const data = await listCouponTemplates(templateQuery); templateRows.value = data.items; templateTotal.value = data.total } catch (error) { ElMessage.error(error instanceof Error ? error.message : '模板加载失败') } finally { loading.value = false } }
async function loadUsers() { loading.value = true; try { const data = await listCouponUsers(userQuery); userRows.value = data.items; userTotal.value = data.total } catch (error) { ElMessage.error(error instanceof Error ? error.message : '用户券加载失败') } finally { loading.value = false } }
async function loadRedemptions() { loading.value = true; try { const data = await listCouponRedemptions(redemptionQuery); redemptionRows.value = data.items; redemptionTotal.value = data.total } catch (error) { ElMessage.error(error instanceof Error ? error.message : '核销记录加载失败') } finally { loading.value = false } }
function loadActiveTab() { if (activeTab.value === 'activities') return loadActivities(); if (activeTab.value === 'templates') return loadTemplates(); if (activeTab.value === 'users') return loadUsers(); return loadRedemptions() }
function search() { activityQuery.page = 1; templateQuery.page = 1; userQuery.page = 1; redemptionQuery.page = 1; void loadActiveTab() }
function changePage(value: { page: number; pageSize: number }) { const query = activeTab.value === 'activities' ? activityQuery : activeTab.value === 'templates' ? templateQuery : activeTab.value === 'users' ? userQuery : redemptionQuery; Object.assign(query, value); void loadActiveTab() }

async function openActivity(activity?: CouponActivity) {
  editingActivity.value = activity ?? null
  activityScheduleMode.value = 'ONCE'
  resetRecurrenceForm()
  Object.assign(activityForm, { activityName: activity?.activityName ?? '', subtitle: activity?.subtitle ?? '', bannerUrl: activity?.bannerUrl ?? '', activityType: activity?.activityType ?? 'COUPON_CENTER', startsAt: toInputTime(activity?.startsAt), endsAt: toInputTime(activity?.endsAt) })
  dialogVisible.value = true
  dialogLoading.value = true
  try {
    if (activity?.activityType === 'FLASH_CLAIM') {
      const schedule = await getCouponActivitySchedule(activity.id)
      templateActivityScheduleType.value = schedule.scheduleType
      if (schedule.scheduleType === 'RECURRING' && schedule.recurrence) {
        activityScheduleMode.value = 'RECURRING'
        fillRecurrenceForm(schedule.recurrence)
      }
    }
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '活动编辑信息加载失败')
    dialogVisible.value = false
  } finally {
    dialogLoading.value = false
  }
}
async function saveActivity() {
  if (!activityForm.activityName.trim()) { ElMessage.warning('请填写活动名称'); return }
  if (activityScheduleMode.value === 'ONCE' && (!activityForm.startsAt || !activityForm.endsAt)) { ElMessage.warning('请填写活动起止时间'); return }
  if (activityScheduleMode.value === 'ONCE' && new Date(activityForm.startsAt) >= new Date(activityForm.endsAt)) { ElMessage.warning('活动结束时间必须晚于开始时间'); return }
  if (activityScheduleMode.value === 'RECURRING' && !validateRecurrenceForm()) return
  dialogLoading.value = true
  try {
    if (activityScheduleMode.value === 'RECURRING' && !editingActivity.value) {
      await createRecurringCouponActivity({ activityName: activityForm.activityName.trim(), subtitle: activityForm.subtitle?.trim() || null, bannerUrl: activityForm.bannerUrl?.trim() || null, recurrence: buildRecurrencePayload() })
    } else {
      const payload = { ...activityForm, activityName: activityForm.activityName.trim(), startsAt: toApiTime(activityForm.startsAt), endsAt: toApiTime(activityForm.endsAt) }
      await (editingActivity.value
        ? await updateCouponActivity(editingActivity.value.id, { ...payload, version: editingActivity.value.version })
        : await createCouponActivity(payload))
    }
    ElMessage.success('活动已保存'); dialogVisible.value = false; await loadActivities()
  } catch (error) { ElMessage.error(error instanceof Error ? error.message : '活动保存失败') } finally { dialogLoading.value = false }
}
async function openSchedule(row: CouponActivity) {
  schedulingActivity.value = row
  resetRecurrenceForm()
  scheduleDialogVisible.value = true
  scheduleDialogLoading.value = true
  try {
    const schedule = await getCouponActivitySchedule(row.id)
    if (schedule.scheduleType !== 'RECURRING' || !schedule.recurrence) {
      scheduleDialogVisible.value = false
      ElMessage.warning('该活动不是周期定时抢券活动')
      return
    }
    scheduleVersion.value = schedule.version
    fillRecurrenceForm(schedule.recurrence)
  } catch (error) {
    scheduleDialogVisible.value = false
    ElMessage.error(error instanceof Error ? error.message : '排期加载失败')
  } finally {
    scheduleDialogLoading.value = false
  }
}
async function saveSchedule() {
  if (!schedulingActivity.value || !validateRecurrenceForm()) return
  scheduleDialogLoading.value = true
  try {
    await updateCouponActivitySchedule(schedulingActivity.value.id, { scheduleType: 'RECURRING', recurrence: buildRecurrencePayload(), version: scheduleVersion.value })
    ElMessage.success('排期规则已保存')
    scheduleDialogVisible.value = false
    await loadActivities()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '排期保存失败')
  } finally {
    scheduleDialogLoading.value = false
  }
}
async function runActivityAction(row: CouponActivity, action: 'publish' | 'pause' | 'resume' | 'end' | 'cancel') {
  const reason = ['pause', 'end', 'cancel'].includes(action) ? await askReason(action) : ''
  if (['pause', 'end', 'cancel'].includes(action) && !reason) return
  try {
    // 模板列表接口未返回 activityId/activity 时，前端无法可靠判断模板归属，发布校验交给后端处理。
    await couponActivityAction(row.id, action, ['pause', 'end', 'cancel'].includes(action) ? { reason, version: row.version } : { version: row.version })
    ElMessage.success(action === 'cancel' ? '活动已删除' : '活动状态已更新')
    await loadActivities()
  } catch (error) { ElMessage.error(error instanceof Error ? error.message : '活动操作失败') }
}
async function cancelActivity(row: CouponActivity) {
  try {
    await ElMessageBox.confirm(`确认取消活动「${row.activityName}」？历史数据会保留。`, '取消活动', { type: 'warning', confirmButtonText: '确认取消', cancelButtonText: '返回' })
    await couponActivityAction(row.id, 'cancel', { reason: '平台管理员取消活动', version: row.version })
    ElMessage.success('活动已取消')
    await loadActivities()
  } catch (error) {
    if (error instanceof Error && error.message !== 'cancel') ElMessage.error(error.message)
  }
}
async function activateTemplate(row: CouponTemplateSummary) {
  try {
    const latest = await getCouponTemplate(row.id)
    if (row.status === 'PAUSED') await resumeCouponTemplate(row.id, { version: latest.version })
    else await activateCouponTemplate(row.id, { version: latest.version })
    ElMessage.success(row.status === 'PAUSED' ? '模板已恢复' : '模板已激活')
    await loadTemplates()
  } catch (error) { ElMessage.error(error instanceof Error ? error.message : '模板发布失败') }
}
async function pauseTemplate(row: CouponTemplateSummary) {
  const reason = await askReason('offline')
  if (!reason) return
  try {
    const latest = await getCouponTemplate(row.id)
    await pauseCouponTemplate(row.id, { reason, version: latest.version })
    ElMessage.success('模板已下架')
    await loadTemplates()
  } catch (error) { ElMessage.error(error instanceof Error ? error.message : '模板下架失败') }
}
async function endTemplate(row: CouponTemplateSummary) {
  const reason = await askReason('end')
  if (!reason) return
  try {
    const latest = await getCouponTemplate(row.id)
    await endCouponTemplate(row.id, { reason, version: latest.version })
    ElMessage.success('模板已结束')
    await loadTemplates()
    await loadActivities()
  } catch (error) { ElMessage.error(error instanceof Error ? error.message : '模板结束失败') }
}
async function archiveTemplate(row: CouponTemplateSummary) {
  const reason = await askReason('archive')
  if (!reason) return
  try {
    const latest = await getCouponTemplate(row.id)
    await archiveCouponTemplate(row.id, { reason, version: latest.version })
    ElMessage.success('模板已归档')
    await loadTemplates()
    await loadActivities()
  } catch (error) { ElMessage.error(error instanceof Error ? error.message : '模板归档失败') }
}
async function copyTemplate(row: CouponTemplateSummary) {
  try {
    const { value } = await ElMessageBox.prompt('请输入新模板名称', '复制优惠券模板', {
      inputValue: `${row.couponName}（副本）`,
      confirmButtonText: '复制',
      cancelButtonText: '取消',
      inputValidator: (input) => input.trim().length > 0 || '模板名称不能为空'
    })
    const latest = await getCouponTemplate(row.id)
    await copyCouponTemplate(row.id, { couponName: value.trim(), activityId: latest.activity?.id ?? null, copyScope: true, version: latest.version })
    ElMessage.success('模板已复制为草稿')
    await loadTemplates()
  } catch (error) {
    if (error instanceof Error && error.message !== 'cancel') ElMessage.error(error.message)
  }
}
async function grantTemplate(row: CouponTemplateSummary) {
  try {
    const users = await ElMessageBox.prompt('请输入用户 ID，多个 ID 用逗号或换行分隔', '定向发券', { inputType: 'textarea', confirmButtonText: '发券', cancelButtonText: '取消', inputValidator: (value) => { const count = value.split(/[,\n]/).map((item) => item.trim()).filter(Boolean).length; return count >= 1 && count <= 100 || '请输入 1 到 100 个用户 ID' } })
    const reason = await ElMessageBox.prompt('请输入发券原因', '定向发券', { confirmButtonText: '提交', cancelButtonText: '取消', inputValidator: (value) => Boolean(value.trim()) || '原因不能为空' })
    const userIds = [...new Set(users.value.split(/[,\n]/).map((item) => item.trim()).filter(Boolean))]
    const result = await grantCoupons(row.id, { userIds, reason: reason.value.trim(), externalReference: null })
    ElMessage.success(`已处理 ${result.requested} 个用户，成功 ${result.succeeded} 个`)
  } catch (error) { if (error instanceof Error && error.message !== 'cancel') ElMessage.error(error.message) }
}
async function createTemplateCodes(row: CouponTemplateSummary) {
  try {
    const quantity = await ElMessageBox.prompt('请输入生成数量（1-500）', '生成兑换码', { inputType: 'number', inputValue: '100', confirmButtonText: '下一步', cancelButtonText: '取消', inputValidator: (value) => Number(value) >= 1 && Number(value) <= 500 || '数量必须为 1 到 500' })
    const reason = await ElMessageBox.prompt('请输入生成原因', '生成兑换码', { confirmButtonText: '生成', cancelButtonText: '取消', inputValidator: (value) => Boolean(value.trim()) || '原因不能为空' })
    const result = await createRedeemCodeBatch(row.id, { quantity: Number(quantity.value), reason: reason.value.trim() })
    await ElMessageBox.alert(result.codes.join('\n'), `兑换码批次 ${result.batchNo}`, { confirmButtonText: '关闭' })
  } catch (error) { if (error instanceof Error && error.message !== 'cancel') ElMessage.error(error.message) }
}
async function inviteFunding(row: CouponTemplateSummary) {
  try {
    const detail = await getCouponTemplate(row.id)
    if (detail.fundingType !== 'SHARED') {
      ElMessage.warning('只有联合承担模板可以发送店铺邀请')
      return
    }
    const shops = await ElMessageBox.prompt('请输入承担店铺 ID，多个 ID 用逗号或换行分隔', '发送联合承担邀请', { inputType: 'textarea', confirmButtonText: '发送', cancelButtonText: '取消', inputValidator: (value) => Boolean(value.trim()) || '店铺 ID 不能为空' })
    const shopIds = [...new Set(shops.value.split(/[,\n]/).map((item) => item.trim()).filter(Boolean))]
    await inviteCouponFunding(row.id, { shopIds, version: detail.version })
    ElMessage.success('联合承担邀请已发送')
  } catch (error) { if (error instanceof Error && error.message !== 'cancel') ElMessage.error(error.message) }
}
async function governActivity(row: CouponActivity, action: 'pause' | 'resume') {
  const reason = action === 'pause' ? await askReason('pause') : ''
  if (action === 'pause' && !reason) return
  try { await governCouponActivity(row.id, action, action === 'pause' ? { reason, version: row.version } : { version: row.version }); ElMessage.success('治理操作已完成'); await loadActivities() } catch (error) { ElMessage.error(error instanceof Error ? error.message : '治理操作失败') }
}
function handleActivityCommand(row: CouponActivity, command: string) {
  if (command === 'schedule') return void openSchedule(row)
  if (command === 'cancel') return void cancelActivity(row)
  if (command === 'govern-pause') return void governActivity(row, 'pause')
  if (command === 'govern-resume') return void governActivity(row, 'resume')
  return void runActivityAction(row, command as 'publish' | 'pause' | 'resume' | 'end')
}
function handleTemplateCommand(row: CouponTemplateSummary, command: string) {
  if (command === 'grant') return void grantTemplate(row)
  if (command === 'codes') return void createTemplateCodes(row)
  if (command === 'invite') return void inviteFunding(row)
  if (command === 'activate' || command === 'resume') return void activateTemplate(row)
  if (command === 'pause') return void pauseTemplate(row)
  if (command === 'end') return void endTemplate(row)
  if (command === 'archive') return void archiveTemplate(row)
  if (command === 'copy') return void copyTemplate(row)
}
async function askReason(action: string) { try { const result = await ElMessageBox.prompt(action === 'offline' ? '请输入下架原因' : action === 'archive' ? '请输入归档原因，已暂停模板会先结束再归档，历史数据不会删除' : action === 'pause' ? '请输入暂停原因' : '请输入操作原因', '确认操作', { inputPattern: /\S+/, inputErrorMessage: '原因不能为空', confirmButtonText: '确认', cancelButtonText: '取消' }); return result.value.trim() } catch { return '' } }

onMounted(() => void loadActivities())
</script>

<template>
  <div class="page-view coupon-page">
    <PageHeader title="优惠券管理" description="管理平台优惠券活动、模板，并查看发行、核销和用户券治理情况。">
      <template #actions><el-button v-if="canManage" type="primary" @click="openActivity()">新建活动</el-button></template>
    </PageHeader>
    <el-card class="sg-card" shadow="never">
      <el-form class="filter-form" inline @submit.prevent="search">
        <template v-if="activeTab === 'activities'">
          <el-form-item label="归属"><el-select v-model="activityQuery.ownerType" clearable placeholder="全部"><el-option label="平台" value="PLATFORM" /><el-option label="店铺" value="SHOP" /></el-select></el-form-item><el-form-item label="店铺 ID"><el-input v-model="activityQuery.shopId" clearable /></el-form-item>
          <el-form-item label="活动名称"><el-input v-model="activityQuery.keyword" clearable placeholder="请输入活动名称" /></el-form-item>
          <el-form-item label="状态"><el-select v-model="activityQuery.status" clearable placeholder="全部"><el-option v-for="option in activityStatusOptions" :key="option.value" :label="option.label" :value="option.value" /></el-select></el-form-item>
        </template>
        <template v-else-if="activeTab === 'templates'">
          <el-form-item label="归属"><el-select v-model="templateQuery.ownerType" clearable placeholder="全部"><el-option label="平台" value="PLATFORM" /><el-option label="店铺" value="SHOP" /></el-select></el-form-item><el-form-item label="店铺 ID"><el-input v-model="templateQuery.shopId" clearable /></el-form-item>
          <el-form-item label="模板名称"><el-input v-model="templateQuery.keyword" clearable placeholder="请输入模板名称" /></el-form-item><el-form-item label="券种"><el-select v-model="templateQuery.couponType" clearable placeholder="全部"><el-option v-for="(label, value) in couponTypeLabels" :key="value" :label="label" :value="value" /></el-select></el-form-item><el-form-item label="状态"><el-select v-model="templateQuery.status" clearable placeholder="全部"><el-option v-for="option in templateStatusOptions" :key="option.value" :label="option.label" :value="option.value" /></el-select></el-form-item>
        </template>
        <template v-else-if="activeTab === 'users'"><el-form-item label="券号"><el-input v-model="userQuery.couponNo" clearable placeholder="请输入用户券号" /></el-form-item><el-form-item label="状态"><el-select v-model="userQuery.status" clearable placeholder="全部"><el-option v-for="option in userCouponStatusOptions" :key="option.value" :label="option.label" :value="option.value" /></el-select></el-form-item></template><template v-else><el-form-item label="核销单号"><el-input v-model="redemptionQuery.redemptionNo" clearable placeholder="请输入核销单号" /></el-form-item><el-form-item label="订单号"><el-input v-model="redemptionQuery.orderNo" clearable placeholder="请输入订单号" /></el-form-item><el-form-item label="状态"><el-select v-model="redemptionQuery.status" clearable placeholder="全部"><el-option v-for="option in redemptionStatusOptions" :key="option.value" :label="option.label" :value="option.value" /></el-select></el-form-item></template>
        <el-form-item><el-button type="primary" @click="search">查询</el-button></el-form-item>
      </el-form>
      <el-tabs v-model="activeTab" @tab-change="loadActiveTab">
        <el-tab-pane label="活动管理" name="activities">
          <el-table v-loading="loading" :data="activityRows" empty-text="暂无优惠券活动">
            <el-table-column prop="activityNo" label="活动编号" min-width="150" />
            <el-table-column prop="activityName" label="活动名称" min-width="170" />
            <el-table-column label="归属" width="90"><template #default="{ row }">{{ row.ownerType === 'PLATFORM' ? '平台' : '店铺' }}</template></el-table-column>
            <el-table-column label="活动类型" width="110"><template #default="{ row }">{{ activityTypeLabels[row.activityType] || row.activityType }}</template></el-table-column>
            <el-table-column label="状态" width="100"><template #default="{ row }"><StatusTag :label="activityStatusLabels[row.status]" :type="activityStatusType(row.status)" /></template></el-table-column>
            <el-table-column label="模板数" width="80"><template #default="{ row }">{{ activeTemplateCount(row) }}</template></el-table-column>
            <el-table-column prop="issuedCount" label="已发行" width="90" />
            <el-table-column prop="consumedCount" label="已核销" width="90" />
            <el-table-column label="活动周期" min-width="240"><template #default="{ row }">{{ recurrenceSummary(row) }}</template></el-table-column>
            <el-table-column label="操作" fixed="right" width="180">
              <template #default="{ row }">
                <el-button v-if="canManage && row.ownerType === 'PLATFORM' && row.status === 'DRAFT'" link type="primary" @click="openActivity(row)">编辑</el-button>
                <el-dropdown v-if="(canManage && row.ownerType === 'PLATFORM' && hasActivityMenuActions(row)) || (canGovern && row.ownerType === 'SHOP' && ['RUNNING', 'PAUSED'].includes(row.status))" trigger="click" @command="handleActivityCommand(row, $event)">
                  <el-button link type="primary">更多</el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item v-if="row.ownerType === 'PLATFORM' && row.activityType === 'FLASH_CLAIM' && row.status === 'DRAFT'" command="schedule">排期</el-dropdown-item>
                      <el-dropdown-item v-if="row.ownerType === 'PLATFORM' && row.status === 'DRAFT'" command="publish">发布</el-dropdown-item>
                      <el-dropdown-item v-if="row.ownerType === 'PLATFORM' && row.status === 'RUNNING'" command="pause">暂停</el-dropdown-item>
                      <el-dropdown-item v-if="row.ownerType === 'PLATFORM' && row.status === 'PAUSED'" command="resume">恢复</el-dropdown-item>
                      <el-dropdown-item v-if="row.ownerType === 'PLATFORM' && ['SCHEDULED', 'RUNNING', 'PAUSED'].includes(row.status)" command="end" divided>结束</el-dropdown-item>
                      <el-dropdown-item v-if="row.ownerType === 'PLATFORM' && ['DRAFT', 'SCHEDULED'].includes(row.status)" command="cancel">取消</el-dropdown-item>
                      <el-dropdown-item v-if="row.ownerType === 'SHOP' && row.status === 'RUNNING'" command="govern-pause">治理暂停</el-dropdown-item>
                      <el-dropdown-item v-if="row.ownerType === 'SHOP' && row.status === 'PAUSED'" command="govern-resume">治理恢复</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="模板运营" name="templates">
          <div class="tab-toolbar"><el-button v-if="canManage" type="primary" @click="openTemplate()">新建优惠券模板</el-button></div>
          <el-table v-loading="loading" :data="templateRows" empty-text="暂无优惠券模板">
            <el-table-column prop="templateNo" label="模板编号" min-width="150" />
            <el-table-column prop="couponName" label="优惠券名称" min-width="160" />
            <el-table-column label="归属" width="90"><template #default="{ row }">{{ row.ownerType === 'PLATFORM' ? '平台' : '店铺' }}</template></el-table-column>
            <el-table-column label="券种" width="110"><template #default="{ row }">{{ couponTypeLabels[row.couponType] || row.couponType }}</template></el-table-column>
            <el-table-column label="领取方式" width="110"><template #default="{ row }">{{ distributionTypeLabels[row.distributionType] || row.distributionType }}</template></el-table-column>
            <el-table-column label="状态" width="100"><template #default="{ row }"><StatusTag :label="templateStatusLabels[row.status] || row.status" :type="templateStatusType(row.status)" /></template></el-table-column>
            <el-table-column prop="issuedCount" label="已发行" width="90" />
            <el-table-column prop="totalIssueLimit" label="发行上限" width="110" />
            <el-table-column prop="budgetAmount" label="预算" width="110" />
            <el-table-column label="操作" fixed="right" width="190">
              <template #default="{ row }">
                <el-button v-if="canManage && row.ownerType === 'PLATFORM' && row.status === 'DRAFT'" link type="primary" @click="openTemplate(row)">编辑</el-button>
                <el-dropdown v-if="canManage && row.ownerType === 'PLATFORM'" trigger="click" @command="handleTemplateCommand(row, $event)">
                  <el-button link type="primary">更多</el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item v-if="row.distributionType === 'DIRECT_GRANT' && row.status === 'ACTIVE'" command="grant">定向发券</el-dropdown-item>
                      <el-dropdown-item v-if="row.distributionType === 'REDEEM_CODE' && row.status === 'ACTIVE'" command="codes">生成兑换码</el-dropdown-item>
                      <el-dropdown-item v-if="row.status === 'DRAFT'" command="invite">邀请承担</el-dropdown-item>
                      <el-dropdown-item v-if="row.status === 'DRAFT'" command="activate">激活</el-dropdown-item>
                      <el-dropdown-item v-if="row.status === 'PAUSED'" command="resume">恢复</el-dropdown-item>
                      <el-dropdown-item v-if="row.status === 'ACTIVE'" command="pause">暂停</el-dropdown-item>
                      <el-dropdown-item v-if="['ACTIVE', 'PAUSED'].includes(row.status)" command="end" divided>结束</el-dropdown-item>
                      <el-dropdown-item v-if="['DRAFT', 'ENDED'].includes(row.status)" command="archive">归档</el-dropdown-item>
                      <el-dropdown-item command="copy">复制为草稿</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="用户券治理" name="users">
          <el-table v-loading="loading" :data="userRows" empty-text="暂无用户券">
            <el-table-column prop="couponNo" label="用户券号" min-width="160" />
            <el-table-column prop="templateNo" label="模板编号" min-width="150" />
            <el-table-column prop="userId" label="用户 ID" width="120" />
            <el-table-column label="状态" width="110"><template #default="{ row }"><StatusTag :label="userCouponStatusLabels[row.status] || row.status" type="info" /></template></el-table-column>
            <el-table-column label="有效期至" min-width="180"><template #default="{ row }">{{ formatDate(row.validTo) }}</template></el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="核销记录" name="redemptions">
          <el-table v-loading="loading" :data="redemptionRows" empty-text="暂无核销记录">
            <el-table-column prop="redemptionNo" label="核销单号" min-width="160" />
            <el-table-column prop="tradeId" label="交易 ID" min-width="130" />
            <el-table-column prop="orderId" label="订单 ID" min-width="130" />
            <el-table-column prop="shopId" label="店铺 ID" width="110" />
            <el-table-column prop="discountAmount" label="优惠金额" width="110" />
            <el-table-column prop="platformFundedAmount" label="平台承担" width="110" />
            <el-table-column prop="shopFundedAmount" label="店铺承担" width="110" />
            <el-table-column label="核销状态" width="110"><template #default="{ row }"><StatusTag :label="redemptionStatusLabels[row.status] || row.status" type="info" /></template></el-table-column>
            <el-table-column label="时间" min-width="180"><template #default="{ row }">{{ formatDate(row.createdAt) }}</template></el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
      <AppPagination v-if="activeTab === 'activities'" :page="activityQuery.page || 1" :page-size="activityQuery.pageSize || 20" :total="activityTotal" @change="changePage" /><AppPagination v-else-if="activeTab === 'templates'" :page="templateQuery.page || 1" :page-size="templateQuery.pageSize || 20" :total="templateTotal" @change="changePage" /><AppPagination v-else-if="activeTab === 'users'" :page="userQuery.page || 1" :page-size="userQuery.pageSize || 20" :total="userTotal" @change="changePage" /><AppPagination v-else :page="redemptionQuery.page || 1" :page-size="redemptionQuery.pageSize || 20" :total="redemptionTotal" @change="changePage" />
    </el-card>
    <el-dialog v-model="dialogVisible" :title="editingActivity ? '编辑活动' : '新建活动'" width="680px"><el-form label-width="120px"><el-form-item label="活动名称" required><el-input v-model="activityForm.activityName" maxlength="128" /></el-form-item><el-form-item label="副标题"><el-input v-model="activityForm.subtitle" maxlength="255" /></el-form-item><el-form-item label="时间模式" required><el-radio-group v-model="activityScheduleMode" :disabled="!!editingActivity"><el-radio value="ONCE">一次性活动</el-radio><el-radio value="RECURRING">周期定时抢券</el-radio></el-radio-group></el-form-item><template v-if="activityScheduleMode === 'ONCE'"><el-form-item label="活动类型" required><el-select v-model="activityForm.activityType"><el-option v-for="(label, value) in activityTypeLabels" :key="value" :label="label" :value="value" /></el-select></el-form-item><el-form-item label="开始时间" required><el-date-picker v-model="activityForm.startsAt" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss.SSSZ" /></el-form-item><el-form-item label="结束时间" required><el-date-picker v-model="activityForm.endsAt" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss.SSSZ" /></el-form-item></template><template v-else><el-alert class="recurrence-tip" title="周期活动固定为限时抢券，服务端会根据规则计算第一个和最后一个有效窗口。" type="info" :closable="false" /><el-form-item label="重复类型" required><el-select v-model="recurrenceForm.recurrenceType"><el-option v-for="(label, value) in recurrenceTypeLabels" :key="value" :label="label" :value="value" /></el-select></el-form-item><el-form-item v-if="recurrenceForm.recurrenceType === 'WEEKLY'" label="每周日期" required><el-checkbox-group v-model="recurrenceForm.weekdays"><el-checkbox v-for="option in weekdayOptions" :key="option.value" :value="option.value">{{ option.label }}</el-checkbox></el-checkbox-group></el-form-item><el-form-item v-if="recurrenceForm.recurrenceType === 'MONTHLY'" label="每月日期" required><el-select v-model="recurrenceForm.monthDays" multiple collapse-tags collapse-tags-tooltip><el-option v-for="option in monthDayOptions" :key="option.value" :label="option.label" :value="option.value" /></el-select></el-form-item><el-form-item label="开抢时刻" required><el-time-picker v-model="recurrenceForm.dailyStartsAt" format="HH:mm" value-format="HH:mm" placeholder="选择时间" /></el-form-item><el-form-item label="单次时长" required><el-input-number v-model="recurrenceForm.windowDurationMinutes" :min="1" :max="1440" /><span class="form-unit">分钟</span></el-form-item><el-form-item label="周期开始" required><el-date-picker v-model="recurrenceForm.recurrenceStartsAt" type="datetime" value-format="YYYY-MM-DDTHH:mm" /></el-form-item><el-form-item label="周期结束" required><el-date-picker v-model="recurrenceForm.recurrenceEndsAt" type="datetime" value-format="YYYY-MM-DDTHH:mm" /></el-form-item><el-form-item label="时区"><el-input model-value="北京时间 Asia/Shanghai" disabled /></el-form-item></template><el-form-item label="横幅地址"><el-input v-model="activityForm.bannerUrl" placeholder="可选图片 URL" /></el-form-item></el-form><template #footer><el-button @click="dialogVisible = false">取消</el-button><el-button type="primary" :loading="dialogLoading" @click="saveActivity">保存</el-button></template></el-dialog>
    <el-dialog v-model="scheduleDialogVisible" title="排期 / 周期规则编辑" width="680px"><el-skeleton v-if="scheduleDialogLoading && !scheduleVersion" :rows="6" animated /><el-form v-else label-width="120px"><el-alert class="recurrence-tip" title="仅草稿周期活动允许修改排期规则，保存后服务端会重新计算活动生命周期。" type="info" :closable="false" /><el-form-item label="活动名称"><el-input :model-value="schedulingActivity?.activityName" disabled /></el-form-item><el-form-item label="重复类型" required><el-select v-model="recurrenceForm.recurrenceType"><el-option v-for="(label, value) in recurrenceTypeLabels" :key="value" :label="label" :value="value" /></el-select></el-form-item><el-form-item v-if="recurrenceForm.recurrenceType === 'WEEKLY'" label="每周日期" required><el-checkbox-group v-model="recurrenceForm.weekdays"><el-checkbox v-for="option in weekdayOptions" :key="option.value" :value="option.value">{{ option.label }}</el-checkbox></el-checkbox-group></el-form-item><el-form-item v-if="recurrenceForm.recurrenceType === 'MONTHLY'" label="每月日期" required><el-select v-model="recurrenceForm.monthDays" multiple collapse-tags collapse-tags-tooltip><el-option v-for="option in monthDayOptions" :key="option.value" :label="option.label" :value="option.value" /></el-select></el-form-item><el-form-item label="开抢时刻" required><el-time-picker v-model="recurrenceForm.dailyStartsAt" format="HH:mm" value-format="HH:mm" placeholder="选择时间" /></el-form-item><el-form-item label="单次时长" required><el-input-number v-model="recurrenceForm.windowDurationMinutes" :min="1" :max="1440" /><span class="form-unit">分钟</span></el-form-item><el-form-item label="周期开始" required><el-date-picker v-model="recurrenceForm.recurrenceStartsAt" type="datetime" value-format="YYYY-MM-DDTHH:mm" /></el-form-item><el-form-item label="周期结束" required><el-date-picker v-model="recurrenceForm.recurrenceEndsAt" type="datetime" value-format="YYYY-MM-DDTHH:mm" /></el-form-item><el-form-item label="时区"><el-input model-value="北京时间 Asia/Shanghai" disabled /></el-form-item></el-form><template #footer><el-button @click="scheduleDialogVisible = false">取消</el-button><el-button type="primary" :loading="scheduleDialogLoading" @click="saveSchedule">保存排期</el-button></template></el-dialog>
    <el-dialog v-model="templateDialogVisible" :title="editingTemplate ? '编辑优惠券模板' : '新建优惠券模板'" width="760px">
      <el-form ref="templateFormRef" class="template-form" :model="templateForm" :rules="templateFormRules" label-width="130px">
        <el-form-item label="优惠券名称" prop="couponName" required><el-input v-model="templateForm.couponName" maxlength="128" /></el-form-item>
        <el-form-item label="描述"><el-input v-model="templateForm.description" type="textarea" maxlength="500" /></el-form-item>
        <el-form-item label="券种" required><el-select v-model="templateForm.couponType"><el-option v-for="(label, value) in couponTypeLabels" :key="value" :label="label" :value="value" /></el-select></el-form-item>
        <el-form-item v-if="['THRESHOLD_REDUCTION', 'CASH_RED_PACKET'].includes(templateForm.couponType)" label="门槛金额" prop="thresholdAmount" required><el-input v-model="templateForm.thresholdAmount" /></el-form-item>
        <el-form-item v-if="['THRESHOLD_REDUCTION', 'CASH_RED_PACKET'].includes(templateForm.couponType)" label="优惠金额" prop="discountAmount" required><el-input v-model="templateForm.discountAmount" /></el-form-item>
        <el-form-item v-if="templateForm.couponType === 'PERCENTAGE'" label="折扣比例" prop="percentageOff" required><el-input v-model="templateForm.percentageOff"><template #append>%</template></el-input></el-form-item>
        <el-form-item v-if="templateForm.couponType === 'PERCENTAGE'" label="最高优惠金额" prop="maximumDiscountAmount" required><el-input v-model="templateForm.maximumDiscountAmount" /></el-form-item>
        <el-form-item label="资金承担" required><el-select v-model="templateForm.fundingType"><el-option label="平台承担" value="PLATFORM" /><el-option label="店铺承担" value="SHOP" /><el-option label="联合承担" value="SHARED" /></el-select></el-form-item>
        <el-form-item v-if="templateForm.fundingType === 'SHARED'" label="平台承担比例" required><el-input v-model="templateForm.platformShareRate"><template #append>%</template></el-input></el-form-item>
        <el-form-item label="适用范围" required><el-select v-model="templateForm.scope.scopeType" @change="handleTemplateScopeTypeChange"><el-option label="全平台" value="ALL" /><el-option label="指定店铺" value="SHOP" /><el-option label="指定分类" value="CATEGORY" /><el-option label="指定 SPU" value="SPU" /><el-option label="指定 SKU" value="SKU" /></el-select></el-form-item>
        <el-form-item v-if="templateForm.scope.scopeType === 'CATEGORY'" label="指定分类" required><el-tree-select v-model="templateForm.scope.categoryIds" :data="categoryTree" :loading="categoriesLoading" :props="{ value: 'id', label: 'categoryName', children: 'children' }" clearable filterable multiple show-checkbox check-strictly default-expand-all placeholder="选择适用分类" style="width: 100%"><template #default="{ data }">{{ data.categoryName }}（{{ data.categoryCode }}）</template></el-tree-select></el-form-item>
        <el-form-item v-else-if="templateForm.scope.scopeType === 'SPU'" label="指定商品" required><el-select v-model="templateForm.scope.spuIds" :loading="productsLoading" clearable filterable multiple remote reserve-keyword placeholder="输入商品名称或 SPU 编号搜索" style="width: 100%" :remote-method="searchProducts" @visible-change="handleProductOptionsVisible"><el-option v-for="product in productOptions" :key="product.id" :label="`${product.productName}（${product.productNo}）`" :value="product.id" /></el-select></el-form-item>
        <el-form-item v-else-if="templateForm.scope.scopeType === 'SKU'" label="指定 SKU" required><el-select v-model="templateForm.scope.skuIds" :loading="skusLoading" clearable filterable multiple remote reserve-keyword placeholder="输入商品名称或 SPU 编号筛选 SKU" style="width: 100%" :remote-method="searchSkus" @visible-change="handleSkuOptionsVisible"><el-option v-for="sku in skuOptions" :key="sku.id" :label="`${sku.productName ? `${sku.productName} - ` : ''}${sku.skuName}（${sku.skuNo}）`" :value="sku.id" /></el-select></el-form-item>
        <el-form-item v-else-if="templateForm.scope.scopeType !== 'ALL'" label="范围 ID" required><el-input :model-value="scopeInputValue()" placeholder="多个 ID 用英文逗号分隔" @update:model-value="updateScopeInput" /></el-form-item>
        <el-form-item label="领取方式" prop="distributionType" required><el-select v-model="templateForm.distributionType"><el-option label="公开领取" value="PUBLIC_CLAIM" /><el-option label="限时抢券" value="FLASH_CLAIM" /><el-option label="兑换码" value="REDEEM_CODE" /><el-option label="定向发券" value="DIRECT_GRANT" /><el-option label="系统发放" value="SYSTEM_GRANT" /></el-select></el-form-item>
        <el-form-item label="领取人群" required><el-select v-model="templateForm.audienceType"><el-option label="全部用户" value="ALL_USERS" /><el-option label="新用户" value="NEW_USERS" /><el-option label="首单用户" value="FIRST_ORDER_USERS" /><el-option label="指定用户" value="SPECIFIED_USERS" /></el-select></el-form-item>
        <el-form-item v-if="templateForm.audienceType === 'NEW_USERS'" label="注册后天数" required><el-input-number v-model="templateForm.newUserWithinDays" :min="1" :max="365" /></el-form-item>
        <el-form-item label="活动" prop="activityId" :required="requiresClaimWindow"><el-select v-model="templateForm.activityId" clearable placeholder="公开领取和限时抢券必须选择" @change="handleTemplateActivityChange"><el-option v-for="activity in templateActivityOptions" :key="activity.id" :label="activity.activityName" :value="activity.id" /></el-select></el-form-item>
        <template v-if="requiresClaimWindow">
          <el-form-item label="领取开始" prop="claimStartsAt" required><el-date-picker v-model="templateForm.claimStartsAt" type="datetime" value-format="YYYY-MM-DDTHH:mm" /></el-form-item>
          <el-form-item label="领取结束" prop="claimEndsAt" required><el-date-picker v-model="templateForm.claimEndsAt" type="datetime" value-format="YYYY-MM-DDTHH:mm" /></el-form-item>
        </template>
        <el-form-item label="有效期类型" required><el-radio-group v-model="templateForm.validity.validityType"><el-radio value="RELATIVE_AFTER_CLAIM">领取后生效</el-radio><el-radio value="FIXED_RANGE">固定时间</el-radio></el-radio-group></el-form-item>
        <template v-if="templateForm.validity.validityType === 'RELATIVE_AFTER_CLAIM'"><el-form-item label="生效延迟分钟"><el-input-number v-model="templateForm.validity.effectiveDelayMinutes" :min="0" :max="10080" /></el-form-item><el-form-item label="领取后有效小时"><el-input-number v-model="templateForm.validity.validForHours" :min="1" :max="8760" /></el-form-item></template>
        <template v-else><el-form-item label="固定开始时间" required><el-date-picker v-model="templateForm.validity.validFrom" type="datetime" value-format="YYYY-MM-DDTHH:mm" /></el-form-item><el-form-item label="固定结束时间" required><el-date-picker v-model="templateForm.validity.validTo" type="datetime" value-format="YYYY-MM-DDTHH:mm" /></el-form-item></template>
        <el-form-item label="发行上限" prop="totalIssueLimit" required><el-input-number v-model="templateForm.totalIssueLimit" :min="1" /></el-form-item>
        <el-form-item label="单用户限领" prop="perUserLimit" required><el-input-number v-model="templateForm.perUserLimit" :min="1" :max="99" /></el-form-item>
        <el-form-item label="预算金额" prop="budgetAmount" required><el-input v-model="templateForm.budgetAmount" placeholder="不低于最大单券责任 × 发行上限" /></el-form-item>
        <el-form-item label="叠加模式"><el-select v-model="templateForm.stackMode"><el-option label="独占" value="EXCLUSIVE" /><el-option label="跨归属方叠加" value="CROSS_OWNER" /></el-select></el-form-item>
        <el-form-item label="退券策略"><el-select v-model="templateForm.refundRestorePolicy"><el-option label="不恢复" value="NEVER" /><el-option label="整单退款恢复" value="FULL_TRADE_ONLY" /></el-select></el-form-item>
      </el-form>
      <template #footer><el-button @click="templateDialogVisible = false">取消</el-button><el-button type="primary" :loading="templateDialogLoading" @click="saveTemplate">保存模板</el-button></template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.coupon-page { display: flex; flex-direction: column; gap: 16px; }
.filter-form { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; }
.filter-form :deep(.el-form-item) { margin: 0; }
.filter-form :deep(.el-select) { width: 150px; }
.filter-form :deep(.el-input) { width: 220px; }
.recurrence-tip { margin-bottom: 16px; }
.form-unit { margin-left: 8px; color: #6b7280; }
</style>
