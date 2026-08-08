import { computed, shallowRef } from 'vue'
import { defineStore } from 'pinia'
import { getCurrentUser, login as loginApi, logout as logoutApi, register as registerApi } from '@/api/auth'
import type { RegisterRequest } from '@/api/auth'
import type { CurrentUserView } from '../types/merchant'

const STORAGE_KEY = 'shiguang-auth-session'

interface StoredSession {
  token: string
  currentUser: CurrentUserView | null
}

function readSession(): StoredSession {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return { token: '', currentUser: null }
  try {
    return JSON.parse(raw) as StoredSession
  } catch {
    return { token: '', currentUser: null }
  }
}

export const useAuthStore = defineStore('auth', () => {
  const stored = readSession()
  const token = shallowRef(stored.token)
  const currentUser = shallowRef<CurrentUserView | null>(stored.currentUser)

  const isLoggedIn = computed(() => Boolean(token.value && currentUser.value))
  const manageableShops = computed(() => currentUser.value?.shops ?? [])

  function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: token.value, currentUser: currentUser.value }))
  }

  function hasPlatformPermission(permission: string) {
    return currentUser.value?.platformPermissions.includes(permission) ?? false
  }

  function setSession(nextToken: string, nextUser: CurrentUserView) {
    token.value = nextToken
    currentUser.value = nextUser
    persist()
  }

  async function login(username: string, password: string) {
    const loginView = await loginApi(username, password)
    token.value = loginView.tokenValue
    currentUser.value = await getCurrentUser(loginView.tokenValue)
    persist()
    return currentUser.value
  }

  async function register(data: RegisterRequest) {
    return await registerApi(data)
  }

  async function refreshCurrentUser() {
    currentUser.value = await getCurrentUser()
    persist()
    return currentUser.value
  }

  async function logout() {
    try {
      if (token.value) await logoutApi(token.value)
    } finally {
      clearSession()
    }
  }

  function clearSession() {
    token.value = ''
    currentUser.value = null
    localStorage.removeItem(STORAGE_KEY)
  }

  return {
    token,
    currentUser,
    isLoggedIn,
    manageableShops,
    hasPlatformPermission,
    setSession,
    login,
    register,
    refreshCurrentUser,
    logout,
    clearSession
  }
})
