import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')

  return {
    plugins: [react()],
    server: {
      // El API responde `Access-Control-Allow-Origin: *` sin
      // `Access-Control-Allow-Credentials`, combinación que el navegador
      // rechaza en peticiones con `credentials: 'include'`. Proxyando desde el
      // mismo origen no hay CORS y la cookie `session` viaja como first-party.
      proxy: {
        '/api': {
          target: env.VITE_API_PROXY_TARGET || 'http://localhost:8082',
          changeOrigin: true,
        },
      },
    },
  }
})
