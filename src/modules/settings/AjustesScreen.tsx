import { useEffect, useRef, useState } from 'react'
import { obtenerDatosParaExportar } from '@modules/finance/public'

type EstadoExportar = 'idle' | 'exportando' | 'exportado' | 'error'
type EstadoActualizar = 'idle' | 'buscando' | 'buscado' | 'sin-service-worker' | 'error'
type EstadoResyncNotas = 'idle' | 'procesando' | 'listo' | 'error'
type EstadoResyncAgenda = 'idle' | 'procesando' | 'listo' | 'error'
type EstadoSuscripcionPush = 'ok' | 'sin-soporte' | 'sin-permiso' | 'sin-vapid-key' | 'error'
type EstadoPush = 'idle' | 'suscribiendo' | EstadoSuscripcionPush
type EstadoTestPush = 'idle' | 'enviando' | 'enviado' | 'error'
type EstadoFondo = 'idle' | 'guardando' | 'error'
type EstadoPosicionX = 'idle' | 'guardando' | 'error'

/** Duplicado a propósito de FondoOption (src/lib/room/roomBackgrounds.ts) — `settings-boundaries` en .dependency-cruiser.cjs no permite importar de src/lib, mismo motivo por el que EstadoSuscripcionPush está duplicado acá abajo en vez de importado de pushClient.ts. */
interface FondoOption {
  id: string
  label: string
  archivo: string
  ruta: string
}

/** Duplicado a propósito de PosicionX (src/lib/room/roomBackgrounds.ts) — mismo motivo que FondoOption arriba. Porcentaje 0–100 (0 = borde izquierdo de la imagen, 100 = borde derecho). */
type PosicionX = number

/** Proporción de pantalla de teléfono usada para dibujar la caja de recorte sobre la miniatura — mismo valor que asume `background-size: cover` al llenar la pantalla real. */
const ASPECTO_TELEFONO = 390 / 844

/**
 * Ajustes — pantalla de utilidades del dispositivo, no un panel de
 * preferencias de producto: por ahora solo dos acciones que el usuario
 * pidió explícitamente al investigar por qué las sub-tareas de Misiones
 * no se veían (sospecha de caché vieja del service worker) — "Exportar
 * datos" como backup de Finanzas antes de tocar nada, y "Actualizar app"
 * para forzar la versión nueva sin arriesgar los datos de IndexedDB
 * (viven en el origen del navegador, nunca en la Cache Storage del
 * service worker — ninguna de las dos acciones de acá los toca).
 */
interface AjustesScreenProps {
  accountEmail: string | null
  onSignOut: () => void
  /** `null` si no hay sesión activa — oculta la sección de re-sincronización de Notas. */
  onForceNotesResync: (() => Promise<void>) | null
  /** `null` si no hay sesión activa — oculta la sección de re-sincronización de Agenda. */
  onForceAgendaResync: (() => Promise<void>) | null
  /** Feature-detection de Web Push del navegador actual (Notification + PushManager + Service Worker). */
  pushSupported: boolean
  /** `null` si no hay sesión activa. */
  onSubscribePush: (() => Promise<EstadoSuscripcionPush>) | null
  /** `null` si no hay sesión activa. */
  onSendTestPush: (() => Promise<boolean>) | null
  /** Las 15 imágenes del banco de fondos (Sprint ROOM). */
  fondos: FondoOption[]
  /** Id del fondo actualmente activo — ya aplicado, no una elección pendiente. */
  fondoActivo: string
  /** Aplica el fondo (CSS var + caché local) y, si hay sesión, lo sube a Supabase. 'sin-sesion' cuando no hay usuario logueado — el fondo igual queda aplicado en este dispositivo. */
  onSelectFondo: (fondoId: string) => Promise<'ok' | 'sin-sesion' | 'error'>
  /** Posición horizontal manual de la foto, 0–100 (50 por defecto) — ver comentario de .room-layer-photo en src/index.css. */
  posicionXActiva: PosicionX
  /** Aplica la posición (CSS var + caché local) y, si hay sesión, la sube a Supabase. Mismo contrato que onSelectFondo. */
  onSelectPosicionX: (posicionX: PosicionX) => Promise<'ok' | 'sin-sesion' | 'error'>
}

export function AjustesScreen({
  accountEmail,
  onSignOut,
  onForceNotesResync,
  onForceAgendaResync,
  pushSupported,
  onSubscribePush,
  onSendTestPush,
  fondos,
  fondoActivo,
  onSelectFondo,
  posicionXActiva,
  onSelectPosicionX,
}: AjustesScreenProps) {
  const [estadoExportar, setEstadoExportar] = useState<EstadoExportar>('idle')
  const [estadoActualizar, setEstadoActualizar] = useState<EstadoActualizar>('idle')
  const [estadoResyncNotas, setEstadoResyncNotas] = useState<EstadoResyncNotas>('idle')
  const [estadoResyncAgenda, setEstadoResyncAgenda] = useState<EstadoResyncAgenda>('idle')
  const [estadoPush, setEstadoPush] = useState<EstadoPush>('idle')
  const [estadoTestPush, setEstadoTestPush] = useState<EstadoTestPush>('idle')
  const [estadoFondo, setEstadoFondo] = useState<EstadoFondo>('idle')
  const [fondoConError, setFondoConError] = useState<string | null>(null)
  const [grillaFondosAbierta, setGrillaFondosAbierta] = useState(false)
  const [estadoPosicionX, setEstadoPosicionX] = useState<EstadoPosicionX>('idle')
  /** Posición en vivo mientras se arrastra la caja sobre la miniatura — `null` cuando no se está arrastrando, y el control cae a `posicionXActiva` (la ya guardada). Evita disparar el guardado remoto en cada pointermove. */
  const [posicionArrastre, setPosicionArrastre] = useState<number | null>(null)
  /** Relación ancho/alto real de la imagen activa, para que la caja de recorte represente la proporción real de pantalla de teléfono — se reinicia al cambiar de fondo y se mide de nuevo con onLoad. */
  const [aspectoImagen, setAspectoImagen] = useState<number | null>(null)
  const contenedorMiniaturaRef = useRef<HTMLDivElement>(null)
  const arrastrandoRef = useRef(false)

  async function handleExportar() {
    setEstadoExportar('exportando')
    try {
      const datos = await obtenerDatosParaExportar()
      const payload = { exportadoEn: new Date().toISOString(), ...datos }
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const enlace = document.createElement('a')
      enlace.href = url
      enlace.download = `el-estudio-finanzas-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(enlace)
      enlace.click()
      enlace.remove()
      URL.revokeObjectURL(url)
      setEstadoExportar('exportado')
    } catch {
      setEstadoExportar('error')
    }
  }

  async function handleActualizar() {
    setEstadoActualizar('buscando')
    try {
      if (!('serviceWorker' in navigator)) {
        setEstadoActualizar('sin-service-worker')
        return
      }
      const registro = await navigator.serviceWorker.getRegistration()
      if (!registro) {
        setEstadoActualizar('sin-service-worker')
        return
      }
      await registro.update()
      setEstadoActualizar('buscado')
    } catch {
      setEstadoActualizar('error')
    }
  }

  async function handleSuscribirPush() {
    if (!onSubscribePush) return
    setEstadoPush('suscribiendo')
    const resultado = await onSubscribePush()
    setEstadoPush(resultado)
  }

  async function handleTestPush() {
    if (!onSendTestPush) return
    setEstadoTestPush('enviando')
    const ok = await onSendTestPush()
    setEstadoTestPush(ok ? 'enviado' : 'error')
  }

  async function handleSeleccionarFondo(fondoId: string) {
    setFondoConError(null)
    setEstadoFondo('guardando')
    const resultado = await onSelectFondo(fondoId)
    if (resultado === 'error') {
      setFondoConError(fondoId)
      setEstadoFondo('error')
    } else {
      setEstadoFondo('idle')
    }
  }

  async function handleSeleccionarPosicionX(posicionX: PosicionX) {
    setEstadoPosicionX('guardando')
    const resultado = await onSelectPosicionX(posicionX)
    setEstadoPosicionX(resultado === 'error' ? 'error' : 'idle')
  }

  /** Ancho de la caja de recorte como fracción [0,1] del ancho de la miniatura — mismo cálculo que hace `background-size: cover` para decidir cuánto de la imagen queda tapado por los costados de la pantalla real. */
  const anchoCajaFraccion = aspectoImagen ? Math.min(1, ASPECTO_TELEFONO / aspectoImagen) : 1

  function calcularPosicionDesdeClientX(clientX: number): PosicionX {
    const contenedor = contenedorMiniaturaRef.current
    if (!contenedor) return posicionXActiva
    const rect = contenedor.getBoundingClientRect()
    const anchoCajaPx = rect.width * anchoCajaFraccion
    const rango = rect.width - anchoCajaPx
    if (rango <= 0) return 50
    const xCentroCaja = clientX - rect.left
    const fraccion = (xCentroCaja - anchoCajaPx / 2) / rango
    return Math.round(Math.min(100, Math.max(0, fraccion * 100)))
  }

  function handlePointerDownMiniatura(evento: React.PointerEvent<HTMLDivElement>) {
    evento.currentTarget.setPointerCapture(evento.pointerId)
    arrastrandoRef.current = true
    setPosicionArrastre(calcularPosicionDesdeClientX(evento.clientX))
  }

  function handlePointerMoveMiniatura(evento: React.PointerEvent<HTMLDivElement>) {
    if (!arrastrandoRef.current) return
    setPosicionArrastre(calcularPosicionDesdeClientX(evento.clientX))
  }

  async function handlePointerUpMiniatura(evento: React.PointerEvent<HTMLDivElement>) {
    if (!arrastrandoRef.current) return
    arrastrandoRef.current = false
    try {
      evento.currentTarget.releasePointerCapture(evento.pointerId)
    } catch {
      // El navegador ya pudo haber soltado la captura solo (p. ej. pointercancel) — no hay nada que limpiar.
    }
    const posicionFinal = posicionArrastre
    if (posicionFinal !== null) {
      await handleSeleccionarPosicionX(posicionFinal)
    }
    setPosicionArrastre(null)
  }

  function handleCargaMiniatura(evento: React.SyntheticEvent<HTMLImageElement>) {
    const img = evento.currentTarget
    if (img.naturalWidth > 0 && img.naturalHeight > 0) {
      setAspectoImagen(img.naturalWidth / img.naturalHeight)
    }
  }

  // La miniatura anterior sigue de fondo un instante mientras carga la nueva — reiniciar acá evita que la caja de recorte se dibuje un momento con la proporción de la imagen vieja.
  useEffect(() => {
    setAspectoImagen(null)
  }, [fondoActivo])

  const posicionMostrada = posicionArrastre ?? posicionXActiva

  async function handleResyncNotas() {
    if (!onForceNotesResync) return
    setEstadoResyncNotas('procesando')
    try {
      await onForceNotesResync()
      setEstadoResyncNotas('listo')
    } catch {
      setEstadoResyncNotas('error')
    }
  }

  async function handleResyncAgenda() {
    if (!onForceAgendaResync) return
    setEstadoResyncAgenda('procesando')
    try {
      await onForceAgendaResync()
      setEstadoResyncAgenda('listo')
    } catch {
      setEstadoResyncAgenda('error')
    }
  }

  return (
    <div className="ajustes-superficie mx-auto flex max-w-xl flex-col gap-8 p-4 sm:p-6">
      <h1 className="font-mono text-[11px] uppercase tracking-wide text-accent">Ajustes</h1>

      <section className="flex flex-col gap-2">
        <h2 className="font-mono text-[11px] uppercase tracking-wide text-accent">Cuenta</h2>
        {accountEmail && <p className="text-[13px] text-ink-dim">Sesión iniciada como {accountEmail}.</p>}
        <button type="button" className="idea-destino self-start" onClick={onSignOut}>
          Cerrar sesión
        </button>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-mono text-[11px] uppercase tracking-wide text-accent">Exportar datos</h2>
        <p className="text-[13px] text-ink-dim">
          Descarga un archivo JSON con todos los movimientos, cuentas, metas y períodos de Finanzas — un backup que
          podés guardar antes de actualizar o reinstalar la app.
        </p>
        <button
          type="button"
          className="idea-destino self-start"
          onClick={() => void handleExportar()}
          disabled={estadoExportar === 'exportando'}
        >
          {estadoExportar === 'exportando' ? 'Exportando…' : 'Exportar datos de Finanzas'}
        </button>
        {estadoExportar === 'exportado' && <p className="text-[13px] text-ink-dim">Listo — revisá tus descargas.</p>}
        {estadoExportar === 'error' && (
          <p className="text-[13px] text-critical">No se pudo exportar. Probá de nuevo.</p>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-mono text-[11px] uppercase tracking-wide text-accent">Actualizar app</h2>
        <p className="text-[13px] text-ink-dim">
          Fuerza a la app a buscar una versión nueva ahora mismo, en vez de esperar el chequeo automático. Si
          encuentra una, se recarga sola en unos segundos. Esto nunca borra tus datos: viven aparte, en el
          almacenamiento del dispositivo.
        </p>
        <button
          type="button"
          className="idea-destino self-start"
          onClick={() => void handleActualizar()}
          disabled={estadoActualizar === 'buscando'}
        >
          {estadoActualizar === 'buscando' ? 'Buscando…' : 'Actualizar app'}
        </button>
        {estadoActualizar === 'buscado' && (
          <p className="text-[13px] text-ink-dim">
            Búsqueda hecha. Si había una versión nueva, la app se va a recargar sola.
          </p>
        )}
        {estadoActualizar === 'sin-service-worker' && (
          <p className="text-[13px] text-ink-dim">Esta versión no tiene service worker activo todavía.</p>
        )}
        {estadoActualizar === 'error' && (
          <p className="text-[13px] text-critical">No se pudo buscar una actualización. Probá de nuevo.</p>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-mono text-[11px] uppercase tracking-wide text-accent">Notificaciones push (Fase 1)</h2>
        {!pushSupported ? (
          <p className="text-[13px] text-ink-dim">
            Este navegador no soporta notificaciones push. En iPhone hace falta instalar la app desde
            "Compartir → Agregar a inicio" (iOS 16.4+) — una pestaña normal de Safari no alcanza.
          </p>
        ) : (
          <>
            <p className="text-[13px] text-ink-dim">
              Activá los recordatorios reales para este dispositivo y mandate una notificación de prueba para
              confirmar que llega, incluso con la app cerrada.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="idea-destino self-start"
                onClick={() => void handleSuscribirPush()}
                disabled={!onSubscribePush || estadoPush === 'suscribiendo'}
              >
                {estadoPush === 'suscribiendo' ? 'Activando…' : 'Activar notificaciones'}
              </button>
              {estadoPush === 'ok' && (
                <button
                  type="button"
                  className="idea-destino self-start"
                  onClick={() => void handleTestPush()}
                  disabled={!onSendTestPush || estadoTestPush === 'enviando'}
                >
                  {estadoTestPush === 'enviando' ? 'Enviando…' : 'Mandame una notificación de prueba'}
                </button>
              )}
            </div>
            {estadoPush === 'ok' && (
              <p className="text-[13px] text-ink-dim">Notificaciones activadas en este dispositivo.</p>
            )}
            {estadoPush === 'sin-permiso' && (
              <p className="text-[13px] text-critical">
                Permiso denegado. Habilitalo en los ajustes de notificaciones del navegador/sistema y probá de
                nuevo.
              </p>
            )}
            {estadoPush === 'sin-vapid-key' && (
              <p className="text-[13px] text-critical">Falta configurar VITE_VAPID_PUBLIC_KEY en este entorno.</p>
            )}
            {estadoPush === 'error' && (
              <p className="text-[13px] text-critical">No se pudo activar. Probá de nuevo.</p>
            )}
            {estadoTestPush === 'enviado' && (
              <p className="text-[13px] text-ink-dim">Enviada — debería llegarte en unos segundos.</p>
            )}
            {estadoTestPush === 'error' && (
              <p className="text-[13px] text-critical">No se pudo enviar la notificación de prueba.</p>
            )}
          </>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <button
          type="button"
          className="flex items-center justify-between gap-2 text-left"
          aria-expanded={grillaFondosAbierta}
          onClick={() => setGrillaFondosAbierta((abierta) => !abierta)}
        >
          <h2 className="font-mono text-[11px] uppercase tracking-wide text-accent">Fondo del estudio</h2>
          <span aria-hidden className="font-mono text-[11px] text-ink-dim">
            {grillaFondosAbierta ? '−' : '+'}
          </span>
        </button>
        <p className="text-[13px] text-ink-dim">
          Elegí la imagen que compone la habitación. Cada fondo ya trae su propia luz y atmósfera.
        </p>
        {grillaFondosAbierta && (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {fondos.map((fondo) => {
              const activo = fondo.id === fondoActivo
              return (
                <button
                  key={fondo.id}
                  type="button"
                  aria-pressed={activo}
                  aria-label={fondo.label}
                  className={[
                    'relative aspect-square overflow-hidden rounded-(--radius-sm) bg-cover bg-center transition-opacity active:opacity-70 motion-reduce:transition-none',
                    activo ? 'ring-2 ring-accent' : 'ring-1 ring-border/40',
                  ].join(' ')}
                  style={{ backgroundImage: `url('${fondo.ruta}')` }}
                  onClick={() => void handleSeleccionarFondo(fondo.id)}
                >
                  {activo && (
                    <span className="absolute inset-x-0 bottom-0 bg-canvas/70 px-1 py-0.5 text-center text-[10px] text-ink">
                      Activo
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}
        {estadoFondo === 'error' && (
          <p className="text-[13px] text-critical">
            "{fondos.find((f) => f.id === fondoConError)?.label ?? fondoConError}" quedó activo en este dispositivo,
            pero no se pudo guardar en tu cuenta. Probá de nuevo.
          </p>
        )}

        <div className="flex flex-col gap-2 pt-2">
          <h3 className="font-mono text-[11px] uppercase tracking-wide text-ink-dim">Posición del fondo</h3>
          <p className="text-[13px] text-ink-dim">
            El fondo llena la pantalla y puede recortar los costados — arrastrá el recuadro sobre la imagen para
            elegir qué parte queda visible.
          </p>
          {/*
            El panel de Ajustes tapa el fondo real, así que esta miniatura ES
            el preview — mismo motivo por el que antes existía una cajita de
            preview aparte (ver historial): acá el thumbnail completo (sin
            recortar, object-fit: contain) muestra la imagen entera, y el
            recuadro dibuja qué franja quedaría visible en pantalla real con
            `background-size: cover`. Arrastrar el recuadro solo actualiza el
            estado local (`posicionArrastre`) en cada pointermove — el guardado
            remoto (mismo `onSelectPosicionX` que ya usaba el selector viejo)
            recién se dispara al soltar, para no spamear Supabase con un
            upsert por cada píxel de arrastre.
          */}
          <div
            ref={contenedorMiniaturaRef}
            className="relative w-full touch-none select-none overflow-hidden rounded-(--radius-sm) border border-border/40 bg-canvas"
            style={{ aspectRatio: aspectoImagen ? `${aspectoImagen}` : '16 / 9' }}
            onPointerDown={handlePointerDownMiniatura}
            onPointerMove={handlePointerMoveMiniatura}
            onPointerUp={(evento) => void handlePointerUpMiniatura(evento)}
            onPointerCancel={(evento) => void handlePointerUpMiniatura(evento)}
          >
            <img
              src={fondos.find((f) => f.id === fondoActivo)?.ruta ?? ''}
              alt=""
              draggable={false}
              onLoad={handleCargaMiniatura}
              className="pointer-events-none h-full w-full object-contain"
            />
            <div
              role="slider"
              aria-label="Posición horizontal del fondo"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(posicionMostrada)}
              className="absolute inset-y-0 cursor-grab border-2 border-accent bg-accent/15 active:cursor-grabbing"
              style={{
                width: `${anchoCajaFraccion * 100}%`,
                left: `${(posicionMostrada / 100) * (100 - anchoCajaFraccion * 100)}%`,
              }}
            />
          </div>
          {estadoPosicionX === 'error' && (
            <p className="text-[13px] text-critical">
              La posición quedó aplicada en este dispositivo, pero no se pudo guardar en tu cuenta. Probá de nuevo.
            </p>
          )}
        </div>
      </section>

      {onForceNotesResync && (
        <section className="flex flex-col gap-2">
          <h2 className="font-mono text-[11px] uppercase tracking-wide text-accent">Notas — forzar re-sincronización (temporal)</h2>
          <p className="text-[13px] text-ink-dim">
            Usalo solo si en este dispositivo Notas quedó vacío después de loguearte a pesar de tener carpetas o
            notas en otro dispositivo. Borra el estado de sincronización de Notas guardado en este dispositivo y
            vuelve a intentarlo — no borra ninguna carpeta ni nota, ni acá ni en el servidor.
          </p>
          <button
            type="button"
            className="idea-destino self-start"
            onClick={() => void handleResyncNotas()}
            disabled={estadoResyncNotas === 'procesando'}
          >
            {estadoResyncNotas === 'procesando' ? 'Sincronizando…' : 'Forzar re-sincronización de Notas'}
          </button>
          {estadoResyncNotas === 'listo' && (
            <p className="text-[13px] text-ink-dim">Listo — revisá el módulo Notas.</p>
          )}
          {estadoResyncNotas === 'error' && (
            <p className="text-[13px] text-critical">No se pudo re-sincronizar. Probá de nuevo.</p>
          )}
        </section>
      )}

      {onForceAgendaResync && (
        <section className="flex flex-col gap-2">
          <h2 className="font-mono text-[11px] uppercase tracking-wide text-accent">Agenda — forzar re-sincronización</h2>
          <p className="text-[13px] text-ink-dim">
            Usalo si borraste eventos o bloques directo en Supabase y siguen apareciendo acá. Trae el estado real
            del servidor y saca de este dispositivo lo que ya no exista ahí — nunca borra algo que todavía no se
            subió.
          </p>
          <button
            type="button"
            className="idea-destino self-start"
            onClick={() => void handleResyncAgenda()}
            disabled={estadoResyncAgenda === 'procesando'}
          >
            {estadoResyncAgenda === 'procesando' ? 'Sincronizando…' : 'Forzar re-sincronización de Agenda'}
          </button>
          {estadoResyncAgenda === 'listo' && (
            <p className="text-[13px] text-ink-dim">Listo — revisá el módulo Agenda.</p>
          )}
          {estadoResyncAgenda === 'error' && (
            <p className="text-[13px] text-critical">No se pudo re-sincronizar. Probá de nuevo.</p>
          )}
        </section>
      )}
    </div>
  )
}
