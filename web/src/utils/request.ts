import axios, { AxiosError } from 'axios'
import { router } from '@/router'
import { useAdminAuthStore } from '@/stores/adminAuth'
import { useAuthStore } from '@/stores/auth'
import type { ApiErrorResponse, ApiResponse } from '@/types/common'

export class ApiRequestError extends Error {
  code: string
  requestId?: string
  details?: ApiErrorResponse['details']
  status?: number

  constructor(message: string, options: { code: string; requestId?: string; details?: ApiErrorResponse['details']; status?: number }) {
    super(message)
    this.name = 'ApiRequestError'
    this.code = options.code
    this.requestId = options.requestId
    this.details = options.details
    this.status = options.status
  }
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'
const AUTH_ERROR_CODES = new Set(['AUTH_NOT_LOGGED_IN', 'AUTH_TOKEN_EXPIRED', 'AUTH_TOKEN_REPLACED', 'AUTH_TOKEN_KICKED_OUT'])

const request = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8000,
  headers: { Accept: 'application/json', 'Content-Type': 'application/json' }
})

function handleAuthExpired(code?: string, status?: number, requestUrl?: string, token?: string) {
  if (!((code && AUTH_ERROR_CODES.has(code)) || status === 401)) return

  const adminAuth = useAdminAuthStore()
  const isAdminRequest = requestUrl?.startsWith('/platform/') || token === adminAuth.token
  if (isAdminRequest) adminAuth.clearSession()
  else useAuthStore().clearSession()
  if (router.currentRoute.value.path !== '/login') void router.replace({ path: '/login' })
}

function unwrapResponse<T>(payload: ApiResponse<T>, requestUrl?: string, token?: string) {
  if (payload.code !== 'OK') {
    handleAuthExpired(payload.code, undefined, requestUrl, token)
    throw new ApiRequestError(payload.message || '请求处理失败', {
      code: payload.code,
      requestId: payload.requestId
    })
  }
  return payload.data
}

request.interceptors.request.use((config) => {
  const adminAuth = useAdminAuthStore()
  const userAuth = useAuthStore()
  const requestToken = config.headers?.satoken
  const isLoginRequest = config.url?.endsWith('/auth/login')
  const isAdminRequest = config.url?.startsWith('/platform/')
  const token = requestToken || (isLoginRequest ? '' : isAdminRequest ? adminAuth.token : userAuth.token)
  if (token) config.headers.satoken = token
  else delete config.headers.satoken
  return config
})

request.interceptors.response.use(
  (response) => unwrapResponse(response.data, response.config.url, response.config.headers?.satoken as string | undefined),
  (error: AxiosError<ApiErrorResponse>) => {
    const status = error.response?.status
    const data = error.response?.data
    handleAuthExpired(data?.code, status, error.config?.url, error.config?.headers?.satoken as string | undefined)

    return Promise.reject(new ApiRequestError(data?.message || error.message || '网络请求失败', {
      code: data?.code || 'NETWORK_ERROR',
      requestId: data?.requestId,
      details: data?.details,
      status
    }))
  }
)

export default request
