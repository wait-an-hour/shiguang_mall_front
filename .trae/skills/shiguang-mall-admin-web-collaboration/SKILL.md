---
name: "shiguang-mall-admin-web-collaboration"
description: "Guides Shiguang Mall admin web collaboration. Invoke when developing or reviewing platform admin pages under web/src."
---

# 时光商城管理端 Web 协作规范

## 调用时机

当任务涉及时光商城平台管理端页面、接口、路由、权限、布局或公共后台组件时，必须调用本 skill。典型场景：

- 开发或审查 `web/src/views/admin` 下的管理端页面。
- 开发或审查 `web/src/api/admin` 下的管理端接口封装。
- 修改管理端登录态、权限、菜单、路由守卫或后台布局。
- 合并其他协作者开发的管理端代码到 `web/src`。

## 工程入口

- `web` 是唯一前端工程入口。
- 运行命令必须进入 `web` 目录，或在根目录使用 `npm --prefix web <script>`。
- 根目录 `src` 仅作为历史迁移来源，不得继续新增功能。
- 不得迁移或覆盖根目录 `src/App.vue`、`src/main.ts` 到 `web/src`。

## 管理端开发边界

管理端只在以下位置开发：

- `web/src/views/admin`
- `web/src/api/admin`
- `web/src/stores/adminAuth.ts`
- `web/src/layouts/AdminLayout.vue`
- `web/src/components/common`
- `web/src/mock/adminData.ts`
- `web/src/types/admin.ts`
- `web/src/utils/labels.ts`
- `web/src/utils/request.ts`
- `web/src/styles/theme.scss`

禁止在根目录 `src` 新增页面、接口、store、layout、组件或样式。根目录 `src` 只可作为对照来源读取。

## 商家端保护边界

不得覆盖或破坏以下商家端文件和目录：

- `web/src/stores/auth.ts`
- `web/src/stores/merchant.ts`
- `web/src/layouts/MerchantLayout.vue`
- `web/src/views/merchant`
- `web/src/api/merchant`
- `web/src/constants/merchant.ts`

商家端仍使用 `useAuthStore` 和 `useMerchantStore`。管理端不得复用商家端 `useAuthStore`。

## 鉴权和权限规则

- 管理端登录态统一使用 `useAdminAuthStore`。
- 管理端 store 文件为 `web/src/stores/adminAuth.ts`，store 名称为 `useAdminAuthStore`。
- 管理端代码不得引用 `@/stores/auth`，不得使用 `useAuthStore`。
- 管理端路由必须设置 `meta.requiresAuth: true` 和 `meta.permissions`。
- 管理端权限通过 `useAdminAuthStore().hasPermissions(meta.permissions)` 判断。
- 未登录访问 `/admin/*` 时跳转 `/login?redirect=<原路径>`。
- 无权限访问管理端页面时跳转 `/403`。
- 前端权限仅用于体验隔离，真实安全必须以后端校验为准。

## 路由规则

- `/admin/*` 属于平台管理端，由 `web/src/layouts/AdminLayout.vue` 承载。
- `/merchant/shops/:shopId/*` 属于商家端，由 `web/src/layouts/MerchantLayout.vue` 承载。
- `/login` 和 `/register` 是公共入口。
- `/admin/login` 和 `/shop/login` 统一重定向到 `/login`。
- 管理端路由名保持稳定，例如 `AdminDashboard`、`AdminRoles`、`AdminAccounts`、`AdminProducts`。
- 管理端新增页面时，优先追加到 `/admin` children，不要重写商家端路由组。

## 代码风格

- 使用 Vue 3 + TypeScript + `<script setup lang="ts">`。
- 使用 Composition API，不新增 Options API。
- API 调用放在 `web/src/api/admin`，页面不直接写请求实现。
- 管理端 DTO 和枚举放在 `web/src/types/admin.ts`。
- 中文标签和状态展示优先放在 `web/src/utils/labels.ts`。
- 页面级组件保持清晰，复杂交互可拆到 `web/src/components/common` 或管理端专属组件。
- 不要引入新依赖，除非构建明确提示缺失且已获授权。
- 不要在代码中记录、输出或持久化密码、真实 token、密钥等敏感信息。

## 提交前验证

交付前必须在 `web` 目录执行：

```powershell
npm.cmd run build
```

如果构建失败，优先检查：

- `@` alias 是否指向 `web/src`。
- `tsconfig.app.json` 是否包含 `baseUrl` 和 `paths`。
- 是否遗漏 `@/stores/auth` 到 `@/stores/adminAuth` 的替换。
- 是否遗漏 `useAuthStore` 到 `useAdminAuthStore` 的替换。
- `RouteMeta.layout` 是否允许 `admin`。
- TypeScript `noUnusedLocals` 和 `noUnusedParameters` 是否有未使用变量。
- vue-router 当前版本的类型签名是否兼容。

不要提交 git，除非用户明确要求。
