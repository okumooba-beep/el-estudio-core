/**
 * Superficie pública del módulo Finanzas. `finanzas` ya existía
 * reservado como IdeaDestino y FurnitureId (ver
 * work-table/destinoFurniture.ts) desde antes de tener ruta propia.
 * Threshold Experience V1: deja de ser un `ModulePlaceholder` — la
 * primera versión real vive en FinanceScreen (foundations only:
 * Patrimonio Neto, Liquidez, Flujo de Caja, Inversiones, Deudas, Metas),
 * importada directo en App.tsx (mismo patrón que HoyScreen/MisionesScreen/
 * DiarioScreen: la ruta importa la pantalla de su propio archivo, no de
 * `public.ts` — acá `public.ts` solo expone la identidad de navegación).
 */
export const MODULE = { path: '/finanzas', label: 'Finanzas' }
