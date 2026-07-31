import type { Id, PageView } from '../../types/common'
import type {
  CreateProductRequest,
  CreateSkuRequest,
  ProductStatus,
  ShopProductDetailView,
  ShopProductSummaryView,
  ShopSkuView,
  UpdateProductContentRequest,
  UpdateSkuRequest
} from '../../types/merchant'

export interface MerchantProductQuery {
  page?: number
  pageSize?: number
  keyword?: string
  status?: ProductStatus | ''
  categoryId?: Id | ''
  sort?: 'created_desc' | 'updated_desc' | 'stock_asc'
}

const now = () => new Date().toISOString()

const products: ShopProductDetailView[] = [
  {
    id: 'SPU202607260001',
    spuNo: 'SPU-IP16-001',
    productName: 'iPhone 16 黑色 256GB',
    category: { id: 'CAT1001', name: '手机数码', level: 2 },
    brand: { id: 'BRAND1001', name: 'Apple' },
    subtitle: '官方正品，支持校园分期',
    coverImageUrl: 'https://dummyimage.com/160x160/e5e7eb/64748b&text=iPhone',
    galleryImageUrls: ['https://dummyimage.com/640x360/e5e7eb/64748b&text=iPhone+16'],
    detailHtml: 'A18 芯片，全天候续航，适合学习与创作。',
    packageList: '手机、USB-C 充电线、资料',
    serviceNotes: '7 天无理由退货，官方保修',
    attributes: [{ name: '颜色', value: '黑色' }],
    status: 'ON_SHELF',
    minSalePrice: '5999.00',
    skuCount: 2,
    totalAvailableStock: 23,
    contentVersion: 1,
    createdAt: '2026-07-26T10:00:00.000+08:00',
    updatedAt: '2026-07-31T09:00:00.000+08:00',
    skus: [
      {
        id: 'SKU202607260001',
        skuNo: 'IP16-BLK-256',
        skuName: '黑色 256GB',
        imageUrl: 'https://dummyimage.com/120x120/e5e7eb/64748b&text=256G',
        salePrice: '5999.00',
        marketPrice: '6299.00',
        barcode: '690000000001',
        status: 'ENABLED',
        stock: { skuId: 'SKU202607260001', availableStock: 15, lockedStock: 2, safetyStock: 10, version: 1 },
        version: 1,
        createdAt: '2026-07-26T10:00:00.000+08:00',
        updatedAt: '2026-07-31T09:00:00.000+08:00'
      },
      {
        id: 'SKU202607260004',
        skuNo: 'IP16-BLK-512',
        skuName: '黑色 512GB',
        imageUrl: 'https://dummyimage.com/120x120/e5e7eb/64748b&text=512G',
        salePrice: '6999.00',
        marketPrice: '7299.00',
        barcode: '690000000004',
        status: 'ENABLED',
        stock: { skuId: 'SKU202607260004', availableStock: 8, lockedStock: 1, safetyStock: 6, version: 1 },
        version: 1,
        createdAt: '2026-07-26T10:10:00.000+08:00',
        updatedAt: '2026-07-31T09:00:00.000+08:00'
      }
    ],
    statusHistories: [
      { id: 'HIS1001', status: 'DRAFT', operatorName: '商家运营', remark: '创建商品草稿', createdAt: '2026-07-26T10:00:00.000+08:00' },
      { id: 'HIS1002', status: 'ON_SHELF', operatorName: '平台审核', remark: '审核通过并上架', createdAt: '2026-07-27T10:00:00.000+08:00' }
    ]
  },
  {
    id: 'SPU202607260002',
    spuNo: 'SPU-CASE-001',
    productName: '磁吸保护壳 雾蓝色',
    category: { id: 'CAT1002', name: '数码配件', level: 2 },
    brand: { id: 'BRAND1002', name: '时光优选' },
    subtitle: '轻薄防摔，兼容磁吸充电',
    coverImageUrl: 'https://dummyimage.com/160x160/dbeafe/64748b&text=Case',
    galleryImageUrls: ['https://dummyimage.com/640x360/dbeafe/64748b&text=Case'],
    detailHtml: '亲肤材质，边角加强保护。',
    packageList: '保护壳 1 个',
    serviceNotes: '拆封后非质量问题不退换',
    attributes: [{ name: '材质', value: 'TPU' }],
    status: 'DRAFT',
    minSalePrice: '99.00',
    skuCount: 1,
    totalAvailableStock: 7,
    contentVersion: 1,
    createdAt: '2026-07-28T11:00:00.000+08:00',
    updatedAt: '2026-07-30T11:00:00.000+08:00',
    skus: [
      {
        id: 'SKU202607260002',
        skuNo: 'CASE-MAG-BLUE',
        skuName: '雾蓝色',
        imageUrl: 'https://dummyimage.com/120x120/dbeafe/64748b&text=Blue',
        salePrice: '99.00',
        marketPrice: '129.00',
        barcode: '690000000002',
        status: 'ENABLED',
        stock: { skuId: 'SKU202607260002', availableStock: 7, lockedStock: 1, safetyStock: 10, version: 1 },
        version: 1,
        createdAt: '2026-07-28T11:00:00.000+08:00',
        updatedAt: '2026-07-30T11:00:00.000+08:00'
      }
    ],
    statusHistories: [
      { id: 'HIS2001', status: 'DRAFT', operatorName: '商家运营', remark: '创建商品草稿', createdAt: '2026-07-28T11:00:00.000+08:00' }
    ]
  },
  {
    id: 'SPU202607260003',
    spuNo: 'SPU-CABLE-001',
    productName: 'Type-C 编织数据线 1m',
    category: { id: 'CAT1002', name: '数码配件', level: 2 },
    brand: { id: 'BRAND1002', name: '时光优选' },
    subtitle: '耐弯折，支持快充',
    coverImageUrl: 'https://dummyimage.com/160x160/f1f5f9/64748b&text=Cable',
    galleryImageUrls: ['https://dummyimage.com/640x360/f1f5f9/64748b&text=Cable'],
    detailHtml: '尼龙编织外被，日常学习通勤备用。',
    packageList: '数据线 1 根',
    serviceNotes: '一年质保',
    attributes: [{ name: '长度', value: '1m' }],
    status: 'OFF_SHELF',
    minSalePrice: '39.00',
    skuCount: 1,
    totalAvailableStock: 0,
    contentVersion: 2,
    createdAt: '2026-07-29T12:00:00.000+08:00',
    updatedAt: '2026-07-31T08:00:00.000+08:00',
    skus: [
      {
        id: 'SKU202607260003',
        skuNo: 'CABLE-C-1M',
        skuName: '白色 1m',
        imageUrl: 'https://dummyimage.com/120x120/f1f5f9/64748b&text=1m',
        salePrice: '39.00',
        marketPrice: '49.00',
        barcode: '690000000003',
        status: 'DISABLED',
        stock: { skuId: 'SKU202607260003', availableStock: 0, lockedStock: 0, safetyStock: 20, version: 2 },
        version: 1,
        createdAt: '2026-07-29T12:00:00.000+08:00',
        updatedAt: '2026-07-31T08:00:00.000+08:00'
      }
    ],
    statusHistories: [
      { id: 'HIS3001', status: 'DRAFT', operatorName: '商家运营', remark: '创建商品草稿', createdAt: '2026-07-29T12:00:00.000+08:00' },
      { id: 'HIS3002', status: 'OFF_SHELF', operatorName: '商家运营', remark: '库存不足主动下架', createdAt: '2026-07-31T08:00:00.000+08:00' }
    ]
  }
]

function clone<T>(value: T): T {
  return structuredClone(value)
}

function paginate<T>(items: T[], page = 1, pageSize = 10): PageView<T> {
  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const start = (page - 1) * pageSize

  return { items: clone(items.slice(start, start + pageSize)), page, pageSize, total, totalPages }
}

function toSummary(product: ShopProductDetailView): ShopProductSummaryView {
  const { galleryImageUrls, detailHtml, packageList, serviceNotes, attributes, skus, statusHistories, ...summary } = product
  void galleryImageUrls
  void detailHtml
  void packageList
  void serviceNotes
  void attributes
  void skus
  void statusHistories
  return clone(summary)
}

function findProduct(spuId: Id) {
  const product = products.find((item) => item.id === spuId)
  if (!product) {
    throw new Error('商品不存在')
  }
  return product
}

function syncProductSummary(product: ShopProductDetailView) {
  product.skuCount = product.skus.length
  product.totalAvailableStock = product.skus.reduce((total, sku) => total + sku.stock.availableStock, 0)
  product.minSalePrice = product.skus.reduce((min, sku) => (Number(sku.salePrice) < Number(min) ? sku.salePrice : min), product.skus[0]?.salePrice ?? '0.00')
  product.updatedAt = now()
}

function addStatusHistory(product: ShopProductDetailView, status: ProductStatus, remark: string) {
  product.status = status
  product.statusHistories.unshift({
    id: `HIS${Date.now()}`,
    status,
    operatorName: '商家运营',
    remark,
    createdAt: now()
  })
  syncProductSummary(product)
}

export async function getMerchantProducts(_shopId: Id, query: MerchantProductQuery = {}) {
  const keyword = query.keyword?.trim().toLowerCase()
  let filtered = [...products]

  if (keyword) {
    filtered = filtered.filter((product) => product.productName.toLowerCase().includes(keyword) || product.spuNo.toLowerCase().includes(keyword))
  }
  if (query.status) {
    filtered = filtered.filter((product) => product.status === query.status)
  }
  if (query.categoryId) {
    filtered = filtered.filter((product) => product.category.id === query.categoryId)
  }

  if (query.sort === 'stock_asc') {
    filtered.sort((a, b) => a.totalAvailableStock - b.totalAvailableStock)
  } else if (query.sort === 'updated_desc') {
    filtered.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  } else {
    filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  return paginate(filtered.map(toSummary), query.page, query.pageSize)
}

export async function createMerchantProduct(_shopId: Id, request: CreateProductRequest) {
  const id = `SPU${Date.now()}`
  const createdAt = now()
  const skus: ShopSkuView[] = request.skus.map((sku, index) => ({
    id: `SKU${Date.now()}${index}`,
    skuNo: `SKU-${Date.now()}-${index + 1}`,
    skuName: sku.skuName,
    imageUrl: sku.imageUrl,
    salePrice: sku.salePrice,
    marketPrice: sku.marketPrice,
    barcode: sku.barcode,
    status: 'ENABLED',
    stock: { skuId: `SKU${Date.now()}${index}`, availableStock: sku.stock, lockedStock: 0, safetyStock: 10, version: 1 },
    version: 1,
    createdAt,
    updatedAt: createdAt
  }))
  skus.forEach((sku) => {
    sku.stock.skuId = sku.id
  })

  const product: ShopProductDetailView = {
    id,
    spuNo: `SPU-${Date.now()}`,
    productName: request.productName,
    category: { id: request.categoryId, name: `类目 ${request.categoryId}`, level: 2 },
    brand: request.brandId ? { id: request.brandId, name: `品牌 ${request.brandId}` } : undefined,
    subtitle: request.subtitle,
    coverImageUrl: request.coverImageUrl,
    galleryImageUrls: request.galleryImageUrls,
    detailHtml: request.detailHtml,
    packageList: request.packageList,
    serviceNotes: request.serviceNotes,
    attributes: request.attributes,
    status: 'DRAFT',
    minSalePrice: skus[0]?.salePrice ?? '0.00',
    skuCount: skus.length,
    totalAvailableStock: skus.reduce((total, sku) => total + sku.stock.availableStock, 0),
    contentVersion: 1,
    createdAt,
    updatedAt: createdAt,
    skus,
    statusHistories: [{ id: `HIS${Date.now()}`, status: 'DRAFT', operatorName: '商家运营', remark: '创建商品草稿', createdAt }]
  }

  products.unshift(product)
  return clone(product)
}

export async function getMerchantProductDetail(_shopId: Id, spuId: Id) {
  return clone(findProduct(spuId))
}

export async function updateMerchantProductContent(_shopId: Id, spuId: Id, request: UpdateProductContentRequest) {
  const product = findProduct(spuId)
  product.productName = request.productName
  product.category = { id: request.categoryId, name: `类目 ${request.categoryId}`, level: 2 }
  product.brand = request.brandId ? { id: request.brandId, name: `品牌 ${request.brandId}` } : undefined
  product.subtitle = request.subtitle
  product.coverImageUrl = request.coverImageUrl
  product.galleryImageUrls = request.galleryImageUrls
  product.detailHtml = request.detailHtml
  product.packageList = request.packageList
  product.serviceNotes = request.serviceNotes
  product.attributes = request.attributes
  product.contentVersion = request.version + 1
  syncProductSummary(product)
  return clone(product)
}

export async function createMerchantSku(_shopId: Id, spuId: Id, request: CreateSkuRequest) {
  const product = findProduct(spuId)
  const sku: ShopSkuView = {
    id: `SKU${Date.now()}`,
    skuNo: `SKU-${Date.now()}`,
    skuName: request.skuName,
    imageUrl: request.imageUrl,
    salePrice: request.salePrice,
    marketPrice: request.marketPrice,
    barcode: request.barcode,
    status: 'ENABLED',
    stock: { skuId: '', availableStock: request.stock, lockedStock: 0, safetyStock: 10, version: 1 },
    version: 1,
    createdAt: now(),
    updatedAt: now()
  }
  sku.stock.skuId = sku.id
  product.skus.push(sku)
  syncProductSummary(product)
  return clone(sku)
}

export async function updateMerchantSku(_shopId: Id, spuId: Id, skuId: Id, request: UpdateSkuRequest) {
  const product = findProduct(spuId)
  const sku = product.skus.find((item) => item.id === skuId)
  if (!sku) {
    throw new Error('SKU 不存在')
  }
  sku.skuName = request.skuName ?? sku.skuName
  sku.imageUrl = request.imageUrl ?? sku.imageUrl
  sku.salePrice = request.salePrice ?? sku.salePrice
  sku.marketPrice = request.marketPrice ?? sku.marketPrice
  sku.barcode = request.barcode ?? sku.barcode
  sku.status = request.status ?? sku.status
  sku.version = request.version + 1
  sku.updatedAt = now()
  syncProductSummary(product)
  return clone(sku)
}

export async function submitMerchantProductReview(shopId: Id, spuId: Id) {
  void shopId
  const product = findProduct(spuId)
  addStatusHistory(product, 'PENDING_REVIEW', '提交平台审核')
  return clone(product)
}

export async function putMerchantProductOnShelf(shopId: Id, spuId: Id) {
  void shopId
  const product = findProduct(spuId)
  addStatusHistory(product, 'ON_SHELF', '商品上架')
  return clone(product)
}

export async function takeMerchantProductOffShelf(shopId: Id, spuId: Id) {
  void shopId
  const product = findProduct(spuId)
  addStatusHistory(product, 'OFF_SHELF', '商品下架')
  return clone(product)
}

export function getMockProductSnapshots() {
  return products
}
