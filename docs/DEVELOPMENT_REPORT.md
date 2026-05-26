# Cervantes Development Report

## Estado

MVP local-first implementado con monorepo npm, backend Express/TypeScript, frontend React/Vite y Prisma SQLite.

## Decisiones

- Los motores editoriales funcionan en modo plantilla cuando no existe API key.
- La API persiste cada fase del pipeline en SQLite con Prisma.
- Las exportaciones MVP generan Markdown, DOCX, HTML imprimible para PDF, EPUB en Markdown y ZIP.
- El frontend prioriza operación rápida: dashboard, navegación por fases, editor de bloques y paneles JSON para inspección.

## Pendientes recomendados

- Integrar llamadas reales de OpenAI en `AIService`.
- Sustituir exportación HTML por PDF real con Puppeteer cuando el diseño final esté cerrado.
- Añadir validadores Zod o similar para entradas API.
- Completar pruebas end-to-end del flujo de proyecto.
