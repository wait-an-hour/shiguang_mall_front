import axios, { AxiosError } from 'axios'
import router from '@/router'
import { useAuthStore } from '@/stores/auth'

const request = axios.create({
  baseURL: '/api',
  timeout: 8000,
  headers: { Accept: 'application/json', 'Content-Type': 'application/json' }
})

request.interceptors.request.use((config) => {
  const auth = useAuthStore()
  // Sa-Token 后端约定使用 satoken 请求头；Mock 页面也保留该逻辑，后续替换真实后端时页面层无需改动。
  if (auth.token) config.headers.satoken = auth.token
  return config
})

request.interceptors.response.use(
  (response) => response.data,
  (error: AxiosError) => {
    const status = error.response?.status
    if (status === 401 || status === 403) {
      const auth = useAuthStore()
      const loginPath = auth.user?.role === 'MERCHANT' ? '/shop/login' : '/admin/login'
      auth.clearSession()
      router.replace({ path: loginPath })
    }
    return Promise.reject(error)
  }
)

export default request
