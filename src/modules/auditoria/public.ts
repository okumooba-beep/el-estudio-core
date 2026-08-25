/**
 * Superficie pública del módulo Auditoría — capa de observación/corrección
 * sobre Agenda y Misiones (nunca un segundo calendario ni una segunda
 * entidad de misión). Nadie más necesita consumir a Auditoría: no compone
 * otros módulos (eso es exclusivo de `today`, ver ARCHITECTURE_RATIFIED.md)
 * y ninguna otra pantalla lee su estado — por eso acá solo vive la
 * identidad de navegación, igual que agenda/public.ts. AuditoriaScreen se
 * importa directo de su archivo en App.tsx, mismo patrón que AgendaScreen.
 */
export const MODULE = { path: '/auditoria', label: 'Auditoría' }
