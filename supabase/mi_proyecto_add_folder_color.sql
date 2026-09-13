-- Ampliación de mi_proyecto_schema.sql — color de acento por carpeta.
--
-- Mismo campo que notes_add_folder_color.sql, tabla propia de Mi Proyecto.
-- Columna nullable: las carpetas creadas antes de esta feature no tienen
-- color, y la carpeta cae al color por defecto del lado del cliente.
alter table mi_proyecto_folders add column if not exists color text;
