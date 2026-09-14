import type { FinanceCategoria } from './categorias'
import type { PatchMovimiento } from './MovimientoRow'
import type { GrupoCategoria } from './mes'
import type { FinanceMovimiento } from '@/types/finance'
import type { Moneda } from './extraccion'

interface SeFueDetalleProps {
  moneda: Moneda
  /** Sprint 016.1, punto 15: mismo texto que ya muestra el header de FinanceScreen — nunca se recalcula acá. */
  periodoLabel: string
  total: number
  /** Ya filtrados a categorías con al menos un movimiento (punto 3: "no mostrar categorías vacías"). */
  grupos: readonly GrupoCategoria[]
  /** Movimientos ya recortados al período (semana o mes) — se filtra acá solo por tipo/categoría. */
  movimientos: readonly FinanceMovimiento[]
  /** Al llegar desde el anillo/lista de categorías del resumen, abre directo en esa categoría. */
  categoriaInicial: FinanceCategoria | null
  /** Sprint 026: corrige la categoría de un movimiento ya existente, sin borrarlo y recrearlo. */
  onCambiarCategoria: (movimiento: FinanceMovimiento, categoria: FinanceCategoria) => void
  /** Mini Sprint 029.1 (§4/§6) — corrige un egreso ya existente. Mini Sprint 032 (§7) amplió el patch. */
  onEditar: (movimiento: FinanceMovimiento, patch: PatchMovimiento) => void
  /** Mini Sprint 029.1 (§7) — borra un egreso individual. */
  onEliminar: (movimiento: FinanceMovimiento) => void
  onCerrar: () => void
}

/**
 * Sprint 016, punto 3: "Se fue" responde "¿en qué?" — total, después
 * categorías (solo las que tienen movimientos), y al tocar una,
 * los movimientos concretos que la forman. El período (semana o mes)
 * nunca se pierde: `grupos`/`movimientos` ya vienen recortados por
 * quien abre este detalle (FinanceScreen), y volver a la lista de
 * categorías no cierra el detalle ni cambia el período.
 */
/**
 * Diagnóstico temporal (identificar si este archivo es el que realmente
 * renderiza "Se fue" dentro de una carpeta de Mi Proyecto): reemplaza TODO
 * el contenido real por un único marcador. Se revierte apenas se confirme.
 */
export function SeFueDetalle(_props: SeFueDetalleProps) {
  return (
    <div style={{ background: 'lime', color: 'black', fontSize: '28px', fontWeight: 'bold', padding: '24px' }}>
      ESTE ES EL ARCHIVO — SeFueDetalle.tsx
    </div>
  )
}
