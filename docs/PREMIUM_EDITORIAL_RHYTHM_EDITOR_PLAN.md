# Editor de Ritmo Editorial Premium

## Resumen

Cervantes incorpora una capa de ritmo editorial para que el ebook no sea solo un texto maquetado, sino una lectura con cadencia profesional: páginas compactadas, variedad de plantillas, títulos humanos, casos, tablas, prácticas y cierres accionables.

## Implementación

- Se agrega `EditorialRhythmEngine` entre la construcción del layout y el render HTML.
- Se agregan páginas premium: lectura amplia, caso aplicado, tabla editorial, práctica guiada y resumen de capítulo.
- Se normaliza copy visible: acentos, títulos de continuación y etiquetas editoriales.
- Se agrega `EditorialRhythmInspector` y se integra al reporte profesional y al paquete final.
- Preview incluye panel de ritmo editorial y botón `Optimizar ritmo editorial`.

## Criterios

- Evitar páginas infladas y repetitivas.
- Mantener páginas de lectura bajo 620 palabras.
- Evitar títulos mecánicos como `/ continuacion`.
- Incluir casos, tablas y cierres accionables.
- Exportar `rhythm_report.json` dentro del ZIP final.

## Verificación

- `npm run build`
- `npm test`
- `node scripts/verify-editorial-rhythm.mjs`
- `node scripts/verify-professional-ebook.mjs`
