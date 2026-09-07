-- Diagnóstico del 401 en dispatch-reminders: chequea el secret guardado en
-- Vault sin exponer el valor completo en el chat/resultado. En vez de
-- comparar contra una longitud "de referencia" (que no tenemos acá), esto
-- detecta directamente espacios/saltos de línea de más, que es la causa más
-- común de un copy-paste roto.
select
  length(decrypted_secret) as longitud,
  length(trim(decrypted_secret)) as longitud_sin_espacios,
  decrypted_secret ~ '^\s' as empieza_con_espacio,
  decrypted_secret ~ '\s$' as termina_con_espacio,
  decrypted_secret ~ e'\n' as tiene_salto_de_linea
from vault.decrypted_secrets
where name = 'dispatch_reminders_service_role_key';
