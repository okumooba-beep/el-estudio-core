-- Fase 4 (sync Supabase) — ampliación de ideas_schema.sql.
--
-- Hábitos y Agenda resultaron tener el mismo problema que Asuntos/
-- Biblioteca: no son entidades 100% independientes en el modelo local.
-- Cada definición de hábito (el nombre que ve HabitosScreen.tsx) es una
-- fila de `db.ideas` con `destino = 'habitos'` — habitChecks solo guarda
-- el circulito marcado/desmarcado por fecha, nunca el nombre. Y cada
-- captura de Agenda todavía no convertida en AgendaEvento real es una
-- fila de `db.ideas` con `destino = 'agenda'` (AgendaScreen.tsx la lee
-- vía `pendientes` y la convierte con `addEvento`). Sin estas dos filas
-- sincronizando, la lista de hábitos y las capturas pendientes de Agenda
-- no viajan entre dispositivos — mismo motor (ideasSync.ts), solo se
-- amplía el filtro de destinos.
--
-- Ninguno de los dos tiene mecanismo de borrado real hoy (mismo caso que
-- 'hoy'), así que no cambia nada más de la tabla — solo el CHECK.
alter table ideas drop constraint if exists ideas_destino_check;
alter table ideas add constraint ideas_destino_check
  check (destino in ('asuntos', 'biblioteca', 'habitos', 'agenda'));
