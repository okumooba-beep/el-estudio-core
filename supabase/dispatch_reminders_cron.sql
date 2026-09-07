-- Fase 2 (push real) — pg_cron para disparar dispatch-reminders cada minuto.
--
-- NO CORRAS ESTO TODAVÍA. Es solo para tu revisión. Una vez que ejecutes el
-- bloque 3 (cron.schedule), la función va a correr cada minuto contra
-- producción — activala solo cuando estés listo.
--
-- Orden sugerido: 1) extensiones, 2) Vault (una sola vez, con tus valores
-- reales), 3) cron.schedule (el paso que activa todo).

-- 1) Extensiones necesarias (pg_cron para programar, pg_net para el POST
-- HTTP saliente). En Supabase suelen venir disponibles pero no siempre
-- habilitadas — "if not exists" hace este bloque seguro de re-correr.
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

-- 2) Guardar la URL de la función y la service_role key en Vault, en vez de
-- plaintext en cron.job (que cualquiera con acceso de lectura a esa tabla
-- podría ver — Vault los guarda cifrados).
--
-- Reemplazá <SERVICE_ROLE_KEY_AQUI> por la key real ANTES de correr esto:
-- Supabase Dashboard → Project Settings → API → service_role key (sección
-- "Project API keys"). No la pego yo acá porque no la tengo, y porque no
-- debería quedar en el historial de este chat.
select vault.create_secret(
  'https://jixzgcbfddbpqgeohade.supabase.co/functions/v1/dispatch-reminders',
  'dispatch_reminders_url'
);

select vault.create_secret(
  '<SERVICE_ROLE_KEY_AQUI>',
  'dispatch_reminders_service_role_key'
);

-- Si ya corriste el bloque 2 antes y necesitás actualizar un valor (rotaste
-- la key, por ejemplo), usá esto en vez de create_secret (que falla si el
-- nombre ya existe):
--   select vault.update_secret(
--     (select id from vault.secrets where name = 'dispatch_reminders_service_role_key'),
--     '<NUEVA_KEY>'
--   );

-- 3) Programar el cron — ESTE ES EL PASO QUE ACTIVA EL ENVÍO REAL CADA
-- MINUTO. Corré todo lo de arriba primero y confirmá que los secrets
-- quedaron bien guardados (select name from vault.secrets;) antes de
-- ejecutar esto.
select cron.schedule(
  'dispatch-reminders-cada-minuto',
  '* * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'dispatch_reminders_url'),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'dispatch_reminders_service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Para pausar/desactivar el cron más adelante (sin borrar los secrets):
--   select cron.unschedule('dispatch-reminders-cada-minuto');
--
-- Para ver las últimas corridas y sus resultados HTTP:
--   select * from cron.job_run_details order by start_time desc limit 20;
