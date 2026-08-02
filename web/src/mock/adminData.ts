import type { AccountStatus, BrandRecord, CategoryRecord, CommonStatus, Id, ListQuery, PageResult, PlatformAccount, PlatformAfterSale, PlatformOrder, PlatformProduct, ProductStatus, RoleRecord, SkuInventory } from '@/types/admin'

const now = '2026-07-31T10:00:00.000+08:00'

export const allPermissions = [
  { code: 'platform:rbac:manage', label: '平台 RBAC 管理' },
  { code: 'platform:catalog:manage', label: '平台目录管理' },
  { code: 'platform:product:audit', label: '平台商品审核' },
  { code: 'platform:product:ban', label: '平台商品治理' },
  { code: 'platform:operation:read', label: '平台运营只读' },
  { code: 'platform:task:execute', label: '内部任务执行' }
] as const

export const permissionTree = [
  { id: 'rbac', label: '权限中心', children: [{ id: 'platform:rbac:manage', label: '平台 RBAC 管理' }] },
  { id: 'catalog', label: '商品基础资料', children: [{ id: 'platform:catalog:manage', label: '平台目录管理' }] },
  { id: 'product', label: '平台商品', children: [{ id: 'platform:product:audit', label: '平台商品审核' }, { id: 'platform:product:ban', label: '平台商品治理' }] },
  { id: 'operation', label: '平台运营', children: [{ id: 'platform:operation:read', label: '平台运营只读' }] },
  { id: 'task', label: '内部任务', children: [{ id: 'platform:task:execute', label: '内部任务执行' }] }
]

let roles: RoleRecord[] = [
  { id: 'role-1', name: '超级管理员', code: 'SUPER_ADMIN', description: '拥有平台全部菜单和按钮权限', permissions: allPermissions.map((item) => item.code), createdAt: now },
  { id: 'role-2', name: '运营管理员', code: 'OPERATION_ADMIN', description: '负责商品、品牌、分类和订单运营', permissions: ['platform:catalog:manage', 'platform:product:audit', 'platform:product:ban', 'platform:operation:read'], createdAt: now },
  { id: 'role-3', name: '售后审核员', code: 'AUDIT_ADMIN', description: '负责平台售后纠纷审核', permissions: ['platform:operation:read'], createdAt: now }
]

let accounts: PlatformAccount[] = [
  { id: 'acc-1', username: 'admin', displayName: '平台管理员', role: 'SUPER_ADMIN', permissions: roles[0].permissions, status: 'ACTIVE', phone: '13800000001', createdAt: now },
  { id: 'acc-2', username: 'operation', displayName: '运营管理员', role: 'OPERATION_ADMIN', permissions: roles[1].permissions, status: 'ACTIVE', phone: '13800000002', createdAt: now },
  { id: 'acc-3', username: 'audit', displayName: '售后审核员', role: 'AUDIT_ADMIN', permissions: roles[2].permissions, status: 'ACTIVE', phone: '13800000003', createdAt: now },
  { id: 'acc-4', username: 'merchant', displayName: '商家演示账号', role: 'MERCHANT', permissions: ['shop:home:view'], status: 'ACTIVE', phone: '13800000004', ownerShopName: '时光数码店', ownerShopNames: ['时光数码店', '时光生活馆'], createdAt: now }
]

let categories: CategoryRecord[] = [
  { id: 'cat-1', name: '数码家电', level: 1, sort: 1, status: 'ENABLED', children: [{ id: 'cat-1-1', parentId: 'cat-1', name: '手机配件', level: 2, sort: 1, status: 'ENABLED' }, { id: 'cat-1-2', parentId: 'cat-1', name: '智能穿戴', level: 2, sort: 2, status: 'ENABLED' }] },
  { id: 'cat-2', name: '生活百货', level: 1, sort: 2, status: 'ENABLED', children: [{ id: 'cat-2-1', parentId: 'cat-2', name: '厨房用品', level: 2, sort: 1, status: 'DISABLED' }] }
]

let brands: BrandRecord[] = [
  { id: 'brand-1', name: 'TimeTech', initial: 'T', status: 'ENABLED', createdAt: now },
  { id: 'brand-2', name: 'CalmLife', initial: 'C', status: 'ENABLED', createdAt: now },
  { id: 'brand-3', name: 'OldMarket', initial: 'O', status: 'DISABLED', createdAt: now }
]

let products: PlatformProduct[] = [
  { id: 'prd-1', name: '静音机械键盘', shopName: '时光数码店', categoryName: '手机配件', brandName: 'TimeTech', price: '399.00', status: 'PENDING_REVIEW', createdAt: now },
  { id: 'prd-2', name: '智能运动手环', shopName: '晨光运动专营店', categoryName: '智能穿戴', brandName: 'TimeTech', price: '199.00', status: 'ON_SHELF', createdAt: now },
  { id: 'prd-3', name: '违规夸大宣传保温杯', shopName: '旧市集百货', categoryName: '厨房用品', brandName: 'OldMarket', price: '59.00', status: 'BANNED', reason: '商品图片包含违规内容', createdAt: now }
]

let inventories: SkuInventory[] = [
  { id: 'sku-1', productName: '静音机械键盘', skuName: '白色 / 茶轴', shopName: '时光数码店', stock: 126, warningStock: 20, lockedStock: 8, updatedAt: now },
  { id: 'sku-2', productName: '智能运动手环', skuName: '黑色', shopName: '晨光运动专营店', stock: 9, warningStock: 20, lockedStock: 2, updatedAt: now },
  { id: 'sku-3', productName: '保温杯', skuName: '500ml', shopName: '旧市集百货', stock: 0, warningStock: 15, lockedStock: 0, updatedAt: now }
]

let orders: PlatformOrder[] = [
  { id: 'ord-1', orderNo: 'SG202607310001', shopName: '时光数码店', buyerName: '林同学', amount: '399.00', status: 'PAID', products: ['静音机械键盘 x1'], createdAt: now },
  { id: 'ord-2', orderNo: 'SG202607310002', shopName: '晨光运动专营店', buyerName: '周老师', amount: '199.00', status: 'SHIPPED', products: ['智能运动手环 x1'], createdAt: now },
  { id: 'ord-3', orderNo: 'SG202607310003', shopName: '旧市集百货', buyerName: '王先生', amount: '59.00', status: 'PENDING_PAYMENT', products: ['保温杯 x1'], createdAt: now }
]

let afterSales: PlatformAfterSale[] = [
  { id: 'as-1', serviceNo: 'AS202607310001', orderNo: 'SG202607310001', shopName: '时光数码店', buyerName: '林同学', amount: '399.00', reason: '收到商品按键异常，商家拒绝退款', status: 'PENDING', createdAt: now },
  { id: 'as-2', serviceNo: 'AS202607310002', orderNo: 'SG202607310002', shopName: '晨光运动专营店', buyerName: '周老师', amount: '199.00', reason: '物流超时申请补偿', status: 'APPROVED', auditRemark: '商家需按平台规则补偿运费券', createdAt: now }
]

function delay<T>(value: T) {
  // 统一模拟网络延迟，让页面 loading、空状态和刷新交互接近真实后端替换后的体验。
  return new Promise<T>((resolve) => window.setTimeout(() => resolve(value), 180))
}

function page<T>(items: T[], query: ListQuery = {}): PageResult<T> {
  const pageNo = query.page ?? 1
  const pageSize = query.pageSize ?? 20
  const totalPages = Math.ceil(items.length / pageSize)
  const start = (pageNo - 1) * pageSize
  return { items: items.slice(start, start + pageSize), page: pageNo, pageSize, total: items.length, totalPages }
}

function keywordMatch(values: string[], keyword?: string) {
  return !keyword || values.some((value) => value.includes(keyword))
}

export const mockAdmin = {
  login(username: string, password: string) {
    const user = accounts.find((item) => item.username === username)
    if ((username === 'admin' && password === 'admin123') || (username === 'merchant' && password === 'merchant123')) {
      return delay({ token: `mock-token-${username}`, user: user! })
    }
    return Promise.reject(new Error('账号或密码错误'))
  },
  getDashboard() { return delay({ metrics: { products: products.length, orders: orders.length, lowStock: inventories.filter((i) => i.stock <= i.warningStock).length, pendingAfterSale: afterSales.filter((i) => i.status === 'PENDING').length }, tasks: ['2 个 SKU 库存低于预警线', '1 笔售后纠纷等待平台审核', '3 个商家账号需定期巡检'], recent: orders.slice(0, 3) }) },
  listRoles: () => delay(roles), saveRole: (record: RoleRecord) => { roles = record.id ? roles.map((item) => item.id === record.id ? record : item) : [{ ...record, id: `role-${Date.now()}`, createdAt: now }, ...roles]; return delay(true) },
  listAccounts: (q: ListQuery) => delay(page(accounts.filter((i) => keywordMatch([i.username, i.displayName, i.ownerShopName ?? '', ...(i.ownerShopNames ?? [])], q.keyword) && (!q.status || i.status === q.status)), q)), saveAccount: (record: PlatformAccount) => { accounts = record.id ? accounts.map((item) => item.id === record.id ? record : item) : [{ ...record, id: `acc-${Date.now()}`, createdAt: now }, ...accounts]; return delay(true) }, setAccountStatus: (id: Id, status: AccountStatus) => { accounts = accounts.map((item) => item.id === id ? { ...item, status } : item); return delay(true) },
  listCategories: () => delay(categories), saveCategory: (record: CategoryRecord) => { categories = record.id ? categories.map((item) => item.id === record.id ? record : { ...item, children: item.children?.map((child) => child.id === record.id ? record : child) }) : [{ ...record, id: `cat-${Date.now()}` }, ...categories]; return delay(true) }, setCategoryStatus: (id: Id, status: CommonStatus) => { categories = categories.map((item) => item.id === id ? { ...item, status } : { ...item, children: item.children?.map((child) => child.id === id ? { ...child, status } : child) }); return delay(true) },
  listBrands: (q: ListQuery) => delay(page(brands.filter((i) => keywordMatch([i.name, i.initial], q.keyword) && (!q.status || i.status === q.status)), q)), saveBrand: (record: BrandRecord) => { brands = record.id ? brands.map((item) => item.id === record.id ? record : item) : [{ ...record, id: `brand-${Date.now()}`, createdAt: now }, ...brands]; return delay(true) }, setBrandStatus: (id: Id, status: CommonStatus) => { brands = brands.map((item) => item.id === id ? { ...item, status } : item); return delay(true) },
  listProducts: (q: ListQuery) => delay(page(products.filter((i) => keywordMatch([i.name, i.shopName, i.categoryName], q.keyword) && (!q.status || i.status === q.status) && (!q.shopName || i.shopName === q.shopName) && (!q.categoryName || i.categoryName === q.categoryName)), q)), setProductStatus: (id: Id, status: ProductStatus, reason?: string) => { products = products.map((item) => item.id === id ? { ...item, status, reason } : item); return delay(true) },
  listInventories: (q: ListQuery) => delay(page(inventories.filter((i) => keywordMatch([i.productName, i.skuName, i.shopName], q.keyword)), q)),
  listOrders: (q: ListQuery) => delay(page(orders.filter((i) => keywordMatch([i.orderNo, i.shopName, i.buyerName], q.keyword) && (!q.status || i.status === q.status) && (!q.shopName || i.shopName === q.shopName)), q)),
  listAfterSales: (q: ListQuery) => delay(page(afterSales.filter((i) => keywordMatch([i.serviceNo, i.orderNo, i.shopName, i.buyerName], q.keyword) && (!q.status || i.status === q.status)), q))
}
