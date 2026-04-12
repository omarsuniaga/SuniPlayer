import { defineConfig, createLogger } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

const logger = createLogger();
const loggerWarn = logger.warn.bind(logger);
logger.warn = (msg, options) => {
    if (msg.includes('@soundtouchjs') && msg.includes('Sourcemap')) return;
    loggerWarn(msg, options);
};

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
            },
            includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg', 'manifest.webmanifest'],
        })
    ],
    optimizeDeps: {
        exclude: ['@soundtouchjs/audio-worklet']
    },
})
