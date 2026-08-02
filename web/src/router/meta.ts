import type { PermissionCode } from '@/types/admin'

export type AppLayout = 'merchant' | 'admin' | 'blank'

declare module 'vue-router' {
  interface RouteMeta {
    title: string
    layout: AppLayout
    requiresAuth?: boolean
    permissions?: PermissionCode[] | string[]
    role?: string
    shopScoped?: boolean
  }
}

export {}
