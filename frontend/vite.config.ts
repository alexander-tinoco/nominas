import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import viteCompression from 'vite-plugin-compression'

// Resolver la exportación default para evitar errores de firma de llamada de TypeScript
const compression = (viteCompression as any).default || viteCompression;

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    compression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 1025, // Comprimir archivos mayores a 1KB
      deleteOriginFile: false // Mantener los archivos originales para fallback
    })
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: new URL('./src/setupTests.ts', import.meta.url).pathname,
  },
})
