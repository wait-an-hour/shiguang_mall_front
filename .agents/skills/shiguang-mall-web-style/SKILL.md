---
name: "shiguang-mall-web-style"
description: "Enforces Shiguang Mall Vue web code style. Invoke when creating, reviewing, or refactoring frontend web code for this project."
---

# Shiguang Mall Web Code Style

Use this skill whenever you create, modify, review, or refactor the Shiguang Mall frontend web code. The goal is to keep AI-generated code consistent with the backend API contract, backend module boundaries, and the project's Vue 3 + TypeScript engineering style.

## Core Stack

- Use Vue 3, TypeScript, Vite, Vue Router, Pinia, Element Plus, Axios, and SCSS or UnoCSS.
- Use `<script setup lang="ts">` for all Vue single-file components.
- Prefer Composition API over Options API.
- Prefer explicit types for API data, props, emits, stores, route meta, and utility functions.
- Do not use `any` unless there is no safer alternative. If used, add a short reason and isolate it.
- Do not introduce React, jQuery, global event buses, or unrelated UI frameworks.

## Backend Contract Sources

When frontend code depends on backend data or endpoints, align with these backend documents:

- `server/shiguang_mall_server/docs/api/common-contract.md`
- `server/shiguang_mall_server/docs/api/phase-1-api.md`
- `server/shiguang_mall_server/docs/api/phase-2-api.md`
- `server/shiguang_mall_server/docs/api/dto-catalog.md`

If implementation and documentation conflict, prefer the API documentation and flag the conflict instead of guessing.

## API Contract Rules

- All HTTP endpoints use root path `/api`.
- JSON fields use `camelCase`.
- IDs are strings in JSON, not numbers. Never call `Number(id)` for backend IDs.
- Money values are strings with two decimals, for example `"3999.00"`. Do not use floating-point arithmetic for money.
- Timestamps are ISO 8601 strings with offset, for example `2026-07-26T18:30:15.123+08:00`.
- Stable enums use uppercase English codes. UI may display Chinese labels, but logic and requests must use enum codes.
- Success responses use `ApiResponse<T>` with `code`, `message`, `data`, `requestId`, and `timestamp`.
- Paginated data uses `PageView<T>` with `items`, `page`, `pageSize`, `total`, and `totalPages`.
- Business decisions must use `code` or enum fields, not `message` or Chinese display text.
- Unknown response fields should be ignored. Do not send entire response objects back to the server.

Use these shared frontend types as the baseline:

```ts
export type Id = string
export type Money = string
export type Timestamp = string

export interface ApiResponse<T> {
  code: string
  message: string
  data: T
  requestId: string
  timestamp: Timestamp
}

export interface ApiErrorResponse {
  code: string
  message: string
  details?: Array<{ field?: string; reason: string }>
  requestId: string
  timestamp: Timestamp
}

export interface PageView<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}
```

## Authentication And Headers

- Store the login token from `LoginView.tokenValue` and send it using the `satoken` header.
- Do not use `Authorization: Bearer ...` unless the backend contract changes.
- Protected requests must include `satoken`.
- JSON requests should include `Content-Type: application/json`.
- Recommended request headers: `Accept: application/json`, `X-Request-Id` when available.
- For idempotent write operations, send `Idempotency-Key` with a UUID-like value and reuse it only for retries of the same user action.
- On `AUTH_NOT_LOGGED_IN`, `AUTH_TOKEN_EXPIRED`, or `AUTH_TOKEN_REPLACED`, clear the user session and redirect to login.

## Idempotency Rules

The frontend must generate and pass one `Idempotency-Key` per user action for these operations:

- Create trade: `POST /api/trades`
- Create or confirm payment: `POST /api/trades/{tradeId}/payments`, `POST /api/payments/{paymentId}/confirm`
- Wallet recharge: `POST /api/wallet/recharges`
- Inventory inbound or adjustment
- Create after-sale request
- Submit return shipment
- Approve after-sale
- Confirm return received
- Retry refund

Network retry must reuse the same key. A new user click must generate a new key.

## Project Structure

Use this frontend structure unless the project already defines a stricter one:

```text
src/
├── api/          # Axios instance and module API functions
├── assets/       # Static assets
├── components/   # Reusable business-neutral components
├── composables/  # Reusable Composition API logic
├── constants/    # Enums, labels, route names, storage keys
├── layouts/      # Layout components
├── router/       # Vue Router setup and route guards
├── stores/       # Pinia stores
├── styles/       # Global styles and theme variables
├── types/        # API DTOs and shared TS types
├── utils/        # Pure helpers
└── views/        # Page-level components
```

Do not place API calls directly in `views`. Do not scatter DTO types inside page components when they belong in `src/types`.

## Module Mapping

Map frontend modules to backend domains and endpoint groups:

- `auth` and `user`: `/api/auth/**`, `/api/users/me`, `/api/addresses/**`
- `product`: `/api/categories/**`, `/api/brands`, `/api/products/**`
- `cart`: `/api/cart/**`
- `trade`: `/api/trades/**`
- `payment`: `/api/payments/**`, `/api/wallet/**`
- `order`: `/api/orders/**`, `/api/shops/{shopId}/orders/**`
- `shop`: `/api/shops/**`
- `inventory`: `/api/shops/{shopId}/inventory/**`
- `catalog`: `/api/platform/catalog/**`
- `rbac`: `/api/platform/rbac/**`
- `aftersale`: `/api/after-sales/**`, `/api/shops/{shopId}/after-sales/**`
- `operation`: `/api/platform/operations/**`

Use the same module names for `src/api`, `src/types`, and `src/stores` where applicable.

## Naming Rules

- Vue components: PascalCase, for example `ProductCard.vue`, `OrderStatusTag.vue`.
- Page components: PascalCase under domain folders, for example `src/views/product/ProductListView.vue`.
- API files: lower camel or domain names, for example `product.ts`, `afterSale.ts`, `platformCatalog.ts`.
- Type files: domain names, for example `product.ts`, `order.ts`, `api.ts`.
- Pinia stores: `useXxxStore`, for example `useUserStore`, `useCartStore`.
- Constants: `UPPER_SNAKE_CASE`, for example `ORDER_STATUS_LABELS`.
- Route names: stable PascalCase strings, for example `ProductDetail`, `OrderList`, `AdminProductManage`.
- Functions: verb-first camelCase, for example `getProductList`, `createTrade`, `confirmPayment`.

## API Layer Style

- Create one Axios instance in `src/api/request.ts`.
- Put all token injection, request ID, idempotency handling, and error normalization in the API layer.
- Each domain file exports typed functions only. UI code should not know raw endpoint construction details beyond route params.
- Request and response types must come from `src/types`.
- Function names should match backend action semantics:
  - `register`, `login`, `logout`, `getCurrentUser`
  - `getCategoryTree`, `getProductList`, `getProductDetail`
  - `getCart`, `addCartItem`, `updateCartItem`, `updateCartSelection`
  - `previewCheckout`, `createTrade`, `cancelTrade`, `getTradeDetail`
  - `createPayment`, `confirmPayment`, `getPaymentDetail`
  - `getOrderList`, `getOrderDetail`, `completeOrder`

Example:

```ts
export function getProductDetail(spuId: Id) {
  return request.get<ProductDetailView>(`/products/${spuId}`)
}
```

The `request` wrapper should unwrap `ApiResponse<T>` only after checking `code === 'OK'`. If it returns raw responses, make that consistent across the whole project.

## Type Modeling Rules

- Define `Id`, `Money`, and `Timestamp` as string aliases.
- Keep backend DTO names where possible: `ProductCardView`, `ProductDetailView`, `CartView`, `TradeDetailView`, `OrderDetailView`.
- Keep backend request names where possible: `LoginRequest`, `CreateTradeRequest`, `UpdateSkuRequest`.
- Represent enum codes as string union types or `as const` objects.
- Create label maps separately, for example `ORDER_STATUS_LABELS`, without changing the enum values.
- For `PATCH` requests, distinguish omitted fields from explicit `null` according to the API docs.
- For arrays with backend uniqueness rules, dedupe before submitting only when it does not change user intent; otherwise show validation errors.

Example:

```ts
export const ORDER_STATUS = {
  PendingPayment: 'PENDING_PAYMENT',
  PendingShipment: 'PENDING_SHIPMENT',
  PendingReceipt: 'PENDING_RECEIPT',
  Completed: 'COMPLETED',
  Cancelled: 'CANCELLED'
} as const

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS]
```

## Vue Component Style

- Use `<template>`, `<script setup lang="ts">`, then `<style scoped lang="scss">` when scoped styles are needed.
- Keep page components orchestration-focused. Extract reusable UI blocks into `src/components`.
- Use `computed` for derived values and `watch` only for side effects.
- Do not mutate props. Use emits or local state copies when needed.
- Define props and emits with TypeScript.
- Use Element Plus components consistently for forms, tables, pagination, dialogs, messages, and upload UI.
- Avoid hard-coded API enum labels in templates. Use constant label maps.
- Use loading, empty, and error states for all remote data views.

Example:

```ts
const props = defineProps<{
  orderId: Id
}>()

const emit = defineEmits<{
  refreshed: []
}>()
```

## Pinia Store Style

- Use Pinia setup stores for new code.
- Store long-lived cross-page state only: user session, cart badge count, permissions, active shop context, query preferences.
- Do not put one-time form state into global stores unless multiple pages need it.
- Keep API side effects in store actions only when state ownership is clear.
- Persist only safe and necessary fields, such as token and basic user context. Never persist passwords.

Example:

```ts
export const useUserStore = defineStore('user', () => {
  const token = ref<string>('')
  const currentUser = ref<CurrentUserView | null>(null)

  const isLoggedIn = computed(() => Boolean(token.value))

  function clearSession() {
    token.value = ''
    currentUser.value = null
  }

  return { token, currentUser, isLoggedIn, clearSession }
})
```

## Vue Router Style

- Define route records in domain groups.
- Use lazy-loaded page components.
- Use route meta for auth, permissions, title, and layout.
- Route guards must read user session and permissions from Pinia.
- Do not rely on frontend permission control as security. It is only for UX.
- If a protected route is accessed without valid login, redirect to login and preserve the original target.

Example route meta fields:

```ts
interface AppRouteMeta {
  requiresAuth?: boolean
  permissions?: string[]
  title?: string
  layout?: 'default' | 'admin' | 'blank'
}
```

## Permission And Menu Rules

- Use `GET /api/auth/me` as the source for platform permissions and shop context.
- Platform permissions come from `platformPermissions`.
- Shop permissions come from each item in `shops[].permissions`.
- `SUPER_ADMIN` does not automatically imply shop data scope. Respect selected `shopId` and shop membership.
- Buttons and menus should be hidden or disabled based on frontend permissions, but backend errors must still be handled.

## Money And Calculation Rules

- Keep money as string at the API boundary.
- Do not use JavaScript floating-point math for money.
- For display, format strings directly or use a decimal helper.
- For business totals, prefer backend-calculated fields such as `selectedAmount`, `payableAmount`, `refundAmount`.
- Frontend may compute display-only previews, but final order, payment, refund, and inventory logic must trust backend responses.

## ID Rules

- IDs are strings throughout frontend code.
- Route params containing IDs must remain strings.
- Do not use numeric comparison for IDs.
- Do not sort IDs numerically unless the backend contract explicitly allows it and a safe big integer strategy is used.

## Error Handling Rules

- Normalize API errors to a predictable frontend error shape.
- Show user-friendly Chinese messages, but keep original `code`, `requestId`, and `details` available for debugging.
- For validation errors, map `details[].field` to form fields when possible.
- Handle common auth errors by clearing session and redirecting to login.
- Handle `VERSION_CONFLICT` by refreshing data and asking the user to retry.
- Handle `IDEMPOTENCY_KEY_REUSED` by generating a new key only for a new user action, not for retrying the same request.
- Never display backend stack traces or internal technical details to users.

## Form Rules

- Use Element Plus `ElForm` and typed form models.
- Define validation rules near the form or in a domain helper.
- Match backend constraints from `dto-catalog.md`: username, password, phone, email, URLs, role codes, category codes, money, quantities, evidence URLs, and remarks.
- Trim fields that backend trims before validation, except rich text or fields where internal whitespace is meaningful.
- For POST/PUT, send required fields explicitly.
- For PATCH, send only changed fields; use explicit `null` only when clearing nullable fields.

## HTML And URL Safety

- Treat `detailHtml` as sanitized by backend, but still render it only through a controlled component.
- Do not insert arbitrary user HTML with `v-html` unless the field is documented as sanitized.
- Image URLs should be `https` except configured local development URLs.
- Do not expose password, token, Redis keys, SQL, or internal error details in UI, logs, or screenshots.

## Testing And Quality Gates

Before finalizing code, run the available checks. Prefer these scripts if present:

- `npm run type-check`
- `npm run lint`
- `npm run build`
- `npm run test:unit`
- `npm run test:e2e`

If scripts are not present, recommend adding them. Do not claim tests passed unless they were actually run.

Use Vitest for pure utils, composables, stores, and important calculations. Use Playwright for core flows:

- login
- product list and detail
- add to cart
- checkout preview
- create trade
- wallet recharge or simulated payment
- order detail
- after-sale submission when implemented

## AI Development Workflow

When asked to implement a frontend feature:

1. Read the relevant backend API docs and existing frontend code first.
2. Identify the domain module and endpoint names.
3. Define or reuse TypeScript DTOs before writing UI code.
4. Add or reuse API functions in `src/api`.
5. Add or reuse Pinia state only if the state is cross-page.
6. Implement the page or component with typed props, emits, loading, empty, and error states.
7. Keep changes minimal and avoid unrelated refactors.
8. Run type-check, lint, and build if possible.
9. If errors occur, fix by following diagnostics, not by rewriting unrelated files.

## Prohibited Patterns

- Do not use backend IDs as numbers.
- Do not submit frontend-calculated order amounts, payment amounts, freight, product names, or shop names when backend says not to.
- Do not PATCH status fields directly when the API requires action endpoints.
- Do not bypass `src/api/request.ts` with raw `fetch` or raw `axios` in pages.
- Do not hard-code token header as `Authorization`.
- Do not infer undocumented DTO fields.
- Do not silently ignore TypeScript errors.
- Do not create large unrelated rewrites while fixing small issues.
- Do not mix Vue JSX rules with React JSX assumptions.

## Review Checklist

Use this checklist before considering frontend code done:

- Types match `dto-catalog.md`.
- Endpoint path and method match `phase-1-api.md` or `phase-2-api.md`.
- IDs, money, timestamps, enums, pagination, and errors follow `common-contract.md`.
- Protected requests send `satoken`.
- Idempotent actions send `Idempotency-Key`.
- Vue files use `<script setup lang="ts">`.
- API calls are in `src/api`, not directly in views.
- Shared DTOs are in `src/types`.
- Cross-page state is in Pinia; local form state stays local.
- Route guards use permissions from `GET /api/auth/me`.
- Loading, empty, error, and permission-denied states are handled.
- Type-check, lint, and build are run or explicitly reported as not run.
