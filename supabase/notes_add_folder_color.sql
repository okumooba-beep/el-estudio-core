-- Ampliación de notes_schema.sql — color de acento por carpeta.
--
-- Carpetas de Notas/Mi Proyecto suman un color elegido al crearlas (grilla
-- premium de Mi Proyecto, ver `carpetasEnGrilla` en NotesEngineScreen.tsx).
-- Columna nullable: las carpetas creadas antes de esta feature no tienen
-- color, y la carpeta cae al color por defecto del lado del cliente.
alter table notes_folders add column if not exists color text;
