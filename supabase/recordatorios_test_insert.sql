-- Prueba manual de punta a punta para dispatch-reminders. Corré esto en el
-- SQL Editor de Supabase (usa now() del servidor de Postgres, no tu reloj
-- local) DESPUÉS de haber corrido recordatorios_schema.sql.
--
-- Reemplazá <TU_EMAIL_AQUI> por el email con el que iniciás sesión en la
-- app — así no hace falta que busques tu user_id a mano.
insert into recordatorios (user_id, origen_tipo, titulo, cuerpo, disparar_en)
values (
  (select id from auth.users where email = '<TU_EMAIL_AQUI>'),
  'manual',
  'Recordatorio de prueba',
  'Si ves esto, dispatch-reminders funciona de punta a punta.',
  now() + interval '2 minutes'
);

-- Para chequear que quedó bien insertada (y ver disparar_en en hora del
-- servidor, para comparar con la hora de tu push cuando llegue):
select id, titulo, disparar_en, enviado, enviado_en, now() as hora_actual_servidor
from recordatorios
order by created_at desc
limit 1;
