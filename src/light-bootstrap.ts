import { applyLight } from '@world/light/applyLight'
import { aplicarFondo, leerFondoGuardado, aplicarPosicionX, leerPosicionXGuardada } from '@/lib/room/roomBackgrounds'

// Se ejecuta antes que main.tsx (ver el orden de los <script> en index.html)
// para que la habitación nunca haga un flash de la luz equivocada al abrir.
applyLight()

// Mismo motivo: pinta el fondo elegido (o el default '33') antes del
// primer paint, leyendo solo localStorage — la confirmación contra
// Supabase (otros dispositivos del mismo usuario) llega después, ya con
// sesión resuelta, ver App.tsx.
aplicarFondo(leerFondoGuardado())
aplicarPosicionX(leerPosicionXGuardada())

// La clase que bloquea toda transición (ver src/index.css) se saca recién
// ahora, en el mismo tick en el que la luz real ya quedó escrita — así la
// habitación aparece ya iluminada, nunca "encendiéndose", y la deriva de
// 60s vuelve a estar disponible para cuando el tiempo pase de verdad.
document.documentElement.classList.remove('light-boot')

// --vh-real (ver .h-dvh-safe en src/index.css): ni dvh ni svh resolvieron
// el hueco bajo la pill del nav al abrir la PWA instalada en iOS — ahí no
// hay barra de direcciones que "asiente" después del primer render (no es
// el mecanismo de Safari con pestañas), así que la altura real solo se
// conoce midiendo. visualViewport.height es más preciso que innerHeight
// cuando existe soporte; si no, innerHeight es el único dato disponible.
// Corre acá (antes de que React monte, mismo motivo que applyLight/
// aplicarFondo arriba) para que el contenedor raíz de AppShell ya nazca
// con la altura correcta en el primer paint, en vez de heredar un valor
// de CSS que todavía no asentó.
function medirVhReal(): void {
  const alto = window.visualViewport?.height ?? window.innerHeight
  document.documentElement.style.setProperty('--vh-real', `${alto}px`)
}
medirVhReal()

// Solo 'resize', nunca 'scroll': ese fue exactamente el desfasaje que
// causaba useNavAncladaAlViewportVisual (Sprint "eliminar motor de luz"),
// que medía en cada scroll y terminaba peleando con el propio scroll del
// teclado. 'resize' solo dispara ante un cambio real de tamaño — el
// asentamiento tardío de WKWebView al lanzar la PWA standalone incluido
// — y se mantiene escuchando toda la vida de la página (no solo la
// primera vez) porque el mismo evento también cubre rotación de
// pantalla y apertura/cierre de teclado.
window.visualViewport?.addEventListener('resize', medirVhReal)
