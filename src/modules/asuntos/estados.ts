import type { Idea } from '@/types/idea'

/**
 * Los cuatro estados de un asunto (Sprint 005 — "Sistema de
 * seguimiento"): Pendiente, En espera, Resuelto, Archivado. Nada más.
 *
 * No hay "en progreso": un asunto por definición depende de otro, así
 * que nunca hay nada que "progrese" desde este lado. Si empezás a
 * poder avanzarlo vos mismo, dejó de ser un asunto — se resuelve, y lo
 * que sigue es una Misión nueva (módulos independientes, nunca una
 * conversión automática).
 */
export type AsuntoEstado = 'pendiente' | 'en-espera' | 'resuelto' | 'archivado'

export const ASUNTO_ESTADOS: readonly AsuntoEstado[] = ['pendiente', 'en-espera', 'resuelto', 'archivado']

export const ESTADO_LABEL: Record<AsuntoEstado, string> = {
  pendiente: 'Pendiente',
  'en-espera': 'En espera',
  resuelto: 'Resuelto',
  archivado: 'Archivado',
}

/**
 * `Idea.estado` es un `string | null` compartido con Misiones (que lo
 * usa para 'terminada'), así que acá se normaliza en vez de confiar en
 * él: una idea recién llegada de El Umbral tiene `estado: null` y eso
 * es un asunto pendiente, no un asunto sin estado.
 *
 * 'en-progreso' y 'completado' son valores heredados del diseño previo
 * (Sprint de Producto 003, cuatro estados distintos): se migran acá en
 * lectura para no perder asuntos ya guardados con ese valor, sin tocar
 * lo persistido.
 */
export function estadoDe(idea: Idea): AsuntoEstado {
  const estado = idea.estado
  if (estado === 'completado') return 'resuelto'
  if (estado === 'en-progreso') return 'pendiente'
  return estado && (ASUNTO_ESTADOS as readonly string[]).includes(estado) ? (estado as AsuntoEstado) : 'pendiente'
}

/**
 * Los dos niveles de prioridad (Sprint 005). Nunca "urgente": el brief
 * es explícito en que un tercer nivel no agrega información, solo
 * ansiedad — la misma razón por la que el tono visual del módulo debe
 * quedarse tranquilo.
 */
export type AsuntoPrioridad = 'normal' | 'importante'

export const ASUNTO_PRIORIDADES: readonly AsuntoPrioridad[] = ['normal', 'importante']

export const PRIORIDAD_LABEL: Record<AsuntoPrioridad, string> = {
  normal: 'Normal',
  importante: 'Importante',
}

/** Un asunto recién capturado no trae prioridad — el silencio es 'normal'. */
export function prioridadDe(idea: Idea): AsuntoPrioridad {
  return idea.prioridad === 'importante' ? 'importante' : 'normal'
}
