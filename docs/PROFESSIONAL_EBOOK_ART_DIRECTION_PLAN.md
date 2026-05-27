# Professional Ebook Art Direction Engine

## Objetivo

Subir Cervantes desde un generador/exportador funcional a un sistema local capaz de producir ebooks con dirección editorial premium: portada fuerte, páginas con ritmo visual, assets coherentes, texto reescrito como libro y controles de calidad que hablen en acciones humanas.

## Estándar Esperado

El ebook no debe parecer una conversación exportada ni un documento plano. Debe sentirse como una guía editorial diseñada por una editorial boutique:

- identidad visual coherente por nicho;
- portada comercial con jerarquía y composición;
- índice visual;
- aperturas de capítulo;
- páginas de lectura con márgenes, folios, llamadas y ritmo;
- láminas, figuras, tablas, worksheets y checklist;
- cero Markdown visible;
- cero metatexto de IA;
- paquete KDP/Gumroad completo.

## Motores Nuevos

- `ProfessionalArtDirectionEngine`: elige estilo visual según idea, nicho, mercado e idioma.
- `EditorialRewriteEngine`: mejora bloques pobres antes de maquetar y elimina tono de chat.
- `PremiumPageTemplateEngine`: fuerza variedad editorial y páginas críticas.
- `ProfessionalEbookInspector`: valida que el resultado se parezca a un ebook profesional, no a un PDF básico.

## Estilos Iniciales

- `premium-editorial`
- `mystic-antique`
- `modern-clean`
- `practical-visual`
- `dark-luxury`
- `educational-clear`
- `technical-professional`

`mystic-antique` será el primer estilo de máxima ambición visual, inspirado en el nivel de calidad de referencia mostrado por Iván. Los demás estilos mantienen estructura premium con distinta personalidad.

## Cambios Backend

- Completar endpoints de Page Builder:
  - `GET /api/projects/:id/layout/styles`
  - `GET /api/projects/:id/layout/pages`
  - `POST /api/projects/:id/layout/pages/:pageId/regenerate`
  - `POST /api/projects/:id/layout/pages/:pageId/approve`
  - `POST /api/projects/:id/layout/pages/:pageId/template`
- Agregar dirección de arte:
  - `POST /api/projects/:id/art-direction/apply`
  - `GET /api/projects/:id/art-direction/report`
- Persistir estilo activo, páginas renderizadas, aprobación por página, reporte visual, reporte editorial y assets usados.
- Generar PDF desde layout profesional, sin fallback silencioso.

## Cambios Frontend

- Preview se convierte en mesa editorial:
  - selector de estilo;
  - miniaturas por página;
  - visor ampliado;
  - aprobar página;
  - regenerar variante;
  - cambiar plantilla;
  - descargar preview PDF.
- Quality Gates muestra tareas accionables en lenguaje humano.
- Visual Design conserva aprobación, variantes y ampliación de assets.

## QA Profesional

El verificador profesional debe bloquear o pedir revisión si detecta:

- portada débil;
- páginas demasiado vacías;
- páginas demasiado textuales;
- diseño tipo presentación;
- texto genérico o tipo GPT;
- ausencia de figuras o worksheets;
- marcas Markdown visibles;
- metatexto IA;
- incoherencia entre promesa, título, contenido y mercado.

## Verificación

Comandos obligatorios:

```bash
npm run build
npm test
node scripts/verify-visual-layout.mjs
node scripts/verify-page-editor.mjs
node scripts/verify-professional-ebook.mjs
node scripts/verify-premium.mjs
node scripts/verify-production.mjs
```

## Criterio De Aceptación

La versión queda aceptada solo si un proyecto puede producir:

- layout profesional persistido;
- páginas críticas aprobadas;
- portada no básica;
- figuras y worksheets presentes;
- PDF preview descargable y válido;
- paquete final con reportes visuales/profesionales;
- `docs/PRODUCTION_READINESS_REPORT.md` en estado operativo únicamente si pasan los verificadores.
