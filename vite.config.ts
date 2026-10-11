import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

// Unified Vite configuration for Laravel
export default defineConfig({
  base: '/dist/',
  publicDir: false,
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    outDir: 'public/dist',
    emptyOutDir: true,
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/leaflet')) {
            return 'vendor-leaflet';
          }
          if (id.includes('node_modules/react') || id.includes('node_modules/scheduler')) {
            return 'vendor-react';
          }
        },
      },
    },
  },
})
