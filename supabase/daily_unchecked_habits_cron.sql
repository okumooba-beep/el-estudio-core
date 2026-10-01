-- Fase 6 (IA en el bolsillo) — pg_cron para daily-unchecked-habits, todos
-- los días 21:00 ART (UTC-3 todo el año) = 00:00 UTC. Mismo patrón que los
-- otros crons de esta fase: extensiones, Vault, cron.schedule.
--
-- 21:00 ART, separado del horario de daily-pending-missions (9:00 ART), a
-- propósito: dos pushes distintos no deberían llegar juntos.
--
-- NO CORRAS ESTO TODAVÍA. Revisalo primero. Reusa el secret
-- 'dispatch_reminders_service_role_key' de Vault — solo agrega la URL
-- propia de esta función.

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

select vault.create_secret(
  'https://jixzgcbfddbpqgeohade.supabase.co/functions/v1/daily-unchecked-habits',
  'daily_unchecked_habits_url'
);

-- Si ya corriste esto antes y necesitás actualizar la URL:
--   select vault.update_secret(
--     (select id from vault.secrets where name = 'daily_unchecked_habits_url'),
--     '<NUEVA_URL>'
--   );

select cron.schedule(
  'daily-unchecked-habits-00utc',
  '0 0 * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'daily_unchecked_habits_url'),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'dispatch_reminders_service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Para pausar/desactivar:
--   select cron.unschedule('daily-unchecked-habits-00utc');
-- Para ver corridas:
--   select * from cron.job_run_details order by start_time desc limit 20;
