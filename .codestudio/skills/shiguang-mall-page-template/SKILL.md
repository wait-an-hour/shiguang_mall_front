---
name: "shiguang-mall-page-template"
description: "Defines calm Shiguang Mall web page templates and visual style. Invoke when designing, creating, or reviewing Vue web pages for this project."
---

# Shiguang Mall Page Template And Calm Visual Style

Use this skill when designing, creating, modifying, or reviewing any Shiguang Mall web page. It standardizes calm page layout, visual style, component usage, interaction states, and collaboration rules so multiple frontend developers and agents produce consistent, comfortable pages.

This skill complements `shiguang-mall-web-style`, `vue-best-practices`, `vue-router-best-practices`, and `vue-pinia-best-practices`.

## 1. Design Direction

Shiguang Mall is a teaching-oriented multi-merchant e-commerce system. The UI should be comfortable, clear, restrained, and easy to use for long sessions. Prefer business readability over visual drama.

Design keywords:

- Calm
- Clear
- Trustworthy
- Lightweight
- Structured
- Easy to scan
- Easy to maintain

Avoid:

- Large saturated backgrounds
- Heavy shadows
- Too many gradients
- Too many status colors on one screen
- Dense cards competing for attention
- Decorative effects that do not improve comprehension
- Custom components when Element Plus already provides a suitable pattern

Default aesthetic: light, low-contrast, card-based, spacious, with blue as the only primary accent.

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
- Cross-page state goes through Pinia only when it is shared across pages.

## 3. Calm Visual Tokens

Use these values unless the project theme already defines stricter tokens.

### 3.1 Colors

Use fewer, softer colors. Primary blue should guide actions, not dominate the page.

| Token | Value | Usage |
| --- | --- | --- |
| Primary | `#2563EB` | Main action, active menu, link |
| Primary Soft | `#EFF6FF` | Active menu background, selected card |
| Success | `#16A34A` | Completed, paid, enabled |
| Success Soft | `#ECFDF3` | Success tag background |
| Warning | `#D97706` | Pending, low stock, waiting |
| Warning Soft | `#FFFBEB` | Warning tag background |
| Danger | `#DC2626` | Delete, failed, rejected |
| Danger Soft | `#FEF2F2` | Danger tag background |
| Info | `#475569` | Neutral metadata |
| Text Primary | `#111827` | Headings and important values |
| Text Regular | `#374151` | Body text |
| Text Secondary | `#6B7280` | Descriptions and helper text |
| Text Muted | `#9CA3AF` | Placeholder and less important text |
| Border | `#E5E7EB` | Card, table, form borders |
| Divider | `#F1F5F9` | Internal card dividers |
| Page Background | `#F7F8FA` | App background |
| Card Background | `#FFFFFF` | Main content cards |
| Header Background | `#FFFFFF` | Top bars |

### 3.2 Spacing

Use an 8px spacing system and keep pages breathable.

| Token | Value | Usage |
| --- | --- | --- |
| `xs` | `4px` | Icon gap, tag inner gap |
| `sm` | `8px` | Button groups, inline controls |
| `md` | `16px` | Card padding, form groups |
| `lg` | `24px` | Page sections |
| `xl` | `32px` | Major layout separation |

Rules:

- Page content gap: `16px` or `24px`.
- Card padding: usually `16px` or `20px`.
- Avoid stacking many cards with different padding styles.

### 3.3 Radius, Border, Shadow

Prefer borders over shadows for admin and merchant pages.

- Control radius: `6px`.
- Card radius: `8px` or `10px`.
- Dialog radius: `10px`.
- Default card border: `1px solid #E5E7EB`.
- Default card shadow: none or `0 1px 2px rgba(15, 23, 42, 0.04)`.
- Avoid floating, glassmorphism, neon shadows, and dramatic elevation.

### 3.4 Typography

| Level | Size | Weight | Usage |
| --- | --- | --- | --- |
| Page title | `20px` | `600` | Page title |
| Section title | `16px` | `600` | Card title |
| Body | `14px` | `400` | Tables, forms, normal text |
| Secondary | `13px` | `400` | Descriptions and metadata |
| Caption | `12px` | `400` | Tags and helper text |

Rules:

- Do not use more than three font sizes on one page unless necessary.
- Use font weight sparingly; avoid making every label bold.
- Amounts and key counts can be bold, but should not all be oversized.
- UI labels use Chinese; logic uses stable English enum codes.

## 4. Layout Types

### 4.1 Buyer Mall Layout

Use for `/`, `/products`, `/cart`, `/checkout`, `/orders`, `/account/*`.

Structure:

```text
BuyerLayout
├── TopHeader: logo, search, user menu, cart entry
├── Optional category navigation
├── Main content container, max width 1200px
└── Simple footer
```

Rules:

- Header stays white or near-white.
- Product pages may use more whitespace and card layouts.
- Price can use danger red, but do not overuse red in surrounding UI.
- Checkout/payment amount should be prominent but not oversized.

### 4.2 Merchant Workspace Layout

Use for `/merchant` routes.

Structure:

```text
MerchantLayout
├── TopBar: active shop, user, logout
├── SideMenu: product, inventory, orders
└── Main
    ├── Breadcrumb, optional
    ├── PageHeader
    └── PageContent
```

Rules:

- Prefer a light sidebar or very restrained dark sidebar. Avoid gradient sidebars by default.
- Always show current shop context.
- Use tables for lists and simple cards for summary metrics.
- Keep operation buttons predictable and aligned to the right.
- Do not make every metric card visually loud; only urgent counts need warning emphasis.

### 4.3 Platform Admin Layout

Use for `/admin` routes.

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
- Prefer dense but readable tables.
- Use breadcrumbs for nested pages.
- Use confirmation dialogs for destructive and status-changing actions.
- Keep platform pages quieter than buyer marketing pages.

### 4.4 Blank Layout

Use for login, register, 403, 404, and 500.

Rules:

- Keep auth pages simple and centered.
- Avoid busy background illustrations.
- Show project name, clear form errors, and one primary action.
- Preserve `redirect` query after successful login.

## 5. Standard Page Template

Every business page should follow this structure unless it is a special landing page.

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

Design each page by answering:

1. What is the page's main job?
2. What must the user see first?
3. What is the single most important action?
4. Which filters are necessary, not just nice to have?
5. What are the loading, empty, error, forbidden, and conflict states?
6. What happens after each action succeeds?

## 6. Vue Page SFC Skeleton

Use this shape for small page demos or initial page scaffolding:

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
  } catch {
    errorMessage.value = '页面数据加载失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

onMounted(loadPageData)
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
  color: #111827;
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
  border: 1px solid #e5e7eb;
  border-radius: 10px;
}
</style>
```

## 7. Page Header Rules

Every business page should have a clear but quiet header.

Header content:

- Title: short business noun, for example `商品管理`.
- Description: one sentence explaining the page scope.
- Primary action: at most one visually primary action.
- Secondary actions: use normal buttons or dropdowns.

Rules:

- Do not use large hero banners for admin and merchant pages.
- Do not put too many buttons in the page header.
- If there are more than three actions, move secondary actions into a dropdown or page content area.

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

- Put filters above the table in a white card.
- Keep filters to one row on desktop when possible.
- Use server-side pagination for growing lists.
- Keep table columns stable across pages of the same domain.
- Use row action buttons on the right.
- More than three row actions should use `el-dropdown`.
- Status columns should use a shared status tag component.
- Empty lists must show `el-empty` with a domain-specific description.

Recommended list states:

| State | UI |
| --- | --- |
| First loading | `v-loading` on content card |
| Search loading | Keep previous data and show table loading |
| Empty | `el-empty` with clear text |
| Error | `el-result` with retry button |
| Forbidden | Redirect to `/403` or show permission result |
| Conflict after action | Show warning and refresh data |

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
- All state-changing actions must refresh from the latest backend response.
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
- Use 3-4 metric cards at most in the first row.
- Keep dashboard lightweight and avoid complex charts in MVP.
- Use warning emphasis only for urgent items such as pending shipment or low stock.

## 12. Component Rules

Buyer components:

| Component | Purpose |
| --- | --- |
| `ProductCard` | Product image, name, subtitle, price, stock |
| `SkuSelector` | SKU spec selection and availability |
| `CartShopGroup` | Cart items grouped by shop |
| `MoneyText` | Consistent money display |
| `OrderStatusTag` | Order status label and color |
| `AddressCard` | Address display and selection |
| `CheckoutSummary` | Amount summary and submit area |

Merchant/admin components:

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

Rules:

- Reuse shared components before inventing new page-specific UI.
- Keep components visually quiet by default.
- Use icons only when they improve recognition.
- Avoid decorative icons in every metric card.

## 13. Status Color Rules

Use color for meaning, not decoration.

| Semantic | Color | Examples |
| --- | --- | --- |
| Success | green | paid, completed, enabled, approved |
| Warning | amber | pending payment, pending review, pending shipment, low stock |
| Danger | red | rejected, failed, cancelled, banned, closed |
| Info | gray/blue | draft, off shelf, created, processing |

Rules:

- Use soft tag backgrounds and readable text.
- Do not use saturated filled tags unless the state is critical.
- Avoid showing many bright tags in the same table row.
- Status labels come from shared constant maps, not hard-coded templates.

## 14. Interaction Rules

- One primary button per page section when possible.
- Dangerous actions use danger style and confirmation dialog.
- State-changing actions show loading and prevent duplicate clicks.
- Idempotent actions reuse the same idempotency key for retry of the same action.
- Success after create navigates to detail page when the created resource is important.
- Success after update stays on current page and refreshes data.
- Success after delete returns to list or removes row after backend success.
- Conflict shows warning, refreshes latest data, and asks user to retry.
- Permission denied hides impossible actions, but still handles backend 403.

## 15. Empty, Error, Loading, And Permission States

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

## 16. Navigation And Route Design

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

## 17. Comfortable UI Checklist

Before finishing a page, check:

- Is there only one obvious primary action?
- Can the user identify the page purpose within 3 seconds?
- Are cards separated by whitespace rather than heavy shadows?
- Are table rows readable without too much color?
- Are urgent states visible without making the whole page stressful?
- Are filters necessary and not excessive?
- Are empty/error states clear and calm?
- Does the page still look usable after 30 minutes of operation work?

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
- Visual style is calm, low-noise, and suitable for long-session work.

## 20. When To Push Back

Ask for clarification before implementation if:

- The page role is unclear.
- The route conflicts with existing route groups.
- Required backend DTO or endpoint is missing.
- A page mixes buyer, merchant, and platform responsibilities.
- The requested UI style conflicts with project consistency.
- A custom component is requested but Element Plus already covers the need.
- The design introduces visual noise without improving usability.

When uncertain, choose the simplest, quietest page structure that supports the business flow and follows existing project style.
