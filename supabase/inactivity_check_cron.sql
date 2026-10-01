-- Fase 6 (IA en el bolsillo) — pg_cron para inactivity-check, CADA HORA
-- (a diferencia de los otros crons de esta fase, que corren una vez al
-- día). El umbral pedido es de 3 horas de silencio — un cron diario no
-- puede detectar eso con sentido, así que este corre con la misma
-- granularidad que el umbral que evalúa (ver el comentario en
-- supabase/functions/inactivity-check/index.ts).
--
-- NO CORRAS ESTO TODAVÍA. Revisalo primero. Reusa el secret
-- 'dispatch_reminders_service_role_key' de Vault — solo agrega la URL
-- propia de esta función.

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

select vault.create_secret(
  'https://jixzgcbfddbpqgeohade.supabase.co/functions/v1/inactivity-check',
  'inactivity_check_url'
);

-- Si ya corriste esto antes y necesitás actualizar la URL:
--   select vault.update_secret(
--     (select id from vault.secrets where name = 'inactivity_check_url'),
--     '<NUEVA_URL>'
--   );

select cron.schedule(
  'inactivity-check-cada-hora',
  '0 * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'inactivity_check_url'),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'dispatch_reminders_service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Para pausar/desactivar:
--   select cron.unschedule('inactivity-check-cada-hora');
-- Para ver corridas:
--   select * from cron.job_run_details order by start_time desc limit 20;
