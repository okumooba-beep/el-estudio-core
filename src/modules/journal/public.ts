/**
 * Superficie pública del módulo Journal: lo único importable de este
 * módulo desde fuera (mismo patrón que habits/missions/trading/frases).
 *
 * MODULE (Sprint "Build V1"): Journal ya tenía ruta (/diario, App.tsx)
 * pero nunca identidad de navegación — el Home nuevo la necesita para
 * poder linkearlo igual que a los demás módulos.
 */
export { DiarioScreen } from './DiarioScreen'
export const MODULE = { path: '/diario', label: 'Cuaderno' }
