import { CATEGORIAS, type FinanceCategoria } from './categorias'
import type { Medio, Moneda } from './extraccion'
import type { FinanceMovimiento } from '@/types/finance'

export interface GrupoCategoria {
  categoria: FinanceCategoria
  total: number
  cantidad: number
  /** Sobre el total gastado del mes, 0..1. Para el anillo y la barra. */
  parte: number
}

export interface GrupoSemana {
  /** 1-based: la semana calendario dentro del mes (día 1-7 = semana 1, etc). */
  semana: number
  total: number
  cantidad: number
}

export interface ResumenMes {
  /** YYYY-MM */
  mes: string
  moneda: Moneda
  /** Cuánto se gastó en efectivo y cuánto por transferencia, en esta moneda. */
  porMedio: Record<Medio, number>
  gastado: number
  ingresado: number
  balance: number
  grupos: readonly GrupoCategoria[]
  /** Ingresos del mes agrupados por semana (modelo Monefy: Ingresos separado de Egresos). */
  ingresos: readonly GrupoSemana[]
  movimientos: readonly FinanceMovimiento[]
  /** Sprint 007 — egresos que el léxico no clasificó con confianza: "Por revisar", nunca 'Otros'. */
  porRevisar: readonly FinanceMovimiento[]
}

export function semanaDelMes(fecha: string): number {
  const dia = Number(fecha.slice(8, 10))
  return Math.ceil(dia / 7)
}

/**
 * `null` es "Por revisar" (Sprint 007): un movimiento sin categoría
 * reconocida nunca se fuerza a una categoría inventada. Incluye la
 * migración de lo persistido antes de este sprint con `categoria:
 * 'otros'` — ese valor ya no es válido, se lee igual como "Por revisar".
 */
export function categoriaDe(movimiento: FinanceMovimiento): FinanceCategoria | null {
  const categoria = movimiento.categoria
  return categoria && (CATEGORIAS as readonly string[]).includes(categoria) ? (categoria as FinanceCategoria) : null
}

export function mesDe(fecha: Date): string {
  return fecha.toISOString().slice(0, 7)
}

/**
 * El mes agrupado (Sprint de Producto 004). Es la vista que
 * EL_ESTUDIO_CORE.md pide palabra por palabra: "Al finalizar la semana
 * El Estudio agrupa automáticamente esos movimientos. Vehículo. Comida.
 * Servicios. Ocio. Compras. Y muestra una visión clara del
 * comportamiento financiero."
 *
 * Es una función pura sobre los movimientos, no una tabla nueva: el
 * documento es explícito en que presupuestos, categorías y reportes no
 * son módulos, son vistas. Cambiar la agrupación no debería migrar
 * nunca un solo dato.
 */
/** Los movimientos anteriores al Sprint 006 no tienen moneda: son pesos. */
export function monedaDe(movimiento: FinanceMovimiento): Moneda {
  return movimiento.moneda === 'usd' ? 'usd' : 'ars'
}

export function medioDe(movimiento: FinanceMovimiento): Medio {
  return movimiento.medio === 'efectivo' ? 'efectivo' : 'transferencia'
}

export function resumirMes(
  movimientos: readonly FinanceMovimiento[],
  mes: string,
  moneda: Moneda = 'ars',
): ResumenMes {
  const delMes = movimientos.filter(
    (movimiento) => movimiento.fecha.startsWith(mes) && monedaDe(movimiento) === moneda,
  )
  const egresos = delMes.filter((movimiento) => movimiento.tipo === 'egreso')

  const gastado = egresos.reduce((total, movimiento) => total + movimiento.monto, 0)
  const ingresado = delMes
    .filter((movimiento) => movimiento.tipo === 'ingreso')
    .reduce((total, movimiento) => total + movimiento.monto, 0)

  const grupos = CATEGORIAS.map((categoria) => {
    const propios = egresos.filter((movimiento) => categoriaDe(movimiento) === categoria)
    const total = propios.reduce((suma, movimiento) => suma + movimiento.monto, 0)
    return { categoria, total, cantidad: propios.length, parte: gastado > 0 ? total / gastado : 0 }
  })
    .filter((grupo) => grupo.cantidad > 0)
    .sort((a, b) => b.total - a.total)

  const porRevisar = egresos.filter((movimiento) => categoriaDe(movimiento) === null)

  const porSemana = new Map<number, { total: number; cantidad: number }>()
  for (const movimiento of delMes.filter((m) => m.tipo === 'ingreso')) {
    const semana = semanaDelMes(movimiento.fecha)
    const actual = porSemana.get(semana) ?? { total: 0, cantidad: 0 }
    actual.total += movimiento.monto
    actual.cantidad += 1
    porSemana.set(semana, actual)
  }
  const ingresos = [...porSemana.entries()]
    .map(([semana, valores]) => ({ semana, ...valores }))
    .sort((a, b) => a.semana - b.semana)

  return {
    mes,
    moneda,
    porMedio: {
      efectivo: egresos.filter((m) => medioDe(m) === 'efectivo').reduce((t, m) => t + m.monto, 0),
      transferencia: egresos.filter((m) => medioDe(m) === 'transferencia').reduce((t, m) => t + m.monto, 0),
    },
    gastado,
    ingresado,
    balance: ingresado - gastado,
    grupos,
    ingresos,
    movimientos: delMes.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    porRevisar,
  }
}

export interface ResumenSemana {
  semana: number
  entro: number
  seFue: number
  teQuedo: number
}

/**
 * Vista semanal (Sprint 007): "Entró, Se fue, Te quedó", sin
 * comparaciones ni tendencias — la misma pregunta que la vista mensual,
 * recortada a la semana calendario dentro del mes (día 1-7 = semana 1,
 * igual que `semanaDelMes`, ya usado para agrupar ingresos).
 */
export function resumirSemana(
  movimientos: readonly FinanceMovimiento[],
  mes: string,
  semana: number,
  moneda: Moneda = 'ars',
): ResumenSemana {
  const delaSemana = movimientos.filter(
    (movimiento) =>
      movimiento.fecha.startsWith(mes) && monedaDe(movimiento) === moneda && semanaDelMes(movimiento.fecha) === semana,
  )
  const entro = delaSemana.filter((m) => m.tipo === 'ingreso').reduce((total, m) => total + m.monto, 0)
  const seFue = delaSemana.filter((m) => m.tipo === 'egreso').reduce((total, m) => total + m.monto, 0)
  return { semana, entro, seFue, teQuedo: entro - seFue }
}

/** Sin decimales: en pesos los centavos son ruido, y el número tiene que leerse de un vistazo. */
export function formatearMonto(monto: number, moneda: Moneda = 'ars'): string {
  const cifra = Math.round(monto).toLocaleString('es-AR')
  return moneda === 'usd' ? `US$${cifra}` : `$${cifra}`
}
