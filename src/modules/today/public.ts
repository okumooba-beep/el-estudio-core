/**
 * Superficie pública del módulo Today (F14, ARCHITECTURE_RATIFIED.md §7,
 * roadmap F14; renombrado de `hoy` en F16): lo único importable de este
 * módulo desde fuera. Today expone únicamente su identidad de
 * navegación — `app/modules.ts` la agrega en el registro central, nunca
 * la declara directamente.
 */
export const MODULE = { path: '/', label: 'Hoy' }

/**
 * Sprint 015.4 ("Navegación global de El Estudio Core"): identidad de
 * `EspaciosScreen`, la segunda pantalla que expone Today — mismo patrón
 * F14 que `MODULE`, nombre distinto porque un módulo ya usa `MODULE` para
 * su ruta principal (Hoy).
 */
export const ESPACIOS_MODULE = { path: '/espacios', label: 'Espacios' }
