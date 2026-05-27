# AI Image Provider Integration Plan

## Objetivo

Convertir la generacion visual de Cervantes en un flujo IA-first: la app intentara crear imagenes editoriales profesionales con un proveedor externo desde frontend, empezando con Puter.js, y caera automaticamente al motor SVG local cuando el proveedor no este disponible, falle, requiera login o entregue un resultado no usable.

## Decision Tecnica

- Proveedor principal: Puter.js en frontend.
- Fallback obligatorio: `EditorialAssetEngine` local SVG.
- Persistencia: toda imagen aceptada por el usuario se guarda localmente en `storage/exports`.
- Export: PDF/EPUB/ZIP usan siempre archivos locales, nunca URLs remotas.
- Seguridad: no se guardan API keys ni secretos en DB.

## Flujo

1. Cervantes construye un prompt visual detallado por asset.
2. El frontend carga Puter.js bajo demanda.
3. Puter genera una imagen segun el prompt y el estilo activo.
4. El frontend convierte la imagen a data URL/blob cuando sea posible.
5. El backend guarda el archivo local y actualiza `VisualAsset`.
6. El usuario revisa la imagen ampliada.
7. El usuario aprueba o pide otra variante.
8. El layout usa la imagen aprobada/local si existe.
9. Si Puter falla, Cervantes mantiene el SVG premium local.

## Endpoints Nuevos

- `GET /api/projects/:id/visual-assets/:assetId/prompt`
  - Devuelve prompt editorial final, estilo, rol, dimensiones recomendadas y fallback local.

- `POST /api/projects/:id/visual-assets/:assetId/external-result`
  - Recibe `dataUrl`, `provider`, `model`, `prompt`, `rights`.
  - Guarda la imagen localmente.
  - Marca el asset como `GENERATED`, `PENDING`, `AI_EXTERNAL`.

- `POST /api/projects/:id/visual-assets/:assetId/external-fallback`
  - Registra fallo externo y deja el SVG local como opcion vigente.

## Persistencia VisualAsset

Campos agregados:

- `externalProvider`
- `externalModel`
- `externalPrompt`
- `externalStatus`
- `externalError`
- `mimeType`

`replacementPath` conserva la ruta local del archivo generado o metadata JSON de fallback.

## Frontend

Visual Design agrega:

- `Generar con IA`
- `Otra opción IA`
- `Usar fallback local`
- indicador de proveedor: `IA externa`, `SVG local`, `Fallback`
- ampliacion de imagen
- aprobacion igual que hoy

## Prompts

Cada prompt debe incluir:

- rol editorial;
- uso exacto en el ebook;
- formato/aspect ratio;
- estilo activo;
- paleta;
- tono visual;
- restricciones de texto;
- consistencia con el resto de la obra;
- evitar look de presentacion o template generico.

## QA

El verificador debe confirmar:

- endpoint de prompt disponible;
- resultado externo guardable;
- imagen preview servida localmente;
- fallback registra fallo sin bloquear;
- export puede empaquetar assets externos aprobados;
- layout sigue pasando aunque Puter no exista.

## Criterio de Aceptacion

- `npm run build` pasa.
- `npm test` pasa.
- `node scripts/verify-ai-image-provider.mjs` pasa.
- `node scripts/verify-visual-layout.mjs 14` pasa.
- `node scripts/verify-professional-ebook.mjs 14` pasa.
- `node scripts/verify-production.mjs` pasa.
