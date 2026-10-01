import { applyLight } from '@world/light/applyLight'
import { aplicarFondo, leerFondoGuardado, aplicarPosicionX, leerPosicionXGuardada, urlDeFondo } from '@/lib/room/roomBackgrounds'
import { iniciarDebugViewport, registrarDebug } from '@/lib/debug/viewportDebug'

iniciarDebugViewport()

// Se ejecuta antes que main.tsx (ver el orden de los <script> en index.html)
// para que la habitación nunca haga un flash de la luz equivocada al abrir.
applyLight()

// Mismo motivo: pinta el fondo elegido (o el default '33') antes del
// primer paint, leyendo solo localStorage — la confirmación contra
// Supabase (otros dispositivos del mismo usuario) llega después, ya con
// sesión resuelta, ver App.tsx.
const fondoGuardado = leerFondoGuardado()
aplicarFondo(fondoGuardado)
aplicarPosicionX(leerPosicionXGuardada())

// Bug reportado (2026-10-01): el fondo (ahora WebP, ~150-250KB en vez
// de ~2.5MB en PNG) tardaba en llegar y a veces se veía "a medias" —
// el navegador recién lo pedía cuando el CSS con --room-photo se
// aplicaba, nunca antes. Un <link rel="preload"> explícito, inyectado
// en el mismo tick que aplicarFondo() (antes del primer paint de
// React), adelanta ese pedido lo más posible; el navegador lo
// deduplica solo si el <style> termina pidiendo la misma URL.
const preloadFondo = document.createElement('link')
preloadFondo.rel = 'preload'
preloadFondo.as = 'image'
preloadFondo.href = urlDeFondo(fondoGuardado)
document.head.appendChild(preloadFondo)

// La clase que bloquea toda transición (ver src/index.css) se saca recién
// ahora, en el mismo tick en el que la luz real ya quedó escrita — así la
// habitación aparece ya iluminada, nunca "encendiéndose", y la deriva de
// 60s vuelve a estar disponible para cuando el tiempo pase de verdad.
document.documentElement.classList.remove('light-boot')

/*
 * Altura base del layout (ver body/#root en src/index.css). Medido con el
 * panel de src/lib/debug/viewportDebug.ts en la PWA instalada en iPhone:
 * al abrir en frío, WKWebView reporta el layout viewport más corto por
 * exactamente safe-area-inset-top (873 en vez de 932) — innerHeight,
 * visualViewport.height y todas las unidades vh/dvh/svh heredan ese
 * error, y ningún evento lo corrige hasta el primer scroll del documento.
 * outerHeight (y screen.height) sí son correctos desde el ms 0, así que
 * la altura base sale de ahí y nunca de visualViewport.
 *
 * Solo en iOS standalone (navigator.standalone es exclusivo de iOS): en
 * Safari con pestañas, Android o escritorio outerHeight incluye el chrome
 * del navegador, y ahí el fallback 100dvh del CSS ya es correcto.
 *
 * Se mide una vez y se vuelve a medir solo cuando cambia el ancho
 * (rotación): 'orientationchange' dispara antes de que WebKit actualice
 * las dimensiones, mientras que el 'resize' de la rotación ya llega con
 * outerHeight nuevo — y el teclado nunca cambia el ancho, así que no
 * puede colarse acá.
 */
const html = document.documentElement
// La prueba f2 del panel de depuración (barra de estado 'black', ver
// index.html) saca el contenido de debajo de la barra: ahí outerHeight ya
// no es el alto disponible y no hay desfasaje que corregir.
const barraTranslucida =
  document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')?.getAttribute('content') === 'black-translucent'
const esIosStandalone = (navigator as { standalone?: boolean }).standalone === true && barraTranslucida
let altoBase = 0
let anchoMedido = 0

function medirAltoBase(): void {
  anchoMedido = window.innerWidth
  if (!esIosStandalone) return
  altoBase = Math.max(window.outerHeight, window.innerHeight)
  html.style.setProperty('--alto-base', `${altoBase}px`)
}
medirAltoBase()

window.addEventListener('resize', () => {
  if (window.innerWidth !== anchoMedido) medirAltoBase()
})

/** Alto completo contra el que se compara visualViewport para detectar el teclado. */
function altoDeReferencia(): number {
  return esIosStandalone ? altoBase : window.innerHeight
}

/*
 * Teclado: visualViewport se usa SOLO para esto. Abierto = el alto visible
 * quedó más de 120px por debajo del alto base (el desfasaje de 59px del
 * arranque en frío nunca alcanza) y no hay pinch-zoom de por medio.
 * Con el teclado abierto el layout NO se achica: body, la habitación y el
 * shell siguen a altura completa; solo se oculta la pill
 * (html.teclado-abierto .nav-inferior) y el <main> scrolleable suma
 * padding-bottom (.scroll-principal) para que los últimos campos (la Nota
 * de Nuevo movimiento incluida) puedan subir hasta el centro de la franja
 * visible. Después se centra el campo activo dentro de esa franja.
 */
const UMBRAL_TECLADO = 120
let tecladoAbierto = false

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

function abreTecladoNativo(el: EventTarget | null): el is HTMLElement {
  if (!(el instanceof HTMLElement)) return false
  if (el instanceof HTMLTextAreaElement) return true
  if (el instanceof HTMLInputElement) return !TIPOS_SIN_TECLADO.has(el.type)
  return el.isContentEditable
}

function contenedorScrolleable(el: HTMLElement): HTMLElement | null {
  for (let actual = el.parentElement; actual && actual !== document.body; actual = actual.parentElement) {
    const { overflowY } = getComputedStyle(actual)
    if ((overflowY === 'auto' || overflowY === 'scroll') && actual.scrollHeight > actual.clientHeight) return actual
  }
  return null
}

/**
 * Lleva el campo activo al centro del área visible sobre el teclado
 * (coordenadas del layout viewport: vv.offsetTop cubre el caso en que iOS
 * paneó el viewport visual). Un campo más alto que media pantalla (un
 * textarea crecido) se alinea por arriba en vez de por el centro.
 */
function centrarCampoActivo(): void {
  const vv = window.visualViewport
  const campo = document.activeElement
  if (!vv || !tecladoAbierto || !abreTecladoNativo(campo)) return
  const contenedor = contenedorScrolleable(campo)
  if (!contenedor) {
    registrarDebug(`centrar ${campo.tagName}: sin contenedor scrolleable`)
    return
  }
  const r = campo.getBoundingClientRect()
  const altoCampo = Math.min(r.height, vv.height * 0.5)
  const arribaDeseado = vv.offsetTop + (vv.height - altoCampo) / 2
  const delta = r.top - arribaDeseado
  if (Math.abs(delta) <= 4) return
  const antes = contenedor.scrollTop
  contenedor.scrollTop += delta
  registrarDebug(
    `centrar ${campo.tagName} y${Math.round(r.top)} banda ${Math.round(vv.offsetTop)}–${Math.round(vv.offsetTop + vv.height)} ` +
      `delta${Math.round(delta)} ${contenedor.tagName}.scrollTop ${Math.round(antes)}→${Math.round(contenedor.scrollTop)}`,
  )
}

/*
 * El centrado corre cuando el viewport visual ya se asentó, nunca en el
 * primer evento: iOS emite el resize del teclado al EMPEZAR a abrirlo y
 * después hace su propio "revelar campo" paneando el viewport visual
 * (vv.scroll), lo que corre la banda visible después de cualquier
 * centrado temprano — era lo que dejaba la Nota de Nuevo movimiento
 * debajo del teclado, con "Cuándo" a la vista. Cada resize/scroll con el
 * teclado abierto reprograma el centrado, así que corre una vez que iOS
 * terminó de moverse, y gana sobre los reencuadres propios de
 * NoteForm/Misiones. Centrar es idempotente (sin cambio si ya está a
 * ±4px), así que el pase de seguridad posterior al foco no mueve nada
 * si no hace falta. vv.scroll solo cuenta dentro de una ventana corta
 * tras el foco/apertura: un paneo manual posterior no devuelve el campo
 * al centro.
 */
const ESPERA_CENTRADO_MS = 150
const PASE_SEGURIDAD_MS = 650
const VENTANA_REVELADO_MS = 1200
let temporizadorCentrado: number | undefined
let reveladoHasta = 0

function abrirVentanaRevelado(): void {
  reveladoHasta = performance.now() + VENTANA_REVELADO_MS
}

function programarCentrado(): void {
  window.clearTimeout(temporizadorCentrado)
  temporizadorCentrado = window.setTimeout(centrarCampoActivo, ESPERA_CENTRADO_MS)
}

/**
 * Al cerrar el teclado, si iOS dejó la página desplazada por su propio
 * "revelar campo" (sY o vvTop distintos de 0), el contenido queda corrido
 * y aparece un hueco: se vuelve al origen una sola vez, disparado por el
 * cierre medido en visualViewport (no por focusout), y solo si hace falta.
 */
function restaurarPaginaTrasCierre(): void {
  const vv = window.visualViewport
  if (tecladoAbierto || (window.scrollY === 0 && (vv?.offsetTop ?? 0) === 0)) return
  registrarDebug(`cierre: sY${Math.round(window.scrollY)} vvTop${Math.round(vv?.offsetTop ?? 0)} → scrollTo(0,0)`)
  window.scrollTo(0, 0)
}

function actualizarTeclado(): void {
  const vv = window.visualViewport
  if (!vv) return
  const base = altoDeReferencia()
  const abierto = Math.abs(vv.scale - 1) < 0.01 && vv.height < base - UMBRAL_TECLADO
  const estabaAbierto = tecladoAbierto
  html.style.setProperty('--alto-teclado', abierto ? `${Math.round(base - vv.height)}px` : '0px')
  html.classList.toggle('teclado-abierto', abierto)
  tecladoAbierto = abierto
  if (abierto) {
    if (!estabaAbierto) abrirVentanaRevelado()
    programarCentrado()
  } else if (estabaAbierto) window.setTimeout(restaurarPaginaTrasCierre, ESPERA_CENTRADO_MS * 2)
}
window.visualViewport?.addEventListener('resize', actualizarTeclado)
window.visualViewport?.addEventListener('scroll', () => {
  if (tecladoAbierto && performance.now() < reveladoHasta) programarCentrado()
})

// Pasar de un campo a otro con el teclado ya abierto (Monto → Nota) no
// cambia el alto visible, así que no hay resize que lo cubra; el pase de
// seguridad cubre el caso en que iOS revela el campo sin emitir vv.scroll.
document.addEventListener('focusin', (event) => {
  if (!abreTecladoNativo(event.target)) return
  abrirVentanaRevelado()
  if (tecladoAbierto) programarCentrado()
  window.setTimeout(centrarCampoActivo, PASE_SEGURIDAD_MS)
})
