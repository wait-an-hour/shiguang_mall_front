import { beforeEach, describe, expect, it, vi } from 'vitest'

// 请求层被替换为可观察的 mock：此处验证真实封装的路径、查询转换、请求体和幂等头，绝不调用后端写接口。
const { request } = vi.hoisted(() => ({
  request: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn()
  }
}))
vi.mock('@/utils/request', () => ({ default: request }))

import { listOrders } from '@/api/admin/orders'
import { getProductDetail, listProducts, setProductStatus } from '@/api/admin/products'
import { getAdminDashboard } from '@/api/admin/dashboard'
import { activateCouponTemplate, listCouponTemplates } from '@/api/admin/coupons'
import { decideAfterSaleAppeal, listAfterSaleAppeals } from '@/api/admin/afterSaleAppeals'

describe('管理员 API 契约', () => {
  beforeEach(() => {
    request.get.mockReset()
    request.post.mockReset()
    request.put.mockReset()
    vi.stubGlobal('crypto', { randomUUID: vi.fn(() => 'test-idempotency-key') })
  })

  it('传递订单分页，转换空筛选并为退款金额提供默认值', async () => {
    request.get.mockResolvedValue({
      items: [{ id: '1', orderNo: 'SO-1', shop: { shopName: '店铺 A' }, buyer: { username: 'buyer' }, payableAmount: '88.00', orderStatus: 'PENDING_SHIPMENT', itemSummary: [{ productName: '商品', skuName: '默认', quantity: 2 }], createdAt: '2026-08-16T00:00:00+08:00', availableActions: [] }],
      page: 2, pageSize: 20, total: 1, totalPages: 1
    })

    const result = await listOrders({ keyword: '', status: '', page: 2, pageSize: 20 })
    expect(request.get).toHaveBeenCalledWith('/platform/operations/orders', { params: expect.objectContaining({ page: 2, pageSize: 20, orderNo: undefined, orderStatus: undefined, keyword: undefined, status: undefined }) })
    expect(result.items[0]).toMatchObject({ buyerName: 'buyer', refundAmount: '0.00', totalQuantity: 2 })
  })

  it('传递商品分页，并按 SKU 数值最低价映射详情', async () => {
    request.get
      .mockResolvedValueOnce({ items: [], page: 3, pageSize: 15, total: 0, totalPages: 0 })
      .mockResolvedValueOnce({ id: 'p1', spuNo: 'SPU-1', productName: '商品', coverUrl: null, shop: { shopName: '店铺' }, category: { categoryName: '分类' }, brand: null, status: 'ON_SHELF', contentVersion: 2, skus: [
        { id: 's1', skuNo: 'SKU-1', skuName: '高价', imageUrl: null, salePrice: '100.00', marketPrice: '120.00', barcode: '', status: 'ENABLED', availableQuantity: 1, lockedQuantity: 0, version: 1, createdAt: '', updatedAt: '' },
        { id: 's2', skuNo: 'SKU-2', skuName: '低价', imageUrl: null, salePrice: '9.90', marketPrice: '12.00', barcode: '', status: 'ENABLED', availableQuantity: 1, lockedQuantity: 0, version: 1, createdAt: '', updatedAt: '' }
      ], createdAt: '', updatedAt: '' })

    await listProducts({ shopId: '', categoryId: '', page: 3, pageSize: 15 })
    expect(request.get).toHaveBeenCalledWith('/platform/products', { params: expect.objectContaining({ page: 3, pageSize: 15, shopId: undefined, categoryId: undefined }) })
    expect((await getProductDetail('p1')).price).toBe('9.90')
  })

  it('拒绝未实现的商品状态动作，避免向不存在端点发请求', () => {
    expect(() => setProductStatus('p1', 'PENDING_REVIEW')).toThrow('暂不支持平台接口')
    expect(request.post).not.toHaveBeenCalled()
  })

  it('按文档发送优惠券分页与状态流转幂等头', async () => {
    request.get.mockResolvedValue({ items: [], page: 4, pageSize: 25, total: 0, totalPages: 0 })
    request.post.mockResolvedValue({})

    await listCouponTemplates({ ownerType: 'PLATFORM', status: 'DRAFT', page: 4, pageSize: 25 })
    await activateCouponTemplate('coupon-1', { version: 3 })

    expect(request.get).toHaveBeenCalledWith('/platform/coupon-operations/templates', { params: { ownerType: 'PLATFORM', status: 'DRAFT', page: 4, pageSize: 25 } })
    expect(request.post).toHaveBeenCalledWith('/platform/coupon-templates/coupon-1/activate', { version: 3 }, { headers: { 'Idempotency-Key': 'test-idempotency-key' } })
  })

  it('清洗售后空输入、保留分页，并为裁决请求传递调用方幂等键', async () => {
    request.get.mockResolvedValue({ items: [], page: 1, pageSize: 10, total: 0, totalPages: 0 })
    request.post.mockResolvedValue({})

    await listAfterSaleAppeals({ afterSaleNo: '   ', page: 1, pageSize: 10 })
    await decideAfterSaleAppeal('appeal-1', { decision: 'APPROVE', approvedAmount: '10.00', reviewComment: '同意退款', version: 1 }, 'appeal-key')

    expect(request.get).toHaveBeenCalledWith('/platform/after-sale-appeals', { params: expect.objectContaining({ afterSaleNo: undefined, page: 1, pageSize: 10 }) })
    expect(request.post).toHaveBeenCalledWith('/platform/after-sale-appeals/appeal-1/decide', expect.objectContaining({ decision: 'APPROVE', version: 1 }), { headers: { 'Idempotency-Key': 'appeal-key' } })
  })

  it('首页统计使用四类真实计数请求与最近订单请求', async () => {
    request.get
      .mockResolvedValueOnce({ total: 11 })
      .mockResolvedValueOnce({ total: 22 })
      .mockResolvedValueOnce({ total: 3 })
      .mockResolvedValueOnce({ total: 4 })
      .mockResolvedValueOnce({ items: [], page: 1, pageSize: 3, total: 0, totalPages: 0 })

    await expect(getAdminDashboard()).resolves.toMatchObject({ metrics: { products: 11, orders: 22, shops: 3, pendingAfterSale: 4 } })
    expect(request.get.mock.calls.map((call: unknown[]) => call[0])).toEqual([
      '/platform/products', '/platform/operations/orders', '/platform/shops', '/platform/after-sale-appeals', '/platform/operations/orders'
    ])
  })
})
