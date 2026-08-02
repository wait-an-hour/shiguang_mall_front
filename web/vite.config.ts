import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// 统一使用 Vite 根路径别名，避免依赖 node:url、__dirname 或 @types/node。
export default defineConfig({
  plugins: [vue()],
  server: {
    // 直接指定回环地址，避免 dev server 在当前环境下回退到 localhost 解析。
    host: '127.0.0.1',
    port: 5173,
    strictPort: true
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
})
