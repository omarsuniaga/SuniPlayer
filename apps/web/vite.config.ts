import { defineConfig, createLogger } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

const logger = createLogger();

// https://vitejs.dev/config/
export default defineConfig({
    customLogger: logger,
    define: {
        __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
        __BUILD_DATE__: JSON.stringify(new Date().toLocaleDateString('es-ES', { timeZone: 'America/Caracas', year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-')),
        __BUILD_TIME__: JSON.stringify(new Date().toLocaleTimeString('es-ES', { timeZone: 'America/Caracas', hour: '2-digit', minute: '2-digit', hour12: false })),
    },
    server: {
        host: true,
        port: 5173,
        hmr: {
            host: 'localhost',
            port: 5173,
        },
    },
    plugins: [
        react(),
        nodePolyfills(),
        VitePWA({
            registerType: 'autoUpdate',
            manifest: false,
            workbox: {
                cleanupOutdatedCaches: true,
                clientsClaim: true,
                skipWaiting: true,
                // include the vendored signalsmith worklet so playback works offline
                globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest,mjs}'],
            },
            includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg', 'manifest.webmanifest'],
        })
    ],
    build: {
        rollupOptions: {
            output: {
                // Split heavy, rarely-changing third-party families into their own
                // chunks so the browser parses less up front and caches them across
                // deploys (app code changes far more often than these vendors).
                manualChunks(id) {
                    if (!id.includes('node_modules')) return;
                    if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return 'react';
                    if (id.includes('node_modules/firebase') || id.includes('@firebase')) return 'firebase';
                    if (/node_modules[\\/](simple-peer|socket\.io-client|engine\.io|ws)[\\/]/.test(id)) return 'sync';
                    return 'vendor';
                },
            },
        },
    },
})
