# 后端功能与商家/管理员接口梳理

## 1. 后端定位

时光商城后端是一个多商户、类京东的教学商城后端，采用模块化单体架构。

当前完整范围不是单独的一期或二期，而是以下两部分的并集：

- 基础交易功能分册：认证、地址、公开商品、购物车、交易、支付、买家订单、商家商品、库存、订单履约、平台店铺、目录、商品审核。
- 治理与售后功能分册：平台 RBAC、店铺成员、商品治理、库存审计、买家售后、商家售后、平台运营查询、内部任务。

技术栈：

- Spring Boot 4
- Java 21
- MyBatis-Plus
- MySQL
- Redis
- Sa-Token

权威文档入口：

- `server/shiguang_mall_server/docs/README.md`
- `server/shiguang_mall_server/docs/api/common-contract.md`
- `server/shiguang_mall_server/docs/api/phase-1-api.md`
- `server/shiguang_mall_server/docs/api/phase-2-api.md`
- `server/shiguang_mall_server/docs/api/dto-catalog.md`
- `server/shiguang_mall_server/docs/database/phase-1-design.md`

## 2. 当前代码实现状态

当前后端更像“契约与数据模型已冻结，业务 Controller 仍待补齐”的状态。

已具备：

- 26 张业务表对应的 Java 实体。
- 各领域 Mapper。
- 统一响应、分页、错误响应。
- 全局异常处理。
- Sa-Token 基础配置。
- 当前用户校验服务。
- 店铺访问权限校验服务。
- Redis 幂等服务。
- 密码服务、请求 ID、格式化和编号工具。
- 核心业务枚举。

暂未发现：

- 业务 Controller。
- 完整业务 Application Service。
- 各接口 Request/View DTO 的正式 Java 实现。

因此，前端目前应继续以 `docs/api` 下的接口契约为准进行 Mock 和页面开发，不应按当前实体类反推最终 HTTP 接口。

## 3. 统一 API 契约

### 3.1 基础规则

| 项目 | 规则 |
| --- | --- |
| API 根路径 | `/api` |
| JSON 字段 | `camelCase` |
| ID | JSON 中全部为字符串 |
| 金额 | 两位小数字符串，例如 `"99.00"` |
| 时间 | ISO 8601，带 `+08:00` 偏移 |
| 鉴权 Header | `satoken` |
| 响应包装 | `ApiResponse<T>` |
| 分页包装 | `PageView<T>` |
| 幂等 Header | `Idempotency-Key` |

### 3.2 统一成功响应

```json
{
  "code": "OK",
  "message": "success",
  "data": {},
  "requestId": "01J3R84M3YJHT8K8MEH3B7NQ5E",
  "timestamp": "2026-07-26T18:30:15.123+08:00"
}
```

### 3.3 分页响应

```json
{
  "code": "OK",
  "message": "success",
  "data": {
    "items": [],
    "page": 1,
    "pageSize": 20,
    "total": 0,
    "totalPages": 0
  },
  "requestId": "01J3R84M3YJHT8K8MEH3B7NQ5E",
  "timestamp": "2026-07-26T18:30:15.123+08:00"
}
```

### 3.4 权限级别

| 级别 | 说明 |
| --- | --- |
| `PUBLIC` | 不要求登录 |
| `LOGIN` | 只要求有效登录 |
| `PERMISSION` | 要求平台权限 |
| `SHOP_PERMISSION` | 要求店铺成员身份和店铺权限 |
| `OWNER` | 资源必须属于当前用户 |

### 3.5 店铺范围规则

所有 `/api/shops/{shopId}/...` 接口必须同时校验：

1. 当前用户有效。
2. 店铺存在。
3. 当前用户是该店铺有效成员。
4. 店铺角色和权限有效。
5. SQL 查询或更新条件必须带同一个 `shop_id`。

`SUPER_ADMIN` 不自动拥有店铺数据范围。

### 3.6 必须使用幂等键的操作

以下操作必须提交 `Idempotency-Key`：

- 创建交易。
- 创建或确认支付。
- 钱包充值。
- 库存入库。
- 库存调整。
- 创建售后申请。
- 提交退货物流。
- 售后批准。
- 确认退货收货并退款。
- 执行或重试退款。

## 4. 后端模块划分

| 模块 | 主要职责 |
| --- | --- |
| 身份认证 | 注册、登录、退出、当前用户、个人资料、账号状态 |
| 平台 RBAC | 用户、角色、权限、平台角色分配、踢下线 |
| 地址 | 买家收货地址增删改查、默认地址 |
| 店铺 | 平台创建店铺、状态治理、公开店铺信息 |
| 店铺成员 | 店铺成员添加、角色变更、启停 |
| 目录品牌 | 类目树、类目属性模板、品牌维护 |
| 商品 | SPU、SKU、属性、审核、上下架、禁售、状态历史 |
| 库存 | 可用库存、锁定库存、入库、调整、流水、预占、释放、扣减、退货回库 |
| 购物车 | 加购、数量修改、选择、删除、按店铺展示、失效提示 |
| 交易订单 | 结算预览、跨店父交易、店铺子订单、取消、发货、确认收货 |
| 支付钱包 | 钱包、模拟充值、支付尝试、确认支付、退款入账、钱包流水 |
| 售后退款 | 申请、撤销、审核、退货物流、确认收货、退款、失败重试 |
| 自动任务 | 超时取消、自动收货、退款重试、库存对账、钱包对账 |
| 平台运营 | 交易、订单、支付、售后和业务链路只读查询 |

## 5. 商家端功能

### 5.1 商家角色

| 角色 | 核心任务 |
| --- | --- |
| `SHOP_ADMIN` | 管理本店全部业务 |
| `SHOP_PRODUCT_OPERATOR` | 商品维护、SPU/SKU、提交审核、上下架 |
| `SHOP_ORDER_OPERATOR` | 订单履约、售后审核、退款重试 |
| `SHOP_INVENTORY_OPERATOR` | 库存入库、调整、流水、发货相关库存动作 |

### 5.2 商家页面能力

| 页面/模块 | 必须展示 | 主要操作 |
| --- | --- | --- |
| 店铺上下文 | 本人店铺、当前角色、当前权限 | 切换店铺 |
| 店铺商品列表 | SPU 编号、名称、状态、版本、SKU/库存摘要 | 新建、编辑、提交审核、上架、下架 |
| 商品编辑 | 类目、品牌、基础内容、属性模板、SKU 表格 | 保存草稿、新增 SKU |
| 库存管理 | SKU、可用库存、锁定库存、更新时间、流水摘要 | 入库、调整、查看流水 |
| 店铺订单 | 订单号、买家、状态、支付、金额、创建时间 | 筛选、查看、发货 |
| 订单详情 | 地址快照、商品明细、金额、状态历史、物流 | 填写承运商和运单号发货 |
| 成员管理 | 用户、角色、状态、加入时间 | 添加、改角色、启停 |
| 售后工作台 | 售后号、订单、商品、类型、状态、金额、申请时间 | 筛选、审核 |
| 售后详情 | 订单快照、申请额度、凭证、物流、退款 | 批准、拒绝、确认收货、退款重试 |
| 库存流水 | SKU、类型、变化、结果、业务号、操作者、时间 | 筛选、跳转来源 |

## 6. 商家端接口清单

### 6.1 商家商品

| 功能 | 方法 | 路径 | 权限/说明 |
| --- | --- | --- | --- |
| 商品列表 | GET | `/api/shops/{shopId}/products` | `shop:product:manage` |
| 创建商品 | POST | `/api/shops/{shopId}/products` | `CreateProductRequest` |
| 商品详情 | GET | `/api/shops/{shopId}/products/{spuId}` | 本店商品 |
| 更新商品内容 | PUT | `/api/shops/{shopId}/products/{spuId}/content` | `UpdateProductContentRequest` |
| 新增 SKU | POST | `/api/shops/{shopId}/products/{spuId}/skus` | `CreateSkuRequest` |
| 修改 SKU | PATCH | `/api/shops/{shopId}/products/{spuId}/skus/{skuId}` | `UpdateSkuRequest` |
| 提交审核 | POST | `/api/shops/{shopId}/products/{spuId}/submit-review` | `DRAFT` 可提交 |
| 上架 | POST | `/api/shops/{shopId}/products/{spuId}/put-on-shelf` | `OFF_SHELF` 可上架 |
| 下架 | POST | `/api/shops/{shopId}/products/{spuId}/take-off-shelf` | 可选原因 |

### 6.2 商家库存

| 功能 | 方法 | 路径 | 权限/说明 |
| --- | --- | --- | --- |
| 库存列表 | GET | `/api/shops/{shopId}/inventory` | `shop:inventory:manage` |
| 库存详情 | GET | `/api/shops/{shopId}/inventory/{skuId}` | SKU 维度 |
| 普通入库 | POST | `/api/shops/{shopId}/inventory/{skuId}/inbounds` | 必填幂等键 |
| 库存流水 | GET | `/api/shops/{shopId}/inventory/transactions` | 可按 SKU、类型、业务号筛选 |
| 库存调整 | POST | `/api/shops/{shopId}/inventory/{skuId}/adjustments` | 必填幂等键和版本 |

### 6.3 商家订单履约

| 功能 | 方法 | 路径 | 权限/说明 |
| --- | --- | --- | --- |
| 订单列表 | GET | `/api/shops/{shopId}/orders` | `shop:order:read` |
| 订单详情 | GET | `/api/shops/{shopId}/orders/{orderId}` | 只查本店订单 |
| 商家发货 | POST | `/api/shops/{shopId}/orders/{orderId}/ship` | `shop:order:ship` |

### 6.4 店铺成员

| 功能 | 方法 | 路径 | 权限/说明 |
| --- | --- | --- | --- |
| 成员列表 | GET | `/api/shops/{shopId}/members` | 店铺成员管理 |
| 添加成员 | POST | `/api/shops/{shopId}/members` | `AddShopMemberRequest` |
| 修改成员角色 | PUT | `/api/shops/{shopId}/members/{userId}/role` | `ChangeShopMemberRoleRequest` |
| 启停成员 | POST | `/api/shops/{shopId}/members/{userId}/status` | `ACTIVE` / `DISABLED` |

### 6.5 商家售后

| 功能 | 方法 | 路径 | 权限/说明 |
| --- | --- | --- | --- |
| 售后列表 | GET | `/api/shops/{shopId}/after-sales` | 商家售后工作台 |
| 售后详情 | GET | `/api/shops/{shopId}/after-sales/{afterSaleId}` | 含买家与资格快照 |
| 批准售后 | POST | `/api/shops/{shopId}/after-sales/{afterSaleId}/approve` | 必填幂等键 |
| 拒绝售后 | POST | `/api/shops/{shopId}/after-sales/{afterSaleId}/reject` | 拒绝原因必填 |
| 确认退货收货 | POST | `/api/shops/{shopId}/after-sales/{afterSaleId}/confirm-return-received` | 必填幂等键 |
| 退款重试 | POST | `/api/shops/{shopId}/after-sales/{afterSaleId}/refund/retry` | 必填幂等键 |

## 7. 管理员端功能

### 7.1 平台角色

| 角色 | 核心任务 |
| --- | --- |
| `SUPER_ADMIN` | 平台 RBAC、用户、角色、权限 |
| `PLATFORM_SHOP_ADMIN` | 店铺创建、店铺状态治理 |
| `PLATFORM_PRODUCT_AUDITOR` | 商品审核、目录品牌基础资料 |

### 7.2 管理员页面能力

| 页面/模块 | 必须展示 | 主要操作 |
| --- | --- | --- |
| 店铺管理 | 店铺编号、名称、联系人、状态、创建时间 | 创建、编辑、启用、暂停、关闭 |
| 类目管理 | 树结构、状态、排序、属性数量 | 新增子类目、编辑、启停、属性模板 |
| 品牌管理 | 编码、名称、Logo、状态 | 新增、编辑、启停 |
| 商品审核 | 店铺、商品、类目、版本、提交时间 | 查看内容、批准、拒绝 |
| 用户管理 | 用户名、联系方式、状态、平台角色、时间 | 状态变更、角色分配、踢下线 |
| 角色权限 | 作用域、角色、权限矩阵、状态 | 创建角色、编辑、授权 |
| 商品治理 | 商品、店铺、状态、历史、原因 | 强制下架、禁售、解禁 |
| 运营检索 | 交易、订单、支付、售后和流水关联关系 | 只读排障 |
| 内部任务 | 任务类型、执行结果、异常信息 | 手动触发任务 |

## 8. 管理员端接口清单

### 8.1 平台店铺

| 功能 | 方法 | 路径 | 权限/说明 |
| --- | --- | --- | --- |
| 店铺列表 | GET | `/api/platform/shops` | `platform:shop:manage` |
| 创建店铺 | POST | `/api/platform/shops` | 指定首位店铺管理员 |
| 店铺详情 | GET | `/api/platform/shops/{shopId}` | 平台店铺详情 |
| 编辑店铺 | PUT | `/api/platform/shops/{shopId}` | 基础资料 |
| 修改店铺状态 | POST | `/api/platform/shops/{shopId}/status` | 关闭前校验无活跃业务 |

### 8.2 平台目录与品牌

| 功能 | 方法 | 路径 | 权限/说明 |
| --- | --- | --- | --- |
| 平台类目树 | GET | `/api/platform/catalog/categories/tree` | `platform:catalog:manage` |
| 新增类目 | POST | `/api/platform/catalog/categories` | `CategoryUpsertRequest` |
| 编辑类目 | PUT | `/api/platform/catalog/categories/{categoryId}` | 编码创建后不可修改 |
| 启停类目 | POST | `/api/platform/catalog/categories/{categoryId}/status` | `ENABLED` / `DISABLED` |
| 类目属性列表 | GET | `/api/platform/catalog/categories/{categoryId}/attributes` | 叶子属性模板 |
| 新增类目属性 | POST | `/api/platform/catalog/categories/{categoryId}/attributes` | `CategoryAttributeRequest` |
| 编辑类目属性 | PUT | `/api/platform/catalog/categories/{categoryId}/attributes/{attributeId}` | 属性模板 |
| 启停类目属性 | POST | `/api/platform/catalog/categories/{categoryId}/attributes/{attributeId}/status` | 状态切换 |
| 品牌列表 | GET | `/api/platform/catalog/brands` | `platform:catalog:manage` |
| 新增品牌 | POST | `/api/platform/catalog/brands` | 品牌编码唯一 |
| 编辑品牌 | PUT | `/api/platform/catalog/brands/{brandId}` | 品牌编码不可复用 |
| 启停品牌 | POST | `/api/platform/catalog/brands/{brandId}/status` | 状态切换 |

### 8.3 平台商品审核与治理

| 功能 | 方法 | 路径 | 权限/说明 |
| --- | --- | --- | --- |
| 商品审核列表 | GET | `/api/platform/products/reviews` | `platform:product:audit` |
| 商品审核详情 | GET | `/api/platform/products/reviews/{spuId}` | 待审内容 |
| 审核通过 | POST | `/api/platform/products/reviews/{spuId}/approve` | 通过后进入 `OFF_SHELF` |
| 审核拒绝 | POST | `/api/platform/products/reviews/{spuId}/reject` | 拒绝原因 |
| 商品禁售 | POST | `/api/platform/products/bans/{spuId}` | `platform:product:ban` |
| 商品解禁 | POST | `/api/platform/products/bans/{spuId}/revoke` | 恢复治理状态 |
| 强制下架 | POST | `/api/platform/products/bans/{spuId}/take-off-shelf` | 平台治理 |
| 商品历史 | GET | `/api/platform/products/reviews/{spuId}/history` | 审核和治理历史 |

### 8.4 平台 RBAC

| 功能 | 方法 | 路径 | 权限/说明 |
| --- | --- | --- | --- |
| 用户列表 | GET | `/api/platform/rbac/users` | 用户管理 |
| 用户详情 | GET | `/api/platform/rbac/users/{userId}` | 脱敏信息 |
| 用户状态 | POST | `/api/platform/rbac/users/{userId}/status` | 禁用、锁定等 |
| 分配平台角色 | PUT | `/api/platform/rbac/users/{userId}/roles` | `AssignPlatformRolesRequest` |
| 踢下线 | POST | `/api/platform/rbac/users/{userId}/kickout` | Sa-Token 会话治理 |
| 角色列表 | GET | `/api/platform/rbac/roles` | 可按作用域筛选 |
| 创建角色 | POST | `/api/platform/rbac/roles` | `CreateRoleRequest` |
| 角色详情 | GET | `/api/platform/rbac/roles/{roleId}` | 含权限 |
| 编辑角色 | PUT | `/api/platform/rbac/roles/{roleId}` | 名称和描述 |
| 启停角色 | POST | `/api/platform/rbac/roles/{roleId}/status` | `ACTIVE` / `DISABLED` |
| 角色授权 | PUT | `/api/platform/rbac/roles/{roleId}/permissions` | 权限矩阵 |
| 权限列表 | GET | `/api/platform/rbac/permissions` | 平台/店铺权限 |

### 8.5 平台运营只读查询

| 功能 | 方法 | 路径 | 权限/说明 |
| --- | --- | --- | --- |
| 交易查询 | GET | `/api/platform/operations/trades` | `platform:operation:read` |
| 订单查询 | GET | `/api/platform/operations/orders` | 只读排障 |
| 支付查询 | GET | `/api/platform/operations/payments` | 只读排障 |
| 售后查询 | GET | `/api/platform/operations/after-sales` | 只读排障 |
| 业务链路追踪 | GET | `/api/platform/operations/business/{businessType}/{businessNo}` | 交易、支付、库存、钱包关联 |

### 8.6 内部任务

| 功能 | 方法 | 路径 | 权限/说明 |
| --- | --- | --- | --- |
| 取消超时交易 | POST | `/api/internal/tasks/cancel-expired-trades` | `platform:task:execute` |
| 自动完成已发货订单 | POST | `/api/internal/tasks/complete-shipped-orders` | 内部任务 |
| 退款重试任务 | POST | `/api/internal/tasks/retry-refunds` | 内部任务 |
| 库存对账 | POST | `/api/internal/tasks/reconcile-inventory` | 内部任务 |
| 钱包对账 | POST | `/api/internal/tasks/reconcile-wallets` | 内部任务 |

## 9. 买家与公共接口概览

虽然本文重点梳理商家端和管理员端，但后端完整范围还包含买家和公共能力。

| 模块 | 接口范围 |
| --- | --- |
| 认证 | `/api/auth/register`、`/api/auth/login`、`/api/auth/logout`、`/api/auth/me` |
| 个人资料 | `/api/users/me` |
| 地址 | `/api/addresses/**` |
| 公开目录 | `/api/categories/tree`、`/api/categories/{categoryId}/attributes`、`/api/brands` |
| 公开商品 | `/api/products`、`/api/products/{spuId}`、`/api/shops/{shopId}` |
| 购物车 | `/api/cart/**` |
| 结算交易 | `/api/trades/preview`、`/api/trades`、`/api/trades/{tradeId}`、`/api/trades/{tradeId}/cancel` |
| 钱包 | `/api/wallet`、`/api/wallet/transactions`、`/api/wallet/recharges` |
| 支付 | `/api/trades/{tradeId}/payments`、`/api/payments/{paymentId}/confirm`、`/api/payments/{paymentId}` |
| 买家订单 | `/api/orders`、`/api/orders/{orderId}`、`/api/orders/{orderId}/complete` |
| 买家售后 | `/api/after-sales/**` |

## 10. 核心状态机

### 10.1 商品状态

```text
DRAFT -> PENDING_REVIEW -> OFF_SHELF -> ON_SHELF
```

补充状态：

- `REJECTED`
- `BANNED`

### 10.2 订单状态

```text
PENDING_PAYMENT -> PENDING_SHIPMENT -> PENDING_RECEIPT -> COMPLETED
```

补充状态：

- `CANCELLED`

### 10.3 支付状态

- `PENDING`
- `SUCCESS`
- `FAILED`
- `CANCELLED`

### 10.4 售后状态

- `PENDING`
- `REJECTED`
- `WAITING_RETURN`
- `REFUNDING`
- `COMPLETED`
- `CANCELLED`

### 10.5 退款状态

- `NOT_STARTED`
- `PROCESSING`
- `SUCCESS`
- `FAILED`

### 10.6 库存流水类型

- `INBOUND`
- `LOCK`
- `RELEASE`
- `DEDUCT`
- `RETURN`
- `ADJUST`

## 11. 数据模型重点

后端数据库共 26 张业务表，覆盖：

- `sys_user`、`sys_role`、`sys_permission`、`sys_user_role`、`sys_role_permission`
- `user_address`
- `shop`、`shop_user`
- `product_category`、`product_category_attribute`、`product_brand`
- `product_spu`、`product_sku`、`product_attribute_value`、`product_status_history`
- `inventory_stock`、`inventory_transaction`
- `cart_item`
- `trade_order`、`order_info`、`order_item`、`order_status_history`
- `wallet_account`、`payment_order`、`wallet_transaction`
- `after_sale_request`

关键关系：

- `shop` 是商家数据隔离边界。
- 一次跨店提交生成一个父交易 `trade_order`。
- 父交易按店铺拆分为多个子订单 `order_info`。
- 商家只能看到和处理自己店铺下的子订单。
- 一份售后申请只针对一条订单明细 `order_item`。
- 库存采用“可用库存 + 锁定库存”。
- 下单锁库存，取消释放库存，发货扣减锁定库存，退货退款回库。
- 订单、支付、库存流水、钱包流水、售后等历史数据不得物理删除。

## 12. 前端对接建议

### 12.1 当前阶段

后端业务 Controller 尚未完成时，前端继续使用 Mock API 开发是合理的。前端应以 `server/shiguang_mall_server/docs/api` 为接口权威来源。

### 12.2 前端请求层需要准备

- 统一 `request` 实例。
- 自动注入 `satoken`。
- 写接口生成并携带 `Idempotency-Key`。
- 统一解析 `ApiResponse<T>`。
- 统一处理 `AUTH_NOT_LOGGED_IN`、`AUTH_TOKEN_EXPIRED`、`AUTH_TOKEN_REPLACED`。
- 统一处理 `VERSION_CONFLICT`、`STATE_CONFLICT`、`IDEMPOTENCY_KEY_REUSED`。

### 12.3 商家端优先联调顺序

1. `/api/auth/me`
2. `/api/shops/{shopId}/products`
3. `/api/shops/{shopId}/inventory`
4. `/api/shops/{shopId}/orders`
5. `/api/shops/{shopId}/after-sales`
6. `/api/shops/{shopId}/members`

### 12.4 管理端优先联调顺序

1. `/api/auth/me`
2. `/api/platform/rbac/**`
3. `/api/platform/shops/**`
4. `/api/platform/catalog/**`
5. `/api/platform/products/reviews/**`
6. `/api/platform/products/bans/**`
7. `/api/platform/operations/**`

## 13. 当前版本明确不做

当前数据库没有对应模型，下列能力不纳入当前完整版本：

- 真实第三方支付。
- 商户结算与平台佣金。
- 优惠券、满减、秒杀、积分。
- 评价、收藏、搜索引擎、推荐。
- 站内信、聊天客服。
- 发票。
- 物流轨迹实时查询。
- 运费模板。
- 商家资质申请。
- 换货、维修、争议仲裁。
- 文件存储服务。
- 财务提现。
- 多仓库存。
