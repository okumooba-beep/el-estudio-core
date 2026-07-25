# Graph Report - lifeos  (2026-07-13)

## Corpus Check
- 99 files · ~36,281 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 488 nodes · 524 edges · 64 communities (44 shown, 20 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7
- Community 8
- Community 9
- Community 10
- Community 11
- Community 12
- Community 13
- Community 14
- Community 15
- Community 16
- Community 17
- Community 18
- Community 19
- Community 21
- Community 22
- Community 23
- Community 24
- Community 25
- Community 27
- Community 28
- Community 29
- Community 30
- Community 40
- Community 41
- Community 44
- Community 45
- LIBRO 01 — La Biblia del Estudio
- ESTUDIO MASTER CONTEXT
- Guía de instalación
- graphify reference: extra exports and benchmark
- Próximos muebles
- graphify reference: query, path, explain
- graphify reference: add a URL and watch a folder
- graphify reference: commit hook and native CLAUDE.md integration
- graphify reference: incremental update and cluster-only
- Visión
- React + TypeScript + Vite
- graphify reference: GitHub clone and cross-repo merge
- graphify reference: transcribe video and audio
- Experience Log
- CLAUDE.md
- extraction-spec.md
- furniture-map.md

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 23 edges
2. `react` - 17 edges
3. `compilerOptions` - 15 edges
4. `LIBRO 01 — La Biblia del Estudio` - 13 edges
5. `What You Must Do When Invoked` - 12 edges
6. `/graphify` - 11 edges
7. `ESTUDIO MASTER CONTEXT` - 11 edges
8. `Guía de instalación` - 10 edges
9. `graphify reference: extra exports and benchmark` - 8 edges
10. `IdeaRepository` - 7 edges

## Surprising Connections (you probably didn't know these)
- `useAmbientLight()` --calls--> `applyLight()`  [EXTRACTED]
  src/lib/light/useAmbientLight.ts → src/lib/light/applyLight.ts
- `HabitosScreen()` --calls--> `useHabitChecks()`  [EXTRACTED]
  src/features/habitos/HabitosScreen.tsx → src/features/habitos/useHabitChecks.ts
- `IdeaCapture()` --calls--> `useIdeas()`  [EXTRACTED]
  src/features/idea/IdeaCapture.tsx → src/features/idea/useIdeas.ts
- `TradingScreen()` --calls--> `getChecklistTemplate()`  [EXTRACTED]
  src/features/trading/TradingScreen.tsx → src/features/trading/checklistTemplate.ts
- `TradingScreen()` --calls--> `useOperaciones()`  [EXTRACTED]
  src/features/trading/TradingScreen.tsx → src/features/trading/useOperaciones.ts

## Import Cycles
- None detected.

## Communities (64 total, 20 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.10
Nodes (18): buildChecklistFromTemplate(), ChecklistTemplateItem, getChecklistTemplate(), newTemplateItem(), saveChecklistTemplate(), DEFAULT_TRADING_CHECKLIST, DexieOperacionRepository, NuevaOperacion (+10 more)

### Community 1 - "Community 1"
Cohesion: 0.07
Nodes (29): DOM, ./src/*, vite/client, compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, exactOptionalPropertyTypes (+21 more)

### Community 2 - "Community 2"
Cohesion: 0.11
Nodes (15): DeskPaperStack(), DeskPaperStackProps, DESTINO_TO_FURNITURE, FURNITURE_TO_DESTINO, CORRECCION_DESTINOS, DESTINO_LABEL, IdeaCapture(), Proposal (+7 more)

### Community 3 - "Community 3"
Cohesion: 0.07
Nodes (17): react, App(), Libreta(), LibretaProps, OBJECT_RENDERERS, ObjectRendererProps, ROOM_OBJECTS, DexieHabitCheckRepository (+9 more)

### Community 4 - "Community 4"
Cohesion: 0.10
Nodes (20): dexie, dependencies, dexie, react, react-dom, react-router-dom, @supabase/supabase-js, name (+12 more)

### Community 5 - "Community 5"
Cohesion: 0.10
Nodes (21): oxlint, devDependencies, oxlint, tailwindcss, @tailwindcss/vite, @types/node, @types/react, @types/react-dom (+13 more)

### Community 6 - "Community 6"
Cohesion: 0.10
Nodes (19): node, vite.config.ts, compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection (+11 more)

### Community 7 - "Community 7"
Cohesion: 0.16
Nodes (11): comprehensionEngine, normalizeTexto(), RuleBasedClassifier, ClassificationLogEntry, getLearnedDestino(), Memoria, RULES, ClassificationEngine (+3 more)

### Community 8 - "Community 8"
Cohesion: 0.07
Nodes (26): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+18 more)

### Community 9 - "Community 9"
Cohesion: 0.28
Nodes (9): applyLight(), computeLight(), daylightAt(), lerp(), lerpRgb(), lerpRgba(), LightState, Rgb (+1 more)

### Community 10 - "Community 10"
Cohesion: 0.24
Nodes (8): Furniture, FurnitureId, HistoryEntry, HistoryEvento, IMPLEMENTED_MATERIALS, MaterialId, MaterialProfile, MATERIALS

### Community 11 - "Community 11"
Cohesion: 0.22
Nodes (8): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema, oxc, typescript, warn

### Community 12 - "Community 12"
Cohesion: 0.33
Nodes (7): dateKey(), daysBetween(), DEFAULT_STATE, getTodaysPhrase(), PhraseState, pickIndex(), PHRASES

### Community 13 - "Community 13"
Cohesion: 0.28
Nodes (7): HistoryMark, RoomObjectAnimation, RoomObjectCondition, RoomObjectDefinition, RoomObjectKind, RoomObjectPosition, RoomObjectState

### Community 14 - "Community 14"
Cohesion: 0.39
Nodes (7): getEstudioSignal(), getFraseEntry(), getMemoriaViva(), getSabiduria(), resolveVoice(), VoiceEntry, VoiceSource

### Community 15 - "Community 15"
Cohesion: 0.29
Nodes (5): OFFSETS_X, OFFSETS_Y, ROTATIONS, SheetEstado, SheetPhysics

### Community 16 - "Community 16"
Cohesion: 0.40
Nodes (3): db, LegacyNota, LifeosDB

### Community 18 - "Community 18"
Cohesion: 0.60
Nodes (3): getHistoryMarks(), LIBRETA_THRESHOLDS, daysSincePresent()

### Community 19 - "Community 19"
Cohesion: 0.40
Nodes (4): ChecklistItem, Operacion, OperacionChecklist, OperacionLado

### Community 47 - "LIBRO 01 — La Biblia del Estudio"
Cohesion: 0.14
Nodes (13): 01 — ¿Qué es el Estudio?, 02 — Leyes del Mundo, 03 — Materiales, 04 — Los Objetos, 05 — El Tiempo, 06 — El Sonido, 07 — La Luz, 08 — Los Olores (+5 more)

### Community 48 - "ESTUDIO MASTER CONTEXT"
Cohesion: 0.17
Nodes (11): 10. Lo que El Estudio nunca será, 1. Qué es El Estudio, 2. Problema que resuelve, 3. Filosofía, 4. Estado actual del proyecto, 5. Qué todavía NO existe, 6. Descubrimientos importantes, 7. Roadmap resumido (+3 more)

### Community 49 - "Guía de instalación"
Cohesion: 0.18
Nodes (10): ANDROID — paso a paso, Antes de empezar: generar la versión de producción, Camino A — Túnel HTTPS temporal (para probar hoy), Camino B — Hosting permanente (para el uso diario), Checklist física — la tenés que marcar vos, DESKTOP — Chrome y Edge, Guía de instalación, IPHONE — paso a paso (+2 more)

### Community 50 - "graphify reference: extra exports and benchmark"
Cohesion: 0.22
Nodes (8): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7a - FalkorDB export (only if --falkordb or --falkordb-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 51 - "Próximos muebles"
Cohesion: 0.25
Nodes (7): Archivador, Biblioteca, Calendario de Pared, Libro Contable, Mapa Mental, Mesa de Planificación, Próximos muebles

### Community 52 - "graphify reference: query, path, explain"
Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 53 - "graphify reference: add a URL and watch a folder"
Cohesion: 0.50
Nodes (3): For /graphify add, For --watch, graphify reference: add a URL and watch a folder

### Community 54 - "graphify reference: commit hook and native CLAUDE.md integration"
Cohesion: 0.50
Nodes (3): For git commit hook, For native CLAUDE.md integration, graphify reference: commit hook and native CLAUDE.md integration

### Community 55 - "graphify reference: incremental update and cluster-only"
Cohesion: 0.50
Nodes (3): For --cluster-only, For --update (incremental re-extraction), graphify reference: incremental update and cluster-only

### Community 56 - "Visión"
Cohesion: 0.50
Nodes (3): Cómo usar esto, Lo que eso significa en la práctica, Visión

### Community 57 - "React + TypeScript + Vite"
Cohesion: 0.50
Nodes (3): Expanding the Oxlint configuration, React Compiler, React + TypeScript + Vite

## Knowledge Gaps
- **212 isolated node(s):** `$schema`, `typescript`, `oxc`, `react/rules-of-hooks`, `warn` (+207 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **20 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `Community 3` to `Community 0`, `Community 9`, `Community 2`, `Community 11`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Why does `plugins` connect `Community 11` to `Community 3`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `Community 5` to `Community 4`?**
  _High betweenness centrality (0.005) - this node is a cross-community bridge._
- **What connects `$schema`, `typescript`, `oxc` to the rest of the system?**
  _212 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.10483870967741936 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.10574712643678161 - nodes in this community are weakly interconnected._