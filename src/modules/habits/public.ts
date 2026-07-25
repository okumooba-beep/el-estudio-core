/**
 * Superficie pública del módulo Habits (F14, ARCHITECTURE_RATIFIED.md
 * §7, roadmap F14; renombrado de `habitos` en F16): lo único
 * importable de este módulo desde fuera. HabitosScreen se agrega acá
 * (fase "la habitación es el sistema operativo") para que la Pizarra
 * (Planning Board) lo consuma sin import directo al interior.
 */
export const MODULE = { path: '/habitos', label: 'Hábitos' }
export { HabitosScreen } from './HabitosScreen'
/**
 * Build Core V1: El Estudio Core necesita el estado de hoy de cada
 * hábito para su propio vistazo compacto (ver
 * src/modules/today/components/HabitsGlance.tsx) — mismo hook de
 * siempre, ya usado por HabitosScreen, ahora también público.
 */
export { useHabitChecks } from './useHabitChecks'
