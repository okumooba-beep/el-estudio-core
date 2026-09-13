-- Ampliación de mi_proyecto_finanzas_schema.sql — Finanzas pasa de ser
-- por espacio a ser por carpeta.
--
-- Columna nullable: cada movimiento/cuenta/meta/período queda scopeado a
-- una carpeta puntual (`carpeta_id`), no ya al espacio entero. El motor
-- filtra en el cliente por esta columna en vez de solo por user_id.
alter table mi_proyecto_finanzas_accounts add column if not exists carpeta_id text;
alter table mi_proyecto_finanzas_movimientos add column if not exists carpeta_id text;
alter table mi_proyecto_finanzas_goals add column if not exists carpeta_id text;
alter table mi_proyecto_finanzas_income_periods add column if not exists carpeta_id text;
