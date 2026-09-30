import type { FinanceCategoria } from './categorias'
import type { FinanceMovimiento } from '@/types/finance'

/**
 * Sugerencia automática de categoría (todo Finanzas, no solo Gastos
 * Fijos — a diferencia de `gastoFijoMatch.ts`, que matchea contra una
 * palabra clave fija por gasto fijo, acá se busca en el historial real
 * del usuario: conceptos parecidos al que está tipeando ahora, y qué
 * categoría usó la mayoría de las veces para ellos. Nunca fuerza nada —
 * el llamador la usa solo para preseleccionar, el usuario la acepta con
 * un toque o la cambia (misma UI de siempre, ver NuevoMovimiento.tsx).
 */
function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

/** Palabras demasiado comunes para delatar una categoría por sí solas — quedan afuera de la comparación. */
const PALABRAS_VACIAS = new Set([
  'de', 'la', 'el', 'en', 'con', 'por', 'para', 'del', 'los', 'las',
  'una', 'uno', 'mi', 'tu', 'su', 'que', 'un', 'al', 'se', 'me',
])

function palabrasClave(texto: string): string[] {
  return normalizar(texto)
    .split(/[^\p{L}\p{N}]+/u)
    .filter((palabra) => palabra.length >= 3 && !PALABRAS_VACIAS.has(palabra))
}

/**
 * Devuelve la categoría a preseleccionar para `concepto`, o `null` si no
 * hay un patrón claro. "Claro" acá significa: al menos un movimiento
 * pasado con una palabra en común, y esa categoría es la que ganó en
 * más de la mitad de esos movimientos — un empate o una mayoría débil
 * no alcanza para sugerir con confianza.
 */
export function sugerirCategoria(
  concepto: string,
  movimientos: readonly FinanceMovimiento[],
): FinanceCategoria | null {
  const palabras = palabrasClave(concepto)
  if (palabras.length === 0) return null

  const conteoPorCategoria = new Map<FinanceCategoria, number>()
  let totalCoincidencias = 0

  for (const movimiento of movimientos) {
    if (movimiento.tipo !== 'egreso' || !movimiento.categoria) continue
    const palabrasMovimiento = palabrasClave(movimiento.concepto)
    if (!palabras.some((palabra) => palabrasMovimiento.includes(palabra))) continue

    totalCoincidencias++
    conteoPorCategoria.set(
      movimiento.categoria,
      (conteoPorCategoria.get(movimiento.categoria) ?? 0) + 1,
    )
  }

  if (totalCoincidencias === 0) return null

  let categoriaGanadora: FinanceCategoria | null = null
  let conteoGanador = 0
  for (const [categoria, conteo] of conteoPorCategoria) {
    if (conteo > conteoGanador) {
      categoriaGanadora = categoria
      conteoGanador = conteo
    }
  }

  if (categoriaGanadora === null || conteoGanador / totalCoincidencias <= 0.5) return null
  return categoriaGanadora
}
