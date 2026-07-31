import { mockAdmin } from '@/mock/adminData'

export function loginAdmin(username: string, password: string) {
  // 页面通过 API 函数访问 Mock，后续切换真实接口时只需替换这里的实现，不影响登录页和权限守卫。
  return mockAdmin.login(username, password)
}
