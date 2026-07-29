---
name: "shiguang-mall-page-template"
description: "Defines Shiguang Mall web page templates and visual style. Invoke when designing, creating, or reviewing Vue web pages for this project."
---

# Shiguang Mall Page Template And Visual Style

Use this skill when designing, creating, modifying, or reviewing any Shiguang Mall web page. It standardizes page layout, visual style, component usage, interaction states, and collaboration rules so multiple frontend developers and agents produce consistent pages.

This skill complements `shiguang-mall-web-style`, `vue-best-practices`, `vue-router-best-practices`, and `vue-pinia-best-practices`.

## 1. Product Positioning

Shiguang Mall is a teaching-oriented multi-merchant e-commerce system. The web UI must feel clear, reliable, and business-focused rather than decorative. Prioritize transaction correctness, readable status, permission clarity, and consistent workflows.

Design keywords:

- Clean
- Trustworthy
- Structured
- Efficient
- Commerce-oriented
- Easy to review

Avoid:

- Overly playful visual effects
- Inconsistent colors between pages
- Hidden business states
- Dense pages without hierarchy
- Custom UI patterns when Element Plus already provides a suitable component

## 2. Core Stack And UI Library

For web pages, use:

- Vue 3
- TypeScript
- Vite
- Element Plus
- Pinia
- Vue Router
- Axios
- SCSS or project-approved atomic CSS

Rules:

- Use Element Plus as the default component library.
- Use `<script setup lang="ts">` for Vue SFCs.
- Page views live under `src/views`.
- Reusable page sections live under `src/components`.
- API requests go through `src/api`, never directly in templates.
- Cross-page state goes through Pinia only when needed.

## 3. Visual Design Tokens

Use these as the default design language unless an existing theme file already defines stricter values.

### 3.1 Colors

| Token | Value | Usage |
| --- | --- | --- |
| Primary | `#1E6BFF` | Main actions, active navigation, links |
| Primary Hover | `#3F82FF` | Hover state for primary actions |
| Success | `#16A34A` | Success status, paid, completed, enabled |
| Warning | `#F59E0B` | Pending, waiting, low stock, review |
| Danger | `#DC2626` | Delete, reject, failed, cancelled, risk |
| Info | `#64748B` | Secondary metadata |
| Text Primary | `#1F2937` | Main text |
| Text Regular | `#4B5563` | Body text |
| Text Secondary | `#6B7280` | Descriptions, table metadata |
| Border | `#E5E7EB` | Card, table, form borders |
| Page Background | `#F5F7FA` | App background |
| Card Background | `#FFFFFF` | Content containers |

### 3.2 Spacing

Use an 8px spacing system:

| Token | Value | Usage |
| --- | --- | --- |
| `xs` | `4px` | Icon gap, compact inline spacing |
| `sm` | `8px` | Button groups, tag gap |
| `md` | `16px` | Form item groups, card inner blocks |
| `lg` | `24px` | Page sections |
| `xl` | `32px` | Major layout separation |

### 3.3 Radius And Shadow

- Small radius: `6px` for tags and small controls.
- Card radius: `10px` for page cards.
- Dialog radius: `12px`.
- Default card shadow should be subtle: `0 4px 16px rgba(15, 23, 42, 0.06)`.
- Avoid heavy shadows in admin pages.

### 3.4 Typography

| Level | Size | Weight | Usage |
| --- | --- | --- | --- |
| Page title | `20px` | `600` | Top page title |
| Section title | `16px` | `600` | Card title |
| Body | `14px` | `400` | Tables, forms, normal text |
| Secondary | `13px` | `400` | Metadata and tips |
| Caption | `12px` | `400` | Tags, helper text |

Rules:

- Do not use more than three font sizes on one page unless necessary.
- Numbers such as amounts, stock, and order totals should align clearly.
- Use Chinese labels for UI text and stable English enum codes for logic.

## 4. Layout Types

### 4.1 Buyer Mall Layout

Use for routes such as `/`, `/products`, `/cart`, `/checkout`, `/orders`, `/account/*`.

Structure:

```text
BuyerLayout
├── TopHeader: logo, search, user menu, cart entry
├── Category/Nav area when needed
├── Main content container, max width 1200px
└── Footer: simple project/team info
```

Rules:

- Product browsing pages can be anonymous.
- Account, cart, checkout, payment, and order pages require login.
- Main content width should usually be `1200px`.
- Buyer pages can use more whitespace and card-based product displays.

### 4.2 Merchant Workspace Layout

Use for routes under `/merchant`.

Structure:

```text
MerchantLayout
├── TopBar: active shop, user, logout
├── SideMenu: product, inventory, orders
└── Main
    ├── PageHeader
    └── PageContent
```

Rules:

- Always show current shop context when inside shop-specific pages.
- All shop business pages must include `shopId` in the route or selected context.
- Use tables for lists and forms/dialogs for operations.
- Keep action buttons state-driven by backend status and permissions.

### 4.3 Platform Admin Layout

Use for routes under `/admin`.

Structure:

```text
AdminLayout
├── TopBar: platform title, current user
├── SideMenu: shops, categories, brands, reviews, RBAC
└── Main
    ├── Breadcrumb
    ├── PageHeader
    └── PageContent
```

Rules:

- Target desktop management use, minimum width 1280px.
- Prefer dense but readable table layouts.
- Use breadcrumbs for nested pages.
- Use confirmation dialogs for destructive and status-changing actions.

### 4.4 Blank Layout

Use for:

- Login
- Register
- 403
- 404
- 500

Rules:

- Keep authentication pages visually simple.
- Show project name and clear form errors.
- Preserve `redirect` query after successful login.

## 5. Standard Page Template

Every page should follow this order unless it is a special landing page.

```text
PageView
├── PageHeader
│   ├── title
│   ├── description
│   └── primary actions
├── Filter/Search Card, optional
├── Main Content Card
│   ├── loading state
│   ├── error state
│   ├── empty state
│   └── data content
├── Pagination, if list
└── Dialog/Drawer components
```

Use this mental template for page design:

1. What is the page for?
2. What does the user need to see first?
3. What is the primary action?
4. What filters or context are required?
5. What are the loading, empty, error, forbidden, and conflict states?
6. What happens after each action succeeds?

## 6. Vue Page SFC Skeleton

Use this shape for page-level Vue components:

```vue
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

const loading = ref(false)
const errorMessage = ref('')

const hasError = computed(() => Boolean(errorMessage.value))

async function loadPageData() {
  loading.value = true
  errorMessage.value = ''

  try {
    // Call typed API functions here.
  } catch (error) {
    errorMessage.value = '页面数据加载失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadPageData()
})
</script>

<template>
  <div class="page-view">
    <section class="page-header">
      <div>
        <h1 class="page-title">页面标题</h1>
        <p class="page-description">说明当前页面的主要用途。</p>
      </div>

      <div class="page-actions">
        <el-button type="primary">主要操作</el-button>
      </div>
    </section>

    <el-card v-if="hasError" class="page-card" shadow="never">
      <el-result icon="error" title="加载失败" :sub-title="errorMessage">
        <template #extra>
          <el-button type="primary" @click="loadPageData">重试</el-button>
        </template>
      </el-result>
    </el-card>

    <el-card v-else class="page-card" shadow="never" v-loading="loading">
      页面内容
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.page-view {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.page-title {
  margin: 0;
  color: #1f2937;
  font-size: 20px;
  font-weight: 600;
}

.page-description {
  margin: 8px 0 0;
  color: #6b7280;
  font-size: 13px;
}

.page-actions {
  display: flex;
  gap: 8px;
}

.page-card {
  border-radius: 10px;
}
</style>
```

## 7. Page Header Rules

Every business page should have a clear header.

Header content:

- Title: short business noun, for example `商品管理`.
- Description: one sentence explaining the page scope.
- Primary action: at most one visually primary action.
- Secondary actions: use normal buttons or dropdowns.

Examples:

| Page | Title | Description | Primary Action |
| --- | --- | --- | --- |
| Product list | 商品列表 | 管理当前店铺的 SPU、SKU 与上下架状态 | 新建商品 |
| Inventory | 库存管理 | 查看 SKU 可用库存、锁定库存并处理入库 | 新增入库 |
| Product review | 商品审核 | 审核商家提交的商品内容变更 | None |
| Cart | 我的购物车 | 确认商品、数量和失效状态后进入结算 | 去结算 |

## 8. List Page Template

Use for products, orders, shops, brands, reviews, inventory, wallet records, and after-sales.

Structure:

```text
ListPage
├── PageHeader
├── SearchForm Card
├── Table/List Card
│   ├── batch actions, optional
│   ├── table or cards
│   └── pagination
└── Dialogs
```

Rules:

- Put search filters above the table in a card.
- Use inline search for keyword and select controls for status.
- Use server-side pagination for growing lists.
- Keep table columns stable across pages of the same domain.
- Put row actions at the right side.
- More than three row actions should use `el-dropdown`.
- Status columns should use a shared status tag component.
- Amount columns should use a money display component or formatter.
- Empty lists must show `el-empty` with a domain-specific description.

Recommended list states:

| State | UI |
| --- | --- |
| First loading | `v-loading` on content card |
| Search loading | keep previous data, show table loading |
| Empty | `el-empty` with clear text |
| Error | `el-result` with retry button |
| Forbidden | redirect to `/403` or show permission result |
| Conflict after action | show warning and refresh data |

## 9. Detail Page Template

Use for product detail, trade detail, order detail, shop detail, review detail, and after-sale detail.

Structure:

```text
DetailPage
├── PageHeader with back button and actions
├── Summary Card
├── Status/Timeline Card
├── Domain Detail Cards
└── Action Dialogs
```

Rules:

- Put business number, status, amount, owner/shop, and creation time in the summary card.
- Use tabs only when detail content is large and naturally separable.
- Use timeline for order, payment, inventory, review, and after-sale history.
- All state-changing actions must use the latest backend response to refresh the page.
- Do not optimistically change order, payment, inventory, or review status.

## 10. Form Page Template

Use for product edit, profile edit, address edit, shop edit, category edit, brand edit, and review forms.

Structure:

```text
FormPage
├── PageHeader
├── Form Card
│   ├── Basic info section
│   ├── Business-specific sections
│   └── Sticky footer actions when form is long
└── Preview or side info, optional
```

Rules:

- Use Element Plus `el-form`.
- Keep form model typed.
- Match backend validation constraints.
- Required fields must be visually marked.
- Use inline validation errors.
- Long product forms should use sections: basic info, category attributes, images, SKU table, detail content.
- Save buttons must show loading and prevent duplicate submit.
- For status-changing submit actions, use confirmation dialogs when the effect is business-significant.

## 11. Dashboard Page Template

Use dashboards only for summary pages such as merchant home or admin home.

Structure:

```text
DashboardPage
├── PageHeader
├── Metric Cards
├── Pending Tasks Card
├── Recent Records Card
└── Quick Actions
```

Rules:

- Dashboard data is for navigation and awareness, not final business judgment.
- Metric cards should link to filtered list pages.
- Keep dashboard lightweight and avoid complex charts in MVP.

## 12. Buyer Commerce Components

Use consistent components for buyer pages:

| Component | Purpose |
| --- | --- |
| `ProductCard` | Product image, name, subtitle, price, stock |
| `SkuSelector` | SKU spec selection and availability |
| `CartShopGroup` | Cart items grouped by shop |
| `MoneyText` | Consistent money display |
| `OrderStatusTag` | Order status label and color |
| `AddressCard` | Address display and selection |
| `CheckoutSummary` | Amount summary and submit area |

Buyer page rules:

- Product cards should emphasize image, name, price, and stock.
- Price color may use danger red, but do not overuse red elsewhere.
- Checkout and payment pages must make final payable amount visually prominent.
- Cart and checkout must clearly show invalid items and stock changes.

## 13. Admin Components

Use consistent components for merchant and platform pages:

| Component | Purpose |
| --- | --- |
| `PageHeader` | Page title, description, actions |
| `SearchPanel` | Search and filter form container |
| `StatusTag` | Shared status display |
| `MoneyText` | Money display |
| `DataTableActions` | Row action layout |
| `ConfirmActionButton` | Confirmed state-changing action |
| `AuditResultDialog` | Approve/reject style dialogs |
| `TimelinePanel` | Status history |

Admin page rules:

- Prefer tables over cards for management lists.
- Align row actions consistently on the right.
- Use tag colors consistently for statuses.
- Do not hide failed, rejected, or cancelled states in neutral gray if they require attention.

## 14. Status Color Rules

Use consistent colors for business states:

| Semantic | Color | Examples |
| --- | --- | --- |
| Success | green | paid, completed, enabled, approved |
| Warning | orange | pending payment, pending review, pending shipment, low stock |
| Danger | red | rejected, failed, cancelled, banned, closed |
| Info | blue/gray | draft, off shelf, created, processing |

Status labels should come from shared constant maps, not hard-coded in templates.

## 15. Interaction Rules

- Primary button: one per page section when possible.
- Dangerous actions: use danger style and confirmation dialog.
- State-changing actions: show loading and prevent duplicate clicks.
- Idempotent actions: reuse the same idempotency key for retry of the same action.
- Success after create: navigate to detail page when the created resource is important.
- Success after update: stay on current page and refresh data.
- Success after delete: return to list or remove row from list after backend success.
- Conflict: show warning, refresh latest data, ask user to retry.
- Permission denied: hide impossible actions, still handle backend 403.

## 16. Empty, Error, Loading, And Permission States

Every remote-data page must handle:

| State | Required UI |
| --- | --- |
| Loading | `v-loading`, skeleton, or disabled submit button |
| Empty | `el-empty` with domain text and optional action |
| Error | `el-result` with retry action |
| Forbidden | `/403` page or inline permission result |
| Not found | `/404` page or resource-not-found result |
| Conflict | Warning message and refresh |

Recommended copy examples:

| Scenario | Text |
| --- | --- |
| Empty products | 暂无商品，请调整筛选条件 |
| Empty cart | 购物车还是空的，去挑选商品吧 |
| Empty orders | 暂无订单记录 |
| Load failed | 页面数据加载失败，请稍后重试 |
| Conflict | 数据已发生变化，已为你刷新最新内容 |
| Forbidden | 当前账号无权访问该页面 |

## 17. Navigation And Route Design

Route groups:

```text
/                         # buyer home
/products                 # buyer product list
/products/:spuId          # buyer product detail
/cart                     # buyer cart
/checkout                 # buyer checkout
/payment/:tradeId         # buyer payment
/orders                   # buyer order list
/trades/:tradeId          # buyer trade detail
/account/*                # buyer account center

/merchant                 # merchant home
/merchant/shops           # merchant shop selector
/merchant/shops/:shopId/* # shop-scoped merchant pages

/admin                    # platform admin home
/admin/shops              # platform shop management
/admin/categories         # platform category management
/admin/brands             # platform brand management
/admin/product-reviews    # platform product review
```

Route meta should include:

```ts
interface AppRouteMeta {
  title: string
  layout: 'buyer' | 'merchant' | 'admin' | 'blank'
  requiresAuth?: boolean
  permissions?: string[]
  shopScoped?: boolean
}
```

Rules:

- Use route names as stable PascalCase strings.
- Use lazy-loaded views.
- Preserve query filters for list pages.
- Use route query for shareable filters such as keyword, status, page, and pageSize.
- Do not store list filters only in component local state if users need browser back/forward behavior.

## 18. Collaboration Rules

Before building a new page, define:

1. Route path and route name.
2. Page layout type.
3. Required permissions.
4. API functions and DTOs.
5. Main page states: loading, empty, error, forbidden, conflict.
6. Primary action and success navigation.
7. Reusable components needed.

For team consistency:

- Reuse shared `PageHeader`, `SearchPanel`, `StatusTag`, and `MoneyText`.
- Do not create one-off visual styles if a shared component can solve it.
- Keep labels and status maps in constants.
- Keep page-specific styles scoped.
- Do not modify global theme casually.
- Update route documentation when adding routes.

## 19. Review Checklist

Use this checklist before accepting a page:

- Page follows buyer, merchant, admin, or blank layout rules.
- Page has a clear title, description, and primary action.
- UI uses Element Plus consistently.
- Loading, empty, error, forbidden, and conflict states are handled.
- Status labels and colors use shared constants.
- Money and IDs follow backend contract rules.
- Route meta includes title, layout, auth, and permissions.
- API calls are typed and placed in `src/api`.
- Page does not hard-code backend messages for business logic.
- Actions refresh from backend response after success.
- Destructive or important state-changing actions use confirmation.
- Styles are scoped or use approved global tokens.

## 20. When To Push Back

Ask for clarification before implementation if:

- The page role is unclear.
- The route conflicts with existing route groups.
- Required backend DTO or endpoint is missing.
- A page mixes buyer, merchant, and platform responsibilities.
- The requested UI style conflicts with project consistency.
- A custom component is requested but Element Plus already covers the need.

When uncertain, choose the simplest page structure that supports the business flow and follows existing project style.
