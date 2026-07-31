import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  // 外层 src 已迁移到 web/src，根目录运行 Vite 时直接把 web 作为前端项目根目录。
  root: 'web',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true
  }
})
