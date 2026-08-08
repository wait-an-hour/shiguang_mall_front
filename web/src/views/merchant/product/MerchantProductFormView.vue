<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { getCategoryAttributes, getCategoryTree, type CategoryAttributeView, type CategoryNode } from '../../../api/product'
import { createMerchantProduct, createMerchantSku, getMerchantProductDetail, updateMerchantProductContent, updateMerchantSku } from '../../../api/merchant/products'
import { ApiRequestError } from '../../../utils/request'
import { ROUTE_NAME } from '../../../constants/routes'
import { SKU_STATUS_LABELS } from '../../../constants/merchant'
import type { CreateProductRequest, EnabledStatus, ShopProductDetailView } from '../../../types/merchant'

const route = useRoute()
const router = useRouter()
const formRef = ref<FormInstance>()
const loading = ref(false)
const saving = ref(false)
const product = ref<ShopProductDetailView | null>(null)
const categoryTree = ref<CategoryNode[]>([])
const isEdit = computed(() => route.name === ROUTE_NAME.MerchantProductEdit)
const categoryOptions = computed(() => {
  const options: CategoryNode[] = []
  function collect(nodes: CategoryNode[]) {
    for (const node of nodes) {
      if (!node.children?.length) options.push(node)
      else collect(node.children)
    }
  }
  collect(categoryTree.value)
  return options
})
const categoryAttributes = ref<CategoryAttributeView[]>([])
const attributesLoading = ref(false)
const attributeValues = reactive<Record<string, string>>({})

function getSkuStatusLabel(status: EnabledStatus) {
  return SKU_STATUS_LABELS[status]
}
const shopId = computed(() => String(route.params.shopId))
const spuId = computed(() => String(route.params.spuId || ''))

const form = reactive<CreateProductRequest>({
  productName: '',
  categoryId: '',
  brandId: '',
  subtitle: '',
  coverImageUrl: null,
  galleryImageUrls: [],
  detailHtml: '',
  packageList: '',
  serviceNotes: '',
  attributes: [],
  skus: []
})
const galleryText = ref('')

const idRule = { pattern: /^[1-9]\d*$/, message: '请输入正整数 ID，例如 401', trigger: 'blur' as const }

const rules: FormRules<CreateProductRequest> = {
  productName: [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
  categoryId: [
    { required: true, message: '请输入类目 ID', trigger: 'blur' },
    idRule
  ],
  brandId: [idRule],
  detailHtml: [{ required: true, message: '请输入详情说明', trigger: 'blur' }]
}

function fillForm(detail: ShopProductDetailView) {
  product.value = detail
  form.productName = detail.productName
  form.categoryId = detail.category.id
  form.brandId = detail.brand?.id ?? ''
  form.subtitle = detail.subtitle ?? ''
  form.coverImageUrl = detail.coverImageUrl ?? ''
  form.galleryImageUrls = [...detail.galleryImageUrls]
  form.detailHtml = detail.detailHtml
  form.packageList = detail.packageList ?? ''
  form.serviceNotes = detail.serviceNotes ?? ''
  form.attributes = [...detail.attributes]
  form.skus = []
  galleryText.value = detail.galleryImageUrls.join('\n')
}

async function loadCategories() {
  categoryTree.value = await getCategoryTree()
}

async function loadCategoryAttributes(categoryId: string) {
  attributesLoading.value = true
  try {
    categoryAttributes.value = await getCategoryAttributes(categoryId)
    for (const attribute of categoryAttributes.value) {
      if (!(attribute.id in attributeValues)) attributeValues[attribute.id] = ''
    }
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '类目属性加载失败')
  } finally {
    attributesLoading.value = false
  }
}

watch(() => form.categoryId, (categoryId) => {
  categoryAttributes.value = []
  form.attributes = []
  if (categoryId) void loadCategoryAttributes(categoryId)
})

async function loadDetail() {
  if (!isEdit.value) return
  loading.value = true
  try {
    fillForm(await getMerchantProductDetail(shopId.value, spuId.value))
  } finally {
    loading.value = false
  }
}

function addSku() {
  form.skus.push({ skuName: '', imageUrl: '', salePrice: '', marketPrice: '', barcode: '', stock: 0 })
}

function removeSku(index: number) {
  form.skus.splice(index, 1)
}

function normalizeRequest() {
  form.galleryImageUrls = galleryText.value.split('\n').map((item) => item.trim()).filter(Boolean)
  form.attributes = categoryAttributes.value
    .map((attribute) => ({ name: attribute.id, value: attributeValues[attribute.id]?.trim() || '' }))
    .filter((item) => item.value)
  return {
    ...form,
    coverImageUrl: form.coverImageUrl?.trim() || undefined,
    brandId: form.brandId || undefined,
    subtitle: form.subtitle || undefined
  }
}

async function save() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  const existingSkuCount = isEdit.value ? (product.value?.skus.length ?? 0) : 0
  if (existingSkuCount + form.skus.length === 0) {
    ElMessage.warning('请至少新增一个 SKU')
    return
  }
  const missingAttribute = categoryAttributes.value.find((attribute) => attribute.required && !attributeValues[attribute.id]?.trim())
  if (missingAttribute) {
    ElMessage.warning(`请填写必填属性：${missingAttribute.attributeName}`)
    return
  }
  const invalidSkuIndex = form.skus.findIndex((sku) => !sku.skuName.trim() || !/^\d+\.\d{2}$/.test(sku.salePrice) || Number(sku.salePrice) <= 0)
  if (invalidSkuIndex >= 0) {
    ElMessage.warning(`请完善 SKU ${invalidSkuIndex + 1}：名称不能为空，售价必须是大于 0 的两位小数`)
    return
  }

  saving.value = true
  try {
    const request = normalizeRequest()
    if (isEdit.value && product.value) {
      const detail = await updateMerchantProductContent(shopId.value, spuId.value, { ...request, version: product.value.contentVersion })
      for (const sku of product.value.skus) {
        await updateMerchantSku(shopId.value, spuId.value, sku.id, {
          skuName: sku.skuName,
          imageUrl: sku.imageUrl,
          version: sku.version
        })
      }
      for (const sku of form.skus) {
        await createMerchantSku(shopId.value, spuId.value, sku)
      }
      ElMessage.success('商品已保存')
      router.push({ name: ROUTE_NAME.MerchantProductDetail, params: { shopId: shopId.value, spuId: detail.id } })
    } else {
      const detail = await createMerchantProduct(shopId.value, request)
      ElMessage.success('商品已创建')
      router.push({ name: ROUTE_NAME.MerchantProductDetail, params: { shopId: shopId.value, spuId: detail.id } })
    }
  } catch (error) {
    if (error instanceof ApiRequestError && error.details?.length) {
      ElMessage.error(`${error.message}：${error.details.map((detail) => `${detail.field ? `${detail.field} ` : ''}${detail.reason}`).join('；')}`)
    } else {
      ElMessage.error(error instanceof Error ? error.message : '保存失败')
    }
  } finally {
    saving.value = false
  }
}

function back() {
  router.push({ name: ROUTE_NAME.MerchantProductList, params: { shopId: shopId.value } })
}

onMounted(() => {
  void loadCategories()
  void loadDetail()
})
</script>

<template>
  <div class="form-page">
    <section class="page-header">
      <div>
        <h1 class="page-title">{{ isEdit ? '编辑商品' : '新建商品' }}</h1>
        <p class="page-description">填写商品基础资料、图文说明与 SKU 信息。</p>
      </div>
      <div class="page-actions">
        <el-button @click="back">返回列表</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
      </div>
    </section>

    <el-card class="page-card" shadow="never" v-loading="loading">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
        <h2 class="section-title">基础信息</h2>
        <el-form-item label="商品名称" prop="productName"><el-input v-model="form.productName" /></el-form-item>
        <el-form-item label="叶子类目" prop="categoryId">
          <el-select v-model="form.categoryId" filterable placeholder="请选择叶子类目" style="width: 100%">
            <el-option v-for="category in categoryOptions" :key="category.id" :label="`${category.categoryName}（${category.categoryCode}）`" :value="category.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="品牌 ID" prop="brandId"><el-input v-model="form.brandId" placeholder="可选，请输入正整数 ID" /></el-form-item>
        <el-form-item label="副标题"><el-input v-model="form.subtitle" /></el-form-item>
        <el-form-item label="封面 URL" prop="coverImageUrl"><el-input v-model="form.coverImageUrl" /></el-form-item>
        <el-form-item label="图集 URL"><el-input v-model="galleryText" type="textarea" :rows="3" placeholder="每行一个图片 URL" /></el-form-item>
        <el-form-item label="详情说明" prop="detailHtml"><el-input v-model="form.detailHtml" type="textarea" :rows="4" /></el-form-item>
        <el-form-item label="包装清单"><el-input v-model="form.packageList" /></el-form-item>
        <el-form-item label="服务说明"><el-input v-model="form.serviceNotes" /></el-form-item>

        <div v-if="attributesLoading" class="hint">正在加载类目属性...</div>
        <div v-else-if="form.categoryId && !categoryAttributes.length" class="hint">当前叶子类目暂无属性模板</div>
        <template v-else-if="form.categoryId && categoryAttributes.length">
          <h2 class="section-title">类目属性</h2>
          <el-form-item v-for="attribute in categoryAttributes" :key="attribute.id" :label="attribute.attributeName" :required="attribute.required">
            <el-select v-if="attribute.options?.length" v-model="attributeValues[attribute.id]" filterable allow-create default-first-option style="width: 100%">
              <el-option v-for="option in attribute.options ?? []" :key="option" :label="option" :value="option" />
            </el-select>
            <el-input v-else v-model="attributeValues[attribute.id]" :placeholder="attribute.required ? '必填' : '可选'" />
          </el-form-item>
        </template>

        <h2 class="section-title">SKU 信息</h2>
        <template v-if="isEdit && product">
          <el-table :data="product.skus" row-key="id" class="sku-table">
            <el-table-column label="SKU 名称" min-width="180"><template #default="{ row }"><el-input v-model="row.skuName" /></template></el-table-column>
            <el-table-column label="图片 URL" min-width="220"><template #default="{ row }"><el-input v-model="row.imageUrl" /></template></el-table-column>
            <el-table-column label="售价" prop="salePrice" width="100" />
            <el-table-column label="状态" width="90"><template #default="{ row }">{{ getSkuStatusLabel(row.status) }}</template></el-table-column>
          </el-table>
          <div class="hint">编辑页仅支持快速修改已有 SKU 名称和图片，价格与状态可在详情页弹窗维护。</div>
        </template>

        <div v-for="(sku, index) in form.skus" :key="index" class="sku-card">
          <div class="sku-card-title">{{ isEdit ? '新增 SKU' : `SKU ${index + 1}` }}</div>
          <el-row :gutter="12">
            <el-col :span="8"><el-input v-model="sku.skuName" placeholder="SKU 名称" /></el-col>
            <el-col :span="8"><el-input v-model="sku.imageUrl" placeholder="图片 URL" /></el-col>
            <el-col :span="4"><el-input v-model="sku.salePrice" placeholder="售价" /></el-col>
            <el-col :span="4"><el-input v-model="sku.marketPrice" placeholder="划线价" /></el-col>
          </el-row>
          <el-row :gutter="12" class="sku-row">
            <el-col :span="8"><el-input v-model="sku.barcode" placeholder="条码" /></el-col>
            <el-col :span="4"><el-input-number v-model="sku.stock" :min="0" controls-position="right" /></el-col>
            <el-col :span="4"><el-button v-if="form.skus.length > 1 || isEdit" @click="removeSku(index)">移除</el-button></el-col>
          </el-row>
        </div>
        <el-button plain @click="addSku">新增 SKU</el-button>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.form-page { display: flex; flex-direction: column; gap: 16px; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.page-title { margin: 0; color: #111827; font-size: 20px; font-weight: 600; }
.page-description, .hint { margin: 8px 0 0; color: #6b7280; font-size: 13px; }
.page-actions { display: flex; gap: 8px; }
.page-card { border: 1px solid #e5e7eb; border-radius: 10px; }
.section-title { margin: 8px 0 18px; color: #111827; font-size: 16px; font-weight: 600; }
.sku-table { margin-bottom: 10px; }
.sku-card { margin: 12px 0; border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px; background: #f8fafc; }
.sku-card-title { margin-bottom: 10px; color: #374151; font-weight: 600; }
.sku-row { margin-top: 10px; }
</style>
