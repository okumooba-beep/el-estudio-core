/**
 * Superficie pública del módulo Agenda. `agenda` ya existía reservado
 * como IdeaDestino y FurnitureId (ver work-table/destinoFurniture.ts)
 * desde antes de tener ruta propia. Mismo patrón que finance/public.ts:
 * la ruta importa AgendaScreen directo de su propio archivo en App.tsx —
 * acá solo se expone la identidad de navegación.
 */
export const MODULE = { path: '/agenda', label: 'Agenda' }
