-- Fase 6 (IA en el bolsillo) — suma los 4 orígenes automáticos nuevos al
-- check constraint de `recordatorios.origen_tipo` (recordatorios_schema.sql
-- ya documentó que 'mision' se sumó vía ALTER en producción; este archivo
-- sigue el mismo patrón: drop + re-create del constraint, seguro de
-- re-correr).
--
-- Los 4 tipos, uno por punto del roadmap de IA:
--   reflexion_semanal      -- punto 2: resumen semanal por espacio
--   mision_pendiente_diaria -- punto 3: recordatorio de misión sin hacer
--   inactividad             -- punto 4: el usuario no abrió la app en X días
--   habito_sin_marcar       -- punto 5: hábito de hoy todavía sin marcar
--
-- Cada Edge Function nueva solo inserta filas acá (server-side, con
-- service role) — el cron de dispatch-reminders que ya corre cada minuto
-- las despacha solo, sin tocar ese archivo.
alter table recordatorios drop constraint if exists recordatorios_origen_tipo_check;

alter table recordatorios add constraint recordatorios_origen_tipo_check
  check (origen_tipo in (
    'agenda_evento',
    'agenda_bloque',
    'mision',
    'manual',
    'reflexion_semanal',
    'mision_pendiente_diaria',
    'inactividad',
    'habito_sin_marcar'
  ));
