-- Ampliación de room_preferences_add_posicion_x.sql — posición del fondo
-- como porcentaje continuo, no 3 posiciones fijas.
--
-- Ajustes reemplazó los botones Izquierda/Centro/Derecha por un control
-- arrastrable que guarda un porcentaje 0-100 (ver roomBackgrounds.ts:
-- normalizarPosicionX). El CHECK anterior solo aceptaba 'left'/'center'/
-- 'right' como texto — sin ampliarlo, cualquier upsert con un porcentaje
-- nuevo rompe el insert/update en Supabase (el valor queda aplicado local
-- pero nunca sube, mismo síntoma que documenta roomBackgroundClient.ts
-- para cualquier error de guardado). Sigue aceptando los 3 valores viejos
-- para no romper filas ya guardadas por dispositivos que todavía no
-- volvieron a abrir la app con esta versión.
alter table room_preferences drop constraint if exists room_preferences_posicion_x_check;
alter table room_preferences add constraint room_preferences_posicion_x_check
  check (
    posicion_x in ('left', 'center', 'right')
    or (posicion_x ~ '^[0-9]{1,3}(\.[0-9]+)?$' and posicion_x::numeric >= 0 and posicion_x::numeric <= 100)
  );
