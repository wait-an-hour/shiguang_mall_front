# 管理员端测试说明

## 范围

- 单元测试覆盖 `labels.ts` 的状态、金额文案，`adminAuth.ts` 的登录态和权限分支，`adminFilters.ts` 的空筛选、分页默认值和持久化。
- API 契约测试 mock `@/utils/request`，覆盖真实的订单、商品、首页统计、优惠券模板、售后申诉接口路径、查询参数、数据映射、金额默认值、SKU 最低价、状态动作和 `Idempotency-Key`。
- 组件测试覆盖 `AdminLayout`，以超级管理员、平台店铺管理员、平台商品审核员三种角色验证权限菜单和首页隐藏分支。
- 错误契约测试模拟 `401/AUTH_TOKEN_EXPIRED`、`403` 和 `VALIDATION_FAILED` 的请求层异常透传；非法商品状态在客户端请求前被拒绝。

## 命令

```powershell
cd "f:\前端项目\shiguang_mall_front\web"
npm.cmd install
npm.cmd test
npm.cmd run build
k6 run -e BASE_URL=https://your-api-host -e TOKEN=valid-admin-token -e VUS=10 -e DURATION=30s performance/admin-api.js
```

## 角色矩阵

| 角色 | 已验证内容 |
| --- | --- |
| 超级管理员 | 全量授权菜单，包含首页、角色、商品、订单和优惠券 |
| 平台店铺管理员 | 仅显示店铺管理，隐藏独立首页和无权菜单 |
| 平台商品审核员 | 仅显示商品管理，隐藏独立首页和无权菜单 |

## 状态与风险

- 订单测试验证 `refundAmount` 默认 `0.00`、订单条目数量汇总和分页查询转换。
- 商品测试验证列表分页、空店铺/分类参数清洗、详情最低 SKU 价和未支持状态不发写请求。
- 优惠券测试验证模板查询分页和 `DRAFT -> ACTIVE` 调用的幂等头；售后测试验证空编号清洗与裁决幂等键。
- 商家钱包管理员端当前只有 `GET /api/platform/operations/*` 只读查询，未设计平台写接口，因此未添加虚构的余额、提现或退款写测试。钱包状态流转由后端接口文档定义，应在后端集成环境覆盖。
- 本仓库为前端工程，接口测试不连接真实服务，不会伪造后端鉴权或状态流转通过结果；真实 token、越权和服务端状态流转应在已部署 API 环境运行端到端测试。

## k6 基线

脚本读取 `BASE_URL`、`TOKEN`、`VUS`、`DURATION`，默认 `10` 并发虚拟用户、持续 `30s`。每个迭代压测首页四项统计请求，以及商品、订单、优惠券模板真实列表接口。阈值为失败率 `<1%`、P95 `<500ms`；缺少有效 token 时预期会出现鉴权失败，不能将该次结果作为性能结论。

## 本次执行结果

- `npm.cmd install`：失败。运行环境无法解析 `registry.npmmirror.com`，错误为 `EAI_FAIL`，因此 `vitest`、`@vue/test-utils` 和 `happy-dom` 未安装。
- `npm.cmd test`：未执行成功，原因是上一步依赖安装失败，系统找不到 `vitest` 命令。
- `npm.cmd run build`：通过。`vue-tsc -b && vite build` 成功完成；构建仍报告现有主包超过 500 kB 的体积警告。
- `node --check performance/admin-api.js`：通过。
- `k6 version`：无法执行，本机未安装 `k6`。

本报告只说明配置、覆盖范围和真实执行状态；未运行的 Vitest 或 k6 不声明为通过。
