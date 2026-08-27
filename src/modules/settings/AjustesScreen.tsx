import { useState } from 'react'
import { obtenerDatosParaExportar } from '@modules/finance/public'

type EstadoExportar = 'idle' | 'exportando' | 'exportado' | 'error'
type EstadoActualizar = 'idle' | 'buscando' | 'buscado' | 'sin-service-worker' | 'error'

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
export function AjustesScreen() {
  const [estadoExportar, setEstadoExportar] = useState<EstadoExportar>('idle')
  const [estadoActualizar, setEstadoActualizar] = useState<EstadoActualizar>('idle')

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

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-8 pb-10">
      <h1 className="font-mono text-[11px] uppercase tracking-wide text-accent">Ajustes</h1>

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
    </div>
  )
}
