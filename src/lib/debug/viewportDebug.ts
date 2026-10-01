// Panel temporal de depuración del viewport (hueco bajo la nav en la PWA de iOS).
// Se activa con ?debug=1 (persiste en localStorage; ?debug=0 lo apaga) o con un
// toque largo (~0,8s) en la franja superior de la pantalla.

const CLAVE = 'debug.viewport'
const TIEMPOS = [0, 500, 1500, 3000]
const MAX_EVENTOS = 15

let panel: HTMLDivElement | null = null
let sonda: HTMLDivElement | null = null
let snapshots: string[] = []
let eventos: string[] = []
let lineaViva = ''
let intervalo: number | undefined
let ultimoPorTipo = new Map<string, string>()
let escuchando = false
let abajo = false
let transparente = false
let ultimoToqueY: number | null = null
let pruebas: string[] = []
let indiceAltoHtml = 0

const MAX_PRUEBAS = 24
const CLAVE_BARRA = 'debug.statusBar'
const ALTOS_HTML = ['100vh', '100%', '-webkit-fill-available', '']

function leerFlag(): boolean {
  try {
    return localStorage.getItem(CLAVE) === '1'
  } catch {
    return false
  }
}

function escribirFlag(on: boolean): void {
  try {
    if (on) localStorage.setItem(CLAVE, '1')
    else localStorage.removeItem(CLAVE)
  } catch {
    /* sin storage: el panel vive solo esta sesión */
  }
}

function n(v: number | undefined | null): string {
  return v == null ? '—' : String(Math.round(v * 10) / 10)
}

function rect(sel: string): string {
  const el = document.querySelector(sel)
  if (!el) return '—'
  const r = el.getBoundingClientRect()
  return `y${n(r.top)} h${n(r.height)} b${n(r.bottom)}`
}

function safeAreas(): string {
  if (!sonda) {
    sonda = document.createElement('div')
    sonda.style.cssText =
      'position:fixed;top:0;left:0;width:0;height:0;visibility:hidden;pointer-events:none;' +
      'padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)'
    document.body.appendChild(sonda)
  }
  const cs = getComputedStyle(sonda)
  return `t${parseFloat(cs.paddingTop)} r${parseFloat(cs.paddingRight)} b${parseFloat(cs.paddingBottom)} l${parseFloat(cs.paddingLeft)}`
}

function medicion(): string {
  const vv = window.visualViewport
  const de = document.documentElement
  const altoBase = de.style.getPropertyValue('--alto-base') || '—'
  const altoTeclado = de.style.getPropertyValue('--alto-teclado') || '—'
  const teclado = de.classList.contains('teclado-abierto') ? 'SI' : 'no'
  const activo = document.activeElement
  const campo = activo && activo !== document.body ? activo.getBoundingClientRect() : null
  return [
    `iH${window.innerHeight} oH${window.outerHeight} vvH${n(vv?.height)} vvTop${n(vv?.offsetTop)} vvPageTop${n(vv?.pageTop)} scrH${screen.height} cH${de.clientHeight} sH${de.scrollHeight} sY${n(window.scrollY)}`,
    `  html ${rect('html')} | body ${rect('body')} | #root ${rect('#root')}`,
    `  shell ${rect('.h-dvh-safe')} | main ${rect('main')} | nav ${rect('.nav-inferior')}`,
    `  fondo ${rect('.room-layer-photo')} | safe ${safeAreas()}`,
    `  --alto-base ${altoBase} | teclado ${teclado} --alto-teclado ${altoTeclado} | campo ${campo ? `${activo?.tagName} y${n(campo.top)} b${n(campo.bottom)}` : '—'} | toqueY ${n(ultimoToqueY)}`,
  ].join('\n')
}

function render(): void {
  if (!panel) return
  const cuerpo = panel.querySelector('pre')
  if (!cuerpo) return
  const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true
  cuerpo.textContent = [
    `standalone=${standalone} dpr=${window.devicePixelRatio} ua=${navigator.userAgent.slice(0, 60)}`,
    `— EN VIVO (+${Math.round(performance.now())}ms) —`,
    lineaViva,
    '— PRUEBAS —',
    ...pruebas,
    '— SNAPSHOTS —',
    ...snapshots,
    '— EVENTOS —',
    ...eventos,
  ].join('\n')
}

function programarSnapshots(etiqueta: string): void {
  const base = performance.now()
  for (const ms of TIEMPOS) {
    window.setTimeout(() => {
      const real = Math.round(performance.now() - base)
      snapshots.push(`[${etiqueta} ${ms}ms (real +${real}, t${Math.round(performance.now())})]\n${medicion()}`)
      render()
    }, ms)
  }
}

function registrar(tipo: string): void {
  const vv = window.visualViewport
  const valores = `iH${window.innerHeight} vvH${n(vv?.height)} vvTop${n(vv?.offsetTop)} sY${n(window.scrollY)} shell ${rect('.h-dvh-safe')}`
  if ((tipo === 'scroll' || tipo === 'vv.scroll') && ultimoPorTipo.get(tipo) === valores) return
  ultimoPorTipo.set(tipo, valores)
  eventos.push(`+${Math.round(performance.now())} ${tipo} ${valores}`)
  if (eventos.length > MAX_EVENTOS) eventos = eventos.slice(-MAX_EVENTOS)
  render()
}

function corto(): string {
  const vv = window.visualViewport
  const bottom = (sel: string) => {
    const el = document.querySelector(sel)
    return el ? n(el.getBoundingClientRect().bottom) : '—'
  }
  return `iH${window.innerHeight} vvH${n(vv?.height)} cH${document.documentElement.clientHeight} sY${n(window.scrollY)} | nav b${bottom('.nav-inferior')} shell b${bottom('.h-dvh-safe')}`
}

function anotar(linea: string): void {
  pruebas.push(linea)
  if (pruebas.length > MAX_PRUEBAS) pruebas = pruebas.slice(-MAX_PRUEBAS)
  render()
}

/** Aplica UNA técnica y anota antes / +0ms / +300ms; `aplicar` puede devolver cómo deshacerla (corre después de la medición de +300ms). */
function probar(nombre: string, aplicar: () => (() => void) | void): void {
  anotar(`${nombre} antes: ${corto()}`)
  const revertir = aplicar()
  window.setTimeout(() => anotar(`${nombre} +0: ${corto()}`), 0)
  window.setTimeout(() => {
    anotar(`${nombre} +300: ${corto()}`)
    revertir?.()
  }, 300)
}

function metaViewport(): HTMLMetaElement | null {
  return document.querySelector('meta[name="viewport"]')
}

function metaBarra(): HTMLMetaElement | null {
  return document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')
}

const PRUEBAS: [string, () => void][] = [
  [
    'a',
    () =>
      probar('a scrollTo(0,1)→(0,0)', () => {
        const de = document.documentElement
        const altoPrevio = de.style.height
        de.style.height = '100.5%'
        window.scrollTo(0, 1)
        window.requestAnimationFrame(() => window.scrollTo(0, 0))
        return () => {
          de.style.height = altoPrevio
        }
      }),
  ],
  [
    'b',
    () =>
      probar('b meta viewport quitar/reinsertar', () => {
        const meta = metaViewport()
        if (!meta) return
        const padre = meta.parentNode
        const siguiente = meta.nextSibling
        meta.remove()
        window.requestAnimationFrame(() => padre?.insertBefore(meta, siguiente))
      }),
  ],
  [
    'c',
    () =>
      probar('c meta viewport +maximum-scale y revertir', () => {
        const meta = metaViewport()
        if (!meta) return
        const original = meta.getAttribute('content') ?? ''
        meta.setAttribute('content', `${original}, maximum-scale=1`)
        window.requestAnimationFrame(() => meta.setAttribute('content', original))
      }),
  ],
  [
    'd',
    () =>
      probar('d resize + reflow', () => {
        window.dispatchEvent(new Event('resize'))
        void document.documentElement.offsetHeight
        void document.body.offsetHeight
      }),
  ],
  [
    'e',
    () => {
      const valor = ALTOS_HTML[indiceAltoHtml % ALTOS_HTML.length] ?? ''
      indiceAltoHtml++
      probar(`e html{height:${valor || 'original'}}`, () => {
        document.documentElement.style.height = valor
      })
    },
  ],
  [
    'f',
    () =>
      probar('f status-bar default y volver', () => {
        const meta = metaBarra()
        if (!meta) return
        const original = meta.getAttribute('content') ?? ''
        meta.setAttribute('content', 'default')
        window.setTimeout(() => meta.setAttribute('content', original), 100)
      }),
  ],
  [
    'f2',
    () => {
      let activa = false
      try {
        activa = localStorage.getItem(CLAVE_BARRA) === 'black'
        if (activa) localStorage.removeItem(CLAVE_BARRA)
        else localStorage.setItem(CLAVE_BARRA, 'black')
      } catch {
        /* sin storage no hay prueba f2 */
      }
      anotar(
        activa
          ? 'f2 APAGADA: el próximo arranque vuelve a black-translucent'
          : `f2 ACTIVA: cerrá la app del todo y abrila en frío (barra 'black'; ahora: ${metaBarra()?.getAttribute('content') ?? '—'})`,
      )
    },
  ],
]

function boton(texto: string, onClick: () => void): HTMLButtonElement {
  const b = document.createElement('button')
  b.type = 'button'
  b.textContent = texto
  b.style.cssText = 'font:inherit;color:#fff;background:#333;border:1px solid #666;border-radius:4px;padding:2px 8px;margin-right:6px'
  b.addEventListener('click', onClick)
  return b
}

/**
 * "mover": arriba (bajo la barra de estado) o abajo, pegado al borde
 * inferior del área visible — con el teclado abierto eso es justo arriba
 * del teclado, así el formulario queda a la vista. "transp.": el panel se
 * vuelve casi transparente y deja pasar los toques (salvo la barra de
 * botones).
 */
function ubicarPanel(): void {
  if (!panel) return
  const vv = window.visualViewport
  if (abajo && vv) {
    panel.style.maxHeight = `${Math.round(vv.height * 0.4)}px`
    panel.style.top = `${Math.round(vv.offsetTop + vv.height - panel.offsetHeight - 4)}px`
  } else {
    panel.style.maxHeight = '55vh'
    panel.style.top = 'calc(env(safe-area-inset-top) + 4px)'
  }
  panel.style.opacity = transparente ? '0.35' : '1'
  panel.style.pointerEvents = transparente ? 'none' : 'auto'
}

function abrirPanel(etiqueta: string): void {
  if (panel) return
  panel = document.createElement('div')
  panel.setAttribute('data-debug-viewport', '')
  panel.style.cssText =
    'position:fixed;left:4px;right:4px;top:calc(env(safe-area-inset-top) + 4px);z-index:2147483647;' +
    'max-height:55vh;overflow:auto;background:rgba(0,0,0,0.85);color:#9f9;' +
    'font:10px/1.35 ui-monospace,Menlo,monospace;padding:6px;border-radius:6px;' +
    '-webkit-user-select:text;user-select:text;transition:none'
  const barra = document.createElement('div')
  barra.style.cssText = 'margin-bottom:4px;pointer-events:auto'
  barra.append(
    boton('mover', () => {
      abajo = !abajo
      ubicarPanel()
    }),
    boton('transp.', () => {
      transparente = !transparente
      ubicarPanel()
    }),
    boton('copiar', () => {
      const texto = panel?.querySelector('pre')?.textContent ?? ''
      void navigator.clipboard?.writeText(texto).catch(() => undefined)
    }),
    boton('snapshot', () => programarSnapshots('manual')),
    boton('ocultar', () => cerrarPanel(false)),
    boton('apagar', () => cerrarPanel(true)),
  )
  const barraPruebas = document.createElement('div')
  barraPruebas.style.cssText = 'margin-bottom:4px;pointer-events:auto'
  barraPruebas.append('prueba: ', ...PRUEBAS.map(([texto, accion]) => boton(texto, accion)))
  const pre = document.createElement('pre')
  pre.style.cssText = 'margin:0;white-space:pre-wrap;word-break:break-all'
  panel.append(barra, barraPruebas, pre)
  document.body.appendChild(panel)

  programarSnapshots(etiqueta)
  const vivo = () => {
    lineaViva = medicion()
    render()
    ubicarPanel()
  }
  vivo()
  intervalo = window.setInterval(vivo, 250)

  if (escuchando) return
  escuchando = true
  window.visualViewport?.addEventListener('resize', () => registrar('vv.resize'))
  window.visualViewport?.addEventListener('scroll', () => registrar('vv.scroll'))
  window.addEventListener('resize', () => registrar('win.resize'))
  window.addEventListener('scroll', () => registrar('scroll'), { passive: true })
  window.addEventListener('orientationchange', () => registrar('orientation'))
  window.addEventListener('pageshow', (e) => {
    registrar(`pageshow persisted=${e.persisted}`)
    if (e.persisted) programarSnapshots('pageshow')
  })
  document.addEventListener('visibilitychange', () => {
    registrar(`visibility=${document.visibilityState}`)
    if (document.visibilityState === 'visible') programarSnapshots('resume')
  })
  document.addEventListener('focusin', (e) => registrar(`focusin ${(e.target as HTMLElement)?.tagName ?? ''}`))
  document.addEventListener('focusout', (e) => registrar(`focusout ${(e.target as HTMLElement)?.tagName ?? ''}`))
}

function cerrarPanel(apagar: boolean): void {
  if (apagar) escribirFlag(false)
  window.clearInterval(intervalo)
  panel?.remove()
  panel = null
  if (apagar) {
    snapshots = []
    eventos = []
    pruebas = []
    ultimoPorTipo = new Map()
  }
}

function escucharToqueLargo(): void {
  let timer: number | undefined
  const cancelar = () => window.clearTimeout(timer)
  document.addEventListener(
    'touchstart',
    (e) => {
      const t = e.touches[0]
      if (t) ultimoToqueY = t.clientY
      if (e.touches.length !== 1 || !t || t.clientY > 90) return
      timer = window.setTimeout(() => {
        if (panel) {
          cerrarPanel(true)
        } else {
          escribirFlag(true)
          abrirPanel('toque')
        }
      }, 800)
    },
    { passive: true },
  )
  document.addEventListener('touchend', cancelar, { passive: true })
  document.addEventListener('touchmove', cancelar, { passive: true })
  document.addEventListener('touchcancel', cancelar, { passive: true })
}

export function iniciarDebugViewport(): void {
  const param = new URLSearchParams(window.location.search).get('debug')
  if (param === '1') escribirFlag(true)
  if (param === '0') escribirFlag(false)
  escucharToqueLargo()
  if (leerFlag()) abrirPanel('frío')
}
