/**
 * Espejo exacto de `IdeaDestino` (ver src/types/idea.ts) — mismo patrón
 * que `cognitive-engine/providers/rule-based/rules.ts` (Sprint F7):
 * duplicado a propósito, nunca importado, porque `world` no puede
 * depender del árbol de aplicación (ARCHITECTURE_RATIFIED.md §3). Si
 * `IdeaDestino` cambia sus valores, este tipo debe actualizarse junto
 * con él.
 */
type Destino = 'hoy' | 'misiones' | 'habitos' | 'trading' | 'finanzas' | 'biblioteca' | 'archivo'

/**
 * El lenguaje interno del Estudio (Sprint 2.2, punto 06): "módulo" deja
 * de ser la palabra correcta puertas adentro del código. Cada destino
 * es un mueble real del Estudio — todavía no cambia ninguna ruta ni
 * ninguna etiqueta visible (eso no lo pidió ese sprint), pero el
 * código ya puede nombrarlos así en comentarios y en atributos que
 * nadie ve todavía.
 *
 * Vive en packages/world/studio/ desde Sprint F8 (antes src/lib/studio/,
 * y antes de eso src/lib/muebles/): la arquitectura común de los
 * muebles pertenece al Estudio entero, no a un destino en particular
 * (ver punto 09).
 *
 * Finanzas no tiene mueble propio: la lista que dio Sprint 2.2 no lo
 * nombró, y no corresponde inventarle uno sin que el Estudio lo pida
 * (ver autorrevisión). Por eso el mapa es parcial a propósito.
 */
export const MUEBLES: Partial<Record<Destino, string>> = {
  hoy: 'Escritorio',
  misiones: 'Tablero de Corcho',
  habitos: 'Calendario',
  trading: 'Mesa de Análisis',
  archivo: 'Archivador',
  biblioteca: 'Biblioteca',
}
