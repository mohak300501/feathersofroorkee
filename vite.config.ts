import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, './src'),
    },
  },

  server: {
    port: 5173,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/.netlify/functions': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },

  build: {
    outDir: 'dist',
    sourcemap: true,

    rollupOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'vendor',
              test: /node_modules[\\/](react|react-dom|react-router-dom)/,
            },
            {
              name: 'firebase',
              test: /node_modules[\\/]firebase[\\/](app|auth)/,
            },
            {
              name: 'ui',
              test: /node_modules[\\/](lucide-react|react-hot-toast)/,
            },
            {
              name: 'utils',
              test: /node_modules[\\/]date-fns/,
            },
          ],
        },
      },
    },

    chunkSizeWarningLimit: 1000,
  },

  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
})