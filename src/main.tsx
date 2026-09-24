import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '@/lib/auth/AuthContext'
import './index.css'
import App from './App.tsx'

/**
 * Bug reportado repetido (2026-09-24): más de un fix ya enviado (hueco de
 * nav, duplicado de períodos) seguía "sin resolverse" para el usuario
 * incluso después de verificar build limpio y pushear. Causa real: sw.ts
 * llama `self.skipWaiting()` + `clientsClaim()` sin condición, así que un
 * service worker nuevo instala y toma control de la pestaña ya abierta en
 * segundo plano casi de inmediato — pero sin este listener, nada reacciona
 * a ese `controllerchange`, así que la página ya abierta sigue corriendo el
 * JS viejo indefinidamente (aunque el SW nuevo ya esté activo). `refreshing`
 * evita un loop si el evento llegara a dispararse más de una vez.
 */
if ('serviceWorker' in navigator) {
  let refreshing = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return
    refreshing = true
    window.location.reload()
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
