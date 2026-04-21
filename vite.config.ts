import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8081',
        changeOrigin: true,
      },
      '/local-files': {
        target: 'http://127.0.0.1:8081',
        changeOrigin: true,
      },
      // 与 nginx.conf 一致：私密消息 WebSocket（Chat.tsx 在 VITE_API_BASE_URL 为空时连同源 /ws/chat）
      '/ws': {
        target: 'http://127.0.0.1:8081',
        changeOrigin: true,
        ws: true,
      },
    },
  },
})
