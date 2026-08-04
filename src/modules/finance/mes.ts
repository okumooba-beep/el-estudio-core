import { CATEGORIAS, type FinanceCategoria } from './categorias'
import type { FinanceMovimiento } from '@/types/finance'

export interface GrupoCategoria {
  categoria: FinanceCategoria
  total: number
  cantidad: number
  /** Sobre el total gastado del mes, 0..1. Para el anillo y la barra. */
  parte: number
}

export interface ResumenMes {
  /** YYYY-MM */
  mes: string
  gastado: number
  ingresado: number
  balance: number
  grupos: readonly GrupoCategoria[]
  movimientos: readonly FinanceMovimiento[]
}

/** Los movimientos anteriores a Sprint 004 no tienen categoría: se leen como 'otros'. */
export function categoriaDe(movimiento: FinanceMovimiento): FinanceCategoria {
  const categoria = movimiento.categoria
  return categoria && CATEGORIAS.includes(categoria) ? categoria : 'otros'
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
export function resumirMes(movimientos: readonly FinanceMovimiento[], mes: string): ResumenMes {
  const delMes = movimientos.filter((movimiento) => movimiento.fecha.startsWith(mes))
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

  return {
    mes,
    gastado,
    ingresado,
    balance: ingresado - gastado,
    grupos,
    movimientos: delMes.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  }
}

/** Sin decimales: en pesos los centavos son ruido, y el número tiene que leerse de un vistazo. */
export function formatearMonto(monto: number): string {
  return `$${Math.round(monto).toLocaleString('es-AR')}`
}
