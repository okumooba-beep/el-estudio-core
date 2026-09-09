-- Sprint "Room / Ajustes: 4 cambios puntuales" (§4) — ampliación de room_preferences_schema.sql.
--
-- El fondo vuelve a `cover` (el §1 de este mismo sprint lo había puesto en
-- `contain`) — para compensar el recorte lateral que eso trae de vuelta,
-- Ajustes suma un control manual de 3 posiciones (Izquierda/Centro/
-- Derecha) que ajusta el background-position horizontal de la foto
-- (ver .room-layer-photo en src/index.css). Es una elección del usuario,
-- nunca un encuadre automático por imagen — mismo motivo por el que
-- fondo_id tampoco tiene lógica especial por imagen.
--
-- `default '33'` en fondo_id es nuevo acá (la tabla original no tenía
-- default): sin él, guardar solo la posición para un usuario que nunca
-- eligió fondo explícitamente en otro dispositivo (el default '33' vive
-- únicamente en el cliente, ver FONDO_DEFAULT en roomBackgrounds.ts)
-- rompería el insert por la columna NOT NULL sin valor. Incluir un
-- default acá deja que cada preferencia se guarde de forma independiente,
-- igual que ya asume roomBackgroundClient.ts (dos upserts separados que
-- solo tocan su propia columna).
alter table room_preferences alter column fondo_id set default '33';

alter table room_preferences add column if not exists posicion_x text not null default 'center';

alter table room_preferences drop constraint if exists room_preferences_posicion_x_check;
alter table room_preferences add constraint room_preferences_posicion_x_check
  check (posicion_x in ('left', 'center', 'right'));
