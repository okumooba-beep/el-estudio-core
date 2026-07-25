/**
 * Puente entre animaciones CSS y "eventos de mundo" semánticos (Sprint
 * "Ambient Life Engine v1.0"): ningún objeto llama a esto directo — un
 * único listener delegado (AmbientEventBridge.tsx) escucha
 * animationiteration/animationend en toda la habitación y traduce el
 * animation-name que ya existe en index.css a un nombre con
 * significado. Nadie implementa sonido todavía, pero cualquier futuro
 * motor de audio ya tiene un nombre estable de qué escuchar
 * (window.addEventListener('ambient:lamp_breath', ...)) sin tocar
 * ni un componente visual ni este archivo cuando se suma una animación
 * nueva a un objeto ya existente — solo este mapa.
 */

export type AmbientEventId =
  | 'window_light_shift'
  | 'lamp_breath'
  | 'monitor_glow'
  | 'journal_page_settle'
  | 'library_idle'
  | 'coffee_steam'

const ANIMATION_TO_EVENT: Record<string, AmbientEventId> = {
  'light-breathe-window': 'window_light_shift',
  'light-breathe-lamp': 'lamp_breath',
  'monitor-glow': 'monitor_glow',
  'journal-page-settle-left': 'journal_page_settle',
  'journal-page-settle-right': 'journal_page_settle',
  'library-idle-sway': 'library_idle',
  'taza-vapor-rise': 'coffee_steam',
}

export function notifyAmbientAnimation(animationName: string): void {
  const eventId = ANIMATION_TO_EVENT[animationName]
  if (!eventId) return
  window.dispatchEvent(new CustomEvent(`ambient:${eventId}`, { detail: { animationName } }))
}
