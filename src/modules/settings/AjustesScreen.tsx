import { useState } from 'react'
import { obtenerDatosParaExportar } from '@modules/finance/public'

type EstadoExportar = 'idle' | 'exportando' | 'exportado' | 'error'
type EstadoActualizar = 'idle' | 'buscando' | 'buscado' | 'sin-service-worker' | 'error'
type EstadoResyncNotas = 'idle' | 'procesando' | 'listo' | 'error'
type EstadoSuscripcionPush = 'ok' | 'sin-soporte' | 'sin-permiso' | 'sin-vapid-key' | 'error'
type EstadoPush = 'idle' | 'suscribiendo' | EstadoSuscripcionPush
type EstadoTestPush = 'idle' | 'enviando' | 'enviado' | 'error'

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
  /** Feature-detection de Web Push del navegador actual (Notification + PushManager + Service Worker). */
  pushSupported: boolean
  /** `null` si no hay sesión activa. */
  onSubscribePush: (() => Promise<EstadoSuscripcionPush>) | null
  /** `null` si no hay sesión activa. */
  onSendTestPush: (() => Promise<boolean>) | null
}

export function AjustesScreen({
  accountEmail,
  onSignOut,
  onForceNotesResync,
  pushSupported,
  onSubscribePush,
  onSendTestPush,
}: AjustesScreenProps) {
  const [estadoExportar, setEstadoExportar] = useState<EstadoExportar>('idle')
  const [estadoActualizar, setEstadoActualizar] = useState<EstadoActualizar>('idle')
  const [estadoResyncNotas, setEstadoResyncNotas] = useState<EstadoResyncNotas>('idle')
  const [estadoPush, setEstadoPush] = useState<EstadoPush>('idle')
  const [estadoTestPush, setEstadoTestPush] = useState<EstadoTestPush>('idle')

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

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-8 pb-10">
      <h1 className="font-mono text-[11px] uppercase tracking-wide text-accent">Ajustes</h1>

      <section className="flex flex-col gap-2">
        <h2 className="text-[15px] text-ink">Cuenta</h2>
        {accountEmail && <p className="text-[13px] text-ink-dim">Sesión iniciada como {accountEmail}.</p>}
        <button type="button" className="idea-destino self-start" onClick={onSignOut}>
          Cerrar sesión
        </button>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-[15px] text-ink">Exportar datos</h2>
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
        <h2 className="text-[15px] text-ink">Actualizar app</h2>
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
        <h2 className="text-[15px] text-ink">Notificaciones push (Fase 1)</h2>
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

      {onForceNotesResync && (
        <section className="flex flex-col gap-2">
          <h2 className="text-[15px] text-ink">Notas — forzar re-sincronización (temporal)</h2>
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
    </div>
  )
}
