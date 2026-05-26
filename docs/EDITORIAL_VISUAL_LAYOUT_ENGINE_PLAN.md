# Cervantes Como Maquetador Editorial Visual Premium

## Summary
Convertir Cervantes de generador de texto con exportación a un maquetador editorial visual premium local. La primera versión profunda usa un estándar `premium-editorial`, assets SVG locales, preview paginado tipo libro, PDF premium, EPUB reflow limpio, DOCX editable, ZIP completo y QA visual.

## Key Changes
- Crear `EditorialLayoutEngine`, `EditorialThemeEngine`, `EditorialAssetEngine` y `VisualQualityInspector`.
- Separar ensamblaje, layout, assets, HTML, PDF, EPUB, DOCX y ZIP.
- Usar la Biblia Visual para elegir paleta, tono, ornamento, densidad visual y composición.
- Renderizar páginas editoriales reales: portada, título, índice visual, apertura de capítulo, páginas de lectura, figura, worksheet, apéndices y créditos.
- Persistir render/layout con `themeKey`, `pageTemplates`, `renderedHtmlPath`, `visualReport` y `lastRenderedAt`.
- Exponer preview PDF, render manual de layout y reporte de QA visual.
- Mantener Cervantes local privado: sin SaaS, sin auth y sin imágenes externas obligatorias.

## Interfaces
- `GET /api/projects/:id/preview.pdf`: descarga PDF preview.
- `POST /api/projects/:id/layout/render`: genera HTML visual y reporte sin crear paquete final.
- `GET /api/projects/:id/layout/report`: devuelve el último reporte visual.
- `VisualAsset` conserva datos actuales y agrega metadata visual: `layoutRole`, `themeKey`, `pagePlacement`, `variant`, `qualityStatus`.
- Nuevo registro de layout por proyecto para persistir último HTML, tema y reporte.

## Acceptance
- El preview ya no parece chat ni Markdown renderizado.
- El PDF incluye composición editorial, assets coherentes, apertura de capítulos, figuras y tablas limpias.
- El ZIP final incluye HTML preview y reporte visual.
- Quality Gates muestra “Calidad visual” como bloque separado.
- `npm run build`, `npm test`, `node scripts/verify-premium.mjs`, `node scripts/verify-production.mjs` y `node scripts/verify-visual-layout.mjs` pasan.

## Assumptions
- Estándar elegido: Editorial premium adaptable por nicho.
- Assets base: SVG editoriales locales.
- No se integra generación externa de imágenes en esta primera ejecución.
- El ejemplo del usuario marca nivel de ambición, no estilo único obligatorio.
