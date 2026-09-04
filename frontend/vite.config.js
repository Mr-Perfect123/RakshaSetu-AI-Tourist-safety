import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5005',
        changeOrigin: true,
        secure: false
      },
      '/uploads': {
        target: 'http://localhost:5005',
        changeOrigin: true,
        secure: false
      },
      '/socket.io': {
        target: 'http://localhost:5005',
        ws: true,
        changeOrigin: true,
        secure: false
      }
    }
  }
})
