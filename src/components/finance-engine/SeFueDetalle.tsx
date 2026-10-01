import { useState } from 'react'
import { CATEGORIA_COLOR, CATEGORIA_LABEL, type FinanceCategoria } from './categorias'
import { MovimientoRow, type PatchMovimiento } from './MovimientoRow'
import { categoriaDe, formatearMonto, resumirSemana } from './mes'
import { etiquetaSemanaCobro, semanasRealesDelMes } from './semanaCobro'
import type { FinanceMovimiento } from '@/types/finance'
import type { Moneda } from './extraccion'

interface SeFueDetalleProps {
  moneda: Moneda
  /** El mes (YYYY-MM) cuyas semanas se navegan acá — `mesActual` en "Esta semana", `mesSeleccionado` en "Este mes" (mismo criterio que `mesParaDolares` en FinanceEngineScreen). */
  mes: string
  /**
   * Todos los movimientos, sin recortar por semana ni por mes: cada
   * semana filtra lo suyo acá adentro vía `resumirSemana` (fechaInicio+
   * fechaFin+moneda), la misma función ya usada para "Esta semana" —
   * ninguna lógica de agrupación nueva, solo se llama una vez por semana
   * en vez de una vez para todo el período.
   */
  movimientos: readonly FinanceMovimiento[]
  /** La semana (su `fechaInicio`) que arranca expandida — la relevante para la vista que abrió este detalle, para no agregar un toque extra al camino que ya existía. */
  semanaInicial: string
  /** Al llegar desde el anillo/lista de categorías del resumen, abre directo en esa categoría, dentro de `semanaInicial`. */
  categoriaInicial: FinanceCategoria | null
  /** Sprint 026: corrige la categoría de un movimiento ya existente, sin borrarlo y recrearlo. */
  onCambiarCategoria: (movimiento: FinanceMovimiento, categoria: FinanceCategoria) => void
  /** Mini Sprint 029.1 (§4/§6) — corrige un egreso ya existente. Mini Sprint 032 (§7) amplió el patch. */
  onEditar: (movimiento: FinanceMovimiento, patch: PatchMovimiento) => void
  /** Mini Sprint 029.1 (§7) — borra un egreso individual. */
  onEliminar: (movimiento: FinanceMovimiento) => void
  onCerrar: () => void
}

/** "Septiembre 2026" — mismo criterio que `etiquetaMesConAnio` en EntroDetalle.tsx y `nombreMes` en FinanceEngineScreen.tsx. */
function etiquetaMesConAnio(mes: string): string {
  return new Date(`${mes}-02`).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
}

/**
 * "Vista semanal para Se fue" (Sprint 040) — mismo patrón que Ingresos
 * (EntroDetalle.tsx) de navegar semana por semana, pero para egresos.
 *
 * Unificación de semanas (2026-09-30): egresos e ingresos comparten
 * ahora una sola definición de "semana" (lunes→domingo real, de
 * `semanaCobro.ts`), así que acá la identidad de cada semana es su
 * `fechaInicio` (YYYY-MM-DD), no un número de semana del mes.
 * `semanasRealesDelMes(mes)` da el listado (asignación de mes efectivo,
 * mismo criterio que usa EntroDetalle para su acordeón por mes) y
 * `etiquetaSemanaCobro` da la etiqueta por rango, sin número.
 *
 * Tres niveles: semanas del mes (acordeón, con totales) → categorías de la
 * semana abierta (igual que antes) → movimientos de esa categoría (igual
 * que antes). `categoriaAbierta` guarda a qué semana pertenece la
 * categoría que se está mirando, para que "‹ [etiqueta]" vuelva al
 * acordeón con esa semana todavía expandida.
 */
export function SeFueDetalle({
  moneda,
  mes,
  movimientos,
  semanaInicial,
  categoriaInicial,
  onCambiarCategoria,
  onEditar,
  onEliminar,
  onCerrar,
}: SeFueDetalleProps) {
  const semanas = semanasRealesDelMes(mes)
  const [categoriaAbierta, setCategoriaAbierta] = useState<{ semana: { fechaInicio: string; fechaFin: string }; categoria: FinanceCategoria } | null>(() => {
    if (!categoriaInicial) return null
    const semana = semanas.find((s) => s.fechaInicio === semanaInicial) ?? semanas[0]
    return semana ? { semana, categoria: categoriaInicial } : null
  })
  const [semanasAbiertas, setSemanasAbiertas] = useState<Set<string>>(() => new Set([semanaInicial]))

  function toggleSemana(fechaInicio: string) {
    setSemanasAbiertas((actual) => {
      const siguiente = new Set(actual)
      if (siguiente.has(fechaInicio)) siguiente.delete(fechaInicio)
      else siguiente.add(fechaInicio)
      return siguiente
    })
  }

  if (categoriaAbierta) {
    const resumenSemana = resumirSemana(movimientos, categoriaAbierta.semana.fechaInicio, categoriaAbierta.semana.fechaFin, moneda)
    const deLaCategoria = resumenSemana.movimientos
      .filter((m) => m.tipo === 'egreso' && categoriaDe(m) === categoriaAbierta.categoria)
      .sort((a, b) => a.fecha.localeCompare(b.fecha))
    const totalCategoria = deLaCategoria.reduce((suma, m) => suma + m.monto, 0)

    return (
      <div className="flex flex-col gap-6">
        <button type="button" className="idea-destino self-start" onClick={() => setCategoriaAbierta(null)}>
          ‹ {etiquetaSemanaCobro(categoriaAbierta.semana.fechaInicio, categoriaAbierta.semana.fechaFin)}
        </button>
        <section className="finanzas-tarjeta flex flex-col items-center gap-1">
          <p className="font-mono text-[11px] text-ink-faint">
            {etiquetaSemanaCobro(categoriaAbierta.semana.fechaInicio, categoriaAbierta.semana.fechaFin)}
          </p>
          <p className="font-mono text-[11px] uppercase tracking-wide text-accent">{CATEGORIA_LABEL[categoriaAbierta.categoria]}</p>
          <p className="font-mono text-[28px] text-critical">{formatearMonto(totalCategoria, moneda)}</p>
        </section>
        <ul className="finanzas-tarjeta flex flex-col">
          {deLaCategoria.map((movimiento) => (
            <MovimientoRow
              key={movimiento.id}
              movimiento={movimiento}
              moneda={moneda}
              onCambiarCategoria={(nuevaCategoria) => onCambiarCategoria(movimiento, nuevaCategoria)}
              onEditar={movimiento.compraId ? undefined : (patch) => onEditar(movimiento, patch)}
              onEliminar={movimiento.compraId ? undefined : () => onEliminar(movimiento)}
            />
          ))}
        </ul>
      </div>
    )
  }

  const resumenesPorSemana = semanas.map((semana) => ({
    semana,
    ...resumirSemana(movimientos, semana.fechaInicio, semana.fechaFin, moneda),
  }))
  const totalMes = resumenesPorSemana.reduce((suma, r) => suma + r.seFue, 0)

  return (
    <div className="flex flex-col gap-6">
      <button type="button" className="idea-destino self-start" onClick={onCerrar}>
        ‹ Finanzas
      </button>
      <section className="finanzas-tarjeta flex flex-col items-center gap-1">
        <p className="font-mono text-[11px] text-ink-faint">{etiquetaMesConAnio(mes)}</p>
        <p className="font-mono text-[11px] uppercase tracking-wide text-accent">Total gastado</p>
        <p className="font-mono text-[28px] text-critical">{formatearMonto(totalMes, moneda)}</p>
      </section>
      <ul className="flex flex-col gap-3">
        {resumenesPorSemana.map((resumenSemana) => {
          const abierta = semanasAbiertas.has(resumenSemana.semana.fechaInicio)
          return (
            <li key={resumenSemana.semana.fechaInicio} className="finanzas-tarjeta flex flex-col gap-2">
              <button
                type="button"
                className="flex w-full appearance-none items-start justify-between gap-3 bg-transparent p-0 text-left"
                aria-expanded={abierta}
                onClick={() => toggleSemana(resumenSemana.semana.fechaInicio)}
              >
                <span className="flex flex-col items-start gap-0.5">
                  <span className="font-mono text-[11px] uppercase tracking-wide text-accent">
                    {etiquetaSemanaCobro(resumenSemana.semana.fechaInicio, resumenSemana.semana.fechaFin)}
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="font-mono text-[15px] text-critical">{formatearMonto(resumenSemana.seFue, moneda)}</span>
                  <span aria-hidden className="font-mono text-[11px] text-ink-dim">
                    {abierta ? '−' : '+'}
                  </span>
                </span>
              </button>

              {abierta ? (
                resumenSemana.grupos.length === 0 ? (
                  <p className="text-[13px] text-ink-faint">No se fue dinero esta semana.</p>
                ) : (
                  <ul className="flex flex-col gap-1 border-t border-border/40 pt-2">
                    {resumenSemana.grupos.map((grupo) => (
                      <li key={grupo.categoria}>
                        <button
                          type="button"
                          className="flex w-full appearance-none items-baseline justify-between gap-3 border-b border-border/40 bg-transparent px-0 py-2.5 text-left"
                          onClick={() => setCategoriaAbierta({ semana: resumenSemana.semana, categoria: grupo.categoria })}
                        >
                          <span className="flex items-center gap-2 text-[15px] text-ink">
                            <span
                              className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                              style={{ backgroundColor: CATEGORIA_COLOR[grupo.categoria] }}
                              aria-hidden="true"
                            />
                            {CATEGORIA_LABEL[grupo.categoria]}
                          </span>
                          <span className="font-mono text-[14px] text-ink-dim">{formatearMonto(grupo.total, moneda)}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )
              ) : null}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
