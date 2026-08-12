import { etiquetaDia, formatearMonto } from './mes'
import type { FinanceMovimiento } from '@/types/finance'
import type { Moneda } from './extraccion'

interface MovimientoRowProps {
  movimiento: FinanceMovimiento
  moneda: Moneda
  /** '+' para ingresos (Sprint 016, punto 2: "8 agosto / + $X / Descripción"). */
  signo?: '+' | ''
}

/** Una fila de movimiento dentro de los detalles de Entró/Se fue (Sprint 016). */
export function MovimientoRow({ movimiento, moneda, signo = '' }: MovimientoRowProps) {
  return (
    <li className="flex items-baseline justify-between gap-3 border-b border-border/40 py-2 last:border-b-0">
      <span className="flex flex-col gap-0.5">
        <span className="text-[12.5px] text-ink-faint">{etiquetaDia(movimiento.fecha)}</span>
        <span className="text-[15px] leading-snug text-ink">{movimiento.concepto}</span>
      </span>
      <span className={`shrink-0 font-mono text-[14px] ${signo === '+' ? 'text-good' : 'text-ink-dim'}`}>
        {signo}
        {formatearMonto(movimiento.monto, moneda)}
      </span>
    </li>
  )
}
