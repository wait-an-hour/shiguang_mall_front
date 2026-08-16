# problems_and_diagnostics

## 1. 本轮测试范围

本轮先验证管理员端前端的单元测试和 API 契约测试，暂不执行 k6 压力测试。

覆盖内容：

- 管理员状态标签、金额展示和权限资源文案。
- 管理员登录态、角色权限判断和会话清理。
- 列表筛选条件、默认分页参数和本地持久化。
- 商品、订单、首页概览、优惠券模板、售后申诉 API 封装。
- 商品最低 SKU 价格计算、订单退款金额默认值和商品数量汇总。
- API 路径、查询参数、请求体和幂等请求头。
- Token 过期、越权访问、非法参数错误透传。
- 超级管理员、平台店铺管理员、平台商品审核员的菜单权限分支。

本轮不包含：

- k6 压力测试。
- 真实后端服务联调。
- 真实 Token 下的端到端权限验证。
- 钱包写入和提现处理测试，因为当前管理员端钱包页面只有只读查询接口。

## 2. 问题一：Vitest mock 初始化顺序错误

### 现象

执行 `npm.cmd test` 时，API 测试文件无法加载，测试结果为 `0 test`。错误信息为：

```text
Error: [vitest] There was an error when mocking a module.
ReferenceError: Cannot access 'request' before initialization
```

受影响文件：

- `web/src/__tests__/admin-api.contract.spec.ts`
- `web/src/__tests__/admin-api-errors.spec.ts`

### 原因分析

Vitest 会提升 `vi.mock()` 的执行位置。原测试在文件顶层先声明普通的 `request` 常量，再在 `vi.mock()` 工厂中引用它。由于 mock 工厂实际执行时机早于普通变量初始化，触发了暂时性死区错误。

原逻辑相当于：

```ts
const request = { get: vi.fn(), post: vi.fn(), put: vi.fn() }
vi.mock('@/utils/request', () => ({ default: request }))
```

### 修复方式

使用 Vitest 提供的 `vi.hoisted()` 创建 mock 对象，使 mock 依赖在模块提升阶段即可安全初始化：

```ts
const { request } = vi.hoisted(() => ({
  request: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn()
  }
}))

vi.mock('@/utils/request', () => ({ default: request }))
```

### 修复结果

修复后 API 测试能够正常加载，未再出现 mock 初始化错误。

## 3. 现有业务问题：商品最低 SKU 价格不能使用字符串比较

### 问题

商品详情存在多个 SKU 时，如果直接比较金额字符串，可能得到错误结果。例如：

```text
"100.00" < "9.90"
```

字符串比较是按字符顺序进行的，不能代表真实金额大小。

### 修复

在 `web/src/api/admin/products.ts` 中将 SKU 金额转换为数字后比较，同时保留原始金额字符串作为页面展示值：

```ts
price: skus.reduce(
  (min, sku) => Number(sku.salePrice) < Number(min) ? sku.salePrice : min,
  skus[0]?.salePrice ?? '0.00'
)
```

### 验证

已补充测试：`100.00` 和 `9.90` 同时存在时，最低价格应为 `9.90`。

## 4. 测试执行结果

执行命令：

```powershell
cd "f:\前端项目\shiguang_mall_front\web"
npm.cmd test
```

结果：

```text
Test Files  4 passed (4)
Tests       16 passed (16)
```

当前通过的测试文件包括：

- `src/__tests__/admin-stores-and-labels.spec.ts`
- `src/__tests__/admin-api.contract.spec.ts`
- `src/__tests__/admin-api-errors.spec.ts`
- `src/__tests__/admin-layout.spec.ts`

## 5. 已通过测试明细

### 5.1 `admin-stores-and-labels.spec.ts`

该文件测试结果：通过。

覆盖内容：

- 角色、状态、权限资源等中文标签映射。
- 未知权限资源回退为原始值。
- 管理员登录态写入、清理和持久化。
- `isLoggedIn` 同时依赖 token 和用户信息。
- 权限判断覆盖空权限、部分权限和全部权限。
- 管理员列表筛选默认分页参数。
- 筛选条件写入本地缓存。
- 本地缓存 JSON 损坏时回退默认值。

### 5.2 `admin-api.contract.spec.ts`

该文件测试结果：通过。

覆盖内容：

- 首页概览统计接口封装，覆盖商品、订单、店铺和售后申诉统计请求。
- 商品列表分页参数、状态筛选和商家筛选请求。
- 商品详情 SKU 最低价按数值比较，验证 `100.00` 与 `9.90` 时结果为 `9.90`。
- 订单列表把前端 `keyword/status` 转换为后端 `orderNo/orderStatus`。
- 订单金额、退款金额、商品数量和支付状态默认值映射。
- 优惠券模板列表分页和状态查询参数。
- 优惠券模板激活动作请求体和 `Idempotency-Key`。
- 售后申诉裁决接口请求体和 `Idempotency-Key`。

### 5.3 `admin-api-errors.spec.ts`

该文件测试结果：通过。

覆盖内容：

- Token 过期错误原样透传给页面层。
- 403 越权访问错误原样透传给页面层。
- 非法参数错误原样透传给页面层。
- 状态流转接口失败时不在 API 封装层吞错。

说明：这里验证的是前端 API 封装的错误透传，不代表真实后端权限已经通过端到端验证。

### 5.4 `admin-layout.spec.ts`

该文件测试结果：通过。

覆盖内容：

- 超级管理员可以看到完整管理员端菜单，包括首页概览、角色管理、平台账号、店铺成员、分类、品牌、店铺、商品、订单、售后、钱包、优惠券等入口。
- 平台店铺管理员按权限显示店铺相关入口，并隐藏不属于该角色的入口。
- 平台商品审核员隐藏首页概览，仅保留商品审核相关入口。

## 6. 构建验证

执行命令：

```powershell
npm.cmd run build
```

结果：构建通过。

构建过程中仍存在 Vite 的主包体积警告，属于性能优化提示，不影响当前功能和测试：

```text
Some chunks are larger than 500 kB after minification.
```

## 7. 当前测试限制

- API 测试通过 mock 请求层验证前端封装，不代表真实后端接口已经通过联调。
- 401、403 和非法参数场景验证的是前端错误透传行为，真实越权安全性仍需部署后端环境验证。
- 本轮没有执行 k6 压力测试，后续需要在安装 k6 并准备有效测试环境和管理员 Token 后执行。
- 当前测试未覆盖复杂优惠券页面的完整 DOM 交互，避免将 Element Plus 弹窗实现细节当成业务测试结果。

## 8. 后续建议

1. 在可访问 npm registry 的环境中锁定并安装测试依赖。
2. 接入测试后端，为三种管理员角色准备独立 Token。
3. 增加真实接口集成测试，验证后端权限、状态流转和版本控制。
4. 在预发环境准备稳定数据后，再执行 k6 压力测试。
5. 根据构建产物分析主包体积，进一步拆分 Element Plus 和路由相关代码。

## 9. TypeScript 与 IDE 诊断问题

### 9.1 根目录 `tsconfig.json` 误加载 `vite/client`

#### 现象

IDE 在根目录配置下报告找不到 `vite/client`，并且测试文件中的 `@/...` 别名无法解析；部分 Vue 文件还被按 ES5 标准库检查，产生 `Promise`、`includes`、`Object.entries`、`Set` 等类型错误。

#### 原因

实际前端工程位于 `web` 目录，Vite、Vue 和 TypeScript 依赖也安装在 `web/node_modules`。根目录原配置却把别名指向根目录的 `src/*`，并直接声明 `vite/client`，因此它不属于真实的 Vite 工程，容易被 IDE 错误应用到 `web/src` 文件。

#### 修复

将根目录配置改为 solution 配置，只引用实际的 `web` 工程：

```json
{
  "files": [],
  "references": [
    { "path": "./web/tsconfig.json" }
  ]
}
```

这样根配置不再声明错误的源码目录、路径别名和 Vite 类型；具体的 Vue 类型、`@/*` 别名和浏览器标准库配置由 `web/tsconfig.app.json` 负责。

### 9.2 测试文件的 TypeScript 项目边界不清晰

#### 现象

测试文件中的 `@/layouts/AdminLayout.vue`、`@/stores/adminAuth` 等路径无法解析，且测试全局 API 类型可能无法识别。

#### 修复

保留 `web/tsconfig.test.json` 作为独立测试检查配置，继承生产项目的 Vue、浏览器标准库和 `@/*` 别名，并额外加载 `vitest/globals`：

```json
{
  "extends": "./tsconfig.app.json",
  "compilerOptions": {
    "types": ["vite/client", "vitest/globals"],
    "noUnusedLocals": false,
    "noUnusedParameters": false
  },
  "include": ["src/**/*.ts", "src/**/*.tsx", "src/**/*.vue", "src/__tests__/**/*.spec.ts"],
  "exclude": []
}
```

同时从 `web/tsconfig.json` 的生产 references 中移除测试配置，避免正式构建把测试工程作为额外构建项目处理。测试仍可通过 `vue-tsc --noEmit -p tsconfig.test.json` 独立检查。

### 9.3 TypeScript 版本与 `baseUrl` 配置冲突

#### 现象

IDE 报告 `"--ignoreDeprecations" 的值无效`，同时测试文件和 `products.ts` 出现 `Promise` 不属于 ES5、异步函数需要 `Promise` 构造函数等错误。

#### 原因

项目原先使用 TypeScript 6 配置，但当前 IDE 使用的 TypeScript 服务不接受 `ignoreDeprecations: "6.0"`。另一方面，当前 `@/*` 路径别名仍依赖 `baseUrl` 和 `paths`，直接删除 `baseUrl` 会产生 TS5090：非相对路径无法解析。

#### 修复

将 `web/package.json` 和锁文件中的 TypeScript 版本固定为 `~5.9.3`，与当前 IDE 和 Vue 工具链兼容；在 `web/tsconfig.app.json` 中删除 `ignoreDeprecations`，保留 `baseUrl` 和 `paths`，并显式声明浏览器应用需要的标准库：

```json
{
  "target": "ES2022",
  "lib": ["ES2022", "DOM", "DOM.Iterable"],
  "baseUrl": ".",
  "paths": {
    "@/*": ["src/*"]
  }
}
```

这样既保留了 `@/*` 别名解析，也确保 `Promise`、`Array.includes`、`Object.entries` 和 `Set` 等 ES2015+ API 有正确类型定义。

### 9.4 `@vue/tsconfig/tsconfig.dom.json` 解析问题

经检查，文件实际存在于 `web/node_modules/@vue/tsconfig/tsconfig.dom.json`，不是依赖缺失。IDE 仍然无法解析包名形式的 `extends`，导致继承配置失效，进一步连锁产生 ES5、Vue 依赖和隐式 `any` 诊断。

#### 修复

将 `web/tsconfig.app.json` 的继承路径改为工程内相对路径：

```json
"extends": "./node_modules/@vue/tsconfig/tsconfig.dom.json"
```

这样 IDE、`vue-tsc` 和 Vite 工程都从同一个实际文件加载 Vue 基础配置，不再依赖编辑器对包名 `extends` 的错误解析。

### 9.5 测试文件显示 ES5 的残留诊断

#### 现象

IDE 曾继续显示测试文件和 `products.ts` 的 `Promise`/ES5 错误，但通过 `GetDiagnostics` 检查时这些文件已经没有实际诊断。

#### 原因

这是 TypeScript 服务缓存的旧诊断，或者文件暂时没有被 IDE 归属到 `web/tsconfig.test.json`。将测试配置直接加入生产 project references 会导致测试配置继承全量源码，并触发无关的 TS4023 导出类型错误，因此不采用这种方式。

#### 处理

保留 `web/tsconfig.test.json` 作为独立测试类型检查配置，通过以下命令验证：

```powershell
npx.cmd vue-tsc --noEmit -p tsconfig.test.json
```

同时重新加载 TypeScript 服务后，截图中的旧 ES5 诊断应被清除。当前编辑器诊断和命令行检查均已通过。

## 10. 配置修复后的验证结果

执行以下命令均通过：

```powershell
cd "f:\前端项目\shiguang_mall_front\web"
npm.cmd test
npx.cmd vue-tsc --noEmit -p tsconfig.test.json
npm.cmd run build
npx.cmd vue-tsc --build ..\tsconfig.json --pretty false
```

验证结果：

- Vitest：4 个测试文件通过，16 个测试通过。
- 测试 TypeScript：无诊断错误。
- 生产构建：通过，已生成 `dist`。
- 根 solution 配置：可以正常引用并检查 `web` 工程。
- 仍保留一条 Vite 主包超过 500 kB 的性能警告，该警告不影响类型检查、测试和构建成功。
