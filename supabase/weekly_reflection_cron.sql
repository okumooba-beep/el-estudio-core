-- Fase 6 (IA en el bolsillo) — pg_cron para weekly-reflection, domingo
-- 12:00 ART (UTC-3 todo el año, Argentina no usa horario de verano) =
-- 15:00 UTC. Mismo patrón que dispatch_reminders_cron.sql: extensiones,
-- Vault, cron.schedule — este cron corre una vez por semana, no cada
-- minuto, así que no hace falta el mismo cuidado de LOTE_MAXIMO del otro.
--
-- NO CORRAS ESTO TODAVÍA. Revisalo primero. pg_cron/pg_net y los secrets
-- de dispatch_reminders_cron.sql ya deberían existir si ese cron está
-- activo — este archivo reusa esos mismos secrets de Vault (misma
-- service_role key), solo agrega la URL propia de esta función.

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

select vault.create_secret(
  'https://jixzgcbfddbpqgeohade.supabase.co/functions/v1/weekly-reflection',
  'weekly_reflection_url'
);

-- Si ya corriste esto antes y necesitás actualizar la URL:
--   select vault.update_secret(
--     (select id from vault.secrets where name = 'weekly_reflection_url'),
--     '<NUEVA_URL>'
--   );

select cron.schedule(
  'weekly-reflection-domingo-15utc',
  '0 15 * * 0',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'weekly_reflection_url'),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'dispatch_reminders_service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Para pausar/desactivar:
--   select cron.unschedule('weekly-reflection-domingo-15utc');
-- Para ver corridas:
--   select * from cron.job_run_details order by start_time desc limit 20;
