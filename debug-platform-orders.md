# 平台订单显示调试

状态：[OPEN]

## 症状
管理员端订单页面未显示用户确认已存在的四条订单：ORDER_DEMO_002A、ORDER_DEMO_003B、ORDER_DEMO_001B、ORDER_DEMO_001A。

## 假设
1. 后端接口返回的 total 或 items 不包含这些订单。
2. 前端请求携带了错误的分页、状态或订单号参数。
3. 前端响应解析层丢失了 items 或 total。
4. 订单主交易/子订单查询口径或权限范围与预期不同。

## 运行证据
1. 管理员仪表盘真实请求 `loadLowStockCount` 使用 `/platform/shops?pageSize=200`，后端分页上限为 100，实际返回“分页参数超出范围”。已将请求改为 `pageSize=100`。
2. 仪表盘近期订单前端曾按平铺字段读取 `shopName`、`buyerName`、`amount`，与后端嵌套 DTO 不一致。已改为读取 `shop.shopName`、`buyer.nickname/username`、`payableAmount`，并映射商品摘要。
3. 管理员订单筛选补充 `CANCELLED` 状态。
4. 管理员仪表盘遍历平台店铺后，调用商家库存接口 `/shops/{shopId}/inventory`；当前后端运行环境对这些店铺返回 HTTP 404，说明不能把商家库存接口当作平台库存接口使用。
5. 已将低库存统计改为 `Promise.allSettled`，单个店铺库存接口 404 时按 0 条处理，不再阻塞整个管理员仪表盘。
6. 尚未取得订单列表接口的实际 Network 响应，因此四条订单是否由接口返回仍需用户刷新后确认。
