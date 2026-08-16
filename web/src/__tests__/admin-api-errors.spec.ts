import { describe, expect, it, vi } from 'vitest'

// 统一错误对象由请求层产生；API 封装必须原样向页面透传，页面据此展示登录过期、越权和参数错误状态。
const { request } = vi.hoisted(() => ({
  request: { get: vi.fn(), post: vi.fn(), put: vi.fn() }
}))
vi.mock('@/utils/request', () => ({ default: request }))

import { listOrders } from '@/api/admin/orders'
import { setProductStatus } from '@/api/admin/products'

const errorCases = [
  { name: 'Token 过期', error: { status: 401, code: 'AUTH_TOKEN_EXPIRED' } },
  { name: '越权访问', error: { status: 403, code: 'FORBIDDEN' } },
  { name: '非法分页参数', error: { status: 400, code: 'VALIDATION_FAILED' } }
]

describe('管理员接口错误契约', () => {
  for (const testCase of errorCases) {
    it(`透传${testCase.name}错误`, async () => {
      request.get.mockRejectedValueOnce(testCase.error)
      await expect(listOrders({ page: 0, pageSize: 0 })).rejects.toEqual(testCase.error)
    })
  }

  it('非法商品状态在请求前失败，不产生写请求', () => {
    expect(() => setProductStatus('product-1', 'PENDING_REVIEW')).toThrow('暂不支持平台接口')
    expect(request.post).not.toHaveBeenCalled()
  })
})
