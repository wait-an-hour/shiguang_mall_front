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

function handleAuthExpired(code?: string, status?: number) {
  if ((code && AUTH_ERROR_CODES.has(code)) || status === 401) {
    useAdminAuthStore().clearSession()
    useAuthStore().clearSession()
    router.replace({ path: '/login' })
  }
}

function unwrapResponse<T>(payload: ApiResponse<T>) {
  if (payload.code !== 'OK') {
    handleAuthExpired(payload.code)
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
  const token = adminAuth.token || userAuth.token
  if (token) config.headers.satoken = token
  return config
})

request.interceptors.response.use(
  (response) => unwrapResponse(response.data),
  (error: AxiosError<ApiErrorResponse>) => {
    const status = error.response?.status
    const data = error.response?.data
    handleAuthExpired(data?.code, status)

    return Promise.reject(new ApiRequestError(data?.message || error.message || '网络请求失败', {
      code: data?.code || 'NETWORK_ERROR',
      requestId: data?.requestId,
      details: data?.details,
      status
    }))
  }
)

export default request
