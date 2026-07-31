import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// 统一使用 Vite 根路径别名，避免依赖 node:url、__dirname 或 @types/node。
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': '/src'
    }
  }
})
