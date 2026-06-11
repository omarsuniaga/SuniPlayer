import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
  // signalsmith-stretch embeds its AudioWorklet + WASM in a single file using
  // import.meta/self-referencing tricks that esbuild pre-bundling breaks
  // (the node-creation promise hangs forever). Serve it unbundled.
  optimizeDeps: {
    exclude: ['signalsmith-stretch'],
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    setupFiles: ['./vitest.setup.ts'],
  },
})
