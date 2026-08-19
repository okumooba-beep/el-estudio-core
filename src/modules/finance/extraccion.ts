import { CATEGORIA_LEXICO, type FinanceCategoria } from './categorias'
import type { FinanceMovimientoTipo } from '@/types/finance'

/**
 * Un peso y un dólar no se suman jamás (Sprint 006). Antes existía un
 * solo `monto` sin moneda, así que "1.090.000 + 200 usd" entraba como
 * un único número en pesos y los dólares se perdían en silencio —
 * exactamente el error que el Contrato del Umbral existe para evitar.
 */
export type Moneda = 'ars' | 'usd'

/** Cómo se movió la plata. No es una cuenta: es una marca del movimiento. */
export type Medio = 'efectivo' | 'transferencia'

export interface MontoExtraido {
  monto: number
  moneda: Moneda
  /**
   * Mini Sprint 029.2 (§9): el medio más cercano a ESTE monto, no el de
   * toda la frase. "820K en efectivo + 400K transferencias" tiene un
   * medio distinto para cada número — usar `extraerMedio(texto)` entero
   * les asignaba "efectivo" a los dos. `null` si ningún medio aparece
   * cerca: quien llama cae al medio global (`extraerMedio`), igual que
   * antes de este mini-sprint.
   */
  medio: Medio | null
}

export interface MovimientoExtraido {
  /**
   * Todos los montos del texto, no solo el primero. "Ingreso de agosto
   * = 1.090.000 + 200 usd" son dos movimientos, y quedarse con uno
   * habría borrado el otro sin avisar.
   */
  montos: readonly MontoExtraido[]
  tipo: FinanceMovimientoTipo
  medio: Medio
  categoria: FinanceCategoria | null
  /** true solo si el léxico acertó una categoría; con `false` la categoría es `null` — "Por revisar", nunca 'otros'. */
  categoriaSegura: boolean
  /**
   * Sprint 028 — cantidad de cuotas si el texto las menciona ("3
   * cuotas", "en 3 cuotas sin intereses"), `null` si no. Solo se
   * reconoce en egresos: un ingreso en cuotas no existe en este modelo.
   */
  cuotas: number | null
}

/** "cobré", "me pagaron", "ingreso" → entra plata. Todo lo demás sale. */
const VERBOS_INGRESO = ['cobré', 'cobre ', 'me pagaron', 'me depositaron', 'me transfirieron',
  'ingreso', 'ingresó', 'ingresé', 'entró', 'entro ', 'recibí', 'recibi ', 'facturé', 'facture ',
  'sueldo', 'honorarios', 'venta']

/** Marca explícita de dólar. Un `$` suelto es peso: en Argentina lo es. */
const MARCA_USD = /(?:d[oó]lar(?:es)?|usd|u\$s|us\$)/i

const MEDIO_EFECTIVO = ['efectivo', 'cash', 'en mano', 'billete']
const MEDIO_TRANSFERENCIA = ['transferencia', 'transferí', 'transferi', 'mercado pago', 'mercadopago',
  'débito', 'debito', 'tarjeta', 'crédito', 'credito', 'cbu', 'alias']

/**
 * Multiplicadores del habla real, no del teclado numérico. Nadie
 * escribe "80000" en el Umbral: escribe "80k", "80 mil" o "80 lucas".
 */
const MULTIPLICADORES: readonly { patron: RegExp; factor: number }[] = [
  { patron: /(\d+(?:[.,]\d+)?)\s*(?:k|mil)\b/gi, factor: 1_000 },
  { patron: /(\d+(?:[.,]\d+)?)\s*(?:luca|lucas)\b/gi, factor: 1_000 },
  { patron: /(\d+(?:[.,]\d+)?)\s*(?:palo|palos|millon|millón|millones)\b/gi, factor: 1_000_000 },
]

/** `$35.000`, `1.090.000`, `200 usd`, `300$`. El punto es miles y la coma decimales. */
const MONTO_PLANO =
  /(?:u\$s|us\$|usd)\s*(\d[\d.]*(?:,\d+)?)|\$\s?(\d[\d.]*(?:,\d+)?)|(\d{1,3}(?:\.\d{3})+(?:,\d+)?)|(\d+(?:,\d+)?)\s*(?:pesos|d[oó]lares|dolares|usd|u\$s|\$)/gi

function aNumero(bruto: string, factor: number): number {
  const normalizado = factor === 1 ? bruto.replace(/\./g, '').replace(',', '.') : bruto.replace(',', '.')
  // A dos decimales, no a entero: "1.250,50" tiene centavos y "80.5k"
  // da 80500.00000000001 en coma flotante si no se redondea.
  return Math.round(Number(normalizado) * factor * 100) / 100
}

/**
 * Todas las posiciones donde aparece `marca` en el texto. Mismo criterio
 * laxo que `extraerMedio` ya usa (`.includes()`, no palabra completa):
 * "transferencia" tiene que encontrar "transferencias" también, plural
 * incluido, así que un borde de palabra estricto (como el que usa
 * `contienePalabra` para categorías) rompería justo el caso que motivó
 * esto — "400K transferencias".
 */
function indicesDeMarca(texto: string, marca: string): number[] {
  const normalizado = texto.toLowerCase()
  const objetivo = marca.toLowerCase()
  const indices: number[] = []
  let desde = 0
  for (let encontrado = normalizado.indexOf(objetivo, desde); encontrado !== -1; encontrado = normalizado.indexOf(objetivo, desde)) {
    indices.push(encontrado)
    desde = encontrado + 1
  }
  return indices
}

/**
 * Mini Sprint 029.2 (§9): más allá de esta distancia, un medio en la
 * frase ya no describe a este monto en particular — es ruido de otra
 * parte de la captura, y es mejor no adivinar (`null`, cae al medio
 * global de `extraerMedio`).
 */
const MEDIO_DISTANCIA_MAXIMA = 40

function medioCercano(texto: string, indice: number, largo: number): Medio | null {
  const candidatos: { medio: Medio; distancia: number }[] = []
  const acumular = (palabras: readonly string[], medio: Medio) => {
    for (const palabra of palabras) {
      for (const posicion of indicesDeMarca(texto, palabra)) {
        const distancia =
          posicion < indice ? Math.max(indice - (posicion + palabra.length), 0) : Math.max(posicion - (indice + largo), 0)
        candidatos.push({ medio, distancia })
      }
    }
  }
  acumular(MEDIO_EFECTIVO, 'efectivo')
  acumular(MEDIO_TRANSFERENCIA, 'transferencia')
  if (candidatos.length === 0) return null
  const mejor = candidatos.reduce((a, b) => (b.distancia < a.distancia ? b : a))
  return mejor.distancia <= MEDIO_DISTANCIA_MAXIMA ? mejor.medio : null
}

/**
 * Todos los montos del texto, cada uno con su moneda, del mayor al
 * menor. La marca de moneda se busca **junto al número**, no en toda la
 * frase: "1.090.000 + 200 usd" tiene un peso y un dólar en la misma
 * línea, y mirar la frase entera los teñiría a los dos de dólar.
 */
export function extraerMontos(texto: string): MontoExtraido[] {
  const encontrados: MontoExtraido[] = []
  const ocupado = new Set<number>()

  const registrar = (indice: number, largo: number, monto: number) => {
    if (!Number.isFinite(monto) || monto <= 0) return
    for (let i = indice; i < indice + largo; i++) if (ocupado.has(i)) return
    for (let i = indice; i < indice + largo; i++) ocupado.add(i)
    // La ventana incluye el match —en "300 dólares" la marca queda
    // adentro del número reconocido— pero se corta en cuanto aparece
    // otra cifra: sin ese corte, el "usd" de "1.090.000 + 200 usd"
    // teñía de dólar también al millón que tiene al lado.
    const despues = texto.slice(indice + largo)
    const proximaCifra = despues.search(/\d/)
    const sufijo = despues.slice(0, proximaCifra === -1 ? 10 : Math.min(proximaCifra, 10))
    const antes = texto.slice(0, indice)
    const prefijo = antes.slice(Math.max(0, antes.search(/\d(?!.*\d)/) + 1, antes.length - 8))
    encontrados.push({
      monto,
      moneda: MARCA_USD.test(prefijo + texto.slice(indice, indice + largo) + sufijo) ? 'usd' : 'ars',
      medio: medioCercano(texto, indice, largo),
    })
  }

  // Los multiplicadores van primero: "80k" tiene que ganarle a "80".
  for (const { patron, factor } of MULTIPLICADORES) {
    for (const hallazgo of texto.matchAll(patron)) {
      if (hallazgo[1]) registrar(hallazgo.index, hallazgo[0].length, aNumero(hallazgo[1], factor))
    }
  }

  for (const hallazgo of texto.matchAll(MONTO_PLANO)) {
    const bruto = hallazgo[1] ?? hallazgo[2] ?? hallazgo[3] ?? hallazgo[4]
    if (bruto) registrar(hallazgo.index, hallazgo[0].length, aNumero(bruto, 1))
  }

  return encontrados.sort((a, b) => b.monto - a.monto)
}

/** El monto principal, para quien solo necesita uno. */
export function extraerMonto(texto: string): number | null {
  return extraerMontos(texto)[0]?.monto ?? null
}

/**
 * Sprint 029.1 (§2/§4): el campo "Monto" de "+ Movimiento"/editar no es
 * una frase — no hay "pesos" ni "usd" al lado que buscar, la moneda ya
 * la eligió el toggle de arriba. Antes ese campo era un
 * `<input type="number">` nativo: el navegador interpreta el punto como
 * separador decimal (convención US), así que "100.000" tipeado se
 * guardaba como 100 — el bug reportado. Misma regla que `aNumero` ya usa
 * arriba para el texto libre (ya probada: "1.250,50" → 1250.5), aplicada
 * acá a la cifra sola: el punto siempre es miles, la coma es decimal.
 */
export function parsearMontoManual(texto: string): number | null {
  const limpio = texto.trim()
  if (!/^\d[\d.,]*$/.test(limpio)) return null
  const normalizado = limpio.replace(/\./g, '').replace(',', '.')
  const monto = Math.round(Number(normalizado) * 100) / 100
  return Number.isFinite(monto) && monto > 0 ? monto : null
}

export function extraerTipo(texto: string): FinanceMovimientoTipo {
  const normalizado = texto.toLowerCase()
  return VERBOS_INGRESO.some((verbo) => normalizado.includes(verbo)) ? 'ingreso' : 'egreso'
}

/**
 * El medio no es una cuenta bancaria: es cómo se movió la plata. Por
 * defecto transferencia, que es el caso común — y se corrige de un
 * toque, igual que la categoría.
 */
export function extraerMedio(texto: string): Medio {
  const normalizado = texto.toLowerCase()
  if (MEDIO_EFECTIVO.some((marca) => normalizado.includes(marca))) return 'efectivo'
  if (MEDIO_TRANSFERENCIA.some((marca) => normalizado.includes(marca))) return 'transferencia'
  return 'transferencia'
}

/**
 * Sprint 025: coincidencia de palabra completa, no substring suelto.
 * Antes `normalizado.includes('gas')` (servicios) matcheaba adentro de
 * "gasté"/"gasto" — cualquier egreso escrito con ese verbo caía en
 * Servicios sin importar de qué se tratara en realidad ("Gasté 30k
 * arreglando el auto" nunca llegaba a probar la palabra "auto"). Los
 * lookaround de borde usan `\p{L}\p{N}` (no `\b`) porque `\b` de JS no
 * trata letras acentuadas como parte de la palabra y rompe con "café",
 * "óptica", etc.
 */
function contienePalabra(texto: string, palabra: string): boolean {
  const escapada = palabra.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const patron = new RegExp(`(?<![\\p{L}\\p{N}])${escapada}(?![\\p{L}\\p{N}])`, 'iu')
  return patron.test(texto)
}

export function extraerCategoria(texto: string): { categoria: FinanceCategoria | null; segura: boolean } {
  for (const [categoria, palabras] of Object.entries(CATEGORIA_LEXICO)) {
    if (palabras.some((palabra) => contienePalabra(texto, palabra))) {
      return { categoria: categoria as FinanceCategoria, segura: true }
    }
  }
  return { categoria: null, segura: false }
}

/**
 * Sprint 028 — reconoce "3 cuotas", "en 3 cuotas", "3 cuotas sin
 * intereses", "3 cuotas s/i". El número tiene que estar pegado a la
 * palabra "cuota(s)": nunca se toma un número suelto del concepto como
 * cantidad de cuotas (§5 del brief — "no interpretar números
 * arbitrarios"). "Una cuota" no matchea (no hay dígito), y a propósito:
 * una sola cuota es un movimiento normal, no una serie.
 */
const CUOTAS_PATRON = /(\d+)\s*cuotas?\b/i

export function extraerCuotas(texto: string): number | null {
  const hallazgo = texto.match(CUOTAS_PATRON)
  if (!hallazgo) return null
  const cantidad = Number(hallazgo[1])
  return Number.isFinite(cantidad) && cantidad >= 2 ? cantidad : null
}

/**
 * Divide un total en N cuotas sin perder centavos (§6 del brief): el
 * resto de la división entera de centavos se reparte de a uno entre las
 * primeras cuotas, así la suma de todas siempre da exacto el total
 * original — nunca una diferencia acumulada por redondeo.
 */
export function dividirEnCuotas(total: number, cantidadCuotas: number): number[] {
  const centavosTotal = Math.round(total * 100)
  const base = Math.floor(centavosTotal / cantidadCuotas)
  const resto = centavosTotal - base * cantidadCuotas
  return Array.from({ length: cantidadCuotas }, (_, indice) => (base + (indice < resto ? 1 : 0)) / 100)
}

/**
 * Regla temporal de cuotas (§3 del brief): cuota 1 = mes de la compra,
 * cuota N = mismo día, N-1 meses después. Si ese día no existe en el
 * mes destino (31/01 → febrero), se usa el último día válido de ese
 * mes — nunca una regla de vencimiento de tarjeta, solo el calendario.
 */
export function fechaCuota(fechaInicial: string, indiceCuota: number): string {
  const anio = Number(fechaInicial.slice(0, 4))
  const mes = Number(fechaInicial.slice(5, 7))
  const dia = Number(fechaInicial.slice(8, 10))
  const mesesDesdeEnero = mes - 1 + indiceCuota
  const anioDestino = anio + Math.floor(mesesDesdeEnero / 12)
  const mesDestino = ((mesesDesdeEnero % 12) + 12) % 12
  const ultimoDiaMesDestino = new Date(anioDestino, mesDestino + 1, 0).getDate()
  const diaDestino = Math.min(dia, ultimoDiaMesDestino)
  return `${anioDestino}-${String(mesDestino + 1).padStart(2, '0')}-${String(diaDestino).padStart(2, '0')}`
}

/**
 * Motor de movimientos. Convierte lo que escribiste en el Umbral —"Gasté
 * 80k en gasolina"— en lo que Finanzas necesita: cuánto, en qué moneda,
 * si entra o sale, cómo se movió y de qué se trata.
 *
 * Nunca inventa un monto. Si el texto no trae número, `montos` queda
 * vacío y la captura espera en Finanzas hasta que la completes — el
 * Contrato del Umbral §10: el Umbral resuelve dónde, el módulo resuelve
 * qué falta.
 */
export function extraerMovimiento(texto: string): MovimientoExtraido {
  const { categoria, segura } = extraerCategoria(texto)
  const tipo = extraerTipo(texto)
  return {
    montos: extraerMontos(texto),
    tipo,
    medio: extraerMedio(texto),
    categoria,
    categoriaSegura: segura,
    cuotas: tipo === 'egreso' ? extraerCuotas(texto) : null,
  }
}
