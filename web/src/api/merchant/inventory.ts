import type { Id, PageView } from '../../types/common'
import type {
  InventoryAdjustmentRequest,
  InventoryInboundRequest,
  InventoryItemView,
  InventoryOperationView,
  InventoryTransactionType,
  InventoryTransactionView,
  StockState
} from '../../types/merchant'
import { getMockProductSnapshots } from './products'

export interface MerchantInventoryQuery {
  page?: number
  pageSize?: number
  keyword?: string
  stockState?: StockState | ''
}

export interface InventoryTransactionQuery {
  page?: number
  pageSize?: number
  skuId?: Id | ''
  transactionType?: InventoryTransactionType | ''
  businessType?: string
  businessNo?: string
}

const now = () => new Date().toISOString()

const transactions: InventoryTransactionView[] = [
  {
    id: 'TXN202607310001',
    skuId: 'SKU202607260001',
    skuNo: 'IP16-BLK-256',
    skuName: '黑色 256GB',
    productName: 'iPhone 16 黑色 256GB',
    transactionType: 'INBOUND',
    businessType: 'PURCHASE',
    businessNo: 'IN202607310001',
    quantity: 10,
    beforeAvailableStock: 5,
    afterAvailableStock: 15,
    remark: '暑期补货',
    createdAt: '2026-07-31T09:10:00.000+08:00'
  },
  {
    id: 'TXN202607300001',
    skuId: 'SKU202607260002',
    skuNo: 'CASE-MAG-BLUE',
    skuName: '雾蓝色',
    productName: '磁吸保护壳 雾蓝色',
    transactionType: 'ADJUSTMENT',
    businessType: 'MANUAL',
    businessNo: 'ADJ202607300001',
    quantity: -3,
    beforeAvailableStock: 10,
    afterAvailableStock: 7,
    remark: '盘点差异调整',
    createdAt: '2026-07-30T18:20:00.000+08:00'
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

function getStockState(availableStock: number, safetyStock: number): StockState {
  if (availableStock <= 0) {
    return 'OUT'
  }
  if (availableStock <= safetyStock) {
    return 'LOW'
  }
  return 'NORMAL'
}

function buildInventoryItems(): InventoryItemView[] {
  return getMockProductSnapshots().flatMap((product) =>
    product.skus.map((sku) => ({
      skuId: sku.id,
      skuNo: sku.skuNo,
      skuName: sku.skuName,
      spuId: product.id,
      spuNo: product.spuNo,
      productName: product.productName,
      coverImageUrl: product.coverImageUrl,
      stockState: getStockState(sku.stock.availableStock, sku.stock.safetyStock),
      availableStock: sku.stock.availableStock,
      lockedStock: sku.stock.lockedStock,
      safetyStock: sku.stock.safetyStock,
      version: sku.stock.version,
      updatedAt: sku.updatedAt
    }))
  )
}

function findInventorySku(skuId: Id) {
  for (const product of getMockProductSnapshots()) {
    const sku = product.skus.find((item) => item.id === skuId)
    if (sku) {
      return { product, sku }
    }
  }
  throw new Error('库存 SKU 不存在')
}

function pushTransaction(params: {
  skuId: Id
  transactionType: InventoryTransactionType
  businessType: string
  businessNo: string
  quantity: number
  beforeAvailableStock: number
  afterAvailableStock: number
  remark?: string
}) {
  const { product, sku } = findInventorySku(params.skuId)
  transactions.unshift({
    id: `TXN${Date.now()}`,
    skuId: sku.id,
    skuNo: sku.skuNo,
    skuName: sku.skuName,
    productName: product.productName,
    transactionType: params.transactionType,
    businessType: params.businessType,
    businessNo: params.businessNo,
    quantity: params.quantity,
    beforeAvailableStock: params.beforeAvailableStock,
    afterAvailableStock: params.afterAvailableStock,
    remark: params.remark,
    createdAt: now()
  })
}

export async function getMerchantInventory(_shopId: Id, query: MerchantInventoryQuery = {}) {
  const keyword = query.keyword?.trim().toLowerCase()
  let items = buildInventoryItems()

  if (keyword) {
    items = items.filter((item) => item.productName.toLowerCase().includes(keyword) || item.skuName.toLowerCase().includes(keyword) || item.skuNo.toLowerCase().includes(keyword))
  }
  if (query.stockState) {
    items = items.filter((item) => item.stockState === query.stockState)
  }

  items.sort((a, b) => a.availableStock - b.availableStock)
  return paginate(items, query.page, query.pageSize)
}

export async function getMerchantInventoryDetail(_shopId: Id, skuId: Id) {
  const item = buildInventoryItems().find((inventoryItem) => inventoryItem.skuId === skuId)
  if (!item) {
    throw new Error('库存不存在')
  }
  return clone(item)
}

export async function createInventoryInbound(_shopId: Id, request: InventoryInboundRequest): Promise<InventoryOperationView> {
  const { sku } = findInventorySku(request.skuId)
  const beforeAvailableStock = sku.stock.availableStock
  sku.stock.availableStock += request.quantity
  sku.stock.version += 1
  sku.updatedAt = now()
  pushTransaction({
    skuId: request.skuId,
    transactionType: 'INBOUND',
    businessType: 'PURCHASE',
    businessNo: request.businessNo,
    quantity: request.quantity,
    beforeAvailableStock,
    afterAvailableStock: sku.stock.availableStock,
    remark: request.remark
  })
  return clone({
    skuId: sku.id,
    availableStock: sku.stock.availableStock,
    lockedStock: sku.stock.lockedStock,
    version: sku.stock.version,
    operationType: 'INBOUND',
    businessNo: request.businessNo,
    createdAt: now()
  })
}

export async function createInventoryAdjustment(_shopId: Id, request: InventoryAdjustmentRequest): Promise<InventoryOperationView> {
  const { sku } = findInventorySku(request.skuId)
  const beforeAvailableStock = sku.stock.availableStock
  sku.stock.availableStock = Math.max(0, sku.stock.availableStock + request.delta)
  sku.stock.version = request.version + 1
  sku.updatedAt = now()
  pushTransaction({
    skuId: request.skuId,
    transactionType: 'ADJUSTMENT',
    businessType: 'MANUAL',
    businessNo: request.businessNo,
    quantity: sku.stock.availableStock - beforeAvailableStock,
    beforeAvailableStock,
    afterAvailableStock: sku.stock.availableStock,
    remark: request.remark
  })
  return clone({
    skuId: sku.id,
    availableStock: sku.stock.availableStock,
    lockedStock: sku.stock.lockedStock,
    version: sku.stock.version,
    operationType: 'ADJUSTMENT',
    businessNo: request.businessNo,
    createdAt: now()
  })
}

export async function getInventoryTransactions(_shopId: Id, query: InventoryTransactionQuery = {}) {
  let items = [...transactions]

  if (query.skuId) {
    items = items.filter((item) => item.skuId === query.skuId)
  }
  if (query.transactionType) {
    items = items.filter((item) => item.transactionType === query.transactionType)
  }
  if (query.businessType?.trim()) {
    items = items.filter((item) => item.businessType.toLowerCase().includes(query.businessType!.trim().toLowerCase()))
  }
  if (query.businessNo?.trim()) {
    items = items.filter((item) => item.businessNo.toLowerCase().includes(query.businessNo!.trim().toLowerCase()))
  }

  items.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return paginate(items, query.page, query.pageSize)
}
