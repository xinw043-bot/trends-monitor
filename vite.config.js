import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://trends-monitor-2.vercel.app', // 替换为你的 Vercel 域名
        changeOrigin: true
      }
    }
  }
})