import request from '@/utils/request'
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

interface BackendInventoryItemView {
  spuId: Id
  spuNo: string
  productName: string
  sku: {
    id: Id
    skuNo: string
    skuName: string
    imageUrl: string
    stock: {
      skuId: Id
      availableQuantity: number
      lockedQuantity: number
      version: number
    }
    updatedAt: string
  }
}

interface BackendInventoryOperationView {
  transactionNo: string
  skuId: Id
  transactionType: InventoryTransactionType
  availableChange: number
  lockedChange: number
  availableAfter: number
  lockedAfter: number
  businessType: string
  businessNo: string
  remark?: string
  createdAt: string
}

function getStockState(availableStock: number): StockState {
  if (availableStock <= 0) return 'OUT'
  if (availableStock <= 10) return 'LOW'
  return 'NORMAL'
}

function toInventoryItem(item: BackendInventoryItemView): InventoryItemView {
  return {
    skuId: item.sku.id,
    skuNo: item.sku.skuNo,
    skuName: item.sku.skuName,
    spuId: item.spuId,
    spuNo: item.spuNo,
    productName: item.productName,
    coverImageUrl: item.sku.imageUrl,
    stockState: getStockState(item.sku.stock.availableQuantity),
    availableStock: item.sku.stock.availableQuantity,
    lockedStock: item.sku.stock.lockedQuantity,
    safetyStock: 10,
    version: item.sku.stock.version,
    updatedAt: item.sku.updatedAt
  }
}

function toOperation(data: BackendInventoryOperationView): InventoryOperationView {
  return {
    skuId: data.skuId,
    availableStock: data.availableAfter,
    lockedStock: data.lockedAfter,
    version: 0,
    operationType: data.transactionType,
    businessNo: data.businessNo || data.transactionNo,
    createdAt: data.createdAt
  }
}

function idempotencyKey() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`
}

export async function getMerchantInventory(shopId: Id, query: MerchantInventoryQuery = {}) {
  const stockState = query.stockState === 'LOW' ? 'LOW_STOCK' : query.stockState === 'OUT' ? 'OUT_OF_STOCK' : query.stockState === 'NORMAL' ? 'IN_STOCK' : undefined
  const data = await request.get<PageView<BackendInventoryItemView>>(`/shops/${shopId}/inventory`, {
    params: { ...query, stockState }
  }) as unknown as PageView<BackendInventoryItemView>
  return { ...data, items: data.items.map(toInventoryItem) }
}

export async function getMerchantInventoryDetail(shopId: Id, skuId: Id) {
  const item = await request.get<BackendInventoryItemView>(`/shops/${shopId}/inventory/${skuId}`) as unknown as BackendInventoryItemView
  return toInventoryItem(item)
}

export async function createInventoryInbound(shopId: Id, data: InventoryInboundRequest): Promise<InventoryOperationView> {
  const operation = await request.post<BackendInventoryOperationView>(`/shops/${shopId}/inventory/${data.skuId}/inbounds`, {
    quantity: data.quantity,
    remark: data.remark
  }, { headers: { 'Idempotency-Key': data.businessNo || idempotencyKey() } }) as unknown as BackendInventoryOperationView
  return toOperation(operation)
}

export async function createInventoryAdjustment(_shopId: Id, _data: InventoryAdjustmentRequest): Promise<InventoryOperationView> {
  throw new Error('当前后端暂未实现库存调整接口')
}

export async function getInventoryTransactions(_shopId: Id, _query: InventoryTransactionQuery = {}) {
  return { items: [], page: 1, pageSize: 10, total: 0, totalPages: 0 } as PageView<InventoryTransactionView>
}
