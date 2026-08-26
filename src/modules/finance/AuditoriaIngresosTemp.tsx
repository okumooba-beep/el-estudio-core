import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { db } from '@/lib/db/db'
import type { FinanceIncomePeriod, FinanceMovimiento } from '@/types/finance'

/**
 * Sprint 039 — herramienta TEMPORAL de auditoría, estrictamente de solo
 * lectura. Existe únicamente para poder inspeccionar los datos reales de
 * financeIncomePeriods/financeMovimientos en producción desde un iPhone
 * (PWA instalada, sin acceso a DevTools). No escribe, no crea, no
 * modifica ni elimina ningún registro — solo lee con `.toArray()` y
 * `.filter()`. Se elimina (archivo + ruta + link) apenas termine la
 * auditoría del Sprint 039; no es arquitectura permanente.
 */

async function copiar(texto: string, marcar: (v: boolean) => void) {
  try {
    await navigator.clipboard.writeText(texto)
    marcar(true)
    setTimeout(() => marcar(false), 2000)
  } catch {
    // Clipboard API puede fallar en algunos contextos PWA — el JSON sigue
    // visible en pantalla para copiar a mano como respaldo.
  }
}

function BloqueJSON({ titulo, datos }: { titulo: string; datos: unknown }) {
  const [copiado, setCopiado] = useState(false)
  const texto = JSON.stringify(datos, null, 2)
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-mono text-[12px] uppercase tracking-wide text-accent">{titulo}</h2>
        <button
          type="button"
          className="idea-destino"
          onClick={() => {
            void copiar(texto, setCopiado)
          }}
        >
          {copiado ? '✓ Copiado' : 'Copiar JSON'}
        </button>
      </div>
      <pre className="max-h-[50vh] overflow-auto whitespace-pre-wrap break-all rounded-md border border-border/60 bg-black/20 p-3 font-mono text-[11px] text-ink-dim">
        {texto}
      </pre>
    </section>
  )
}

export function AuditoriaIngresosTemp() {
  const [periodos, setPeriodos] = useState<FinanceIncomePeriod[] | null>(null)
  const [movimientos, setMovimientos] = useState<FinanceMovimiento[] | null>(null)

  useEffect(() => {
    let cancelado = false
    async function leer() {
      const [todosPeriodos, todosMovimientos] = await Promise.all([
        db.financeIncomePeriods.toArray(),
        db.financeMovimientos.toArray(),
      ])
      if (cancelado) return
      setPeriodos(todosPeriodos.slice().sort((a, b) => a.fechaInicio.localeCompare(b.fechaInicio) || a.orden - b.orden))
      setMovimientos(
        todosMovimientos
          .filter((m) => m.tipo === 'ingreso')
          .slice()
          .sort((a, b) => (a.periodoId ?? '').localeCompare(b.periodoId ?? '') || a.createdAt.localeCompare(b.createdAt)),
      )
    }
    void leer()
    return () => {
      cancelado = true
    }
  }, [])

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 pb-10">
      <section className="flex flex-col gap-1 rounded-md border border-accent/50 bg-accent/10 p-3">
        <p className="font-mono text-[11px] uppercase tracking-wide text-accent">Herramienta temporal — Solo lectura</p>
        <p className="text-[13px] text-ink-dim">
          No modifica, crea ni elimina ningún dato. Sprint 039 — se elimina al terminar la auditoría de Ingresos.
        </p>
        <Link to="/finanzas" className="text-[13px] text-accent underline underline-offset-2">
          ← Volver a Finanzas
        </Link>
      </section>

      {periodos === null || movimientos === null ? (
        <p className="text-[13px] text-ink-faint">Leyendo IndexedDB…</p>
      ) : (
        <>
          <BloqueJSON titulo={`Periodos (${periodos.length})`} datos={periodos} />
          <BloqueJSON titulo={`Movimientos ingreso (${movimientos.length})`} datos={movimientos} />
        </>
      )}
    </div>
  )
}
