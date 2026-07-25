# EL ESTUDIO — ARCHITECTURE FOUNDATION

**Rol:** Principal Software Architect de El Estudio.
**Naturaleza de este documento:** arquitectura únicamente. Ningún fragmento de este documento es código de implementación. No hay componentes React, no hay Preact, no hay páginas, no hay layouts, no hay clases Tailwind, no hay animaciones. Donde aparecen `interface`/firmas de tipos, son **contratos arquitectónicos** (la forma de un límite), no implementaciones — la misma convención que usaría cualquier documento de arquitectura ports-and-adapters.

Las 4 referencias visuales entregadas (render de la habitación, Asset Library v1.0, Design System sheet, Work Table mockup) se tratan como **verdad de producto ya aprobada**, no como inspiración. Este documento no rediseña nada de lo que ahí se define — su trabajo es construir la estructura técnica que sostenga esa verdad de producto durante años, con dueños de módulos futuros, múltiples proveedores de IA, sincronización offline y múltiples plataformas.

---

## 0. Punto de partida real (no un lienzo en blanco)

Antes de proponer estructura nueva, esto es lo que ya existe y funciona en `lifeos/` hoy. Toda propuesta de esta arquitectura se ancla explícitamente aquí — por [[AI_DEVELOPMENT_RULES]] §5 ("no romper la arquitectura existente") y §12 ("nunca completar una visión completa en un único sprint"), ninguna sección de abajo se permite ignorar este estado real.

**Stack real:** React 19.2, Vite 8, TypeScript ~6.0, react-router-dom 7, Tailwind CSS v4, Dexie 4.4 (IndexedDB), `@supabase/supabase-js` 2.110 (instalado pero **dormido**: solo un archivo lo referencia, cero auth, cero queries, cero sync), oxlint. Un único paquete `src/`, sin monorepo, sin librería de estado global (no hay Redux/Zustand/Jotai/Context — se confirmó por grep: cero resultados).

**Seams ya construidos que esta arquitectura debe *heredar*, no reinventar:**

- **`src/lib/comprehension/`** ya es el motor cognitivo embrionario: define una interfaz `ClassificationEngine` (`classify(texto): ClassificationResult`) de la que depende el resto de la app, con una implementación `RuleBasedClassifier` (reglas + memoria de correcciones del usuario) explícitamente diseñada en sus propios comentarios para ser reemplazada después por embeddings o LLM sin tocar otro archivo. Este es el puerto real de "AI architecture" — no hay que inventar uno nuevo.
- **Patrón de repositorio ya existe**, pero vive dentro de cada feature (`features/idea/ideaRepository.ts`, `features/habitos/habitCheckRepository.ts`, `features/trading/operacionRepository.ts`), cada uno con su propia interfaz (`IdeaRepository`, etc.) sobre una única instancia Dexie compartida (`lib/db/db.ts`). Es informal pero correcto en espíritu — falta centralizar el contrato, no inventar el patrón.
- **`src/lib/world/`** (`worldRules.ts`, `worldMap.ts`, `gaze.ts`, `stations.ts`) ya es un núcleo de datos puro, sin UI, ya pensado para ser consumido por otros sistemas (cámara, navegación) — el mejor candidato existente para el paquete "World" que pide el brief. Se solapa hoy con `lib/studio/furniture.ts` (grafo de flujo de contenido) y con `features/room/` (la escena/cámara real). La arquitectura debe decir explícitamente cómo estos tres conviven, no fingir que ya están unificados.
- **`components/ui/` tiene un componente** (`EmptyState`). El lenguaje visual real vive hoy, mayormente, hardcodeado dentro de `features/room/SceneStage.tsx` (arrays grandes de estilos/datos inline). El Design System, tal como lo define el brief, **no existe todavía** — esto es trabajo genuinamente nuevo, no una extracción de algo ya modular.
- **Supabase está dormido.** La arquitectura offline/sync que pide el brief es, en su totalidad, trabajo nuevo — no hay nada que migrar, solo un comentario de intención en `db.ts` ("cuando exista un proyecto Supabase real, ese backend sincroniza esta base — nunca la reemplaza").
- **`idea` ya es un kernel compartido de facto**: `habitos`, `diario`, `misiones` y `hoy` importan directamente su hook (`useIdeas`) y su componente (`IdeaSheet`). Esto es exactamente el tipo de acoplamiento directo que el mandato de "módulos con interfaces estables, nunca comunicación directa" viene a corregir — y es la pieza de migración más delicada de todo este documento.
- **`hoy` ya es un orquestador**, no un módulo aislado: importa de `idea`, `memoria`, `workspace` y `room` simultáneamente. Cualquier regla de aislamiento estricto entre módulos tiene que declarar esto como excepción explícita, no pretender que no existe.

Todo lo que sigue se construye citando estos seams, no reemplazándolos — consistente con la regla de [[CONCEPT_TO_SPEC_PROTOCOL]] de citar conocimiento existente en vez de duplicarlo.

---

## 1. Arquitectura de alto nivel

Cuatro capas concéntricas, con una única dirección de dependencia permitida:

```
                      ┌─────────────────────────────┐
                      │   app/ (composition root)    │  ← única capa que conoce a todas las demás
                      └──────────────┬───────────────┘
                 ┌───────────────────┼───────────────────┐
                 ▼                   ▼                   ▼
        ┌───────────────┐   ┌───────────────┐   ┌────────────────┐
        │     World     │   │    Modules    │   │  Cognitive     │
        │ (habitación,  │   │ (work-table,  │   │  Engine        │
        │  cámara,      │   │  missions,    │   │ (clasificación,│
        │  ambiente)    │   │  journal...)  │   │  extracción...)│
        └───────┬───────┘   └───────┬───────┘   └────────┬───────┘
                 │                   │                    │
                 └─────────┬─────────┴──────────┬─────────┘
                            ▼                    ▼
                  ┌───────────────────┐ ┌──────────────────┐
                  │ estudio-design-   │ │  shared-kernel    │
                  │ system            │ │ (persistencia,    │
                  │ (tokens, motion,  │ │  eventos, sync,   │
                  │  componentes)     │ │  ids, fechas)      │
                  └───────────────────┘ └──────────────────┘
```

**Regla de dirección única:** una capa inferior nunca importa de una superior. `estudio-design-system` y `shared-kernel` no saben que `World` o los `Modules` existen. `World` y `Modules` no se importan entre sí — sólo `app/` los compone.

Esto **no es una reescritura** de `App.tsx`: hoy `RoomBackground` ya es hermano de `<Routes>` y `AppShell` ya envuelve solo las pantallas de feature, con `MaterialInspector` ya excluido estructuralmente del árbol real. Este diagrama es la formalización con nombre de un patrón que el proyecto ya acertó a nivel de composición — se valida, no se reemplaza.

---

## 2. Estructura de carpetas

### La decisión más importante de este documento: paquetes lógicos, no monorepo físico — todavía

El brief pide `packages/estudio-design-system/`, `packages/cognitive-engine/`, `modules/*`. Tomado literalmente, esto implica un monorepo real (workspaces de pnpm/npm, cada paquete con su propio `package.json`, build y versión). Antes de aceptarlo tal cual, hay que confrontarlo con [[AI_DEVELOPMENT_RULES]] §12/§13: ningún sprint completa una visión entera, cada sprint debe ser reversible y dejar build/lint limpios, y no se agregan dependencias nuevas salvo que sean imprescindibles.

Un monorepo físico hoy (Turborepo/Nx/pnpm workspaces) sería exactamente el tipo de "reescritura masiva" que la regla 13 prohíbe, para un producto que hoy tiene **un solo consumidor** (la web app). El beneficio real de paquetes físicos — build independiente, versionado independiente, publicación independiente — solo se materializa cuando existe un **segundo consumidor** (una app de escritorio, un sitio de marketing que reutiliza el design system, un shell mobile) o cuando un equipo separado necesita su propio ciclo de CI.

**Propuesta:** adoptar **paquetes lógicos** ahora — carpetas + alias de path (`@design-system/*`, `@cognitive-engine/*`, `@modules/*`, `@world/*`, `@shared-kernel/*` sobre el mismo `tsconfig` `@/*` ya existente) + una regla de lint de fronteras de importación (oxlint ya está instalado; se le añaden reglas de "no importar por fuera de la barrera pública del paquete") — sin tocar el build, sin nueva herramienta de monorepo, sin nueva dependencia. Esto da la mayor parte del beneficio real (fronteras exigibles, dueños claros, piezas reemplazables) al costo de una reorganización de carpetas, no de una migración de tooling.

**Condición de promoción explícita:** un paquete lógico se convierte en paquete físico (su propio `package.json`, publicable) el día que aparezca un segundo consumidor real o una necesidad real de versionar/publicar independientemente — nunca antes, por especulación.

Esto es exactamente el tipo de "si crees que existe una arquitectura mejor, explícala" que pide el brief: la mejor arquitectura no es el monorepo día uno, es la que llega al mismo destino sin pagar el costo del monorepo antes de necesitarlo.

### Árbol objetivo (destino, alcanzado en fases — ver §Roadmap)

```
lifeos/
├── src/
│   ├── packages/
│   │   ├── estudio-design-system/
│   │   │   ├── tokens/          (color, tipografía, spacing, motion, shadow — desde el sheet aprobado)
│   │   │   ├── primitives/      (Surface, Text, Stack — sin estilo de marca)
│   │   │   ├── components/      (WorkTableCard, StatusIndicator, AILanguageBubble...)
│   │   │   ├── motion/          (contratos: Open/Close/Focus/Selection/Classification/Completion/Transition/Micro)
│   │   │   └── icons/
│   │   ├── cognitive-engine/
│   │   │   ├── ports/           (ClassificationEngine — ya existe, se mueve; Extraction, Summarization, Routing — nuevos)
│   │   │   ├── providers/       (rule-based [default/offline], openai, anthropic, local)
│   │   │   └── registry/        (selección de proveedor activo)
│   │   ├── world/
│   │   │   ├── scene/           (desde features/room: SceneStage, useCameraRig)
│   │   │   ├── rules/           (worldRules.ts, worldMap.ts — sin cambios de contenido)
│   │   │   ├── ambience/        (lib/light, lib/voice, lib/phrases)
│   │   │   └── furniture/       (lib/studio: furniture.ts, materials.ts, sheetPhysics.ts)
│   │   └── shared-kernel/
│   │       ├── persistence/     (db.ts, contrato Repository<T>)
│   │       ├── events/          (event bus tipado — nuevo, ver §13)
│   │       ├── sync/            (motor de sincronización — nuevo, ver §10)
│   │       ├── id/, date/
│   ├── modules/
│   │   ├── work-table/          (evolución de features/idea — capturar/entender/clasificar/enrutar)
│   │   ├── missions/            (features/misiones)
│   │   ├── journal/             (features/diario)
│   │   ├── habits/               (features/habitos)
│   │   ├── trading/              (features/trading)
│   │   ├── today/                (features/hoy — módulo orquestador declarado, ver §6)
│   │   └── library/              (features/placeholder)
│   ├── app/
│   │   ├── shell/                (AppShell.tsx, modules.ts — sin cambios de rol)
│   │   ├── routes/
│   │   └── App.tsx
│   └── dev-tools/
│       └── material-inspector/   (gated DEV, movido fuera del árbol de módulos reales)
```

Nótese: esto vive dentro de `src/`, un único `package.json`, un único build de Vite. "Paquete" aquí es una unidad de responsabilidad y de frontera de importación, no una unidad de build.

---

## 3. Estructura de paquetes (grafo de dependencias permitido)

| Paquete | Puede importar de | Nunca puede importar de |
|---|---|---|
| `estudio-design-system` | nada de este proyecto (solo librerías externas de UI) | `world`, `modules`, `cognitive-engine`, `shared-kernel` |
| `cognitive-engine` | `shared-kernel` (tipos, eventos) | React/DOM, `estudio-design-system`, `world`, `modules` |
| `shared-kernel` | nada de este proyecto | todo lo demás |
| `world` | `estudio-design-system`, `shared-kernel` | cualquier `modules/*` específico |
| `modules/*` | `estudio-design-system`, `cognitive-engine`, `shared-kernel` | otro `modules/*` directamente |
| `app/` | todo | — (única capa de composición) |

`estudio-design-system` y `shared-kernel` son las únicas hojas verdaderas del grafo — se pueden extraer a paquetes físicos publicables el día que haga falta, sin refactor, porque ya no dependen de nada del dominio.

---

## 4. Responsabilidad de cada paquete

- **`estudio-design-system`** — única fuente de verdad de tokens (color, tipografía, spacing 8pt, motion, sombra, iconografía) y de los componentes visuales reutilizables (incluyendo los estados de Work Table del sheet aprobado). Ninguna app o módulo define un color, fuente o easing por su cuenta.
- **`cognitive-engine`** — clasificación, extracción, resumen y enrutamiento de contenido. Expone únicamente puertos (`ClassificationEngine` y hermanos); nunca expone un tipo de proveedor concreto a quien lo consume.
- **`world`** — la habitación, la cámara, la luz ambiental, el mobiliario y su evolución con el tiempo. Cero lógica de negocio: reacciona a señales genéricas (foco, inactividad, hora del día), nunca a datos de un módulo específico.
- **`shared-kernel`** — persistencia (Dexie + contrato `Repository<T>`), bus de eventos, motor de sincronización, utilidades de id/fecha. Es infraestructura pura, sin conocimiento de producto.
- **`modules/*`** — lógica de negocio y pantallas de cada vertical de producto (Work Table, Misiones, Diario, Hábitos, Trading, Hoy, Biblioteca). Cada uno es dueño de su propio dominio y su propio repositorio concreto.
- **`app/`** — raíz de composición: enrutamiento, registro de módulos (evolución de `modules.ts`), wiring de `World` + `Modules` + providers de infraestructura. Ya existe en espíritu en `App.tsx`/`AppShell`.
- **`dev-tools/`** — herramientas de desarrollo (Material Inspector) explícitamente excluidas del build de producción, siguiendo el patrón ya establecido de `import.meta.env.DEV`.

---

## 5. Responsabilidad de cada capa de aplicación

| Capa | Responsabilidad | Ejemplo real hoy |
|---|---|---|
| Presentación de mundo | Renderizar la habitación, cámara, ambiente | `features/room/SceneStage.tsx`, `lib/light` |
| Design System | Primitivas y componentes visuales reutilizables | `components/ui/EmptyState` (único hoy) |
| Módulo/Feature | Lógica de negocio + pantallas propias | `features/idea`, `features/trading` |
| Motor cognitivo | Clasificar, extraer, resumir, enrutar | `lib/comprehension` |
| Infraestructura | Persistencia, proveedores externos, plataforma | `lib/db`, `lib/supabase`, `lib/storage` |
| Composición | Enrutar, registrar módulos, unir capas | `App.tsx`, `AppShell.tsx`, `app/modules.ts` |

La capa de composición ya está correctamente separada de la capa de mundo y de la capa de módulos en el código actual — este documento formaliza esa separación, no la introduce.

---

## 6. Límites de módulo

**Regla base:** un módulo nunca importa el archivo interno de otro módulo (ni su repositorio, ni sus componentes internos, ni sus hooks internos). Solo dos canales de comunicación son legítimos:

1. **Bus de eventos** (ver §13) — para notificaciones de "algo pasó" que a otros módulos les puede interesar (`idea.captured`, `mission.completed`, `habit.checked`).
2. **API pública explícita** (`modules/<nombre>/public.ts`) — para los pocos casos donde un módulo necesita leer datos de otro de forma directa y síncrona. Es el único archivo importable desde fuera del módulo; todo lo demás es privado por convención de carpeta + regla de lint.

**Excepción declarada, no accidental: `today` (hoy) es un módulo orquestador.** Ya hoy `features/hoy` importa de `idea`, `memoria`, `workspace` y `room` — es, por diseño de producto, la pantalla que compone piezas de varios módulos. Prohibir esto por regla general sería negar lo que Hoy necesita ser. La resolución correcta no es fingir que Hoy es un módulo aislado más, sino **declarar explícitamente una categoría de módulo orquestador** (hoy, solo Hoy) que puede leer las APIs públicas de varios módulos a la vez, mientras que los módulos de contenido (Misiones, Diario, Hábitos, Trading) permanecen estrictamente aislados entre sí.

Esta excepción se registra formalmente en el **Registro de Excepciones** introducido en [[DESIGN_VALIDATION_FRAMEWORK]] — cualquier futuro módulo que quiera el mismo privilegio orquestador pasa por ese registro, no se concede por defecto. Esto evita que la lista de "módulos especiales" crezca sin control a medida que se agreguen finanzas, vehículo, proyectos.

**Migración concreta más delicada:** `work-table` (evolución de `idea`) debe dejar de exponer `IdeaSheet` y `useIdeas` para importación directa desde `habitos`, `diario` y `misiones`. En su lugar expone un `public.ts` con una API mínima de captura/consulta, o emite eventos que esos módulos consumen — nunca el componente ni el hook interno.

---

## 7. Infraestructura compartida

- **Persistencia**: Dexie permanece como única base local (ya versionada a v5, con migraciones documentadas). Se formaliza un contrato único `Repository<T>` en `shared-kernel/persistence`, que cada repositorio concreto de módulo debe implementar — hoy cada feature ya tiene su propia interfaz (`IdeaRepository`, `HabitCheckRepository`, `OperacionRepository`); el cambio es centralizar la forma del contrato, no el patrón.
- **Bus de eventos**: nuevo, mínimo, en memoria, tipado — imprescindible (§5 de las reglas exige justificar cualquier dependencia nueva; esta no es una dependencia externa, es infraestructura propia, y es la única forma de cumplir "los módulos nunca se comunican directamente" sin volver a acoplarlos).
- **Motor de sincronización**: nuevo, ver §10.
- **Utilidades**: `id.ts`, `date/describeDay.ts` — sin cambios, se mueven de ubicación únicamente.
- **Autenticación**: hoy inexistente; el cliente de Supabase dormido es el único seam. Se diseña cuando el motor de sync lo necesite, no antes.

---

## 8. Estrategia de Design System

`estudio-design-system` es la única fuente de verdad de:

- **Tokens** — codificación literal del sheet aprobado: materiales primarios (madera/concreto/cuero/papel), colores de acento, colores semánticos (éxito/advertencia/urgencia/deshabilitado/foco), tipografía (Recoleta display, Söhne Semibold para títulos, Inter para cuerpo/secundario, Inter Medium para metadata, IBM Plex Mono para código/datos), grid de espaciado de 8pt, superficies, sombras.
- **Motion** — cada nombre del lenguaje de animación aprobado (Open/Close/Focus/Selection/Classification/Completion/Transition/Micro) es un token con su duración y su curva de easing exactas, consumido por nombre — nunca redefinido con un valor distinto dentro de un módulo o de World.
- **Componentes** — primitivas sin marca (Surface, Text, Stack) y componentes con marca (tarjetas de Work Table, indicadores de estado, "AI language" bubbles), cubriendo los estados de componente del sheet (Idle/Hover/Focused/Active/Selected/Thinking/Processing/Completed/Archived/Disabled).

**Distinción importante y no obvia:** el Design System es dueño del **contrato** de las variables visuales (nombres, forma, valores estáticos). El motor de luz ambiental ya existente (`lib/light`, `applyLight.ts`) es dueño del **cómputo en tiempo de ejecución** de valores dentro de ese contrato (interpolación día/noche/estación vía CSS custom properties). Son responsabilidades distintas: el Design System nunca decide qué hora es; el motor de ambiente nunca inventa un nombre de variable nuevo por su cuenta. `world/ambience` consume los tokens del Design System como su rango de valores válidos.

**Deuda de migración ya identificada, no hipotética:** `features/room/SceneStage.tsx` contiene hoy arrays grandes de estilo/datos inline — es la violación más grande y concreta que existe hoy de "el lenguaje visual no debe vivir dentro de World." Es el primer candidato real de migración hacia `estudio-design-system` (ver Roadmap, Fase 1).

**Exigibilidad:** ningún módulo o paquete de World puede usar un valor de color/espaciado/fuente crudo — se aplica con una regla de lint (oxlint) que prohíbe valores arbitrarios de Tailwind y colores hexadecimales fuera de `estudio-design-system/tokens`.

---

## 9. Arquitectura de IA (cognitive-engine)

**Puertos, no proveedores.** `ClassificationEngine` ya existe como interfaz real en `lib/comprehension/types.ts` — se reutiliza sin cambiar su forma, por la regla de "citar, no duplicar" de [[CONCEPT_TO_SPEC_PROTOCOL]]. Se añaden puertos hermanos para Extracción, Resumen y Enrutamiento, siguiendo la misma forma. Cada adaptador concreto (`RuleBasedClassifier` [ya existe], `OpenAIClassifier`, `AnthropicClassifier`, `LocalModelClassifier`) implementa el puerto; un `ProviderRegistry` es el **único** archivo del proyecto que importa un SDK de proveedor. La UI y los módulos solo ven el puerto — nunca saben qué proveedor está activo, cumpliendo el mandato literal del brief.

**Tensión real entre dos mandatos, resuelta:** "proveedores de IA intercambiables" y "offline-first" chocan si la única implementación es un LLM en la nube — la clasificación se rompería cada vez que se pierde conexión. La resolución: `RuleBasedClassifier` (ya construido, cero red) deja de ser un placeholder temporal y se vuelve **el adaptador de fallback obligatorio y siempre presente**, nunca removible. Una capa de política sobre el registro detecta offline o fallo/timeout de proveedor y cae automáticamente al clasificador local, sin bloquear al usuario (sin spinners, sin esperar) — coherente con "silencio como estado por defecto." Opcionalmente encola una re-clasificación para cuando vuelva la conexión, mejorando en segundo plano una clasificación que ya existe, nunca reteniendo al usuario mientras tanto.

**Alcance inicial recomendado:** la arquitectura soporta N proveedores desde el día uno, pero la primera implementación real debería enviar solo `RuleBasedClassifier` + **un** proveedor en la nube — no los tres a la vez. Construir tres adaptadores antes de que exista un solo caso de uso real que los necesite es exactamente el tipo de sobre-alcance que prohíbe la regla 13 (80/20).

---

## 10. Arquitectura offline

Hoy: Dexie ya es la fuente de verdad local (no una caché de servidor); Supabase está completamente dormido. Esto se mantiene — el dispositivo local sigue siendo dueño de la verdad, el servidor es un destino de sincronización, nunca un reemplazo, tal como ya lo dice el comentario existente en `db.ts`.

**Motor de sincronización (nuevo, mayor superficie de trabajo genuinamente nueva de todo este documento):**
- Patrón *outbox*: cada escritura local se marca como pendiente de sincronizar.
- Empuje en segundo plano cuando hay red; detección de red por `navigator.onLine` **más** fallo real de request (nunca confiar solo en `onLine`, que puede mentir).
- Resolución de conflictos: *last-write-wins* por fila con un campo `updatedAt`. Es suficiente porque el escenario real es un mismo usuario en múltiples dispositivos, no colaboración multiusuario — adoptar CRDTs o resolución de conflictos más sofisticada sería sobre-ingeniería para esta escala (regla 13).
- El esquema de Supabase se **deriva** de los tipos de dominio existentes en `types/*.ts`, nunca se duplica a mano — mismo principio de traducción sin pérdida de [[CONCEPT_TO_SPEC_PROTOCOL]] aplicado a esquemas, no solo a documentos.

**Riesgo a vigilar:** las migraciones de esquema de Dexie (ya en v5) deben mantenerse compatibles con lo que el motor de sync espera reflejar en Supabase — un cambio de esquema local sin su contraparte remota es la forma más probable en que este sistema se rompe en silencio.

---

## 11. Gestión de estado

Hoy no existe ninguna librería de estado global — estado local por componente + hooks por módulo que llaman al repositorio directamente, y funciona bien a la escala actual (confirmado: cero usos de Context/Zustand/Redux/Jotai en todo `src/`).

**Decisión, autoimpuesta como desafío aunque el brief no mandató una librería específica:** no introducir un store global (Redux/Zustand/Jotai) como reflejo automático de "ahora hay módulos." Sería una dependencia nueva no imprescindible (§5) resolviendo un problema que no existe todavía. El patrón actual — cada módulo dueño de su propio estado vía hooks — es además la forma correcta de reforzar el aislamiento de módulos, no un obstáculo para él.

Lo único genuinamente cross-módulo es:
1. El **bus de eventos** (§13) para notificación entre módulos.
2. El estado de **foco/atención** (`lib/world/gaze.ts`, ya existe) — pertenece a `world`, no a un store general de aplicación.

**Condición de revisión futura:** si el motor cognitivo introduce llamadas asíncronas complejas con necesidad real de caché/reintento (no solo carga/error/dato), evaluar `react-query`/`swr` en ese momento — no antes.

---

## 12. Flujo de datos

Ejemplo canónico, anclado en el mockup aprobado de Work Table:

```
Usuario escribe en Work Table
        │
        ▼
modules/work-table  →  cognitive-engine (puerto Classification)
        │                         │
        │                 resultado: destino
        ▼
modules/work-table persiste vía su repositorio
        │  (implementa shared-kernel Repository<T>)
        ▼
shared-kernel/persistence escribe en Dexie + marca pending-sync
        │
        ▼
shared-kernel/events emite "idea.routed"
        │
        ├──▶ modules/missions (si corresponde) actualiza su propia vista
        ├──▶ modules/habits (si corresponde) actualiza su propia vista
        └──▶ world/ambience reacciona solo a la señal genérica de actividad,
             nunca al contenido de la idea
```

**Regla de unidireccionalidad:** un módulo nunca llama directamente a otro módulo. World nunca origina flujo de datos hacia un módulo — solo reacciona a señales genéricas, nunca contiene lógica de negocio, tal como exige el brief.

---

## 13. Sistema de eventos

Bus de eventos mínimo, en memoria, dentro del proceso — no un message broker externo (Kafka, etc. sería sobre-ingeniería absoluta a esta escala de un solo usuario/un solo dispositivo activo a la vez).

- Convención de nombre: `<módulo>.<verboEnPasado>` (`idea.captured`, `idea.routed`, `mission.completed`, `habit.checked`).
- Cada nombre de evento tiene **una** forma de payload, definida una sola vez en `shared-kernel`, importada tanto por quien publica como por quien suscribe — evita el drift de eventos "stringly-typed."
- **Los eventos no son el sistema de registro.** Se consideró y se rechaza explícitamente el *event sourcing* completo: los eventos son señales transitorias para desacoplar módulos, no la fuente de verdad — Dexie sigue siendo la fuente de verdad. Esta distinción se deja escrita para prevenir que un futuro sprint derive hacia event sourcing por moda, no por necesidad real.

---

## 14. Modelo de dominio

Los tipos existentes en `types/*.ts` (`Idea`, `Operacion`, `HabitCheck`, `RoomObjectDefinition`, `HistoryMark`, `DeskMemoryMark`, `AmbientParticleDefinition`) son un modelo de dominio ya bueno — se valida y se organiza, no se reemplaza, por la misma regla de citar-no-duplicar.

**Dos categorías de dominio, distinción no obvia que vale la pena declarar:**

- **Dominio de contenido** (`Idea`, `Operacion`, `HabitCheck`) — datos reales del usuario, dueños son los módulos, se persisten, **sí** se sincronizan.
- **Dominio de mundo** (`RoomObjectDefinition`, `HistoryMark`, `DeskMemoryMark`, `AmbientParticleDefinition`) — estado de atmósfera/presentación, dueño es `world`, se persiste localmente pero **no** se sincroniza entre dispositivos: las marcas de desgaste de un escritorio son atmósfera de ese dispositivo, no contenido del usuario. Esta decisión reduce de forma significativa el alcance real del motor de sincronización.

`Idea.destino` ya modela exactamente el resultado de enrutamiento que produce el motor cognitivo — es el seam correcto, no requiere cambio.

**Patrón para módulos futuros** (finanzas, vehículo, proyectos): cada uno sigue la misma forma ya probada por `Idea` y `Operacion` — un tipo de entidad + un puerto `Repository<T>` + una implementación concreta dueña del módulo.

---

## 15. Escalabilidad futura

- **Desktop/mobile**: Tauri (no Electron) es compatible con esta arquitectura por ser más liviano y por reutilizar el mismo webview — el mismo código de `estudio-design-system` corre sin cambios. **Riesgo real a largo plazo, no hipotético:** si algún día se quiere mobile verdaderamente nativo (React Native), solo la capa de *tokens* del Design System se traslada gratis — la capa de *componentes* (React DOM) no. Recomendación explícita: preferir un shell basado en webview (Tauri mobile / Capacitor) antes que React Native, para mantener una única implementación real del Design System.
- **Decenas de módulos**: el patrón módulo + bus de eventos + `public.ts` escala de forma aditiva — cada módulo nuevo no obliga a tocar los demás, siempre que la lista de "módulos orquestadores" (hoy solo `today`) no crezca sin control. Cualquier módulo futuro que pida el mismo privilegio pasa por el Registro de Excepciones de [[DESIGN_VALIDATION_FRAMEWORK]].
- **Múltiples proveedores de IA**: el registro escala, pero el costo/latencia entre proveedores eventualmente necesita observabilidad — una superficie de diagnóstico **solo para desarrollo**, nunca visible al usuario, consistente con la regla de [[DESIGN_VALIDATION_FRAMEWORK]] de que las métricas de identidad nunca se exponen como UI de producto. No se construye ahora, se deja como gatillo futuro.
- **Cuello de botella a vigilar**: una única base Dexie sin disciplina de paginación es un riesgo real a años de datos acumulados de ideas/operaciones/hábitos. Recomendación: auditar que los repositorios usen consultas por cursor/ventana en vez de `.toArray()` sin límite antes de que el volumen de datos lo vuelva un problema perceptible.
- **Registro de decisiones futuras**: reutilizar el formato de Decision Log ya establecido en [[DESIGN_VALIDATION_FRAMEWORK]] y [[CONCEPT_TO_SPEC_PROTOCOL]] para cualquier desviación futura de este blueprint — continuidad de convención, no un formato nuevo.

---

## 16. Veredicto explícito sobre cada decisión mandatada

| # | Decisión del brief | Veredicto | Nota |
|---|---|---|---|
| 1 | `estudio-design-system` como paquete independiente | **Aceptada, con enmienda de secuencia** | Paquete lógico ahora; paquete físico solo cuando exista un segundo consumidor real (§2). |
| 2 | `cognitive-engine` fuera de la UI | **Aceptada tal cual** | Ya existe el seam real (`ClassificationEngine`); se añade fallback offline obligatorio como enmienda (§9). |
| 3 | Módulos con interfaces estables, nunca comunicación directa | **Aceptada, con una excepción declarada** | `today` es módulo orquestador por diseño de producto, registrado en el Registro de Excepciones, no una brecha silenciosa (§6). |
| 4 | World independiente, cero lógica de negocio | **Aceptada tal cual** | Ya parcialmente cierto en el código actual; requiere migrar la deuda visual de `SceneStage.tsx` (§8). |
| 5 | Offline-first obligatorio | **Aceptada, marcada como la mayor inversión neta nueva** | Nada existe hoy; se secuencia como iniciativa propia de varios sprints, no como efecto secundario de la reestructuración de paquetes (§10). |
| 6 | IA con proveedores intercambiables | **Aceptada, con alcance inicial reducido** | Arquitectura soporta N proveedores; primera implementación real solo necesita 1 + el fallback local (§9). |

La contribución propuesta más allá de lo mandatado — **paquetes lógicos antes que físicos, con condición de promoción explícita** — es la respuesta directa a "si crees que existe una arquitectura mejor, explícala": llega al mismo destino que pide el brief sin pagar el costo de un monorepo antes de que haya un segundo consumidor que lo justifique.

---

## 17. Hoja de ruta de migración (cada fase es un sprint válido bajo las reglas 12/13)

0. **Base actual** — este documento, sin cambios de código.
1. **Mayor impacto, menor esfuerzo**: extraer los tokens/estilos inline de `SceneStage.tsx` hacia `estudio-design-system/tokens` + primeros componentes reales en `components/ui`. Introducir los alias de path lógicos.
2. **Frontera de módulo más delicada**: formalizar el bus de eventos; migrar `idea` → `work-table` con `public.ts`, eliminando las importaciones directas de `IdeaSheet`/`useIdeas` desde `habitos`/`diario`/`misiones`.
3. **Motor cognitivo**: mover `lib/comprehension` a `cognitive-engine/ports`, introducir el registro de proveedores (todavía solo `RuleBasedClassifier`).
4. **Offline real**: diseñar e implementar el motor de sincronización (outbox, resolución last-write-wins).
5. **Primer proveedor de IA en la nube**: un adaptador concreto sobre el registro ya existente.
6. **Promoción a paquete físico**: solo si/cuando aparece un segundo consumidor real (desktop, mobile, o un segundo producto que reutilice el Design System).

Ninguna fase intenta completar la visión entera; cada una dejaría build y lint limpios y sería reversible por sí sola, tal como exige la regla 12.

---

## Cierre

Este documento diseña arquitectura, no la implementa. Ningún paquete, módulo o carpeta descrita aquí ha sido creado en el repositorio real como parte de este sprint — la creación de esas carpetas, el movimiento de archivos existentes y la escritura del bus de eventos son trabajo de implementación futura, secuenciado explícitamente en la hoja de ruta de §17, y queda fuera del alcance de este sprint por instrucción explícita del brief.
