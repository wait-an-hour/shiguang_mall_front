import { computed, shallowRef } from 'vue'
import { defineStore } from 'pinia'
import { SHOP_PERMISSION } from '../constants/merchant'
import type { CurrentUserView } from '../types/merchant'

const mockUser: CurrentUserView = {
  id: 'USER202607310001',
  username: 'merchant_admin',
  displayName: '商家运营员',
  roles: ['MERCHANT_ADMIN'],
  platformPermissions: [],
  shops: [
    {
      id: 'SHOP202607260001',
      name: '时光数码店',
      code: 'SG-DIGITAL-001',
      status: 'ACTIVE',
      permissions: [
        SHOP_PERMISSION.ProductManage,
        SHOP_PERMISSION.InventoryManage,
        SHOP_PERMISSION.OrderRead,
        SHOP_PERMISSION.OrderShip,
        SHOP_PERMISSION.AfterSaleManage,
        SHOP_PERMISSION.MemberManage
      ]
    },
    {
      id: 'SHOP202607260002',
      name: '时光生活馆',
      code: 'SG-LIFE-002',
      status: 'PENDING',
      permissions: [SHOP_PERMISSION.ProductManage, SHOP_PERMISSION.InventoryManage, SHOP_PERMISSION.OrderRead]
    }
  ]
}

export const useAuthStore = defineStore('auth', () => {
  const token = shallowRef('mock-satoken-for-merchant-dev')
  const currentUser = shallowRef<CurrentUserView | null>(mockUser)

  const isLoggedIn = computed(() => Boolean(token.value && currentUser.value))
  const manageableShops = computed(() => currentUser.value?.shops ?? [])

  function hasPlatformPermission(permission: string) {
    return currentUser.value?.platformPermissions.includes(permission) ?? false
  }

  function clearSession() {
    token.value = ''
    currentUser.value = null
  }

  return {
    token,
    currentUser,
    isLoggedIn,
    manageableShops,
    hasPlatformPermission,
    clearSession
  }
})
