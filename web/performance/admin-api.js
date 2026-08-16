import http from 'k6/http'
import { check, sleep } from 'k6'

// 运行时由环境变量注入目标地址和有效管理员 Token；默认参数适合开发或预发的基线压测。
const baseUrl = (__ENV.BASE_URL || 'http://localhost:5173').replace(/\/$/, '')
const token = __ENV.TOKEN || ''
const vus = Number(__ENV.VUS || 10)
const duration = __ENV.DURATION || '30s'
const headers = token ? { satoken: token } : {}

export const options = {
  vus,
  duration,
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500']
  }
}

function get(path, name) {
  const response = http.get(`${baseUrl}${path}`, { headers, tags: { name } })
  check(response, { [`${name} 返回成功`]: (value) => value.status >= 200 && value.status < 300 })
}

export default function () {
  // 首页统计实现为四个真实分页计数请求，保持和 dashboard.ts 相同的参数与访问模式。
  get('/api/platform/products?status=ON_SHELF&page=1&pageSize=1', 'dashboard_products')
  get('/api/platform/operations/orders?page=1&pageSize=1', 'dashboard_orders')
  get('/api/platform/shops?status=ACTIVE&page=1&pageSize=1', 'dashboard_shops')
  get('/api/platform/after-sale-appeals?status=PENDING&page=1&pageSize=1', 'dashboard_after_sale_appeals')
  get('/api/platform/products?page=1&pageSize=20', 'products_list')
  get('/api/platform/operations/orders?page=1&pageSize=20', 'orders_list')
  get('/api/platform/coupon-operations/templates?ownerType=PLATFORM&page=1&pageSize=20', 'coupon_templates_list')
  sleep(1)
}
