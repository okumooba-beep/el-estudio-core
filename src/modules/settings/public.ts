/**
 * Superficie pública del módulo Ajustes: pantalla de utilidades del
 * dispositivo (exportar datos, actualizar la PWA instalada). No compone
 * ni es consumida por ningún otro módulo — igual que Agenda/Biblioteca,
 * AjustesScreen se importa directo de su archivo en App.tsx, acá solo
 * vive la identidad de navegación.
 */
export const MODULE = { path: '/ajustes', label: 'Ajustes' }
