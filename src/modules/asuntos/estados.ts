import type { Idea } from '@/types/idea'

/**
 * Los cuatro estados de un asunto, en el orden que fijó
 * EL_ESTUDIO_CORE.md: "Cada asunto únicamente cambia de estado.
 * Pendiente. En progreso. En espera. Completado. Nada más."
 *
 * No hay prioridad, ni fecha límite, ni responsable, ni notas. Un
 * asunto no es un proyecto en miniatura: es una situación abierta que
 * solo cambia de estado.
 */
export type AsuntoEstado = 'pendiente' | 'en-progreso' | 'en-espera' | 'completado'

export const ASUNTO_ESTADOS: readonly AsuntoEstado[] = ['pendiente', 'en-progreso', 'en-espera', 'completado']

export const ESTADO_LABEL: Record<AsuntoEstado, string> = {
  pendiente: 'Pendiente',
  'en-progreso': 'En progreso',
  'en-espera': 'En espera',
  completado: 'Completado',
}

/**
 * `Idea.estado` es un `string | null` compartido con Misiones (que lo
 * usa para 'terminada'), así que acá se normaliza en vez de confiar en
 * él: una idea recién llegada de El Umbral tiene `estado: null` y eso
 * es un asunto pendiente, no un asunto sin estado.
 */
export function estadoDe(idea: Idea): AsuntoEstado {
  const estado = idea.estado as AsuntoEstado | null
  return estado && ASUNTO_ESTADOS.includes(estado) ? estado : 'pendiente'
}

const DIA_MS = 86_400_000

/**
 * Cuánto lleva esperando, contado desde el último cambio de estado.
 *
 * Es el único dato que Asuntos muestra además del texto, y es
 * deliberado: en una situación que depende de otro, el tiempo ES la
 * información — un pago demorado dos días y uno demorado tres semanas
 * son cosas distintas, y ninguna lista con una etiqueta de estado te lo
 * dice.
 *
 * No es un contador de los que el Contrato del Umbral §11 prohíbe:
 * aquellos puntúan al usuario ("tenés 47 sin clasificar"). Este
 * describe al asunto, no a vos, y es justo el dato que decide si hoy
 * toca reclamar algo o no.
 */
export function diasEsperando(idea: Idea, ahora: Date): number {
  return Math.floor((ahora.getTime() - new Date(idea.updatedAt).getTime()) / DIA_MS)
}

export function describirEspera(dias: number): string {
  if (dias <= 0) return 'Hoy'
  if (dias === 1) return 'Ayer'
  if (dias < 7) return `Hace ${dias} días`
  if (dias < 14) return 'Hace una semana'
  if (dias < 31) return `Hace ${Math.floor(dias / 7)} semanas`
  if (dias < 62) return 'Hace un mes'
  return `Hace ${Math.floor(dias / 30)} meses`
}
