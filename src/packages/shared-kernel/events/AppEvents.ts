import { EventBus } from './EventBus'

/**
 * F6 (ARCHITECTURE_RATIFIED.md): primer evento real, `idea.captured`,
 * sin suscriptores todavía. El payload se declara acá mismo — no como
 * `Idea` importada — porque shared-kernel no puede depender de ningún
 * otro paquete del proyecto (Foundation §3).
 */
export interface AppEventMap {
  'idea.captured': { id: string; texto: string }
}

export const eventBus = new EventBus<AppEventMap>()
