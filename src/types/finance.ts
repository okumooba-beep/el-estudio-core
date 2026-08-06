/**
 * Threshold Experience V1 — "Finanzas empieza a existir de verdad": el
 * destino 'finanzas' ya vivía reservado en IdeaDestino/FurnitureId desde
 * antes (ver src/types/idea.ts) sin ninguna tabla propia. Foundations
 * only (el brief lo pide explícito): tres entidades mínimas, nunca una
 * planilla de columnas libres.
 *
 * Una FinanceAccount es lo único que hace falta para Patrimonio Neto,
 * Liquidez, Inversiones y Deudas a la vez — las cuatro son la misma
 * suma agrupada por `tipo`, nunca cuatro tablas separadas (Regla 8:
 * menos archivos, más reuso). Cash Flow necesita su propio registro
 * (FinanceMovimiento) porque un saldo por sí solo no dice nada sobre lo
 * que entró/salió este mes. Goals es lo único que no se deriva de nada.
 */
import type { FinanceCategoria } from '@modules/finance/categorias'
import type { Medio, Moneda } from '@modules/finance/extraccion'

export type FinanceAccountTipo = 'liquidez' | 'inversion' | 'deuda'

export interface FinanceAccount {
  id: string
  nombre: string
  tipo: FinanceAccountTipo
  saldo: number
  createdAt: string
  updatedAt: string
  /** F5 (ARCHITECTURE_RATIFIED.md): marcado inerte — ver shared-kernel/persistence/Repository. */
  pendingSync: boolean
}

export type FinanceMovimientoTipo = 'ingreso' | 'egreso'

export interface FinanceMovimiento {
  id: string
  tipo: FinanceMovimientoTipo
  monto: number
  concepto: string
  /**
   * Sprint 004 — sin esto Finanzas no podía agrupar nada, y agrupar es
   * literalmente lo que EL_ESTUDIO_CORE.md le pide: "Al finalizar la
   * semana El Estudio agrupa automáticamente esos movimientos.
   * Vehículo. Comida. Servicios." Lista cerrada (ver categorias.ts):
   * categorías libres devuelven la planilla que el documento rechaza.
   *
   * Sprint 007 — `null` es "Por revisar": el sistema nunca inventa una
   * categoría cuando el léxico no reconoce el texto (antes caía en
   * 'otros', que el nuevo brief prohíbe explícitamente).
   */
  categoria: FinanceCategoria | null
  /**
   * Sprint 006. Sin moneda, "1.090.000 + 200 usd" era un solo número en
   * pesos y los dólares desaparecían. Pesos y dólares nunca se suman:
   * la pantalla los muestra en columnas separadas, jamás convertidos.
   */
  moneda: Moneda
  /** Cómo se movió: efectivo o transferencia. No es una cuenta. */
  medio: Medio
  /**
   * La hoja del Umbral que originó este movimiento, cuando vino de una
   * captura. Existe para no contar dos veces lo mismo: Finanzas puede
   * saber qué capturas ya se convirtieron sin tocar la tabla de Ideas.
   */
  ideaId?: string
  /** YYYY-MM-DD, igual que Idea/Operacion. */
  fecha: string
  createdAt: string
  updatedAt: string
  pendingSync: boolean
}

export interface FinanceGoal {
  id: string
  texto: string
  objetivo: number
  actual: number
  createdAt: string
  updatedAt: string
  pendingSync: boolean
}
