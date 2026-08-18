import { useState } from 'react'
import { CATEGORIAS, CATEGORIA_LABEL, type FinanceCategoria } from './categorias'
import { etiquetaDia, formatearMonto } from './mes'
import type { FinanceMovimiento } from '@/types/finance'
import type { Moneda } from './extraccion'

interface MovimientoRowProps {
  movimiento: FinanceMovimiento
  moneda: Moneda
  /** '+' para ingresos (Sprint 016, punto 2: "8 agosto / + $X / Descripción"). */
  signo?: '+' | ''
  /**
   * Sprint 026: si se pasa, la fila se puede tocar para corregir la
   * categoría de un movimiento que ya existe — no solo los "Por
   * revisar" (Sprint 007), cualquiera. Monto, moneda, fecha, concepto,
   * tipo e ID quedan intactos: `onCambiarCategoria` es la misma
   * `corregirCategoria` que ya usa esa sección, mismo `updateMovimiento`.
   */
  onCambiarCategoria?: (categoria: FinanceCategoria) => void
}

/** Una fila de movimiento dentro de los detalles de Entró/Se fue (Sprint 016). */
export function MovimientoRow({ movimiento, moneda, signo = '', onCambiarCategoria }: MovimientoRowProps) {
  const [editando, setEditando] = useState(false)

  return (
    <li className="border-b border-border/40 py-2 last:border-b-0">
      <div className="flex items-baseline justify-between gap-3">
        <span className="flex flex-col gap-0.5">
          <span className="text-[12.5px] text-ink-faint">{etiquetaDia(movimiento.fecha)}</span>
          <span className="text-[15px] leading-snug text-ink">{movimiento.concepto}</span>
          {movimiento.cuotaTotal ? (
            <span className="text-[11.5px] text-ink-faint">
              {movimiento.categoria ? `${CATEGORIA_LABEL[movimiento.categoria]} · ` : ''}
              Cuota {movimiento.cuotaNumero}/{movimiento.cuotaTotal}
            </span>
          ) : null}
        </span>
        <span className={`shrink-0 font-mono text-[14px] ${signo === '+' ? 'text-good' : 'text-ink-dim'}`}>
          {signo}
          {formatearMonto(movimiento.monto, moneda)}
        </span>
      </div>
      {onCambiarCategoria ? (
        <>
          <button type="button" className="idea-destino mt-1" onClick={() => setEditando((actual) => !actual)}>
            {editando ? 'Cancelar' : 'Editar categoría'}
          </button>
          {editando ? (
            <div className="idea-destinos mt-2" role="group" aria-label="Elegir categoría">
              {CATEGORIAS.map((categoria) => (
                <button
                  key={categoria}
                  type="button"
                  className="idea-destino"
                  onClick={() => {
                    onCambiarCategoria(categoria)
                    setEditando(false)
                  }}
                >
                  {CATEGORIA_LABEL[categoria]}
                </button>
              ))}
            </div>
          ) : null}
        </>
      ) : null}
    </li>
  )
}
