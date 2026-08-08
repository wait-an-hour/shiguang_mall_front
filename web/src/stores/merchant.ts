import { computed, shallowRef } from 'vue'
import { defineStore } from 'pinia'
import { useAuthStore } from './auth'
import type { Id } from '../types/common'
import type { ShopSummary } from '../types/merchant'

export const useMerchantStore = defineStore('merchant', () => {
  const currentShopId = shallowRef<Id | null>(null)

  const authStore = useAuthStore()

  const currentShop = computed<ShopSummary | null>(() => {
    return authStore.manageableShops.find((shop) => shop.id === currentShopId.value) ?? null
  })

  const currentShopPermissions = computed(() => currentShop.value?.permissions ?? [])
  const isShopActive = computed(() => currentShop.value?.status === 'ACTIVE')

  function setCurrentShop(shopId: Id | null) {
    currentShopId.value = shopId
  }

  function ensureShop(shopId: Id) {
    if (currentShopId.value !== shopId) {
      setCurrentShop(shopId)
    }

    return Boolean(currentShop.value)
  }

  function hasShopPermission(permission: string) {
    return currentShopPermissions.value.includes(permission)
  }

  function hasEveryShopPermission(permissions: string[]) {
    return permissions.every((permission) => hasShopPermission(permission))
  }

  function hasAnyShopPermission(permissions: string[]) {
    return permissions.some((permission) => hasShopPermission(permission))
  }

  return {
    currentShopId,
    currentShop,
    currentShopPermissions,
    isShopActive,
    setCurrentShop,
    ensureShop,
    hasShopPermission,
    hasEveryShopPermission,
    hasAnyShopPermission
  }
})
