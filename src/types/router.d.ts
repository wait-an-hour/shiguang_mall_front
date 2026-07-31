import 'vue-router'
import type { AdminRole, PermissionCode } from './admin'

declare module 'vue-router' {
  interface RouteMeta {
    title: string
    requiresAuth?: boolean
    role?: AdminRole
    permissions?: PermissionCode[]
  }
}
