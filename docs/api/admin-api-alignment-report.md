# 管理员端 API 与 docs/api 对齐记录

## 核对范围

本次核对以 `docs/api/common-contract.md`、`docs/api/phase-1-api.md`、`docs/api/phase-2-api.md`、`docs/api/dto-catalog.md` 为准，对管理员端 `web/src/api/admin`、`web/src/types/admin.ts`、`web/src/mock/adminData.ts`、管理员路由和相关页面进行了逐项检查。

## 已修正内容

### 1. 权限码从旧 admin:* 对齐为 platform:*

- 原问题：管理员端仍使用旧的 `admin:*` 权限码，和文档中的平台权限种子不一致。
- 修改原因：后端 RBAC 文档明确使用 `platform:rbac:manage`、`platform:catalog:manage`、`platform:product:audit`、`platform:product:ban`、`platform:operation:read`、`platform:task:execute`。
- 修改内容：
  - `web/src/types/admin.ts` 更新 `PermissionCode`。
  - `web/src/mock/adminData.ts` 更新权限字典、权限树和角色权限。
  - `web/src/views/LoginView.vue` 更新三个管理员账号 Mock 权限。
  - `web/src/layouts/AdminLayout.vue` 更新菜单鉴权。
  - `web/src/router/index.ts` 更新管理员路由 `meta.permissions`。
  - `web/src/views/admin/RoleManageView.vue` 权限树只收集 `platform:` 开头的权限。

### 2. 分页结构对齐统一 Page<T>

- 原问题：管理员端分页返回缺少 `totalPages`，默认 `pageSize` 为 10。
- 修改原因：统一 API 契约要求分页响应包含 `items`、`page`、`pageSize`、`total`、`totalPages`，默认分页大小为 20。
- 修改内容：
  - `web/src/types/admin.ts` 的 `PageResult<T>` 增加 `totalPages`。
  - `web/src/mock/adminData.ts` 的分页函数补齐 `totalPages`，默认 `pageSize` 改为 20。
  - `web/src/stores/adminFilters.ts` 默认筛选分页改为 `{ page: 1, pageSize: 20 }`。

### 3. 账号状态枚举对齐文档

- 原问题：管理员账号状态使用 `ACTIVE | FROZEN`，文档使用 `ACTIVE | DISABLED | LOCKED`。
- 修改原因：RBAC 用户状态接口 `ChangeUserStatusRequest.targetStatus` 明确使用 `DISABLED`、`LOCKED`，不包含 `FROZEN`。
- 修改内容：
  - `web/src/types/admin.ts` 的 `AccountStatus` 改为 `ACTIVE | DISABLED | LOCKED`。
  - `web/src/api/admin/rbac.ts`、`web/src/mock/adminData.ts` 的状态修改参数改为 `AccountStatus`。
  - `web/src/views/admin/AccountManageView.vue` 状态筛选改为正常、停用、锁定；状态切换从 `ACTIVE` 切到 `DISABLED`。

### 4. 角色删除接口移除

- 原问题：管理员端提供 `deleteRole` API 和角色删除按钮。
- 修改原因：`phase-2-api.md` 明确“当前范围的所有角色都不提供删除接口”。
- 修改内容：
  - `web/src/api/admin/rbac.ts` 删除 `deleteRole` 导出。
  - `web/src/mock/adminData.ts` 删除 `mockAdmin.deleteRole`。
  - `web/src/views/admin/RoleManageView.vue` 删除删除按钮和删除逻辑，仅保留编辑保存。

### 5. 商品审核和治理动作拆分

- 原问题：商品页面使用通用 `setProductStatus` 直接改状态，不能清晰对应文档中的审核与治理接口。
- 修改原因：文档将商品审核和治理拆为不同动作：审核通过、审核驳回、禁售、解禁、强制下架。
- 修改内容：
  - `web/src/types/admin.ts` 的 `ProductStatus` 增加 `PENDING_REVIEW` 和 `BANNED`。
  - `web/src/api/admin/products.ts` 改为导出 `listProductReviews`、`approveProductReview`、`rejectProductReview`、`takeOffShelfProduct`、`banProduct`、`revokeProductBan`。
  - `web/src/mock/adminData.ts` Mock 商品状态改为待审核、上架中、已禁售等更贴近文档的状态。
  - `web/src/views/admin/ProductManageView.vue` 页面操作改为通过、驳回、下架、禁售，避免页面直接调用通用状态修改接口。
  - `web/src/utils/labels.ts` 补齐商品状态中文展示。

### 6. 平台售后页面改为只读查询

- 原问题：管理员端售后页面提供同意/驳回审核动作。
- 修改原因：`phase-2-api.md` 中平台售后接口属于 `platform:operation:read` 的只读运营查询，审核动作在商家售后接口下。
- 修改内容：
  - `web/src/api/admin/afterSales.ts` 删除 `auditAfterSale` 导出。
  - `web/src/mock/adminData.ts` 删除 `mockAdmin.auditAfterSale`。
  - `web/src/views/admin/AfterSaleReviewView.vue` 改为平台售后只读查询页，不再展示审核弹窗和同意/驳回按钮。

### 7. 清理无对应路由的菜单

- 原问题：侧边栏曾出现 `/admin/product-governance`、`/admin/tasks` 菜单，但路由中没有对应页面。
- 修改原因：菜单指向不存在路由会造成 404；在对应页面未实现前不应暴露入口。
- 修改内容：
  - `web/src/layouts/AdminLayout.vue` 暂时移除商品治理、内部任务两个无路由菜单，只保留当前已有路由页面。

## 当前仍保留的差异

### 1. 当前管理员端仍以 Mock API 为主

- 现状：`web/src/api/admin/*.ts` 当前仍调用 `mockAdmin`，没有实际发起 HTTP 请求。
- 原因：当前项目前端仍以本地演示和页面功能为主；若直接改成真实 HTTP，会影响现有页面运行。
- 后续建议：接后端时将 `mockAdmin` 调用替换为 `web/src/utils/request.ts`，并按文档路径请求，例如 `/platform/rbac/users`、`/platform/catalog/brands` 等。

### 2. 部分 DTO 字段仍是前端展示型简化结构

- 现状：例如 `PlatformAccount`、`RoleRecord`、`PlatformProduct`、`PlatformOrder`、`PlatformAfterSale` 仍是页面展示友好的简化字段。
- 文档字段：例如 `PlatformUserView.nickname`、`phoneMasked`、`platformRoles`，`RoleView.roleCode`、`roleName`、`scopeType`，`OperationOrderView` 等。
- 保留原因：一次性全面替换 DTO 会牵动所有表格列、表单字段和 Mock 数据，容易扩大改动范围。
- 后续建议：真实联调阶段可在 API 层增加 DTO adapter，先将后端 DTO 映射成当前页面结构，再逐步统一页面字段。

### 3. Dashboard 和库存概览没有完整后端文档对应

- 现状：`getAdminDashboard`、`listInventories` 仍是前端 Mock 展示接口。
- 原因：当前 docs/api 中平台运营更偏订单、支付、售后和业务链路查询，未完整定义后台首页聚合指标接口。
- 后续建议：若需要真实化，应新增或确认 dashboard 聚合接口文档后再接入。

## 验证记录

- 已用代码搜索确认 `web/src` 中不再残留旧权限码 `admin:*` 和旧状态 `FROZEN`。
- 已清理与文档冲突的角色删除 API 和售后审核 API。
- 类型检查结果见本次任务最终回复。
