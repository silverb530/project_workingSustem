import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    proxy: {
      '/api': 'http://192.168.0.101:5001',
      '/route': 'http://localhost:5000',
      '/manage': 'http://localhost:5000'
    }
  }
})
