import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  // 外层 src 已迁移到 web/src，根目录运行 Vite 时直接把 web 作为前端项目根目录。
  root: 'web',
  plugins: [vue()],
  server: {
    // 显式绑定本机回环地址，避免在当前 Windows 环境里默认解析 localhost 触发 DNS/Socket 异常。
    host: '127.0.0.1',
    port: 5173,
    strictPort: true
  },
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
