-- Sync Umbral + Cuaderno: las Ideas 'hoy' y 'archivo' pasan a viajar en la
-- tabla `ideas` (ver src/lib/sync/ideasSync.ts). Mismo patrón que
-- ideas_add_habitos_agenda.sql para ampliar el CHECK de destino.
alter table ideas drop constraint if exists ideas_destino_check;
alter table ideas add constraint ideas_destino_check
  check (destino in ('asuntos', 'biblioteca', 'habitos', 'agenda', 'hoy', 'archivo'));

-- Last-write-wins en el servidor: un upsert/update con `updated_at` más
-- viejo que el ya guardado se ignora en silencio (la fila no cambia). El
-- Cuaderno se escribe desde más de un dispositivo; sin esto, un push
-- atrasado pisaría una edición más nueva.
create or replace function ideas_ignorar_update_viejo() returns trigger
language plpgsql as $$
begin
  if new.updated_at < old.updated_at then
    return null;
  end if;
  return new;
end $$;

create or replace trigger ideas_lww before update on ideas
  for each row execute function ideas_ignorar_update_viejo();
