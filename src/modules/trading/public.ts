/**
 * Superficie pública del módulo Trading (F14, ARCHITECTURE_RATIFIED.md
 * §7, roadmap F14): lo único importable de este módulo desde fuera.
 * TradingScreen se agrega acá (fase "la habitación es el sistema
 * operativo") para que el tab Trading del Workspace lo consuma sin
 * import directo al interior del módulo.
 */
export const MODULE = { path: '/trading', label: 'Trading' }
export { TradingScreen } from './TradingScreen'
