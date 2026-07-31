# Web 前端协作指南

## 唯一工程入口

- `web` 是时光商城唯一前端工程入口。
- 本地运行、构建、预览等命令必须在 `web` 目录执行，或在根目录使用 `npm --prefix web <script>`。
- 根目录 `src` 仅作为历史迁移来源保留，不删除、不继续承接新功能。
- 禁止继续在根目录 `src` 开发新页面、接口、store、layout 或公共组件。

## 目录边界

商家端开发位置：

- `web/src/views/merchant`
- `web/src/api/merchant`
- `web/src/stores/merchant`
- `web/src/layouts/MerchantLayout.vue`

管理端开发位置：

- `web/src/views/admin`
- `web/src/api/admin`
- `web/src/stores/adminAuth.ts`
- `web/src/layouts/AdminLayout.vue`
- `web/src/components/common`

公共入口和公共页面：

- `web/src/views/LoginView.vue`
- `web/src/views/RegisterView.vue`
- `web/src/views/ForbiddenView.vue`
- `web/src/views/NotFoundView.vue`
- `web/src/router/index.ts`
- `web/src/router/meta.ts`

## 路由边界

- `/merchant/shops/:shopId/*` 属于商家端，由 `MerchantLayout.vue` 承载。
- `/admin/*` 属于平台管理端，由 `AdminLayout.vue` 承载。
- `/login` 和 `/register` 是公共入口。
- `/admin/login` 和 `/shop/login` 统一重定向到 `/login`。
- `/403` 和 404 页面复用 `web/src/views` 下的公共错误页。

## 鉴权边界

- 商家端使用 `useAuthStore` 和 `useMerchantStore`。
- 管理端使用 `useAdminAuthStore`。
- 不得把根目录 `src/stores/auth.ts` 覆盖到 `web/src/stores/auth.ts`。
- 不得在管理端代码中继续引用 `@/stores/auth` 或 `useAuthStore`。
- 管理端权限通过路由 `meta.permissions` 和 `useAdminAuthStore().hasPermissions()` 校验。
- 商家端店铺权限继续由 `useMerchantStore().hasEveryShopPermission()` 校验。

## 管理端协作规则

- 管理端页面只在 `web/src/views/admin` 新增或修改。
- 管理端接口只在 `web/src/api/admin` 新增或修改。
- 管理端登录态只使用 `web/src/stores/adminAuth.ts`。
- 管理端布局只修改 `web/src/layouts/AdminLayout.vue`。
- 管理端公共列表组件优先复用 `web/src/components/common`。
- 不得覆盖商家端 `web/src/stores/auth.ts`、`web/src/stores/merchant.ts`、`web/src/layouts/MerchantLayout.vue` 和 `web/src/views/merchant`。

## 合作者 AI 提示

开发或审查管理端时，合作者 AI 必须先加载以下 skill：

1. `shiguang-mall-admin-web-collaboration`
2. `vue-best-practices`
3. `shiguang-mall-web-style`

推荐提示词：

```text
请在 web 前端工程内开发时光商城平台管理端功能。先加载 shiguang-mall-admin-web-collaboration、vue-best-practices、shiguang-mall-web-style。仅修改 web/src/views/admin、web/src/api/admin、web/src/stores/adminAuth.ts、web/src/layouts/AdminLayout.vue、web/src/components/common 等管理端边界内文件，不要覆盖商家端 store/router/layout。
```

## 提交前检查

- 确认新功能没有落到根目录 `src`。
- 确认管理端没有引用 `@/stores/auth`。
- 确认商家端路由 `/merchant/shops/:shopId/*` 可继续访问。
- 确认管理端路由 `/admin/*` 使用 `useAdminAuthStore` 和 `meta.permissions`。
- 在 `web` 目录执行 `npm.cmd run build`，构建通过后再交付。
