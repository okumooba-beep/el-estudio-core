import { defineConfig, type Plugin } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'
import { gzipSync } from 'node:zlib'

/**
 * F13 (ARCHITECTURE_RATIFIED.md Parte I §14): presupuesto de tamaño de
 * bundle que falla el build si se excede — "no como aspiración, sino
 * un paso que falla el build si se excede". El riesgo real a años
 * vista es que la superficie de paquetes/módulos crezca sin que nadie
 * lo note hasta que el usuario lo sienta como lentitud. Mide el JS+CSS
 * que el navegador descarga en la primera visita (gzip, que es lo que
 * viaja por red); el service worker/workbox de VitePWA queda fuera a
 * propósito — es infraestructura de cache, no parte de esa descarga.
 */
function bundleSizeBudget(budgetBytes: number): Plugin {
  return {
    name: 'bundle-size-budget',
    apply: 'build',
    generateBundle(_options, bundle) {
      let totalGzip = 0
      for (const file of Object.values(bundle)) {
        if (file.type === 'chunk') {
          totalGzip += gzipSync(file.code).length
        } else if (file.fileName.endsWith('.css')) {
          totalGzip += gzipSync(typeof file.source === 'string' ? file.source : Buffer.from(file.source)).length
        }
      }
      if (totalGzip > budgetBytes) {
        const actual = (totalGzip / 1024).toFixed(1)
        const budget = (budgetBytes / 1024).toFixed(0)
        this.error(`Presupuesto de tamaño de bundle excedido: ${actual} KB gzip (presupuesto: ${budget} KB gzip).`)
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    bundleSizeBudget(200 * 1024),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'El Estudio',
        short_name: 'El Estudio',
        description: 'Un lugar personal para pensar. Hoy es el único lugar donde puedes actuar.',
        theme_color: '#120F0C',
        background_color: '#120F0C',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        id: '/',
        lang: 'es',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: '/icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        navigateFallback: '/index.html',
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@design-system': fileURLToPath(new URL('./src/packages/estudio-design-system', import.meta.url)),
      '@cognitive-engine': fileURLToPath(new URL('./src/packages/cognitive-engine', import.meta.url)),
      '@world': fileURLToPath(new URL('./src/packages/world', import.meta.url)),
      '@shared-kernel': fileURLToPath(new URL('./src/packages/shared-kernel', import.meta.url)),
      '@modules': fileURLToPath(new URL('./src/modules', import.meta.url)),
    },
  },
  server: {
    host: true,
  },
  // F12 (ARCHITECTURE_RATIFIED.md): entorno 'node', no jsdom — los tres
  // smoke tests (shared-kernel, clasificador de reglas, repositorio vía
  // fake-indexeddb) no renderizan nada, no necesitan DOM.
  test: {
    environment: 'node',
  },
})
