# Cervantes Premium Editorial Page Builder

## Summary
Cervantes evoluciona de generador/maquetador automatico a mesa editorial visual: cada pagina puede verse, regenerarse, cambiar de plantilla y aprobarse antes de exportar. El objetivo es producir ebooks coherentes, comercialmente orientados y con apariencia editorial premium a partir de una idea.

## Key Changes
- Editor visual por paginas en Preview con miniaturas, ampliacion, aprobacion, cambio de plantilla y regeneracion selectiva.
- Biblioteca de estilos premium: `premium-editorial`, `mystic-antique`, `modern-clean`, `practical-visual`, `dark-luxury`, `educational-clear`, `technical-professional`.
- Regeneracion selectiva para portada, apertura, figura, worksheet, pagina, capitulo o paquete visual completo, manteniendo consistencia global.
- QA editorial profundo para detectar texto generico, tono tipo chat/IA, Markdown visible, repeticion, claims riesgosos, falta de ejemplos y baja coherencia comercial.
- PDF premium de alta fidelidad basado en paginas aprobadas, sin fallback silencioso, y paquete final con reportes de layout, aprobaciones, estilo visual y assets usados.

## Public Interfaces
- `GET /api/projects/:id/layout/styles`
- `GET /api/projects/:id/layout/pages`
- `POST /api/projects/:id/layout/pages/:pageId/regenerate`
- `POST /api/projects/:id/layout/pages/:pageId/approve`
- `POST /api/projects/:id/layout/pages/:pageId/template`

## Acceptance
- `npm run build` pasa.
- `npm test` pasa.
- `node scripts/verify-visual-layout.mjs` pasa.
- `node scripts/verify-page-editor.mjs` pasa.
- `node scripts/verify-premium.mjs` pasa.
- `node scripts/verify-production.mjs` pasa.
