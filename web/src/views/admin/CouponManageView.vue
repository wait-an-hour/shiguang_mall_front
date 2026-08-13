<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAdminAuthStore } from '@/stores/adminAuth'
import PageHeader from '@/components/common/PageHeader.vue'
import AppPagination from '@/components/common/AppPagination.vue'
import StatusTag from '@/components/common/StatusTag.vue'
import {
  couponActivityAction,
  createCouponActivity,
  createRecurringCouponActivity,
  activateCouponTemplate,
  copyCouponTemplate,
  pauseCouponTemplate,
  createCouponTemplate,
  getCouponTemplate,
  governCouponActivity,
  getCouponActivitySchedule,
  listCouponActivities,
  listCouponRedemptions,
  listCouponTemplates,
  listCouponUsers,
  revokeUserCoupon,
  updateCouponActivity,
  updateCouponActivitySchedule,
  updateCouponTemplate,
  type CouponActivity,
  type CouponActivityQuery,
  type CouponActivityStatus,
  type CouponRecurrenceType,
  type CouponRedemptionRecord,
  type CouponTemplate,
  type CouponTemplateQuery,
  type CouponUserRecord,
  type CouponUserQuery,
  type CouponRedemptionQuery,
  type CreateActivityRequest,
  type CreateCouponTemplateRequest,
  type CouponTemplateScopeRequest
} from '@/api/admin/coupons'

const auth = useAdminAuthStore()
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
const availableActivityRows = computed(() => activityRows.value.filter((activity) => !['CANCELLED', 'PAUSED'].includes(activity.status)))
const templateRows = ref<CouponTemplate[]>([])
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

const activityStatusLabels: Record<string, string> = { DRAFT: '草稿', SCHEDULED: '已排期', RUNNING: '进行中', PAUSED: '已下架', ENDED: '已结束', CANCELLED: '已取消' }
const templateStatusLabels: Record<string, string> = { DRAFT: '草稿', ACTIVE: '生效中', PAUSED: '已下架', ENDED: '已结束' }
const userCouponStatusLabels: Record<string, string> = { AVAILABLE: '可使用', LOCKED: '已锁定', USED: '已使用', EXPIRED: '已过期', REVOKED: '已撤销' }
const redemptionStatusLabels: Record<string, string> = { RESERVED: '已预占', CONSUMED: '已核销', RELEASED: '已释放', RESTORED: '已恢复' }
const activityStatusOptions = Object.entries(activityStatusLabels).map(([value, label]) => ({ value, label }))
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
  return row.templateCount ?? 0
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
function resetTemplateForm() {
  Object.assign(templateForm, {
    ownerType: 'PLATFORM', activityId: null, couponName: '', description: null, couponType: 'THRESHOLD_REDUCTION',
    thresholdAmount: '200.00', discountAmount: '30.00', percentageOff: null, maximumDiscountAmount: null, fundingType: 'PLATFORM', platformShareRate: '100.0000',
    scope: { version: 0, scopeType: 'ALL', shopIds: null, categoryIds: null, spuIds: null, skuIds: null }, distributionType: 'PUBLIC_CLAIM', audienceType: 'ALL_USERS', newUserWithinDays: null,
    claimStartsAt: '', claimEndsAt: '', validity: { validityType: 'RELATIVE_AFTER_CLAIM', validFrom: null, validTo: null, effectiveDelayMinutes: 0, validForHours: 168 },
    totalIssueLimit: 1000, perUserLimit: 1, stackMode: 'CROSS_OWNER', refundRestorePolicy: 'FULL_TRADE_ONLY', budgetAmount: '30000.00', sortOrder: 10
  })
}
async function openTemplate(template?: CouponTemplate) {
  editingTemplate.value = template ?? null
  resetTemplateForm()
  templateDialogVisible.value = true
  if (!template) return
  templateDialogLoading.value = true
  try {
    const detail = await getCouponTemplate(template.id)
    const scope = detail.scope ?? templateForm.scope
    const validity = detail.validity ?? templateForm.validity
    Object.assign(templateForm, {
      ownerType: 'PLATFORM',
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
        version: scope.version ?? detail.version,
        scopeType: scope.scopeType,
        shopIds: scope.shopIds ?? null,
        categoryIds: scope.categoryIds ?? null,
        spuIds: scope.spuIds ?? null,
        skuIds: scope.skuIds ?? null
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
    editingTemplate.value = detail
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
async function saveTemplate() {
  if (!templateForm.couponName.trim() || !templateForm.budgetAmount || templateForm.totalIssueLimit < 1 || templateForm.perUserLimit < 1) { ElMessage.warning('请填写优惠券名称、预算、发行上限和单用户限领数量'); return }
  if (templateForm.scope.scopeType !== 'ALL' && !(selectedScopeIds(templateForm.scope)?.length)) { ElMessage.warning('请填写适用范围 ID'); return }
  if (templateForm.distributionType === 'FLASH_CLAIM' && (!templateForm.claimStartsAt || !templateForm.claimEndsAt)) { ElMessage.warning('限时抢券必须填写领取开始和结束时间'); return }
  if (templateForm.claimStartsAt && templateForm.claimEndsAt && new Date(templateForm.claimStartsAt) >= new Date(templateForm.claimEndsAt)) { ElMessage.warning('领取结束时间必须晚于开始时间'); return }
  if (templateForm.validity.validityType === 'FIXED_RANGE' && (!templateForm.validity.validFrom || !templateForm.validity.validTo)) { ElMessage.warning('请填写固定有效期'); return }
  if (templateForm.validity.validityType === 'RELATIVE_AFTER_CLAIM' && (!templateForm.validity.validForHours || templateForm.validity.validForHours < 1)) { ElMessage.warning('请填写领取后的有效小时数'); return }
  templateDialogLoading.value = true
  try {
    const scope = { ...templateForm.scope, shopIds: templateForm.scope.scopeType === 'SHOP' ? templateForm.scope.shopIds : null, categoryIds: templateForm.scope.scopeType === 'CATEGORY' ? templateForm.scope.categoryIds : null, spuIds: templateForm.scope.scopeType === 'SPU' ? templateForm.scope.spuIds : null, skuIds: templateForm.scope.scopeType === 'SKU' ? templateForm.scope.skuIds : null }
    const payload = {
      ...templateForm,
      couponName: templateForm.couponName.trim(), description: templateForm.description?.trim() || null, scope,
      thresholdAmount: templateForm.thresholdAmount?.trim() || '0.00',
      discountAmount: templateForm.couponType === 'THRESHOLD_REDUCTION' || templateForm.couponType === 'CASH_RED_PACKET' ? templateForm.discountAmount : null,
      percentageOff: templateForm.couponType === 'PERCENTAGE' ? templateForm.percentageOff : null,
      maximumDiscountAmount: templateForm.couponType === 'PERCENTAGE' ? templateForm.maximumDiscountAmount : null,
      claimStartsAt: templateForm.claimStartsAt ? toApiTime(templateForm.claimStartsAt) : null, claimEndsAt: templateForm.claimEndsAt ? toApiTime(templateForm.claimEndsAt) : null,
      validity: { ...templateForm.validity, validFrom: templateForm.validity.validFrom ? toApiTime(templateForm.validity.validFrom) : null, validTo: templateForm.validity.validTo ? toApiTime(templateForm.validity.validTo) : null }
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
    const templates = await listCouponTemplates({ ownerType: 'PLATFORM', page: 1, pageSize: 100 })
    const counts = activities.items.map((activity) => {
      const count = templates.items.filter((template) => {
        const sameActivity = String(template.activityId) === String(activity.id) || String(template.activity?.id) === String(activity.id) || template.activity?.activityName === activity.activityName
        return sameActivity && !['PAUSED', 'ENDED'].includes(template.status)
      }).length
      return [String(activity.id), count] as const
    })
    activityTemplateCounts.value = Object.fromEntries(counts)
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
  if (!activity || activity.activityType !== 'FLASH_CLAIM') return
  dialogLoading.value = true
  try {
    const schedule = await getCouponActivitySchedule(activity.id)
    if (schedule.scheduleType === 'RECURRING' && schedule.recurrence) {
      activityScheduleMode.value = 'RECURRING'
      fillRecurrenceForm(schedule.recurrence)
    }
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '活动排期加载失败')
    dialogVisible.value = false
  } finally {
    dialogLoading.value = false
  }
}
async function saveActivity() {
  if (!activityForm.activityName.trim()) { ElMessage.warning('请填写活动名称'); return }
  if (activityScheduleMode.value === 'ONCE' && (!activityForm.startsAt || !activityForm.endsAt)) { ElMessage.warning('请填写活动起止时间'); return }
  if (activityScheduleMode.value === 'RECURRING' && !validateRecurrenceForm()) return
  dialogLoading.value = true
  try {
    if (activityScheduleMode.value === 'RECURRING' && !editingActivity.value) {
      await createRecurringCouponActivity({ activityName: activityForm.activityName.trim(), subtitle: activityForm.subtitle?.trim() || null, bannerUrl: activityForm.bannerUrl?.trim() || null, recurrence: buildRecurrencePayload() })
    } else {
      const payload = { ...activityForm, activityName: activityForm.activityName.trim(), startsAt: toApiTime(activityForm.startsAt), endsAt: toApiTime(activityForm.endsAt) }
      if (editingActivity.value) await updateCouponActivity(editingActivity.value.id, { ...payload, version: editingActivity.value.version })
      else await createCouponActivity(payload)
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
  try { await couponActivityAction(row.id, action, ['pause', 'end', 'cancel'].includes(action) ? { reason, version: row.version } : { version: row.version }); ElMessage.success(action === 'cancel' ? '活动已删除' : '活动状态已更新'); await loadActivities() } catch (error) { ElMessage.error(error instanceof Error ? error.message : '活动操作失败') }
}
async function deleteActivity(row: CouponActivity) {
  try {
    await ElMessageBox.confirm(`确认删除活动「${row.activityName}」？删除后活动会进入已取消状态。`, '删除活动', { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' })
    await couponActivityAction(row.id, 'cancel', { reason: '平台管理员删除活动', version: row.version })
    ElMessage.success('活动已删除')
    await loadActivities()
  } catch (error) {
    if (error instanceof Error && error.message !== 'cancel') ElMessage.error(error.message)
  }
}
async function activateTemplate(row: CouponTemplate) {
  try {
    const latest = await getCouponTemplate(row.id)
    await activateCouponTemplate(row.id, { version: latest.version })
    ElMessage.success('模板已重新发布')
    await loadTemplates()
  } catch (error) { ElMessage.error(error instanceof Error ? error.message : '模板发布失败') }
}
async function pauseTemplate(row: CouponTemplate) {
  const reason = await askReason('offline')
  if (!reason) return
  try {
    const latest = await getCouponTemplate(row.id)
    await pauseCouponTemplate(row.id, { reason, version: latest.version })
    ElMessage.success('模板已下架')
    await loadTemplates()
  } catch (error) { ElMessage.error(error instanceof Error ? error.message : '模板下架失败') }
}
async function copyTemplate(row: CouponTemplate) {
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
async function governActivity(row: CouponActivity, action: 'pause' | 'resume') {
  const reason = action === 'pause' ? await askReason('pause') : ''
  if (action === 'pause' && !reason) return
  try { await governCouponActivity(row.id, action, action === 'pause' ? { reason, version: row.version } : { version: row.version }); ElMessage.success('治理操作已完成'); await loadActivities() } catch (error) { ElMessage.error(error instanceof Error ? error.message : '治理操作失败') }
}
async function askReason(action: string) { try { const result = await ElMessageBox.prompt(action === 'offline' ? '请输入下架原因' : action === 'pause' ? '请输入暂停原因' : '请输入操作原因', '确认操作', { inputPattern: /\S+/, inputErrorMessage: '原因不能为空', confirmButtonText: '确认', cancelButtonText: '取消' }); return result.value.trim() } catch { return '' } }
async function revoke(row: CouponUserRecord) {
  try {
    const result = await ElMessageBox.prompt('请输入撤销原因', '撤销用户券', {
      inputPattern: /\S+/,
      inputErrorMessage: '原因不能为空',
      confirmButtonText: '撤销',
      cancelButtonText: '取消'
    })
    // 治理动作必须使用列表返回的版本号，避免用旧数据覆盖用户券最新状态。
    await revokeUserCoupon(row.id, { reason: result.value.trim(), version: row.version })
    ElMessage.success('用户券已撤销')
    await loadUsers()
  } catch (error) {
    if (error instanceof Error && error.message !== 'cancel') ElMessage.error(error.message)
  }
}

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
          <el-form-item label="活动名称"><el-input v-model="activityQuery.keyword" clearable placeholder="请输入活动名称" /></el-form-item>
          <el-form-item label="状态"><el-select v-model="activityQuery.status" clearable placeholder="全部"><el-option v-for="option in activityStatusOptions" :key="option.value" :label="option.label" :value="option.value" /></el-select></el-form-item>
        </template>
        <template v-else-if="activeTab === 'templates'">
          <el-form-item label="模板名称"><el-input v-model="templateQuery.keyword" clearable placeholder="请输入模板名称" /></el-form-item><el-form-item label="券种"><el-select v-model="templateQuery.couponType" clearable placeholder="全部"><el-option v-for="(label, value) in couponTypeLabels" :key="value" :label="label" :value="value" /></el-select></el-form-item><el-form-item label="状态"><el-select v-model="templateQuery.status" clearable placeholder="全部"><el-option v-for="option in templateStatusOptions" :key="option.value" :label="option.label" :value="option.value" /></el-select></el-form-item>
        </template>
        <template v-else-if="activeTab === 'users'"><el-form-item label="券号"><el-input v-model="userQuery.couponNo" clearable placeholder="请输入用户券号" /></el-form-item><el-form-item label="状态"><el-select v-model="userQuery.status" clearable placeholder="全部"><el-option v-for="option in userCouponStatusOptions" :key="option.value" :label="option.label" :value="option.value" /></el-select></el-form-item></template><template v-else><el-form-item label="核销单号"><el-input v-model="redemptionQuery.redemptionNo" clearable placeholder="请输入核销单号" /></el-form-item><el-form-item label="订单号"><el-input v-model="redemptionQuery.orderNo" clearable placeholder="请输入订单号" /></el-form-item><el-form-item label="状态"><el-select v-model="redemptionQuery.status" clearable placeholder="全部"><el-option v-for="option in redemptionStatusOptions" :key="option.value" :label="option.label" :value="option.value" /></el-select></el-form-item></template>
        <el-form-item><el-button type="primary" @click="search">查询</el-button></el-form-item>
      </el-form>
      <el-tabs v-model="activeTab" @tab-change="loadActiveTab">
        <el-tab-pane label="活动管理" name="activities"><el-table v-loading="loading" :data="activityRows" empty-text="暂无优惠券活动"><el-table-column prop="activityNo" label="活动编号" min-width="150" /><el-table-column prop="activityName" label="活动名称" min-width="170" /><el-table-column label="活动类型" width="110"><template #default="{ row }">{{ activityTypeLabels[row.activityType] || row.activityType }}</template></el-table-column><el-table-column label="状态" width="100"><template #default="{ row }"><StatusTag :label="activityStatusLabels[row.status]" :type="activityStatusType(row.status)" /></template></el-table-column><el-table-column label="模板数" width="80"><template #default="{ row }">{{ activeTemplateCount(row) }}</template></el-table-column><el-table-column prop="issuedCount" label="已发行" width="90" /><el-table-column prop="consumedCount" label="已核销" width="90" /><el-table-column label="活动周期" min-width="260"><template #default="{ row }">{{ recurrenceSummary(row) }}</template></el-table-column><el-table-column label="操作" fixed="right" width="260"><template #default="{ row }"><el-button v-if="canManage && ['DRAFT', 'RUNNING', 'PAUSED'].includes(row.status)" link type="primary" @click="openActivity(row)">编辑</el-button><el-button v-if="canManage && row.activityType === 'FLASH_CLAIM' && row.status === 'DRAFT'" link type="primary" @click="openSchedule(row)">排期</el-button><el-button v-if="canManage && row.status === 'DRAFT'" link type="primary" @click="runActivityAction(row, 'publish')">发布</el-button><el-button v-if="canManage && row.status === 'RUNNING'" link type="warning" @click="runActivityAction(row, 'pause')">暂停</el-button><el-button v-if="canManage && row.status === 'PAUSED'" link type="success" @click="runActivityAction(row, 'resume')">恢复</el-button><el-button v-if="canManage && ['RUNNING', 'PAUSED'].includes(row.status)" link type="danger" @click="runActivityAction(row, 'end')">结束</el-button><el-button v-if="canManage && ['DRAFT', 'SCHEDULED'].includes(row.status)" link type="danger" @click="deleteActivity(row)">删除</el-button><el-button v-if="canGovern && row.status === 'RUNNING'" link type="danger" @click="governActivity(row, 'pause')">治理暂停</el-button></template></el-table-column></el-table></el-tab-pane>
        <el-tab-pane label="模板运营" name="templates"><div class="tab-toolbar"><el-button v-if="canManage" type="primary" @click="openTemplate()">新建优惠券模板</el-button></div><el-table v-loading="loading" :data="templateRows" empty-text="暂无优惠券模板"><el-table-column prop="templateNo" label="模板编号" min-width="150" /><el-table-column prop="couponName" label="优惠券名称" min-width="160" /><el-table-column label="券种" width="110"><template #default="{ row }">{{ couponTypeLabels[row.couponType] || row.couponType }}</template></el-table-column><el-table-column label="领取方式" width="110"><template #default="{ row }">{{ distributionTypeLabels[row.distributionType] || row.distributionType }}</template></el-table-column><el-table-column label="抢券时间" min-width="220"><template #default="{ row }"><span v-if="row.distributionType === 'FLASH_CLAIM'">{{ formatDate(row.claimStartsAt) }}<br>{{ formatDate(row.claimEndsAt) }}</span><span v-else>-</span></template></el-table-column><el-table-column prop="benefit.displayText" label="优惠内容" min-width="150" /><el-table-column label="状态" width="100"><template #default="{ row }"><StatusTag :label="templateStatusLabels[row.status] || row.status" :type="templateStatusType(row.status)" /></template></el-table-column><el-table-column prop="issuedCount" label="已发行" width="90" /><el-table-column prop="remainingIssueQuantity" label="剩余发行量" width="110" /><el-table-column prop="budgetAmount" label="预算" width="110" /><el-table-column label="操作" fixed="right" width="160"><template #default="{ row }"><el-button v-if="canManage && row.status === 'DRAFT'" link type="primary" @click="activateTemplate(row)">激活</el-button><el-button v-if="canManage && row.status === 'PAUSED'" link type="success" @click="activateTemplate(row)">重新发布</el-button><el-button v-if="canManage && row.status === 'ACTIVE'" link type="warning" @click="pauseTemplate(row)">下架</el-button><el-button v-if="canManage && ['ACTIVE', 'PAUSED', 'ENDED'].includes(row.status)" link type="primary" @click="copyTemplate(row)">复制</el-button></template></el-table-column></el-table></el-tab-pane>
        <el-tab-pane label="用户券治理" name="users"><el-table v-loading="loading" :data="userRows" empty-text="暂无用户券"><el-table-column prop="couponNo" label="用户券号" min-width="160" /><el-table-column prop="templateNo" label="模板编号" min-width="150" /><el-table-column prop="couponName" label="优惠券名称" min-width="160" /><el-table-column prop="userId" label="用户 ID" width="110" /><el-table-column prop="username" label="用户" min-width="130" /><el-table-column label="状态" width="100"><template #default="{ row }"><StatusTag :label="userCouponStatusLabels[row.status] || row.status" type="info" /></template></el-table-column><el-table-column label="有效期" min-width="250"><template #default="{ row }">{{ formatDate(row.validFrom) }} 至 {{ formatDate(row.validTo) }}</template></el-table-column><el-table-column label="操作" fixed="right" width="100"><template #default="{ row }"><el-button v-if="canGovern" link type="danger" :disabled="row.status !== 'AVAILABLE'" @click="revoke(row)">撤销</el-button></template></el-table-column></el-table></el-tab-pane>
        <el-tab-pane label="核销记录" name="redemptions"><el-table v-loading="loading" :data="redemptionRows" empty-text="暂无核销记录"><el-table-column prop="redemptionNo" label="核销单号" min-width="160" /><el-table-column prop="tradeNo" label="交易号" min-width="160" /><el-table-column prop="orderNo" label="订单号" min-width="160" /><el-table-column prop="couponNo" label="用户券号" min-width="160" /><el-table-column prop="couponName" label="优惠券" min-width="150" /><el-table-column prop="discountAmount" label="优惠金额" width="110" /><el-table-column label="核销状态" width="110"><template #default="{ row }"><StatusTag :label="redemptionStatusLabels[row.redemptionStatus] || row.redemptionStatus" type="info" /></template></el-table-column><el-table-column label="时间" min-width="180"><template #default="{ row }">{{ formatDate(row.createdAt) }}</template></el-table-column></el-table></el-tab-pane>
      </el-tabs>
      <AppPagination v-if="activeTab === 'activities'" :page="activityQuery.page || 1" :page-size="activityQuery.pageSize || 20" :total="activityTotal" @change="changePage" /><AppPagination v-else-if="activeTab === 'templates'" :page="templateQuery.page || 1" :page-size="templateQuery.pageSize || 20" :total="templateTotal" @change="changePage" /><AppPagination v-else-if="activeTab === 'users'" :page="userQuery.page || 1" :page-size="userQuery.pageSize || 20" :total="userTotal" @change="changePage" /><AppPagination v-else :page="redemptionQuery.page || 1" :page-size="redemptionQuery.pageSize || 20" :total="redemptionTotal" @change="changePage" />
    </el-card>
    <el-dialog v-model="dialogVisible" :title="editingActivity ? '编辑活动' : '新建活动'" width="680px"><el-form label-width="120px"><el-form-item label="活动名称" required><el-input v-model="activityForm.activityName" maxlength="128" /></el-form-item><el-form-item label="副标题"><el-input v-model="activityForm.subtitle" maxlength="255" /></el-form-item><el-form-item label="时间模式" required><el-radio-group v-model="activityScheduleMode" :disabled="!!editingActivity"><el-radio value="ONCE">一次性活动</el-radio><el-radio value="RECURRING">周期定时抢券</el-radio></el-radio-group></el-form-item><template v-if="activityScheduleMode === 'ONCE'"><el-form-item label="活动类型" required><el-select v-model="activityForm.activityType"><el-option v-for="(label, value) in activityTypeLabels" :key="value" :label="label" :value="value" /></el-select></el-form-item><el-form-item label="开始时间" required><el-date-picker v-model="activityForm.startsAt" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss.SSSZ" /></el-form-item><el-form-item label="结束时间" required><el-date-picker v-model="activityForm.endsAt" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss.SSSZ" /></el-form-item></template><template v-else><el-alert class="recurrence-tip" title="周期活动固定为限时抢券，服务端会根据规则计算第一个和最后一个有效窗口。" type="info" :closable="false" /><el-form-item label="重复类型" required><el-select v-model="recurrenceForm.recurrenceType"><el-option v-for="(label, value) in recurrenceTypeLabels" :key="value" :label="label" :value="value" /></el-select></el-form-item><el-form-item v-if="recurrenceForm.recurrenceType === 'WEEKLY'" label="每周日期" required><el-checkbox-group v-model="recurrenceForm.weekdays"><el-checkbox v-for="option in weekdayOptions" :key="option.value" :value="option.value">{{ option.label }}</el-checkbox></el-checkbox-group></el-form-item><el-form-item v-if="recurrenceForm.recurrenceType === 'MONTHLY'" label="每月日期" required><el-select v-model="recurrenceForm.monthDays" multiple collapse-tags collapse-tags-tooltip><el-option v-for="option in monthDayOptions" :key="option.value" :label="option.label" :value="option.value" /></el-select></el-form-item><el-form-item label="开抢时刻" required><el-time-picker v-model="recurrenceForm.dailyStartsAt" format="HH:mm" value-format="HH:mm" placeholder="选择时间" /></el-form-item><el-form-item label="单次时长" required><el-input-number v-model="recurrenceForm.windowDurationMinutes" :min="1" :max="1440" /><span class="form-unit">分钟</span></el-form-item><el-form-item label="周期开始" required><el-date-picker v-model="recurrenceForm.recurrenceStartsAt" type="datetime" value-format="YYYY-MM-DDTHH:mm" /></el-form-item><el-form-item label="周期结束" required><el-date-picker v-model="recurrenceForm.recurrenceEndsAt" type="datetime" value-format="YYYY-MM-DDTHH:mm" /></el-form-item><el-form-item label="时区"><el-input model-value="北京时间 Asia/Shanghai" disabled /></el-form-item></template><el-form-item label="横幅地址"><el-input v-model="activityForm.bannerUrl" placeholder="可选图片 URL" /></el-form-item></el-form><template #footer><el-button @click="dialogVisible = false">取消</el-button><el-button type="primary" :loading="dialogLoading" @click="saveActivity">保存</el-button></template></el-dialog>
    <el-dialog v-model="scheduleDialogVisible" title="排期 / 周期规则编辑" width="680px"><el-skeleton v-if="scheduleDialogLoading && !scheduleVersion" :rows="6" animated /><el-form v-else label-width="120px"><el-alert class="recurrence-tip" title="仅草稿周期活动允许修改排期规则，保存后服务端会重新计算活动生命周期。" type="info" :closable="false" /><el-form-item label="活动名称"><el-input :model-value="schedulingActivity?.activityName" disabled /></el-form-item><el-form-item label="重复类型" required><el-select v-model="recurrenceForm.recurrenceType"><el-option v-for="(label, value) in recurrenceTypeLabels" :key="value" :label="label" :value="value" /></el-select></el-form-item><el-form-item v-if="recurrenceForm.recurrenceType === 'WEEKLY'" label="每周日期" required><el-checkbox-group v-model="recurrenceForm.weekdays"><el-checkbox v-for="option in weekdayOptions" :key="option.value" :value="option.value">{{ option.label }}</el-checkbox></el-checkbox-group></el-form-item><el-form-item v-if="recurrenceForm.recurrenceType === 'MONTHLY'" label="每月日期" required><el-select v-model="recurrenceForm.monthDays" multiple collapse-tags collapse-tags-tooltip><el-option v-for="option in monthDayOptions" :key="option.value" :label="option.label" :value="option.value" /></el-select></el-form-item><el-form-item label="开抢时刻" required><el-time-picker v-model="recurrenceForm.dailyStartsAt" format="HH:mm" value-format="HH:mm" placeholder="选择时间" /></el-form-item><el-form-item label="单次时长" required><el-input-number v-model="recurrenceForm.windowDurationMinutes" :min="1" :max="1440" /><span class="form-unit">分钟</span></el-form-item><el-form-item label="周期开始" required><el-date-picker v-model="recurrenceForm.recurrenceStartsAt" type="datetime" value-format="YYYY-MM-DDTHH:mm" /></el-form-item><el-form-item label="周期结束" required><el-date-picker v-model="recurrenceForm.recurrenceEndsAt" type="datetime" value-format="YYYY-MM-DDTHH:mm" /></el-form-item><el-form-item label="时区"><el-input model-value="北京时间 Asia/Shanghai" disabled /></el-form-item></el-form><template #footer><el-button @click="scheduleDialogVisible = false">取消</el-button><el-button type="primary" :loading="scheduleDialogLoading" @click="saveSchedule">保存排期</el-button></template></el-dialog>
    <el-dialog v-model="templateDialogVisible" :title="editingTemplate ? '编辑优惠券模板' : '新建优惠券模板'" width="760px"><el-form class="template-form" label-width="130px"><el-form-item label="优惠券名称" required><el-input v-model="templateForm.couponName" maxlength="128" /></el-form-item><el-form-item label="描述"><el-input v-model="templateForm.description" type="textarea" maxlength="500" /></el-form-item><el-form-item label="券种" required><el-select v-model="templateForm.couponType"><el-option v-for="(label, value) in couponTypeLabels" :key="value" :label="label" :value="value" /></el-select></el-form-item><el-form-item v-if="templateForm.couponType === 'THRESHOLD_REDUCTION' || templateForm.couponType === 'CASH_RED_PACKET'" label="门槛金额" required><el-input v-model="templateForm.thresholdAmount" /></el-form-item><el-form-item v-if="templateForm.couponType === 'THRESHOLD_REDUCTION' || templateForm.couponType === 'CASH_RED_PACKET'" label="优惠金额" required><el-input v-model="templateForm.discountAmount" /></el-form-item><el-form-item v-if="templateForm.couponType === 'PERCENTAGE'" label="折扣比例" required><el-input v-model="templateForm.percentageOff"><template #append>%</template></el-input></el-form-item><el-form-item v-if="templateForm.couponType === 'PERCENTAGE'" label="最高优惠金额"><el-input v-model="templateForm.maximumDiscountAmount" /></el-form-item><el-form-item label="活动" required><el-select v-model="templateForm.activityId" clearable placeholder="选择平台活动"><el-option v-for="activity in availableActivityRows" :key="activity.id" :label="activity.activityName" :value="activity.id" /></el-select></el-form-item><el-form-item label="适用范围" required><el-select v-model="templateForm.scope.scopeType"><el-option label="全平台" value="ALL" /><el-option label="指定店铺" value="SHOP" /><el-option label="指定分类" value="CATEGORY" /><el-option label="指定 SPU" value="SPU" /><el-option label="指定 SKU" value="SKU" /></el-select></el-form-item><el-form-item v-if="templateForm.scope.scopeType !== 'ALL'" label="范围 ID" required><el-input :model-value="scopeInputValue()" placeholder="多个 ID 用英文逗号分隔" @update:model-value="updateScopeInput" /></el-form-item><el-form-item label="领取方式"><el-select v-model="templateForm.distributionType"><el-option label="公开领取" value="PUBLIC_CLAIM" /><el-option label="限时抢券" value="FLASH_CLAIM" /><el-option label="兑换码" value="REDEEM_CODE" /><el-option label="定向发券" value="DIRECT_GRANT" /></el-select></el-form-item><el-form-item label="领取人群"><el-select v-model="templateForm.audienceType"><el-option label="全部用户" value="ALL_USERS" /><el-option label="新用户" value="NEW_USERS" /><el-option label="首单用户" value="FIRST_ORDER_USERS" /><el-option label="指定用户" value="SPECIFIED_USERS" /></el-select></el-form-item><el-form-item v-if="templateForm.audienceType === 'NEW_USERS'" label="注册后天数"><el-input-number v-model="templateForm.newUserWithinDays" :min="1" /></el-form-item><el-form-item label="领取开始" :required="templateForm.distributionType === 'FLASH_CLAIM'"><el-date-picker v-model="templateForm.claimStartsAt" type="datetime" value-format="YYYY-MM-DDTHH:mm" /></el-form-item><el-form-item label="领取结束" :required="templateForm.distributionType === 'FLASH_CLAIM'"><el-date-picker v-model="templateForm.claimEndsAt" type="datetime" value-format="YYYY-MM-DDTHH:mm" /></el-form-item><el-form-item label="有效期类型" required><el-radio-group v-model="templateForm.validity.validityType"><el-radio value="RELATIVE_AFTER_CLAIM">领取后生效</el-radio><el-radio value="FIXED_RANGE">固定时间</el-radio></el-radio-group></el-form-item><template v-if="templateForm.validity.validityType === 'RELATIVE_AFTER_CLAIM'"><el-form-item label="生效延迟分钟"><el-input-number v-model="templateForm.validity.effectiveDelayMinutes" :min="0" /></el-form-item><el-form-item label="领取后有效小时"><el-input-number v-model="templateForm.validity.validForHours" :min="1" /></el-form-item></template><template v-else><el-form-item label="固定开始时间" required><el-date-picker v-model="templateForm.validity.validFrom" type="datetime" value-format="YYYY-MM-DDTHH:mm" /></el-form-item><el-form-item label="固定结束时间" required><el-date-picker v-model="templateForm.validity.validTo" type="datetime" value-format="YYYY-MM-DDTHH:mm" /></el-form-item></template><el-form-item label="发行上限" required><el-input-number v-model="templateForm.totalIssueLimit" :min="1" /></el-form-item><el-form-item label="单用户限领" required><el-input-number v-model="templateForm.perUserLimit" :min="1" /></el-form-item><el-form-item label="预算金额" required><el-input v-model="templateForm.budgetAmount" placeholder="例如 30000.00" /></el-form-item><el-form-item label="叠加模式"><el-select v-model="templateForm.stackMode"><el-option label="独占" value="EXCLUSIVE" /><el-option label="跨归属方叠加" value="CROSS_OWNER" /></el-select></el-form-item><el-form-item label="退券策略"><el-select v-model="templateForm.refundRestorePolicy"><el-option label="不恢复" value="NEVER" /><el-option label="整单退款恢复" value="FULL_TRADE_ONLY" /></el-select></el-form-item></el-form><template #footer><el-button @click="templateDialogVisible = false">取消</el-button><el-button type="primary" :loading="templateDialogLoading" @click="saveTemplate">保存模板</el-button></template></el-dialog>
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
