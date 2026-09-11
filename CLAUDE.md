# El Estudio Core — protocolo de trabajo

## Protocolo de ahorro de tokens (obligatorio en toda sesión)

- Sin subagentes, sin Task, sin Explore.
- Sin inspección completa del proyecto — trabajar solo con los archivos
  mencionados explícitamente en el prompt de cada tarea.
- Sin buscar mejoras, refactors ni "arreglos" fuera de lo pedido
  explícitamente.
- Sin correr tests, lint ni otras verificaciones automáticas, salvo que
  se pida.
- Modificar solo los archivos mencionados en el prompt.
- Si hace falta información o acceso a un archivo no mencionado,
  DETENERSE y preguntar antes de abrirlo — nunca asumir.

## Arquitectura actual (contexto breve)

- PWA: React + Vite, persistencia local con Dexie (IndexedDB) como
  fuente operativa de cada módulo.
- Fase 4 en curso: sincronización remota con Supabase, agregada
  **módulo por módulo, nunca todos a la vez**.
- Estrategia de sync: **local-first** (Dexie manda; Supabase sincroniza
  en segundo plano) con **last-write-wins por `updated_at`** para
  resolver conflictos, y `deletedAt` como tombstone para borrados
  (nunca versión/optimistic locking).
- Auth: Supabase Auth con email/contraseña (registro, login, logout,
  recuperar contraseña). La migración de datos locales a Supabase corre
  automática en el primer login, sin pantalla de confirmación
  intermedia.

## Estado real de la sincronización, módulo por módulo

**Sincronizados con Supabase (piloto ya completado y probado):**
- Finanzas — único módulo con sync remoto hoy. Local-first, LWW por
  `updated_at`, migración automática al primer login.

**100% locales (Dexie/IndexedDB), sin ningún sync a Supabase todavía:**
- Misiones
- Agenda
- Hábitos
- Trading
- Notas
- Auditoría
- Umbral
- Cuaderno/Diario
- Asuntos
- Biblioteca
- Ajustes

> **Nota:** Asuntos y Biblioteca no son entidades propias — son vistas
> sobre los datos de Umbral (Ideas). Sincronizar Umbral eventualmente
> los afecta a los tres juntos (Umbral, Asuntos, Biblioteca), no por
> separado — no puede haber "solo Umbral sincronizado" o "solo Asuntos
> sincronizado" mientras comparten la misma fuente de datos.

Cualquier sesión nueva puede asumir este estado como cierto sin volver
a inspeccionar el código — se actualiza esta lista a medida que un
módulo nuevo se sincroniza.
