# 时光商城商家端网页框架计划与设计

## 1. 设计目标

商家端网页面向店铺管理员、商品运营、库存人员、订单客服和售后人员，核心目标是支持店铺范围内的商品维护、库存维护、订单履约、售后处理和成员管理。

商家端必须严格遵守后端契约中的店铺数据边界：所有商家业务接口均通过 `/api/shops/{shopId}/...` 访问，并依赖 `SHOP(...)` 权限校验。前端应将 `shopId` 作为商家端核心上下文，而不是普通页面参数。

优先级：

1. 店铺权限隔离
2. 商品、库存、订单履约主流程
3. 售后和成员治理
4. 页面完整性和操作便利性
5. 看板和运营辅助能力

## 2. 依据文档

本设计基于以下项目契约：

- `docs/product/phase-1-requirements.md`
- `docs/product/phase-2-requirements.md`
- `docs/api/common-contract.md`
- `docs/api/dto-catalog.md`
- `docs/api/phase-1-api.md`
- `docs/api/phase-2-api.md`
- `docs/development/frontend-backend-parallel-development.md`
- `docs/development/frontend-page-routing-design.md`

当前后端代码已按领域建立基础包，包括：

- `product`
- `inventory`
- `order`
- `aftersale`
- `shop`
- `identity`
- `common/security`
- `common/service`

因此商家端前端可以先基于 Markdown 契约开发类型、API Client、Mock 和页面，后续与 Controller 实现联调。

## 3. 技术栈建议

商家端网页建议使用：

- Vue 3
- Vite
- TypeScript
- Element Plus
- Pinia
- Vue Router
- Axios
- SCSS
- Vitest + Vue Test Utils
- Playwright

UI 风格遵循 `shiguang-mall-page-template`：

- 浅色侧栏
- 白色顶部栏
- 低对比页面背景
- 轻边框卡片
- 柔和状态标签
- 表格优先，指标卡辅助
- 单个页面区域最多一个主按钮
- 适合长时间操作的低噪音管理界面

## 4. 商家端信息架构

| 一级菜单 | 路由前缀 | 核心功能 |
| --- | --- | --- |
| 工作台 | `/merchant/shops/:shopId/dashboard` | 当前店铺概览、待办入口 |
| 商品管理 | `/merchant/shops/:shopId/products` | SPU 列表、创建、编辑、提交审核、上下架 |
| 库存管理 | `/merchant/shops/:shopId/inventory` | SKU 库存、入库、调整、库存流水 |
| 订单履约 | `/merchant/shops/:shopId/orders` | 店铺订单列表、订单详情、发货 |
| 售后处理 | `/merchant/shops/:shopId/after-sales` | 售后列表、审核、确认退货、退款重试 |
| 成员管理 | `/merchant/shops/:shopId/members` | 本店成员、角色、启停 |
| 店铺切换 | `/merchant/shops` | 当前账号可管理店铺列表 |

`/merchant` 作为商家端入口：

```text
/merchant
  -> 如果只有一个有效店铺：/merchant/shops/:shopId/dashboard
  -> 如果多个有效店铺：/merchant/shops
  -> 如果没有店铺权限：/403
```

## 5. 路由设计

### 5.1 路由清单

```text
/merchant
/merchant/shops
/merchant/shops/:shopId/dashboard

/merchant/shops/:shopId/products
/merchant/shops/:shopId/products/new
/merchant/shops/:shopId/products/:spuId
/merchant/shops/:shopId/products/:spuId/edit

/merchant/shops/:shopId/inventory
/merchant/shops/:shopId/inventory/:skuId
/merchant/shops/:shopId/inventory/transactions

/merchant/shops/:shopId/orders
/merchant/shops/:shopId/orders/:orderId

/merchant/shops/:shopId/after-sales
/merchant/shops/:shopId/after-sales/:afterSaleId

/merchant/shops/:shopId/members
```

### 5.2 Route Meta

```ts
{
  path: '/merchant/shops/:shopId/products',
  name: 'MerchantProductList',
  component: () => import('@/views/merchant/product/ProductListView.vue'),
  meta: {
    title: '商品管理',
    layout: 'merchant',
    requiresAuth: true,
    shopScoped: true,
    permissions: ['shop:product:manage']
  }
}
```

### 5.3 权限映射

| 页面 | 权限 |
| --- | --- |
| 商品管理 | `shop:product:manage` |
| 库存管理 | `shop:inventory:manage` |
| 订单列表、订单详情 | `shop:order:read` |
| 发货动作 | `shop:order:ship` |
| 售后处理 | `shop:after-sale:manage` |
| 成员管理 | `shop:member:manage` |

## 6. 商家端 Layout 设计

统一使用 `MerchantLayout`：

```text
MerchantLayout
├── MerchantSidebar
│   ├── 项目 Logo
│   ├── 当前店铺卡片
│   └── 权限过滤后的菜单
├── MerchantTopbar
│   ├── 面包屑
│   ├── 当前用户
│   └── 退出 / 切换店铺
└── RouterView
    ├── PageHeader
    └── PageContent
```

设计规则：

- `shopId` 变化后，当前页面必须重新请求数据。
- 菜单只展示当前店铺拥有权限的模块。
- `SUPER_ADMIN` 不自动拥有店铺数据范围，不能把平台权限当店铺权限使用。
- 当前店铺状态必须展示：`PENDING`、`ACTIVE`、`SUSPENDED`、`CLOSED`。
- 店铺状态会影响按钮能力。

店铺状态能力：

| 店铺状态 | 前端能力表现 |
| --- | --- |
| `PENDING` | 可维护草稿，可提交审核，不可上架 |
| `ACTIVE` | 可提交审核、上架、发货、售后处理 |
| `SUSPENDED` | 可整改商品，不可提交审核和上架，可处理历史订单 |
| `CLOSED` | 只读历史，不允许新增或状态动作 |

## 7. Pinia Store 设计

### 7.1 Store 划分

| Store | 职责 |
| --- | --- |
| `useAuthStore` | token、当前用户、平台权限、店铺上下文 |
| `useMerchantStore` | 当前 `shopId`、当前店铺、店铺权限、店铺切换 |
| `useRouteQueryStore` | 可选，封装查询参数转换逻辑 |
| `useUiStore` | 可选，菜单折叠等纯 UI 状态 |

### 7.2 商家上下文状态

```ts
type Id = string

interface MerchantState {
  currentShopId: Id | null
  currentShop: ShopSummary | null
  currentShopPermissions: string[]
}
```

权限判断：

```ts
function hasShopPermission(permission: string) {
  return currentShopPermissions.includes(permission)
}
```

`GET /api/auth/me` 返回的 `CurrentUserView` 是商家端初始化入口。前端不要额外猜测权限。

## 8. API Client 设计

建议按领域拆分：

```text
src/api/
├── http.ts
├── auth.ts
├── merchant/
│   ├── shops.ts
│   ├── products.ts
│   ├── inventory.ts
│   ├── orders.ts
│   ├── afterSales.ts
│   └── members.ts
└── types/
    ├── common.ts
    ├── auth.ts
    ├── merchantProduct.ts
    ├── merchantInventory.ts
    ├── merchantOrder.ts
    ├── merchantAfterSale.ts
    └── merchantMember.ts
```

`http.ts` 统一负责：

- 注入 `satoken`
- 注入 `X-Request-Id`
- 幂等动作注入 `Idempotency-Key`
- 解析统一响应 `{ code, message, data, requestId, timestamp }`
- 401 清理登录态并跳转登录
- 403 跳转 `/403` 或展示无权限
- 409 交给页面处理刷新
- 500 展示重试

通用规则：

- ID 全部使用 `string`，不得 `Number(id)`。
- 金额全部使用 `string`，展示通过 `MoneyText`。
- 枚举判断使用英文 code，中文展示放 constants。
- PATCH 表单要区分字段缺失和显式 `null`。

## 9. 页面设计

### 9.1 店铺切换页

路由：`/merchant/shops`

数据来源：`GET /api/auth/me`

展示内容：

- 当前用户信息
- 可管理店铺列表
- 店铺状态
- 当前角色
- 权限摘要
- 进入工作台按钮

交互：

```text
点击店铺
  -> 设置 currentShopId
  -> 跳转 /merchant/shops/:shopId/dashboard
```

状态：

- 无店铺：展示“当前账号暂无可管理店铺”。
- 店铺全部不可用：展示状态说明。
- 访问非本人店铺：跳转 `/403` 或 `/404`。

### 9.2 商家工作台

路由：`/merchant/shops/:shopId/dashboard`

当前接口没有独立 Dashboard 聚合接口，MVP 可并行请求列表接口取第一页统计：

- `GET /api/shops/{shopId}/products?page=1&pageSize=5`
- `GET /api/shops/{shopId}/inventory?stockState=LOW_STOCK&page=1&pageSize=5`
- `GET /api/shops/{shopId}/orders?orderStatus=PENDING_SHIPMENT&page=1&pageSize=5`
- `GET /api/shops/{shopId}/after-sales?status=PENDING&page=1&pageSize=5`

页面模块：

- 指标卡：待发货订单、低库存 SKU、待审核/草稿商品、待处理售后
- 待办列表：待发货、待审核售后、低库存
- 快捷入口：新建商品、库存入库、订单发货、售后审核
- 店铺状态提示：暂停、关闭时说明可用能力

规则：

- Dashboard 只做导航和提醒，不做最终业务判断。
- 数字以后端分页 `total` 为准。
- 操作仍进入对应列表或详情页完成。

### 9.3 商品列表页

路由：`/merchant/shops/:shopId/products`

接口：`GET /api/shops/{shopId}/products`

查询参数：

- `status`
- `keyword`
- `categoryId`
- `page`
- `pageSize`
- `sort`

展示字段：

- 商品图
- `spuNo`
- 商品名称
- 类目
- 品牌
- 状态
- `contentVersion`
- SKU 数
- 启用 SKU 数
- 可用库存
- 锁定库存
- 更新时间
- 操作

状态动作：

| 状态 | 操作 |
| --- | --- |
| `DRAFT` | 编辑、提交审核 |
| `REJECTED` | 编辑、提交审核 |
| `PENDING_REVIEW` | 查看，禁用编辑和上架 |
| `OFF_SHELF` | 编辑、上架、新增 SKU |
| `ON_SHELF` | 查看、下架、改 SKU 价格/启停 |
| `BANNED` | 只读，等待平台处理 |

动作接口：

- `POST /api/shops/{shopId}/products/{spuId}/submit-review`
- `POST /api/shops/{shopId}/products/{spuId}/put-on-shelf`
- `POST /api/shops/{shopId}/products/{spuId}/take-off-shelf`

规则：

- 列表筛选写入 route query。
- 状态动作成功后刷新列表或替换当前行。
- `STATE_CONFLICT`、`VERSION_CONFLICT` 时提示并刷新数据。

### 9.4 商品新建和编辑页

路由：

- `/merchant/shops/:shopId/products/new`
- `/merchant/shops/:shopId/products/:spuId/edit`

接口：

- `POST /api/shops/{shopId}/products`
- `GET /api/shops/{shopId}/products/{spuId}`
- `PUT /api/shops/{shopId}/products/{spuId}/content`
- `POST /api/shops/{shopId}/products/{spuId}/skus`
- `PATCH /api/shops/{shopId}/products/{spuId}/skus/{skuId}`

表单结构：

```text
商品编辑页
├── 基础信息
│   ├── 商品名称
│   ├── 副标题
│   ├── 类目
│   ├── 品牌
│   └── 封面图 / 图集 URL
├── 类目属性
│   └── 根据 CategoryAttributeView 动态生成
├── SKU 表格
│   ├── SKU 名称
│   ├── 规格
│   ├── 售价
│   ├── 市场价
│   ├── 条码
│   ├── 图片 URL
│   └── 启停状态
├── 详情信息
│   ├── detailHtml
│   ├── packingList
│   └── serviceNote
└── 底部操作
    ├── 保存草稿
    ├── 提交审核
    └── 返回列表
```

关键规则：

- 创建商品至少一个 SKU。
- 类目必须是启用叶子类目。
- 必填属性必须填写。
- `spec` 必须非空，键和值长度 `1..64`。
- 已有 SKU 的 `spec` 不允许修改。
- 商品内容更新必须带 `contentVersion`。
- 更新已有 SKU 展示内容时，每项必须带 SKU `version`。
- 售价、市场价、条码、启停属于普通 SKU 更新，不触发审核。
- SKU 名称、SKU 图片、新增 SKU 属于受审核内容，可能导致商品回到 `DRAFT`。

### 9.5 商品详情页

路由：`/merchant/shops/:shopId/products/:spuId`

接口：`GET /api/shops/{shopId}/products/{spuId}`

页面模块：

- 商品摘要：编号、状态、版本、类目、品牌、创建/更新时间
- SKU 表格：价格、状态、库存、版本
- 商品内容：属性、图集、详情、包装、服务说明
- 状态历史：`history`
- 当前可执行动作

### 9.6 库存管理页

路由：`/merchant/shops/:shopId/inventory`

接口：

- `GET /api/shops/{shopId}/inventory`
- `GET /api/shops/{shopId}/inventory/{skuId}`
- `POST /api/shops/{shopId}/inventory/{skuId}/inbounds`
- `POST /api/shops/{shopId}/inventory/{skuId}/adjustments`

查询参数：

- `keyword`
- `spuId`
- `stockState`
- `page`
- `pageSize`

展示字段：

- 商品名称
- `spuNo`
- SKU 编号
- SKU 名称
- 规格
- 可用库存
- 锁定库存
- 库存版本
- 更新时间
- 操作

操作：

- 普通入库
- 人工调整
- 查看库存流水
- 跳转商品详情

入库规则：

- 数量 `1..2147483647`。
- 必须提交 `Idempotency-Key`。
- 网络超时重试沿用同一个 key。
- 成功后刷新对应 SKU 库存。

调整规则：

- `availableChange` 和 `lockedChange` 至少一个非 0。
- 调整后不能为负。
- 必须带当前库存 `version`。
- 必须填写原因。
- 必须提交 `Idempotency-Key`。
- `VERSION_CONFLICT` 后刷新库存并提示重新确认。

### 9.7 库存流水页

路由：`/merchant/shops/:shopId/inventory/transactions`

接口：`GET /api/shops/{shopId}/inventory/transactions`

查询参数：

- `skuId`
- `transactionType`
- `businessType`
- `businessNo`
- `createdFrom`
- `createdTo`
- `page`
- `pageSize`

展示字段：

- 流水号
- SKU
- 类型
- 可用变化
- 锁定变化
- 变化前后
- 业务类型
- 业务编号
- 操作者
- 时间

跳转逻辑：

- `businessType=ORDER`：跳转订单详情。
- `businessType=AFTER_SALE`：跳转售后详情。
- `businessType=MANUAL_INBOUND`：停留流水详情或库存页。
- `businessType=MANUAL_ADJUSTMENT`：停留流水详情或库存页。

### 9.8 店铺订单列表页

路由：`/merchant/shops/:shopId/orders`

接口：`GET /api/shops/{shopId}/orders`

查询参数：

- `orderStatus`
- `paymentStatus`
- `keyword`
- `createdFrom`
- `createdTo`
- `page`
- `pageSize`

展示字段：

- 订单号
- 父交易号
- 买家摘要
- 商品摘要
- 订单状态
- 支付状态
- 应付金额
- 退款金额
- 创建时间
- `availableActions`
- 操作

发货按钮显示条件：

- 当前店铺权限包含 `shop:order:ship`。
- 订单 `availableActions` 包含 `SHIP`。
- 订单状态为 `PENDING_SHIPMENT`。

最终仍以后端为准，点击后需要处理：

- `ORDER_NOT_SHIPPABLE`
- `TRACKING_NO_ALREADY_USED`
- `LOCKED_INVENTORY_INCONSISTENT`
- `ORDER_HAS_ACTIVE_AFTER_SALE`
- `STATE_CONFLICT`

### 9.9 店铺订单详情页

路由：`/merchant/shops/:shopId/orders/:orderId`

接口：

- `GET /api/shops/{shopId}/orders/{orderId}`
- `POST /api/shops/{shopId}/orders/{orderId}/ship`

页面模块：

- 订单摘要：订单号、交易号、状态、金额
- 买家信息
- 地址快照
- 商品明细
- 买家备注
- 物流信息
- 状态历史
- 发货弹窗

发货表单：

- `carrierCode`
- `carrierName`
- `trackingNo`

规则：

- 三个字段必须同时提交。
- 字段去除首尾空白。
- 一张子订单一次性发货，不拆包裹。
- 发货成功后后端扣减锁定库存，订单进入 `PENDING_RECEIPT`。
- 页面不要乐观更新状态，必须用响应刷新。

### 9.10 售后工作台

路由：`/merchant/shops/:shopId/after-sales`

接口：`GET /api/shops/{shopId}/after-sales`

查询参数：

- `status`
- `refundStatus`
- `requestType`
- `keyword`
- `createdFrom`
- `createdTo`
- `page`
- `pageSize`

展示字段：

- 售后号
- 订单号
- 商品摘要
- 类型
- 售后状态
- 退款状态
- 申请数量
- 申请金额
- 更新时间
- 操作

状态优先级：

1. `PENDING`：待商家审核
2. `WAITING_RETURN`：等待买家退货或等待商家确认收货
3. `REFUNDING/FAILED`：需要退款重试
4. `COMPLETED`：完成
5. `REJECTED`、`CANCELLED`：归档

### 9.11 售后详情页

路由：`/merchant/shops/:shopId/after-sales/:afterSaleId`

接口：

- `GET /api/shops/{shopId}/after-sales/{afterSaleId}`
- `POST /api/shops/{shopId}/after-sales/{afterSaleId}/approve`
- `POST /api/shops/{shopId}/after-sales/{afterSaleId}/reject`
- `POST /api/shops/{shopId}/after-sales/{afterSaleId}/confirm-return-received`
- `POST /api/shops/{shopId}/after-sales/{afterSaleId}/refund/retry`

页面模块：

- 售后摘要
- 订单快照
- 商品明细
- 申请信息
- 审核信息
- 退货物流
- 退款信息
- 状态时间线
- 操作区

动作规则：

| 动作 | 条件 | 关键字段 | 幂等 |
| --- | --- | --- | --- |
| 批准 | `PENDING` | `approvedQuantity`、`approvedAmount`、`reviewComment`、`version` | 必须 |
| 拒绝 | `PENDING` | `reviewComment`、`version` | 建议 |
| 确认退货收货 | `WAITING_RETURN` 且已有物流 | `remark`、`version` | 必须 |
| 退款重试 | `REFUNDING/FAILED` | `remark`、`version` | 必须 |

### 9.12 成员管理页

路由：`/merchant/shops/:shopId/members`

接口：

- `GET /api/shops/{shopId}/members`
- `POST /api/shops/{shopId}/members`
- `PUT /api/shops/{shopId}/members/{userId}/role`
- `POST /api/shops/{shopId}/members/{userId}/status`

查询参数：

- `keyword`
- `roleId`
- `status`
- `page`
- `pageSize`

展示字段：

- 用户名
- 昵称
- 用户状态
- 店铺角色
- 成员状态
- 加入时间
- 更新时间

规则：

- 添加成员必须输入精确用户名。
- 角色必须是 `SHOP` 作用域角色。
- 不能停用或降级最后一个有效 `SHOP_ADMIN`。
- 不能停用自己导致店铺没有其他管理员。
- 成员变更后需要刷新 `auth/me` 或当前店铺权限。

## 10. 状态与枚举常量

建议统一维护：

```text
src/constants/
├── productStatus.ts
├── skuStatus.ts
├── shopStatus.ts
├── orderStatus.ts
├── paymentStatus.ts
├── inventoryTransactionType.ts
├── afterSaleStatus.ts
├── refundStatus.ts
├── permissions.ts
└── errorCodes.ts
```

### 10.1 商品状态

| Code | 文案 | 颜色语义 |
| --- | --- | --- |
| `DRAFT` | 草稿 | info |
| `PENDING_REVIEW` | 待审核 | warning |
| `REJECTED` | 审核拒绝 | danger |
| `OFF_SHELF` | 已下架 | info |
| `ON_SHELF` | 已上架 | success |
| `BANNED` | 已禁售 | danger |

### 10.2 订单状态

| Code | 文案 | 颜色语义 |
| --- | --- | --- |
| `PENDING_PAYMENT` | 待支付 | warning |
| `PENDING_SHIPMENT` | 待发货 | warning |
| `PENDING_RECEIPT` | 待收货 | info |
| `COMPLETED` | 已完成 | success |
| `CANCELLED` | 已取消 | danger |

### 10.3 售后状态

| Code | 文案 | 颜色语义 |
| --- | --- | --- |
| `PENDING` | 待审核 | warning |
| `WAITING_RETURN` | 待退货 | warning |
| `REFUNDING` | 退款中 | info |
| `COMPLETED` | 已完成 | success |
| `REJECTED` | 已拒绝 | danger |
| `CANCELLED` | 已撤销 | info |

## 11. 通用组件设计

| 组件 | 作用 |
| --- | --- |
| `MerchantLayout` | 商家端整体布局 |
| `MerchantSidebar` | 菜单、当前店铺、权限过滤 |
| `MerchantTopbar` | 面包屑、用户、退出 |
| `PageHeader` | 页面标题、描述、操作区 |
| `SearchPanel` | 筛选表单容器 |
| `StatusTag` | 状态 code 到标签的统一映射 |
| `MoneyText` | 金额展示 |
| `DataTableActions` | 表格行操作按钮布局 |
| `ConfirmActionButton` | 状态动作确认按钮 |
| `IdempotentSubmitButton` | 幂等提交按钮封装 |
| `TimelinePanel` | 商品、订单、售后历史 |
| `EmptyState` | 空状态 |
| `ErrorState` | 错误重试 |
| `VersionConflictAlert` | 版本冲突提示 |
| `ShopStateBanner` | 店铺暂停、关闭状态提示 |

## 12. 数据流设计

### 12.1 商品列表数据流

```text
进入 /merchant/shops/:shopId/products
  -> 路由守卫检查登录
  -> authStore 确保已加载 auth/me
  -> merchantStore 根据 shopId 找当前店铺
  -> 检查 shop:product:manage
  -> 从 route query 解析筛选条件
  -> 调用 getShopProducts(shopId, query)
  -> 渲染表格
  -> 用户点击提交审核
  -> 弹出确认
  -> 调用 submitProductReview
  -> 成功后刷新列表或替换行
  -> 409 冲突则刷新当前数据
```

### 12.2 发货数据流

```text
订单详情
  -> 点击发货
  -> 打开发货弹窗
  -> 填承运商代码、名称、运单号
  -> 提交 shipOrder
  -> 后端校验订单状态、活跃售后、锁定库存
  -> 成功返回 OrderDetailView
  -> 前端用响应替换详情
  -> 失败根据 code 展示原因
```

### 12.3 售后批准数据流

```text
售后详情
  -> 点击批准
  -> 填批准数量、金额、审核备注
  -> 使用当前 version + Idempotency-Key
  -> POST approve
  -> 响应可能直接 COMPLETED，也可能 REFUNDING/FAILED
  -> 前端用响应刷新页面
```

## 13. 错误与异常处理

| 场景 | 前端处理 |
| --- | --- |
| 401 | 清理 token，跳转 `/login?redirect=当前地址` |
| 403 | 跳转 `/403` 或展示无权限 |
| `SHOP_ACCESS_DENIED` | 展示店铺无权限，返回店铺切换页 |
| `RESOURCE_NOT_FOUND` | 展示资源不存在或无权访问 |
| `VALIDATION_FAILED` | 表单字段就地展示 |
| `STATE_CONFLICT` | 提示状态已变化，刷新数据 |
| `VERSION_CONFLICT` | 提示版本冲突，刷新并要求重新提交 |
| `IDEMPOTENCY_KEY_REUSED` | 提示重复请求异常，重新生成操作 |
| 500 | 显示重试按钮 |

## 14. Mock 与测试计划

Mock 场景必须覆盖：

- `success`
- `empty`
- `unauthorized`
- `forbidden`
- `not-found`
- `validation-error`
- `state-conflict`
- `version-conflict`
- `business-failure`
- `server-error`
- `slow`

商家端 E2E 验收流程：

```text
登录 shop_a_admin
  -> 进入 A 店
  -> 新建商品
  -> 添加 SKU
  -> 入库
  -> 提交审核
  -> 平台审核通过
  -> 商家上架
  -> 买家下单支付
  -> 商家查看待发货订单
  -> 发货
  -> 买家发起售后
  -> 商家审核售后
  -> 商家确认退货收货 / 退款重试
```

越权测试：

```text
shop_b_admin 访问 /merchant/shops/A店/products
  -> 前端拦截或后端返回 SHOP_ACCESS_DENIED / RESOURCE_NOT_FOUND
```

## 15. 前端目录结构建议

如果商家端和平台端放在同一个管理后台应用：

```text
src/
├── api/
│   ├── http.ts
│   └── merchant/
├── assets/
├── components/
│   ├── common/
│   └── merchant/
├── constants/
├── layouts/
│   └── MerchantLayout.vue
├── router/
│   ├── index.ts
│   └── modules/
│       └── merchant.ts
├── stores/
│   ├── auth.ts
│   └── merchant.ts
├── types/
│   ├── api.ts
│   └── merchant.ts
├── utils/
│   ├── money.ts
│   ├── time.ts
│   ├── idempotency.ts
│   └── permission.ts
└── views/
    └── merchant/
        ├── ShopSelectView.vue
        ├── DashboardView.vue
        ├── product/
        ├── inventory/
        ├── order/
        ├── afterSale/
        └── member/
```

## 16. 开发计划

### 16.1 阶段一：商家端基础框架

目标：跑通登录态、店铺上下文、权限菜单。

内容：

- `MerchantLayout`
- `authStore`
- `merchantStore`
- 商家路由表
- 路由守卫
- 店铺切换页
- 403 / 404 / 错误重试
- API Client 基础封装

验收：

- 登录后能看到本人店铺。
- 无店铺权限不能进入商家页面。
- 切换店铺后菜单和数据上下文变化。
- 直接访问不存在或无权店铺能正确处理。

### 16.2 阶段二：商品和库存

目标：打通商品发布前半段。

内容：

- 商品列表
- 商品详情
- 商品新建/编辑
- SKU 普通更新
- 提交审核/上架/下架
- 库存列表
- 入库弹窗
- 库存调整弹窗
- 库存流水

验收：

- 商家能创建商品并产生草稿。
- 商品可提交审核、审核后上架。
- SKU 可入库。
- 低库存、无库存状态正确展示。
- 版本冲突能提示刷新。

### 16.3 阶段三：订单履约

目标：打通商家发货。

内容：

- 店铺订单列表
- 订单详情
- 发货弹窗
- 状态历史
- 活跃售后保护提示

验收：

- 只看到本店订单。
- 待发货订单可填写物流。
- 发货后订单变为待收货。
- 有活跃售后的订单不能发货并给出明确提示。

### 16.4 阶段四：售后和成员管理

目标：补齐当前完整版本商家治理能力。

内容：

- 售后列表
- 售后详情
- 批准/拒绝
- 确认退货收货
- 退款重试
- 成员列表
- 添加成员
- 修改角色
- 启停成员

验收：

- 商家能处理本店售后。
- 售后动作带版本和幂等 key。
- 最后管理员保护能正确提示。
- 成员权限变更后菜单和按钮同步。

## 17. 落地顺序建议

1. 建立商家端路由和 `MerchantLayout`。
2. 实现 `authStore`、`merchantStore` 和权限守卫。
3. 实现店铺切换页和工作台。
4. 建立 `api/merchant/*` 和 `types/merchant/*`。
5. 开发商品管理和库存管理。
6. 开发订单履约。
7. 开发售后处理和成员管理。
8. 补充 Mock、单元测试和 E2E 验收。
