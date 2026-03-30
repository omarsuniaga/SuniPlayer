import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
    define: {
        __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
        __BUILD_DATE__: JSON.stringify(new Date().toLocaleDateString('es-ES', { timeZone: 'America/Caracas', year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-')),
        __BUILD_TIME__: JSON.stringify(new Date().toLocaleTimeString('es-ES', { timeZone: 'America/Caracas', hour: '2-digit', minute: '2-digit', hour12: false })),
    },
    server: {
        host: true,
        port: 5173,
        hmr: {
            port: 5173,
        },
    },
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            workbox: {
                cleanupOutdatedCaches: true,
                clientsClaim: true,
                skipWaiting: true,
            },
            includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
            manifest: {
                name: 'SuniPlayer',
                short_name: 'SuniPlayer',
                description: 'Audio Player for Solo Performers',
                theme_color: '#0A0E14',
                background_color: '#0A0E14',
                display: 'standalone',
                icons: [
                    {
                        src: 'pwa-192x192.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: 'pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png'
                    },
                    {
                        src: 'pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any maskable'
                    }
                ]
            }
        })
    ],
})
