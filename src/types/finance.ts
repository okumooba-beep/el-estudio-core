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
