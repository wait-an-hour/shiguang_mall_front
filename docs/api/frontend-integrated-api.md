# 前端已对接真实后端接口清单

更新时间：2026-08-02

后端服务地址：`https://shiguangserver.zeabur.app`

前端请求基地址：`https://shiguangserver.zeabur.app/api`

## 统一请求契约

| 项目 | 当前实现 |
| --- | --- |
| 请求封装 | `web/src/utils/request.ts` |
| 成功响应 | 按 `ApiResponse<T>` 解包，仅当 `code === 'OK'` 返回 `data` |
| Token Header | `satoken` |
| JSON Header | `Accept: application/json`、`Content-Type: application/json` |
| 鉴权失效处理 | `AUTH_NOT_LOGGED_IN`、`AUTH_TOKEN_EXPIRED`、`AUTH_TOKEN_REPLACED`、`AUTH_TOKEN_KICKED_OUT` 或 HTTP 401 会清理登录态并跳转 `/login` |
| 错误结构 | 抛出 `ApiRequestError`，保留 `code`、`requestId`、`details`、`status` |
| 幂等写入 | 交易创建、支付创建/确认、钱包充值、库存入库发送 `Idempotency-Key` |

## 认证与用户

前端文件：`web/src/api/auth.ts`、`web/src/api/admin/auth.ts`、`web/src/stores/auth.ts`、`web/src/views/LoginView.vue`、`web/src/views/RegisterView.vue`

| 前端函数/页面 | 方法 | 后端接口 | 对接状态 | 说明 |
| --- | --- | --- | --- | --- |
| `loginAdmin` | POST | `/api/auth/login` | 已对接 | 管理端登录 |
| `loginAdmin` | GET | `/api/auth/me` | 已对接 | 登录后拉取平台角色和权限 |
| `useAuthStore.login` | POST | `/api/auth/login` | 已对接 | 商家/普通用户登录 |
| `useAuthStore.login` | GET | `/api/auth/me` | 已对接 | 登录后拉取店铺上下文 |
| `useAuthStore.register` | POST | `/api/auth/register` | 已对接 | 公开注册用户账号，不直接创建店铺 |
| `logout` | POST | `/api/auth/logout` | 已对接 | 登出并清理本地登录态 |
| `getCurrentUser` | GET | `/api/auth/me` | 已对接 | 当前用户信息 |
| `updateCurrentUser` | PATCH | `/api/users/me` | 已对接 | 更新昵称、手机号、邮箱、头像 |

### 认证适配说明

| 后端字段 | 前端字段 | 说明 |
| --- | --- | --- |
| `tokenValue` | `token` | 前端保存 token 值，并通过 `satoken` 发送 |
| `user.nickname` / `user.username` | `displayName` | 优先使用昵称 |
| `platformRoles` | `role` / `roles` | 管理端映射为当前路由权限模型，商家端保留角色列表 |
| `platformPermissions` | `permissions` / `platformPermissions` | 管理端映射为页面权限码，商家端保留后端权限码 |
| `shops[].shop.shopName` | `shops[].name` | 商家端店铺选择和路由上下文使用 |
| `shops[].permissions` | `shops[].permissions` | 已兼容当前商家端菜单权限码 |

## 地址

前端文件：`web/src/api/address.ts`

| 前端函数 | 方法 | 后端接口 | 对接状态 |
| --- | --- | --- | --- |
| `getAddressList` | GET | `/api/addresses` | 已对接 |
| `createAddress` | POST | `/api/addresses` | 已对接 |
| `updateAddress` | PUT | `/api/addresses/{addressId}` | 已对接 |
| `deleteAddress` | DELETE | `/api/addresses/{addressId}` | 已对接 |
| `setDefaultAddress` | POST | `/api/addresses/{addressId}/default` | 已对接 |

## 公开商品与目录

前端文件：`web/src/api/product.ts`

| 前端函数 | 方法 | 后端接口 | 对接状态 |
| --- | --- | --- | --- |
| `getCategoryTree` | GET | `/api/categories/tree` | 已对接 |
| `getCategoryAttributes` | GET | `/api/categories/{categoryId}/attributes` | 已对接 |
| `getBrandList` | GET | `/api/brands` | 已对接 |
| `getPublicShop` | GET | `/api/shops/{shopId}` | 已对接 |
| `getProductList` | GET | `/api/products` | 已对接 |
| `getProductDetail` | GET | `/api/products/{spuId}` | 已对接 |

## 购物车与结算预览

前端文件：`web/src/api/cart.ts`

| 前端函数 | 方法 | 后端接口 | 对接状态 |
| --- | --- | --- | --- |
| `getCart` | GET | `/api/cart` | 已对接 |
| `addCartItem` | POST | `/api/cart/items` | 已对接 |
| `updateCartItem` | PATCH | `/api/cart/items/{cartItemId}` | 已对接 |
| `deleteCartItem` | DELETE | `/api/cart/items/{cartItemId}` | 已对接 |
| `updateCartSelection` | PUT | `/api/cart/selection` | 已对接 |
| `previewCheckout` | POST | `/api/trades/preview` | 已对接 |

## 交易、支付与钱包

前端文件：`web/src/api/trade.ts`、`web/src/api/payment.ts`

| 前端函数 | 方法 | 后端接口 | 对接状态 | 说明 |
| --- | --- | --- | --- | --- |
| `createTrade` | POST | `/api/trades` | 已对接 | 发送 `Idempotency-Key` |
| `getTradeDetail` | GET | `/api/trades/{tradeId}` | 已对接 | 交易详情 |
| `cancelTrade` | POST | `/api/trades/{tradeId}/cancel` | 已对接 | 取消交易 |
| `createPayment` | POST | `/api/trades/{tradeId}/payments` | 已对接 | 钱包支付，发送 `Idempotency-Key` |
| `confirmPayment` | POST | `/api/payments/{paymentId}/confirm` | 已对接 | 确认支付，发送 `Idempotency-Key` |
| `getPaymentDetail` | GET | `/api/payments/{paymentId}` | 已对接 | 支付详情 |
| `getWallet` | GET | `/api/wallet` | 已对接 | 钱包余额 |
| `getWalletTransactions` | GET | `/api/wallet/transactions` | 已对接 | 钱包流水 |
| `rechargeWallet` | POST | `/api/wallet/recharges` | 已对接 | 钱包充值，发送 `Idempotency-Key` |

## 买家订单

前端文件：`web/src/api/order.ts`

| 前端函数 | 方法 | 后端接口 | 对接状态 |
| --- | --- | --- | --- |
| `getOrderList` | GET | `/api/orders` | 已对接 |
| `getOrderDetail` | GET | `/api/orders/{orderId}` | 已对接 |
| `completeOrder` | POST | `/api/orders/{orderId}/complete` | 已对接 |

## 商家商品

前端文件：`web/src/api/merchant/products.ts`

| 前端函数 | 方法 | 后端接口 | 对接状态 |
| --- | --- | --- | --- |
| `getMerchantProducts` | GET | `/api/shops/{shopId}/products` | 已对接 |
| `createMerchantProduct` | POST | `/api/shops/{shopId}/products` | 已对接 |
| `getMerchantProductDetail` | GET | `/api/shops/{shopId}/products/{spuId}` | 已对接 |
| `updateMerchantProductContent` | PUT | `/api/shops/{shopId}/products/{spuId}/content` | 已对接 |
| `createMerchantSku` | POST | `/api/shops/{shopId}/products/{spuId}/skus` | 已对接 |
| `updateMerchantSku` | PATCH | `/api/shops/{shopId}/products/{spuId}/skus/{skuId}` | 已对接 |
| `submitMerchantProductReview` | POST | `/api/shops/{shopId}/products/{spuId}/submit-review` | 已对接 |
| `putMerchantProductOnShelf` | POST | `/api/shops/{shopId}/products/{spuId}/put-on-shelf` | 已对接 |
| `takeMerchantProductOffShelf` | POST | `/api/shops/{shopId}/products/{spuId}/take-off-shelf` | 已对接 |

## 商家库存

前端文件：`web/src/api/merchant/inventory.ts`

| 前端函数 | 方法 | 后端接口 | 对接状态 | 说明 |
| --- | --- | --- | --- | --- |
| `getMerchantInventory` | GET | `/api/shops/{shopId}/inventory` | 已对接 | 库存分页列表 |
| `getMerchantInventoryDetail` | GET | `/api/shops/{shopId}/inventory/{skuId}` | 已对接 | SKU 库存详情 |
| `createInventoryInbound` | POST | `/api/shops/{shopId}/inventory/{skuId}/inbounds` | 已对接 | 发送 `Idempotency-Key` |

## 商家订单

前端文件：`web/src/api/merchant/orders.ts`

| 前端函数 | 方法 | 后端接口 | 对接状态 |
| --- | --- | --- | --- |
| `getMerchantOrders` | GET | `/api/shops/{shopId}/orders` | 已对接 |
| `getMerchantOrderDetail` | GET | `/api/shops/{shopId}/orders/{orderId}` | 已对接 |
| `shipMerchantOrder` | POST | `/api/shops/{shopId}/orders/{orderId}/ship` | 已对接 |

## 管理端目录

前端文件：`web/src/api/admin/catalog.ts`

| 前端函数 | 方法 | 后端接口 | 对接状态 |
| --- | --- | --- | --- |
| `listCategories` | GET | `/api/platform/catalog/categories/tree` | 已对接 |
| `saveCategory` | POST | `/api/platform/catalog/categories` | 已对接 |
| `saveCategory` | PUT | `/api/platform/catalog/categories/{categoryId}` | 已对接 |
| `setCategoryStatus` | POST | `/api/platform/catalog/categories/{categoryId}/status` | 已对接 |
| `listCategoryAttributes` | GET | `/api/platform/catalog/categories/{categoryId}/attributes` | 已对接 |
| `createCategoryAttribute` | POST | `/api/platform/catalog/categories/{categoryId}/attributes` | 已对接 |
| `updateCategoryAttribute` | PUT | `/api/platform/catalog/categories/{categoryId}/attributes/{attributeId}` | 已对接 |
| `setCategoryAttributeStatus` | POST | `/api/platform/catalog/categories/{categoryId}/attributes/{attributeId}/status` | 已对接 |
| `listBrands` | GET | `/api/platform/catalog/brands` | 已对接 |
| `saveBrand` | POST | `/api/platform/catalog/brands` | 已对接 |
| `saveBrand` | PUT | `/api/platform/catalog/brands/{brandId}` | 已对接 |
| `setBrandStatus` | POST | `/api/platform/catalog/brands/{brandId}/status` | 已对接 |

## 管理端商品审核

前端文件：`web/src/api/admin/products.ts`

| 前端函数 | 方法 | 后端接口 | 对接状态 | 说明 |
| --- | --- | --- | --- | --- |
| `listProducts` | GET | `/api/platform/products/reviews` | 已对接 | 获取待审核商品分页列表 |
| `setProductStatus` | POST | `/api/platform/products/reviews/{spuId}/approve` | 已对接 | 当前仅在前端状态传 `ON_SHELF` 时调用 |
| `setProductStatus` | POST | `/api/platform/products/reviews/{spuId}/reject` | 已对接 | 当前在前端状态传 `REJECTED` 或 `OFF_SHELF` 时调用 |

## 管理端店铺

前端文件：`web/src/api/admin/shops.ts`

| 前端函数 | 方法 | 后端接口 | 对接状态 |
| --- | --- | --- | --- |
| `getPlatformShops` | GET | `/api/platform/shops` | 已对接 |
| `createPlatformShop` | POST | `/api/platform/shops` | 已对接 |
| `getPlatformShopDetail` | GET | `/api/platform/shops/{shopId}` | 已对接 |
| `updatePlatformShop` | PUT | `/api/platform/shops/{shopId}` | 已对接 |
| `setPlatformShopStatus` | POST | `/api/platform/shops/{shopId}/status` | 已对接 |

## 仍未切换真实接口

以下接口仍保留 Mock 或前端提示未实现，原因是当前后端未提供对应已实现 API 或接口语义不匹配。

| 模块 | 前端文件 | 当前处理 | 原因 |
| --- | --- | --- | --- |
| 管理端 RBAC | `web/src/api/admin/rbac.ts` | 保留 Mock | 后端未实现 `/api/platform/rbac/**` |
| 管理端订单 | `web/src/api/admin/orders.ts` | 保留 Mock | 后端未实现平台订单运营接口 |
| 管理端售后 | `web/src/api/admin/afterSales.ts` | 保留 Mock | 后端未实现平台售后审核接口 |
| 管理端看板 | `web/src/api/admin/dashboard.ts` | 保留 Mock | 后端未实现平台运营看板接口 |
| 管理端平台库存 | `web/src/api/admin/products.ts` 的 `listInventories` | 保留 Mock | 后端未实现平台级库存查询接口 |
| 商家售后 | `web/src/api/merchant/afterSales.ts` | 保留 Mock | 后端未实现商家售后接口 |
| 商家库存调整 | `web/src/api/merchant/inventory.ts` 的 `createInventoryAdjustment` | 抛出“当前后端暂未实现库存调整接口” | 后端未实现库存调整接口 |
| 商家库存流水 | `web/src/api/merchant/inventory.ts` 的 `getInventoryTransactions` | 返回空分页 | 后端未实现库存流水接口 |

## 页面接入状态

| 页面/模块 | 当前状态 |
| --- | --- |
| `/login` | 管理员和商家登录均调用真实后端 |
| `/register` | 调用真实注册接口，仅注册用户账号 |
| 商家商品页 | 调用真实后端 |
| 商家库存页 | 库存列表、详情、入库调用真实后端 |
| 商家订单页 | 调用真实后端 |
| 管理端分类、品牌、商品审核页 | 调用真实后端 |
| 公开商城、购物车、交易、支付、钱包、地址 | 已补 API 层，当前工程暂未提供对应业务页面 |
| 管理端店铺 | 已补 API 层，当前工程暂未提供对应业务页面 |

## 本次验证

已执行：

```powershell
npm.cmd run build
```

结果：构建通过。

环境提示：当前 Node.js 版本为 `20.15.0`，Vite 建议使用 `20.19+` 或 `22.12+`。
