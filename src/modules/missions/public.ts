/**
 * Superficie pública del módulo Missions (F14, ARCHITECTURE_RATIFIED.md
 * §7, roadmap F14; renombrado de `misiones` en F16): lo único
 * importable de este módulo desde fuera. MisionesScreen se agrega acá
 * (fase "la habitación es el sistema operativo") para que el tab
 * Proyectos del Workspace lo consuma sin import directo al interior.
 */
export const MODULE = { path: '/misiones', label: 'Misiones' }
export { MisionesScreen } from './MisionesScreen'
