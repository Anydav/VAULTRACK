import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    server: {
      port: 5173,
      // Forward /api to the backend so the login cookie is same-site in dev
      // too (Vercel does the same in production, see vercel.json).
      proxy: {
        '/api': { target: env.VITE_API_BASE_URL, changeOrigin: true },
      },
    },
  }
})
