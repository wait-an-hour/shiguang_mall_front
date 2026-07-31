import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { PermissionCode, PlatformUser } from '@/types/admin'

const STORAGE_KEY = 'shiguang-admin-auth'

interface StoredAuth { token: string; user: PlatformUser | null }

function readStoredAuth(): StoredAuth {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) as StoredAuth : { token: '', user: null }
  } catch {
    return { token: '', user: null }
  }
}

export const useAuthStore = defineStore('auth', () => {
  const stored = readStoredAuth()
  const token = ref(stored.token)
  const user = ref<PlatformUser | null>(stored.user)
  const isLoggedIn = computed(() => Boolean(token.value && user.value))
  const role = computed(() => user.value?.role)
  const permissions = computed(() => user.value?.permissions ?? [])

  function persist() {
    // 只持久化 token 与基础用户上下文，不保存密码，避免本地泄露敏感凭据。
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: token.value, user: user.value }))
  }

  function setSession(nextToken: string, nextUser: PlatformUser) {
    token.value = nextToken
    user.value = nextUser
    persist()
  }

  function clearSession() {
    token.value = ''
    user.value = null
    localStorage.removeItem(STORAGE_KEY)
  }

  function hasPermissions(required: PermissionCode[] = []) {
    return required.every((item) => permissions.value.includes(item))
  }

  return { token, user, isLoggedIn, role, permissions, setSession, clearSession, hasPermissions }
})
