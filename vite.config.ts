import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const APP_PORT = 5137
const ADMIN_PORT = 5000
const AI_IMAGE_TARGET = 'https://2api.aiwanwu.cc'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const aiImageApiKey = env.AI_IMAGE_API_KEY || env.VITE_AI_IMAGE_API_KEY || ''
  const surface = mode === 'admin' ? 'admin' : 'app'
  const port = surface === 'admin' ? ADMIN_PORT : APP_PORT

  return {
    plugins: [
      react(),
      {
        name: 'filestore-surface-entry',
        transformIndexHtml: {
          order: 'pre',
          handler(html) {
            if (surface !== 'admin') {
              return html
            }

            return html.replace('/src/main.tsx', '/src/main.admin.tsx')
          },
        },
      },
    ],
    server: {
      port,
      strictPort: true,
      watch: {
        usePolling: true,
        interval: 300,
      },
      proxy:
        surface === 'app'
          ? {
              '/api/ai-image/generations': {
                target: AI_IMAGE_TARGET,
                changeOrigin: true,
                secure: true,
                rewrite: () => '/v1/images/generations',
                configure(proxy) {
                  proxy.on('proxyReq', (proxyReq, req) => {
                    if (aiImageApiKey && !req.headers.authorization) {
                      proxyReq.setHeader('Authorization', `Bearer ${aiImageApiKey}`)
                    }
                  })
                },
              },
            }
          : undefined,
    },
    preview: {
      port,
      strictPort: true,
    },
    build: {
      outDir: surface === 'admin' ? 'dist/admin' : 'dist/app',
    },
    define: {
      'import.meta.env.VITE_APP_SURFACE': JSON.stringify(surface),
    },
    test: {
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
    },
  }
})
