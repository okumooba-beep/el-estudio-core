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

// Bug reportado: al abrir la PWA instalada (standalone, sin barra de
// direcciones) queda un hueco vacío bajo el nav hasta que el usuario hace
// scroll — y ese scroll no "arregla" nada por sí mismo, solo dispara el
// resize de visualViewport de arriba, que es lo que en realidad corrige
// --vh-real. La causa: WKWebView a veces termina de asentar su tamaño
// real *después* de que medirVhReal() ya corrió una vez, sin emitir ese
// resize — el evento cubre teclado y rotación de forma confiable, pero no
// siempre ese asentamiento tardío del lanzamiento. En vez de depender de
// un scroll manual del usuario para heredar el resize "gratis", se remide
// unas pocas veces más durante el primer segundo de vida de la página:
// barato (un setProperty, no fuerza reflow) y sin efecto una vez que el
// valor ya convergió.
function ramaDeMediciones(): void {
  ;[0, 100, 300, 600, 1000].forEach((ms) => window.setTimeout(medirVhReal, ms))
}
ramaDeMediciones()

// Bug reportado de nuevo (2026-09-24) tras lo de arriba: la ráfaga inicial
// solo corre una vez, en el primer load real de la página — pero la PWA
// instalada en iOS casi nunca hace un load real al "abrirse" desde el
// ícono: la mayoría de las veces el sistema solo reanuda un WKWebView que
// ya estaba suspendido en background, y esa reanudación puede cambiar el
// tamaño real disponible (rotación, cambio de safe-area, etc. mientras
// estaba en segundo plano) sin disparar 'resize' de visualViewport — es
// el mismo asentamiento tardío de arriba, pero en el momento de volver, no
// en el de abrir por primera vez. 'visibilitychange' (se vuelve visible) y
// 'pageshow' (con bfcache, `persisted: true`) son los dos eventos que sí
// cubren esa reanudación — repetir acá la misma ráfaga corta de
// mediciones hace que "volver a la app" quede cubierto igual que "abrirla
// por primera vez", sin que el usuario tenga que scrollear para heredar
// el resize "gratis".
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') ramaDeMediciones()
})
window.addEventListener('pageshow', ramaDeMediciones)

/**
 * .nav-inferior es position:absolute con bottom:0 contra este mismo
 * contenedor de --vh-real (ver .h-dvh-safe/.nav-inferior en index.css):
 * al abrir el teclado, --vh-real se achica al alto visible arriba de él,
 * así que la pill deja de estar al borde real de la pantalla y pasa a
 * flotar en la mitad del formulario, tapando los campos que siguen
 * (bug reportado: la pill Hoy/Misiones/Hábitos/Finanzas/Espacios
 * apareciendo entre "Efectivo/Transferencia" y las categorías mientras
 * se escribe el monto). Se oculta mientras hay foco en un campo que de
 * verdad dispara el teclado nativo — excluye checkbox/radio/date/etc,
 * que abren su propio picker y no reducen visualViewport de la misma
 * forma — y vuelve a aparecer al perder el foco. focusin/focusout
 * delegados en document (nunca por input individual) para cubrir
 * cualquier input que se monte después, mismo criterio "corre una sola
 * vez, para toda la vida de la página" que medirVhReal arriba.
 */
const TIPOS_SIN_TECLADO = new Set([
  'checkbox',
  'radio',
  'range',
  'button',
  'submit',
  'reset',
  'file',
  'color',
  'date',
  'time',
  'datetime-local',
  'month',
  'week',
])

function abreTecladoNativo(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false
  if (el instanceof HTMLTextAreaElement) return true
  if (el instanceof HTMLInputElement) return !TIPOS_SIN_TECLADO.has(el.type)
  return el.isContentEditable
}

document.addEventListener('focusin', (event) => {
  if (abreTecladoNativo(event.target)) document.documentElement.classList.add('teclado-abierto')
})
document.addEventListener('focusout', (event) => {
  if (abreTecladoNativo(event.target)) document.documentElement.classList.remove('teclado-abierto')
})
