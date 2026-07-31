export type AppLayout = 'merchant' | 'blank'

declare module 'vue-router' {
  interface RouteMeta {
    title: string
    layout: AppLayout
    requiresAuth?: boolean
    permissions?: string[]
    shopScoped?: boolean
  }
}

export {}
