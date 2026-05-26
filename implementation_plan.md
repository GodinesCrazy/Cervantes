# Plan de Implementación — Cervantes

## Contexto

Cervantes es una aplicación **mono-usuario privada** para Iván Marty, diseñada para transformar una idea simple de eBook en un producto editorial completo, premium y comercialmente competitivo. El repositorio actual (`C:/Cervantes`) contiene únicamente un paquete de investigación (`Cervantes_research_package/`) con 5 documentos de investigación y el prompt maestro. **No existe código fuente, git, ni stack definido.**

**Entorno disponible:** Node.js v22.16.0, npm 10.9.2, Windows.

---

## Decisiones de Diseño

> [!IMPORTANT]
> ### Stack Seleccionado (alineado con el prompt maestro)
> - **Frontend:** React 18 + TypeScript + Vite
> - **Backend:** Node.js + Express + TypeScript
> - **Base de Datos:** SQLite local con Prisma ORM
> - **Exportación:** Markdown → DOCX (docx), PDF (puppeteer), EPUB (epub-gen-redone), ZIP (archiver)
> - **Monorepo:** Estructura de carpetas planas sin Turborepo/Nx (simplicidad mono-usuario)
> - **IA:** Servicio abstracto AIService con provider OpenAI configurable + modo plantilla sin API key

### Justificación de simplificaciones para MVP funcional:
1. **Sin BullMQ** — Jobs síncronos + async en API, persistidos en DB con estado
2. **Sin Docker** — App local-first, ejecutar con `npm run dev`
3. **Sin auth** — Mono-usuario, acceso local directo
4. **PDF via Puppeteer** — Renderiza HTML a PDF premium con control total de diseño
5. **Prisma + SQLite** — Zero-config, archivo local, migrations automáticas

---

## Proposed Changes

### FASE A — Inicialización del Repositorio

#### [NEW] Inicialización Git + estructura base
- `git init` en `C:/Cervantes`
- Mover `Cervantes_research_package/docs/*` → `docs/`
- Mover `Cervantes_research_package/prompts/*` → `prompts/`
- Crear `.gitignore`, `.env.example`, `README.md`

> [!WARNING]
> Los archivos de investigación existentes se **moverán** (no copiarán) de `Cervantes_research_package/` a `docs/` y `prompts/` para alinear con la estructura esperada. El directorio `Cervantes_research_package/` se eliminará después de confirmar la migración.

---

### FASE B — Arquitectura y Setup

#### [NEW] Estructura del proyecto

```
C:/Cervantes/
├─ README.md
├─ package.json                  (root workspace)
├─ .env.example
├─ .gitignore
├─ docs/                         (documentos de investigación migrados)
├─ prompts/                      (prompts migrados)
├─ apps/
│  ├─ frontend/                  (React + Vite + TS)
│  │  ├─ package.json
│  │  ├─ vite.config.ts
│  │  ├─ index.html
│  │  ├─ tsconfig.json
│  │  └─ src/
│  │     ├─ main.tsx
│  │     ├─ App.tsx
│  │     ├─ index.css
│  │     ├─ api/                 (cliente API)
│  │     ├─ components/          (componentes reutilizables)
│  │     ├─ pages/               (18+ páginas)
│  │     ├─ hooks/               (custom hooks)
│  │     └─ types/               (tipos compartidos)
│  └─ backend/
│     ├─ package.json
│     ├─ tsconfig.json
│     └─ src/
│        ├─ index.ts             (entry point Express)
│        ├─ routes/              (rutas API REST)
│        ├─ services/            (lógica de negocio)
│        ├─ engines/             (13 motores editoriales)
│        ├─ exporters/           (MD, DOCX, PDF, EPUB, ZIP)
│        └─ ai/                  (AIService abstracto)
├─ prisma/
│  └─ schema.prisma
├─ storage/
│  ├─ projects/
│  ├─ exports/
│  ├─ covers/
│  ├─ assets/
│  └─ backups/
└─ scripts/
   ├─ dev.ts
   └─ seed-demo.ts
```

#### [NEW] [package.json](file:///C:/Cervantes/package.json) — Root workspace
- npm workspaces con `apps/frontend` y `apps/backend`
- Scripts: `dev`, `build`, `test`, `db:migrate`, `db:seed`

#### [NEW] [.env.example](file:///C:/Cervantes/.env.example)
```
OPENAI_API_KEY=
AI_PROVIDER=openai
AI_MODEL=gpt-4o
DATABASE_URL=file:../storage/cervantes.db
PORT=3001
```

---

### FASE C — Modelo de Datos (Prisma Schema)

#### [NEW] [schema.prisma](file:///C:/Cervantes/prisma/schema.prisma)

20 entidades principales:

| Entidad | Descripción |
|---|---|
| `Project` | Proyecto de eBook (nombre, slug, estado pipeline, timestamps) |
| `EbookIdea` | Idea base con campos: tema, audiencia, nivel, tono, plataformas, formatos |
| `ClarificationQuestion` | Preguntas inteligentes generadas + respuestas del usuario |
| `MarketResearch` | Investigación de mercado: nicho, competencia, precios, score |
| `CompetitorBook` | Libros competidores individuales analizados |
| `LanguageOpportunity` | Análisis de idiomas con métricas y recomendación |
| `EditorialFormula` | Fórmula comercial elegida: tipo producto, bundle, estrategia |
| `EditorialBible` | Biblia editorial completa (JSON estructurado + markdown) |
| `VisualBible` | Biblia visual premium: paleta, tipografías, estilos, prompts |
| `ChapterPlan` | Plan de capítulos/partes con orden, extensión, dependencias |
| `ManuscriptBlock` | Bloques de manuscrito con estado, versión, contenido |
| `BlockVersion` | Historial de versiones por bloque |
| `AuditReport` | Informes de auditoría editorial |
| `RecoveryReport` | Informes de recuperación/reconstrucción |
| `VisualAsset` | Assets visuales: portada, láminas, iconos, prompts |
| `FormatBuild` | Builds de formato generados (MD/DOCX/PDF/EPUB) |
| `MetadataPackage` | Metadata comercial por plataforma |
| `PublishingChecklist` | Checklist de publicación con items verificables |
| `ExportPackage` | Paquetes ZIP exportados |
| `AppSettings` | Configuración de la app (singleton) |

---

### FASE D — Backend/API

#### [NEW] apps/backend/src/ — Express + TypeScript

**Rutas API REST:**

| Ruta | Descripción |
|---|---|
| `GET/POST /api/projects` | CRUD de proyectos |
| `GET/PUT /api/projects/:id` | Detalle y actualización |
| `POST /api/projects/:id/idea` | Guardar/actualizar idea |
| `GET/POST /api/projects/:id/clarifications` | Preguntas y respuestas |
| `GET/POST /api/projects/:id/market-research` | Investigación de mercado |
| `GET/POST /api/projects/:id/language-opportunity` | Análisis de idiomas |
| `POST /api/projects/:id/go-nogo` | Calcular score GO/NO-GO |
| `GET/POST /api/projects/:id/editorial-formula` | Fórmula editorial |
| `GET/POST /api/projects/:id/editorial-bible` | Biblia editorial |
| `GET/POST /api/projects/:id/visual-bible` | Biblia visual |
| `GET/POST /api/projects/:id/chapter-plans` | Planificación de capítulos |
| `GET/POST /api/projects/:id/blocks` | Bloques de manuscrito |
| `PUT /api/projects/:id/blocks/:blockId` | Editar/aprobar bloque |
| `POST /api/projects/:id/blocks/:blockId/generate` | Generar contenido IA |
| `POST /api/projects/:id/audit` | Ejecutar auditoría |
| `POST /api/projects/:id/recovery` | Detectar faltantes y recuperar |
| `POST /api/projects/:id/assemble` | Ensamblar manuscrito maestro |
| `POST /api/projects/:id/export/:format` | Exportar formato específico |
| `POST /api/projects/:id/export/zip` | Generar paquete ZIP completo |
| `GET/POST /api/projects/:id/metadata` | Metadata comercial |
| `GET/POST /api/projects/:id/publishing-checklist` | Checklist publicación |
| `GET/PUT /api/settings` | Configuración de la app |
| `GET /api/projects/:id/history` | Historial/versiones |

**Servicios principales:**
- `ProjectService` — CRUD y gestión de estado del pipeline
- `AIService` — Abstracción para IA (OpenAI + modo plantilla)
- `ExportService` — Orquestador de exportaciones

---

### FASE E — Frontend (React + Vite)

#### [NEW] apps/frontend/src/ — 18+ páginas

**Páginas del frontend:**

| Página | Ruta | Descripción |
|---|---|---|
| Dashboard | `/` | Lista proyectos, estadísticas, acciones rápidas |
| Nuevo Proyecto | `/projects/new` | Wizard de creación |
| Vista Proyecto | `/projects/:id` | Overview del pipeline con progreso |
| Idea Intake | `/projects/:id/idea` | Formulario de idea + preguntas inteligentes |
| Investigación | `/projects/:id/research` | Investigación de mercado |
| Idiomas | `/projects/:id/languages` | Análisis de oportunidad por idioma |
| GO/NO-GO | `/projects/:id/go-nogo` | Score y decisión |
| Fórmula | `/projects/:id/formula` | Fórmula editorial |
| Biblia Editorial | `/projects/:id/editorial-bible` | Biblia editorial completa |
| Biblia Visual | `/projects/:id/visual-bible` | Biblia visual premium |
| Índice Maestro | `/projects/:id/chapter-plan` | Planificación de capítulos |
| Bloques | `/projects/:id/blocks` | Lista de bloques con estados |
| Editor Bloque | `/projects/:id/blocks/:blockId` | Editor de contenido + auditoría |
| Auditoría | `/projects/:id/audit` | Reportes de auditoría |
| Recuperación | `/projects/:id/recovery` | Faltantes y reconstrucción |
| Diseño Visual | `/projects/:id/visual-design` | Assets y prompts visuales |
| Exportación | `/projects/:id/export` | Formatos y exportaciones |
| Metadata | `/projects/:id/metadata` | Metadata y paquete comercial |
| Publicación | `/projects/:id/publishing` | Checklist y guías de publicación |
| Configuración | `/settings` | Settings de la app (API keys, etc.) |

**Diseño UI:**
- Tema oscuro profesional (productivity-oriented)
- Sidebar de navegación con progreso del pipeline
- Estados visuales claros por fase (colores semáforo)
- Componentes: Cards, StatusBadge, ProgressBar, MarkdownEditor, Wizard
- React Router para navegación SPA
- Fetch API para comunicación con backend

---

### FASE F — Motores Internos (13 engines)

Cada motor se implementa como un servicio en `apps/backend/src/engines/`:

| Motor | Archivo | Funcionalidad principal |
|---|---|---|
| Idea Intake | `ideaIntakeEngine.ts` | Genera preguntas inteligentes basadas en la idea |
| Market Research | `marketResearchEngine.ts` | Estructura investigación, calcula score |
| Language Opportunity | `languageOpportunityEngine.ts` | Analiza idiomas, recomienda mercado |
| Editorial Formula | `editorialFormulaEngine.ts` | Recomienda fórmula comercial |
| Editorial Bible | `editorialBibleEngine.ts` | Genera biblia editorial completa |
| Visual Design | `visualDesignEngine.ts` | Genera biblia visual y prompts de assets |
| Manuscript Planner | `manuscriptPlannerEngine.ts` | Divide libro en capítulos y bloques |
| Manuscript Generator | `manuscriptGeneratorEngine.ts` | Genera contenido por bloque |
| Editorial Auditor | `editorialAuditorEngine.ts` | Audita bloques y manuscrito |
| Recovery & Assembly | `recoveryAssemblyEngine.ts` | Detecta faltantes, ensambla maestro |
| Format Builder | `formatBuilderEngine.ts` | Orquesta exportaciones |
| Metadata Generator | `metadataGeneratorEngine.ts` | Genera metadata por plataforma |
| Publishing Assistant | `publishingAssistantEngine.ts` | Genera checklists y guías |

Cada motor:
- Funciona con IA (si API key disponible) **o** con plantillas/modo manual
- Recibe datos del proyecto como input
- Persiste resultados en DB
- Devuelve resultado estructurado

---

### FASE G — Exportadores

#### [NEW] apps/backend/src/exporters/

| Exportador | Librería | Notas |
|---|---|---|
| Markdown | fs nativo | Formato maestro, concatenación de bloques |
| DOCX | `docx` | Con estilos, jerarquía tipográfica, portada |
| PDF | `puppeteer` | HTML → PDF premium con CSS print |
| EPUB | `epub-gen-redone` | EPUB 3, TOC, metadata, imágenes optimizadas |
| ZIP | `archiver` | Paquete completo con estructura definida |

---

### FASE H — Testing

- Tests unitarios de engines con Vitest
- Test de build sin errores
- Script de flujo demo end-to-end
- Validación de exportaciones

---

### FASE I — Documentación

#### [NEW/MODIFY] Documentos a crear/actualizar:
- `README.md` — Instalación, ejecución, configuración
- `docs/DEVELOPMENT_REPORT.md` — Decisiones técnicas, arquitectura
- `docs/USER_GUIDE.md` — Guía de usuario paso a paso
- `docs/TEST_REPORT.md` — Resultados de pruebas
- `docs/PRODUCTION_READINESS_REPORT.md` — Estado de producción

---

## User Review Required

> [!IMPORTANT]
> ### Migración de documentos de investigación
> Los archivos en `Cervantes_research_package/docs/` se moverán a `docs/` en la raíz. El directorio `Cervantes_research_package/` se eliminará. ¿De acuerdo?

> [!IMPORTANT]
> ### Inicialización Git
> Se inicializará un nuevo repositorio git local en `C:/Cervantes`. El remote a `https://github.com/GodinesCrazy/Cervantes.git` se configurará pero **no se hará push automático** (requiere autenticación). ¿Correcto?

---

## Verification Plan

### Automated Tests
```bash
npm install          # Instalar todas las dependencias
npm run db:migrate   # Crear base de datos SQLite
npm run build        # Build de producción sin errores
npm run test         # Tests unitarios
npm run dev          # Verificar que la app abre en localhost
```

### Flujo Demo Manual
1. Abrir `http://localhost:5173`
2. Crear proyecto "Runas Premium"
3. Ingresar idea de eBook sobre runas
4. Avanzar por cada fase del pipeline
5. Verificar generación de documentos (con/sin API key)
6. Exportar MD, DOCX, PDF, EPUB
7. Generar paquete ZIP final

### Criterios de éxito
- ✅ App abre sin errores
- ✅ Se puede crear proyecto y avanzar pipeline
- ✅ Cada motor genera output (plantilla o IA)
- ✅ Exportaciones generan archivos válidos
- ✅ Paquete ZIP con estructura correcta
- ✅ Persistencia SQLite funcional
- ✅ No hay claves hardcodeadas
- ✅ No hay imports rotos
