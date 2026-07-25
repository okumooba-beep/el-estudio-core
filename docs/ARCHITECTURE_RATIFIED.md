# EL ESTUDIO — ARCHITECTURE RATIFIED

**Rol:** Chief Software Architect de El Estudio.
**Naturaleza de este documento:** esta no es una propuesta más. A partir de este documento, la arquitectura de El Estudio queda **congelada**. Cambios futuros solo se justifican cuando la implementación real revele un problema concreto — no por preferencia, no por moda técnica, no por "ya que estamos."

Este documento revisa [[ARCHITECTURE_FOUNDATION]] con el estándar más alto posible: no "¿es razonable?" sino "¿puede sostener el proyecto durante años sin que tengamos que volver a tocarla?" Cada decisión recibe un veredicto explícito: **ACEPTADA**, **ACEPTADA CON MODIFICACIONES**, o **RECHAZADA**. Toda decisión aceptada pasa a ser, desde este momento, parte de la constitución arquitectónica del proyecto.

---

# PARTE I — RATIFICACIÓN

## 1. Paquetes lógicos vs. paquetes físicos

**ACEPTADA CON MODIFICACIONES.**

El veredicto de Foundation se sostiene bajo escrutinio: paquetes lógicos ahora, físicos solo cuando exista un segundo consumidor real. Lo que no sobrevive el escrutinio es dejar "una regla de lint" como intención vaga. **Modificación:** la frontera se codifica desde el primer sprint de bootstrap como un archivo de configuración de fronteras de importación (oxlint import-restrictions o dependency-cruiser, evaluado en el sprint F2 del roadmap) que falla el build si un paquete importa fuera de lo permitido por la tabla de §3 de Foundation. Sin esa exigibilidad mecánica desde el día uno, "paquete lógico" es solo una carpeta con buenas intenciones — y diez ingenieros distintos no comparten intenciones tácitas.

## 2. Ubicación del Design System

**ACEPTADA CON MODIFICACIONES.**

Confirmado: `estudio-design-system` como paquete lógico, hoja del grafo de dependencias, sin conocimiento de World/Modules/Cognitive Engine. **Modificación añadida en ratificación:** el sheet aprobado ("EL ESTUDIO DESIGN SYSTEM") es una imagen estática — no un artefacto verificable en código. Sin un mecanismo de verificación visual, diez ingenieros distintos implementando componentes contra una captura de pantalla van a divergir de forma silenciosa e irreversible en semanas. Se añade al bootstrap una **Galería de Design System**: una ruta exclusiva de desarrollo (mismo patrón ya probado de `MaterialInspector`, excluida de producción vía `import.meta.env.DEV`) que renderiza cada token y cada estado de componente (Idle/Hover/Focused/Active/Selected/Thinking/Processing/Completed/Archived/Disabled) lado a lado con su especificación. Esto no es una feature — es el instrumento que hace verificable, y no solo esperable, la fidelidad a la referencia de producto aprobada.

## 3. Límites del World Engine

**ACEPTADA CON MODIFICACIONES.**

El principio se sostiene: World reacciona a señales genéricas, nunca contiene lógica de negocio. Bajo escrutinio más duro aparece un agujero: Foundation permite a `world` depender de `shared-kernel`, y `shared-kernel/persistence` es de acceso general — nada impedía, tal como estaba escrito, que World terminara leyendo la tabla `Idea` directamente "solo para saber algo," reintroduciendo lógica de negocio por la puerta de atrás de la infraestructura compartida. **Modificación:** World solo puede leer/escribir, a través de `shared-kernel/persistence`, sus **propias** tablas de dominio (`RoomObjectDefinition`, `HistoryMark`, `DeskMemoryMark`, `AmbientParticleDefinition`). El acceso a las tablas de dominio de contenido (`Idea`, `Operacion`, `HabitCheck`) desde `world` queda explícitamente prohibido por la misma configuración de fronteras del punto 1 — no solo por convención.

## 4. Límites del Cognitive Engine

**ACEPTADA CON MODIFICACIONES.**

El puerto `ClassificationEngine` reutilizado, el registro de proveedores, y el fallback obligatorio a `RuleBasedClassifier` se sostienen sin cambios. **Modificación:** en la versión de Foundation quedaba ambiguo quién decide qué proveedor está activo. Bajo escrutinio, si `cognitive-engine` lee su propia configuración (variable de entorno, `localStorage`) internamente, dos cosas se rompen a la vez: se vuelve imposible de testear de forma determinística, y el mandato explícito del brief original de "la UI nunca debe saber qué LLM se está usando" se filtra en la dirección contraria — el motor tampoco debería saber *cómo* se decide, solo ejecutar lo que se le inyecta. Se fija: la selección de proveedor es un valor de configuración inyectado por `app/shell` en el momento de composición (constructor/factory), nunca leído por el motor desde una fuente externa.

## 5. Arquitectura offline-first

**ACEPTADA CON MODIFICACIONES.**

Se confirma: Dexie como fuente de verdad local, Supabase como destino de sincronización nunca reemplazo, resolución de conflictos last-write-wins por `updatedAt`, alcance de sincronización limitado al dominio de contenido (nunca al dominio de mundo). **Modificación de secuencia:** Foundation trataba la sincronización real como una fase separada y tardía (Fase 4 del roadmap original). Bajo escrutinio esto es un riesgo de retrofit — si el contrato `Repository<T>` y el marcado de escritura pendiente (`pendingSync`) no existen desde el primer módulo que se construya, cada módulo posterior tendría que reabrirse para añadirlos. Se fija: el contrato `Repository<T>` y el campo `updatedAt` en cada entidad de dominio de contenido, más el marcado inerte de `pendingSync`, existen desde el bootstrap (sprints F4–F5 del roadmap) aunque el motor de push/pull real se implemente después. La estructura de sincronización se construye una sola vez; la lógica de red se añade encima sin tocar los módulos.

## 6. Abstracción de proveedores de IA

**ACEPTADA, sin modificaciones.**

Confirmado sin cambios: la arquitectura soporta N proveedores desde el diseño, la primera implementación real solo necesita `RuleBasedClassifier` + un proveedor en la nube. Ningún hallazgo de esta ratificación lo contradice.

## 7. Aislamiento de módulos

**ACEPTADA CON MODIFICACIONES.**

El principio y la excepción declarada de `today` como módulo orquestador se sostienen. **Modificación:** bajo escrutinio, "está documentado como excepción" no es lo mismo que "está impuesto como excepción." Si la única barrera es que un ingeniero lea el documento antes de escribir un import, la barrera no existe. Se fija: la excepción de `today` se codifica como una entrada explícita de *allowlist* en la misma configuración de fronteras del punto 1 (`today` puede importar de `public.ts` de cualquier módulo; ningún otro módulo de contenido puede). Cualquier módulo futuro que pida el mismo privilegio requiere una entrada nueva y explícita en esa configuración — que por construcción pasa por revisión de código, no por convención verbal. Esto ata el Registro de Excepciones de [[DESIGN_VALIDATION_FRAMEWORK]] a un mecanismo mecánico, no solo documental.

## 8. Gestión de estado

**ACEPTADA, sin modificaciones.**

Se confirma: sin store global, estado local por módulo vía hooks, bus de eventos y `gaze` como las únicas piezas legítimamente cross-módulo. Se registra un disparador de revisión futura, no una acción presente: si el número de suscripciones cruzadas de `today` crece lo suficiente como para justificar una caché de solo lectura agregada, se revisita entonces — no ahora.

## 9. Arquitectura de eventos

**ACEPTADA CON MODIFICACIONES.**

El bus tipado en memoria, dentro del proceso, se sostiene; el rechazo explícito de event sourcing se sostiene. **Modificación:** Foundation no fijaba la semántica de entrega. Bajo escrutinio, esto es exactamente el tipo de ambigüedad que diez ingenieros llenan cada uno con una suposición distinta. Se fija explícitamente como parte de la constitución: entrega **síncrona**, **en proceso**, **sin persistencia**, **sin garantía de replay**, **sin entrega entre pestañas/dispositivos**, orden de notificación a suscriptores igual al orden de registro. Si en el futuro se necesita entrega entre pestañas o durabilidad, eso es un sistema distinto y nuevo, no una extensión silenciosa de este bus.

## 10. Estructura de carpetas

**ACEPTADA, sin modificaciones.**

El árbol de §2 de Foundation (paquetes lógicos y módulos dentro de `src/`, un único build de Vite) se sostiene sin cambios. Ningún hallazgo de esta ratificación lo contradice.

## 11. Utilidades compartidas

**ACEPTADA CON MODIFICACIONES.**

`shared-kernel` como hoja verdadera del grafo se sostiene. **Modificación:** se añade a la configuración de fronteras del punto 1 la regla explícita de que `shared-kernel/id` y `shared-kernel/date` no pueden importar de ningún otro paquete del proyecto — ni siquiera de otras carpetas de `shared-kernel` entre sí más allá de lo estrictamente necesario. Esto evita que "utilidad compartida" se convierta, con el tiempo, en un segundo kernel de dominio disfrazado.

## 12. Estrategia de sincronización

**ACEPTADA CON MODIFICACIONES.**

El motor de sincronización con patrón outbox y last-write-wins se sostiene. **Modificación:** se fija ahora, como parte de la constitución y no como detalle de implementación futura, el nombre y la forma exacta del campo de conflicto — `updatedAt: string` (ISO 8601, UTC, monotónico por escritura) — en toda entidad del dominio de contenido desde su primera definición. Fijar esto después de que existan filas reales sin ese campo es una migración de datos; fijarlo ahora es una convención de tipo.

## 13. Manejo de excepciones

**ACEPTADA CON MODIFICACIONES — sección nueva, no cubierta explícitamente en Foundation.**

Foundation no tenía una política explícita de manejo de fallas en tiempo de ejecución más allá del fallback del motor cognitivo. Bajo el estándar de "años sin volver a tocarla," esto es una omisión real, no un detalle menor. Se fija:

- **Fallos del motor cognitivo**: un proveedor que falla o hace timeout nunca lanza una excepción no controlada hacia un módulo — siempre resuelve a `RuleBasedClassifier` o a un resultado tipado de error, nunca a una promesa rechazada sin manejar.
- **Fallos de un módulo**: `app/shell`, como única capa de composición, envuelve cada módulo montado en un límite de error de React. Un módulo que falla se apaga solo — nunca tira abajo a World ni a los módulos hermanos.
- **Fallos de sincronización**: reintento silencioso en segundo plano, nunca una alerta bloqueante en la interfaz. Se registran en diagnóstico exclusivo de desarrollo — nunca como una barra de alerta visible al usuario, consistente con la regla de [[DESIGN_VALIDATION_FRAMEWORK]] de que las métricas críticas de identidad nunca se exponen como UI de producto, y con el "silencio como estado por defecto" que gobierna todo el proyecto.
- **Excepciones al aislamiento de módulos** (el privilegio de `today`, y cualquier futuro similar): se gobiernan por el Registro de Excepciones de [[DESIGN_VALIDATION_FRAMEWORK]] más el mecanismo mecánico del punto 7 — nunca se conceden por defecto, nunca se conceden en silencio.

## 14. Riesgos de rendimiento

**ACEPTADA CON MODIFICACIONES.**

El riesgo de una única base Dexie sin disciplina de paginación se sostiene como el riesgo real más probable a años vista. **Modificación:** se añade al pipeline de build (sprint F13 del roadmap) un presupuesto de tamaño de bundle verificado en cada build — no como aspiración, sino como un paso que falla el build si se excede. Esto no resuelve el riesgo de paginación de Dexie por sí solo, pero evita que la superficie de paquetes/módulos crezca sin que nadie lo note hasta que sea un problema percibido por el usuario — que es, en última instancia, la forma más común en que un producto "lugar, no aplicación" empieza a sentirse lento y deja de sentirse habitable.

## 15. Estrategia de migración

**ACEPTADA CON MODIFICACIONES — reemplazada en granularidad por la Parte II de este mismo documento.**

Las 6 fases de Foundation §17 se sostienen como forma macro correcta, pero "extremadamente pequeño, cada uno revisable de forma independiente" (mandato explícito de este sprint) exige más granularidad de la que esas 6 fases ofrecían. La Parte II reemplaza la granularidad del roadmap de Foundation sin contradecir su forma — cada fase de Foundation se descompone en varios sprints de la Parte II.

---

# PARTE II — HOJA DE RUTA DE IMPLEMENTACIÓN

Regla de esta hoja de ruta, no negociable: **cada sprint dejar la aplicación en estado funcional**, build y lint limpios, sin features nuevas mezcladas con reestructuración. Ningún sprint mueve comportamiento y agrega funcionalidad a la vez. Esto es una aplicación directa de [[AI_DEVELOPMENT_RULES]] §12/§13 a la letra: un objetivo por sprint, el menor número de archivos posible, siempre reversible.

## Fundaciones (ningún sprint de esta lista toca una feature de producto)

| Sprint | Objetivo | Cubre |
|---|---|---|
| **F1** | Crear los esqueletos vacíos de los paquetes lógicos (`packages/estudio-design-system`, `packages/cognitive-engine`, `packages/world`, `packages/shared-kernel`, `modules/`) con `index.ts` mínimos y alias de path en `tsconfig`. Cero comportamiento movido. | Estructura de carpetas |
| **F2** | Configuración de fronteras de importación (oxlint import-restrictions / dependency-cruiser) que impone la tabla de dependencias de §3 de Foundation, incluida la allowlist de `today`. Se prueba a propósito con una violación temporal, luego se confirma limpio. | Aislamiento de módulos, paquetes lógicos |
| **F3** | Mover `lib/id.ts` y `lib/date/` a `shared-kernel` — solo relocación e imports, cero cambio de comportamiento. | Utilidades compartidas |
| **F4** | Definir el contrato `Repository<T>` en `shared-kernel/persistence`; adaptar `IdeaRepository`, `HabitCheckRepository`, `OperacionRepository` para implementarlo explícitamente; añadir `updatedAt` a las entidades de contenido si falta (bump de versión Dexie si corresponde). | Sincronización, offline |
| **F5** | Añadir el marcado inerte `pendingSync` a las escrituras de `shared-kernel/persistence` — no lo consume nada todavía. | Offline scaffolding |
| **F6** | Introducir el bus de eventos tipado en `shared-kernel/events` con semántica de entrega fijada en Parte I §9; cablear un primer evento real (`idea.captured`) sin suscriptores todavía. | Arquitectura de eventos |
| **F7** | Mover `lib/comprehension/*` a `cognitive-engine/ports` + `providers/rule-based`; introducir `ProviderRegistry` con selección inyectada por `app/shell`. Verificar clasificación idéntica (test de regresión). | Cognitive Engine |
| **F8** | Mover `lib/world/*`, `lib/studio/*`, `lib/light`, `lib/voice`, `lib/phrases` a `packages/world` — relocación pura, cero cambio de comportamiento. | World Engine scaffolding |
| **F9** | Extraer los tokens del Design System (color, tipografía, spacing, motion, sombra) desde el sheet aprobado hacia `estudio-design-system/tokens` — aditivo, todavía sin consumidores. | Design System integration |
| **F10** | Migrar los arrays de estilo inline de `SceneStage.tsx` para consumir los nuevos tokens — primer consumidor real, verificado con smoke test visual contra las referencias aprobadas. | Design System integration |
| **F11** | Añadir la Galería de Design System (ruta DEV-gated, mismo patrón que `MaterialInspector`) — instrumento de verificación visual fijado en Parte I §2. | Design System integration, DX |
| **F12** | Añadir Vitest sobre la configuración de Vite existente; un test de humo por paquete (`shared-kernel`, regresión del clasificador de reglas, un repositorio). | Testing |
| **F13** | Pipeline de build: typecheck + lint + test + presupuesto de tamaño de bundle, como paso que falla el build si se excede (Parte I §14). | Build pipeline |
| **F14** | Formalizar `app/modules.ts` como registro de módulos que consume `modules/*/public.ts` — mapeo 1:1 con los módulos existentes, sin renombrar todavía. | Routing |
| **F15** | Relocar `features/idea` → `modules/work-table` con `public.ts`; actualizar `habitos`, `diario`, `misiones` para importar solo desde `public.ts`. Sprint dedicado por ser la migración más delicada identificada en Foundation. | Aislamiento de módulos |
| **F16** | Relocar el resto de features a su nombre de módulo definitivo (`misiones→missions`, `diario→journal`, `habitos→habits`, `hoy→today` marcado en la allowlist de orquestador, `placeholder→library`; `trading` sin cambio de nombre). Relocación mecánica, sin cambio de comportamiento. | Estructura de carpetas |
| **F17** | Mover `features/dev/MaterialInspector` → `dev-tools/material-inspector`. Solo ruta, cero comportamiento. | Estructura de carpetas |

Al finalizar F17: toda la arquitectura ratificada existe físicamente en el repositorio, con fronteras exigidas mecánicamente, sin que exista todavía ninguna feature nueva de producto. Este es el punto de control de confianza antes de construir la primera funcionalidad real.

## Primera funcionalidad (solo comienza cuando F1–F17 están 100% cerrados)

| Sprint | Objetivo |
|---|---|
| **B1** | Work Table: capturar una idea real dentro de `modules/work-table` usando únicamente componentes de `estudio-design-system`, clasificarla vía `cognitive-engine` (proveedor `rule-based`), persistirla vía `Repository<T>`, emitir `idea.captured`/`idea.routed`. Primera prueba end-to-end de que la arquitectura entera funciona junta. |

No se especifica más allá de B1 — cada sprint posterior depende de lo que B1 revele, consistente con la regla de que la arquitectura solo cambia cuando la implementación real muestra un problema concreto.

---

# PARTE III — LA PREGUNTA FINAL

**"Si un equipo de diez ingenieros se uniera mañana, ¿podrían construir El Estudio sin cambiar la arquitectura?"**

**Sí, con confianza — no con confianza ciega.** Razones concretas, no una afirmación de fe:

- Las fronteras entre paquetes y módulos no dependen de que diez personas lean el mismo documento y lo recuerden igual — están impuestas por configuración de lint que falla el build (§1, §7, §11 de Parte I). Un ingeniero nuevo no puede romper un límite sin que el CI se lo diga en el mismo commit.
- El lenguaje visual no depende de que diez personas interpreten igual una captura de pantalla — existe una Galería de Design System verificable (§2).
- La semántica del bus de eventos, la selección de proveedor de IA, y el campo de conflicto de sincronización ya no son ambigüedades abiertas a interpretación — están fijadas como parte de esta constitución (§4, §9, §12), no como detalles que "se resuelven durante la implementación."
- Cada módulo tiene un dueño de dominio claro y un patrón ya probado dos veces (`Idea`, `Operacion`) que cualquier módulo futuro (finanzas, vehículo, proyectos) puede replicar sin inventar nada nuevo.
- El manejo de fallas (§13) significa que un ingeniero junior que rompe un módulo no puede tirar abajo World ni a los módulos hermanos mientras lo arregla.

**El único riesgo residual honesto, y no se esconde:** el mecanismo de lint impide que una excepción de aislamiento se **cuele en silencio**, pero no impide que alguien **proponga** una mala excepción y la consiga aprobar en una revisión de código descuidada. Ese último paso sigue siendo humano — el Registro de Excepciones de [[DESIGN_VALIDATION_FRAMEWORK]] depende de que un revisor diga que no cuando corresponde. Ninguna arquitectura elimina la necesidad de criterio humano en el momento de la revisión; esta arquitectura reduce ese momento a una decisión explícita y visible, en vez de un import silencioso en cualquier archivo — que es la mejor garantía que una arquitectura, por sí sola, puede ofrecer.

A partir de este documento, la arquitectura de El Estudio queda ratificada y congelada. El siguiente sprint es F1.
