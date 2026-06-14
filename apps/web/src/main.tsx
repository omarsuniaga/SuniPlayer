import React from 'react'
import ReactDOM from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import { configureStorage } from '@suniplayer/core';
import { storage } from './platform/index';
import App from './App.tsx'
import './index.css'

// Register PWA service worker
registerSW({ immediate: true })

// Configure core to use our high-performance IndexedDB storage
configureStorage(storage);

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)
