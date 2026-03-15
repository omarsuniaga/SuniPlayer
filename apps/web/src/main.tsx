import React from 'react'
import ReactDOM from 'react-dom/client'
import { configureStorage } from '@suniplayer/core';
import App from './App.tsx'
import './index.css'

configureStorage(localStorage);

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)
