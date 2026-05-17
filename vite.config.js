import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const base = env.VITE_BASE_PATH || '/'

  const authProxyTarget = env.VITE_AUTH_PROXY_TARGET || 'http://localhost:9091'
  const filesProxyTarget = env.VITE_FILES_PROXY_TARGET || 'http://localhost:9092'

  return {
    plugins: [react()],
    base,
    server: {
      proxy: {
        '/api/auth': {
          target: authProxyTarget,
          changeOrigin: true,
        },
        '/api/files': {
          target: filesProxyTarget,
          changeOrigin: true,
        },
        '/api/health': {
          target: authProxyTarget,
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false,
      target: 'es2020',
    },
    preview: {
      host: '0.0.0.0',
      port: 4173,
    },
  }
})
