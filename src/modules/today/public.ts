/**
 * Superficie pública del módulo Today (F14, ARCHITECTURE_RATIFIED.md §7,
 * roadmap F14; renombrado de `hoy` en F16): lo único importable de este
 * módulo desde fuera. Today expone únicamente su identidad de
 * navegación — `app/modules.ts` la agrega en el registro central, nunca
 * la declara directamente.
 */
export const MODULE = { path: '/', label: 'Hoy' }
