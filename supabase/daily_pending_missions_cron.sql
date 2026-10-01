-- Fase 6 (IA en el bolsillo) — pg_cron para daily-pending-missions, todos
-- los días 9:00 ART (UTC-3 todo el año) = 12:00 UTC. Mismo patrón que
-- dispatch_reminders_cron.sql / weekly_reflection_cron.sql: extensiones,
-- Vault, cron.schedule.
--
-- NO CORRAS ESTO TODAVÍA. Revisalo primero. Reusa el secret
-- 'dispatch_reminders_service_role_key' de Vault (mismo Authorization que
-- los otros dos crons) — solo agrega la URL propia de esta función.

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

select vault.create_secret(
  'https://jixzgcbfddbpqgeohade.supabase.co/functions/v1/daily-pending-missions',
  'daily_pending_missions_url'
);

-- Si ya corriste esto antes y necesitás actualizar la URL:
--   select vault.update_secret(
--     (select id from vault.secrets where name = 'daily_pending_missions_url'),
--     '<NUEVA_URL>'
--   );

select cron.schedule(
  'daily-pending-missions-12utc',
  '0 12 * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'daily_pending_missions_url'),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'dispatch_reminders_service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Para pausar/desactivar:
--   select cron.unschedule('daily-pending-missions-12utc');
-- Para ver corridas:
--   select * from cron.job_run_details order by start_time desc limit 20;
