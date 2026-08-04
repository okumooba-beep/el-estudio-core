import type { ClassificationRule, StructuralRule } from '../../ports/ClassificationEngine'

/**
 * Espejo exacto de `IdeaDestino` (ver src/types/idea.ts) — duplicado a
 * propósito, nunca importado: cognitive-engine no puede depender de
 * ningún paquete del proyecto (ARCHITECTURE_RATIFIED.md §3). Si
 * `IdeaDestino` cambia sus valores, este tipo debe actualizarse junto
 * con él.
 */
export type Destino =
  | 'hoy'
  | 'misiones'
  | 'asuntos'
  | 'habitos'
  | 'trading'
  | 'finanzas'
  | 'biblioteca'
  | 'archivo'

/**
 * Reglas simples y transparentes (Sprint 2.1, punto 01): palabra clave
 * → destino. Cada regla se puede leer en una línea. Agregar un destino
 * nuevo es agregar una línea acá, nunca tocar RuleBasedClassifier.ts.
 *
 * Umbral V1: la lista queda igual — este sprint no amplía el léxico
 * (Contrato §9 tiene el léxico completo pendiente). Lo que cambia es
 * que una coincidencia léxica ya no alcanza para mover una hoja: vale
 * PESO_LEXICO, que es confianza media, o sea propuesta sin movimiento.
 */
/**
 * Contrato del Umbral §6, familia sintáctica: una marca de dependencia
 * ("me tienen que", "esperando") describe quién actúa, no de qué se
 * habla, y por eso le gana a una palabra de tema. Sigue por debajo de
 * UMBRAL_ALTA a propósito — nunca mueve una hoja sola, solo decide cuál
 * de los dos destinos se propone primero.
 */
export const PESO_DEPENDENCIA = 0.72

export const RULES: readonly ClassificationRule<Destino>[] = [
  { id: 'habito-meditar', keyword: 'meditar', destino: 'habitos' },
  { id: 'habito-gimnasio', keyword: 'gimnasio', destino: 'habitos' },
  { id: 'trading-nasdaq', keyword: 'nasdaq', destino: 'trading' },
  { id: 'trading-mnq', keyword: 'mnq', destino: 'trading' },
  { id: 'trading-sp500', keyword: 'sp500', destino: 'trading' },
  { id: 'mision-tribunales', keyword: 'tribunales', destino: 'misiones' },
  { id: 'mision-comprar', keyword: 'comprar', destino: 'misiones' },
  { id: 'mision-llamar', keyword: 'llamar', destino: 'misiones' },
  { id: 'mision-turno', keyword: 'turno', destino: 'misiones' },
  // Asuntos (Sprint 003): la marca de un asunto no es el tema, es la
  // espera. Todas estas expresiones dicen "depende de otro" — que es
  // exactamente la pregunta que lo separa de una misión. Se eligen
  // formas cerradas: 'pendiente' suelto o 'todavía no' calificarían
  // media docena de pensamientos que no son asuntos.
  { id: 'asunto-esperando', keyword: 'esperando', destino: 'asuntos', peso: PESO_DEPENDENCIA },
  { id: 'asunto-a-la-espera', keyword: 'a la espera', destino: 'asuntos', peso: PESO_DEPENDENCIA },
  { id: 'asunto-pendiente-de', keyword: 'pendiente de', destino: 'asuntos', peso: PESO_DEPENDENCIA },
  { id: 'asunto-me-tienen-que', keyword: 'me tienen que', destino: 'asuntos', peso: PESO_DEPENDENCIA },
  { id: 'asunto-quedo-en', keyword: 'quedó en', destino: 'asuntos', peso: PESO_DEPENDENCIA },
  { id: 'asunto-quedo-en-sin-tilde', keyword: 'quedo en', destino: 'asuntos', peso: PESO_DEPENDENCIA },
  { id: 'finanzas-presupuesto', keyword: 'presupuesto', destino: 'finanzas' },
  { id: 'finanzas-factura', keyword: 'factura', destino: 'finanzas' },
  { id: 'finanzas-ahorro', keyword: 'ahorro', destino: 'finanzas' },
  { id: 'biblioteca-frase', keyword: 'frase', destino: 'biblioteca' },
  { id: 'archivo-archivar', keyword: 'archivar', destino: 'archivo' },
]

/**
 * Señales estructurales (Contrato del Umbral §6) — la familia que
 * faltaba. Un monto es la señal más fuerte que existe en el sistema y
 * hasta este sprint el clasificador la ignoraba por completo.
 *
 * Un monto por sí solo NO es Finanzas: "Comprar un escritorio de
 * $200.000" es una intención de gasto, no un movimiento (Contrato §4:
 * Finanzas no recibe intenciones futuras). Por eso el monto vale
 * PESO_MONTO — media — y solo llega a confianza alta acompañado de un
 * verbo de gasto en pasado.
 */
export const ESTRUCTURA: readonly StructuralRule<Destino>[] = [
  {
    id: 'finanzas-monto',
    // Tres formas, todas vistas en uso real:
    //   $35.000        signo adelante
    //   200$ / 200 usd signo o moneda atrás
    //   1.090.000      miles con puntos, sin ninguna moneda
    // La tercera faltaba, y era la que dejaba "Ingreso primera semana =
    // 1.090.000" sin una sola señal: la captura quedaba varada en el
    // Umbral en vez de llegar a Finanzas.
    patron: /\$\s?\d|\d\s?\$|(?:\d[\d.,]*)\s?(?:pesos|d[oó]lares|dolares|usd|mil|luca|lucas|palo|palos)\b|\d{1,3}(?:\.\d{3})+(?:,\d+)?/i,
    destino: 'finanzas',
  },
]

/**
 * Pretérito de gasto en primera persona (Contrato §6, familia
 * sintáctica). Solo formas cerradas y sin ambigüedad: "gasté" nunca es
 * otra cosa. Se listan con y sin tilde porque el texto llega
 * normalizado pero no siempre acentuado.
 */
export const VERBOS_GASTO_PASADO: readonly string[] = [
  'gasté', 'gaste', 'pagué', 'pague', 'compré', 'compre', 'cobré', 'cobre',
  'transferí', 'transferi', 'deposité', 'deposite', 'me salió', 'me salio',
  'me costó', 'me costo',
  // Un movimiento no siempre se enuncia con verbo: "Ingreso primera
  // semana de agosto" es tan financiero como "cobré".
  'ingreso', 'ingresó', 'ingrese', 'ingresé', 'me pagaron', 'me depositaron', 'facturé', 'facture',
]

/**
 * Negadores (Contrato §6). Sin esto "No tengo que comprar nada" movía
 * la hoja a Misiones por contener "comprar" — el error silencioso más
 * visible de la auditoría. Una palabra clave precedida por un negador
 * en la misma oración no dispara.
 */
export const NEGADORES: readonly string[] = ['no ', 'nunca ', 'ni ', 'tampoco ', 'sin ', 'jamás ', 'jamas ']

/** Contrato §6: el peso de cada familia de señal. */
export const PESO_LEXICO = 0.6
export const PESO_MONTO = 0.6
export const PESO_GASTO_PASADO = 0.86
export const PESO_MONTO_Y_GASTO = 0.95
/** Contrato §6, regla 2: cada señal adicional que apunta al mismo destino. */
export const BONO_CONVERGENCIA = 0.15
/** Contrato §6, regla 3: dos destinos por encima de este valor son un conflicto. */
export const UMBRAL_CONFLICTO = 0.5
