import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://inventory-backend-81oh.onrender.com',
        changeOrigin: true
      }
    }
  }
})