# PROMPT — Desarrollo completo de Cervantes en IDE

Fecha: 2026-05-25

## Uso

Pega este prompt en la IA generativa del IDE ubicado en:

`C:/Cervantes`

Debe ejecutarse **después** de copiar y revisar los documentos de investigación en:

`C:/Cervantes/docs`

---

```text
ACTÚA COMO:
Un equipo senior completo de desarrollo de software compuesto por:

- Principal Software Architect
- Full-stack TypeScript Engineer
- Backend Engineer
- Frontend UX/UI Engineer
- Product Manager
- QA Automation Engineer
- DevOps Engineer
- Security Engineer
- Technical Writer
- Expert in editorial software, eBooks, EPUB, PDF and publishing workflows

PROYECTO:
Cervantes

RUTA LOCAL:
C:/Cervantes

OBJETIVO:
Desarrollar una aplicación web completa, operativa, probada y documentada que transforme una idea simple de eBook en un paquete editorial completo, validado y listo para publicación asistida.

IMPORTANTE:
Antes de codificar, lee obligatoriamente estos documentos:

- docs/01_INVESTIGACION_PROFUNDA_MERCADO_EBOOKS.md
- docs/02_PLATAFORMAS_FORMATOS_COMPLIANCE.md
- docs/03_FLUJO_EDITORIAL_VALIDADO_RUNAS_A_CERVANTES.md
- docs/04_ESPECIFICACION_PRODUCTO_CERVANTES.md
- docs/05_ROADMAP_MVP_Y_DEFINICION_DE_TERMINADO.md

Estos documentos son la fuente de verdad del producto.

NO inventes requisitos que contradigan esos documentos.
NO prometas best seller garantizado.
NO automatices publicación en KDP.
NO simules como reales funciones no implementadas.
NO dejes datos mock en producción.
NO declares DONE si no hay pruebas.
NO entregues fragmentos: entrega software ejecutable.

FASE 1 — AUDITORÍA DEL REPOSITORIO

1. Inspecciona todo el repositorio.
2. Detecta stack actual.
3. Si no existe stack, crea uno profesional.
4. Genera o actualiza:

docs/REPO_AUDIT.md
docs/IMPLEMENTATION_PLAN.md

Debes indicar:
- estructura actual;
- stack detectado;
- faltantes;
- riesgos;
- plan de implementación.

FASE 2 — ARQUITECTURA

Implementa, si no existe:

Frontend:
- React + TypeScript + Vite
- Tailwind
- shadcn/ui o componentes equivalentes
- routing
- dashboard
- wizard de proyecto

Backend:
- Node.js + TypeScript
- Express o NestJS
- PostgreSQL + Prisma
- Redis/BullMQ opcional si el proyecto lo permite
- API REST
- validaciones
- logs

Base de datos:
Crear modelos para:

- User
- Project
- EbookIdea
- ClarificationQuestion
- MarketResearchReport
- EditorialFormula
- EditorialBible
- ChapterPlan
- ManuscriptBlock
- AuditReport
- VisualAssetPlan
- FormatBuild
- MetadataPackage
- ComplianceReport
- PublicationPackage
- VersionSnapshot

FASE 3 — FUNCIONALIDAD MVP 1

Implementa:

1. Crear proyecto de eBook.
2. Ingresar idea simple.
3. Generar preguntas de clarificación.
4. Guardar respuestas.
5. Generar investigación de mercado estructurada.
6. Generar GO / NO-GO.
7. Generar fórmula editorial.
8. Generar biblia editorial.
9. Exportar documentos en Markdown.

FASE 4 — FUNCIONALIDAD MVP 2

Implementa:

1. Plan de manuscrito.
2. División por partes/capítulos/bloques.
3. Generación de bloque.
4. Auditoría de bloque.
5. Aprobación/rechazo.
6. Versionado.
7. Ensamblaje maestro.
8. Detección de faltantes.
9. Reconstrucción controlada sin inventar.

FASE 5 — FUNCIONALIDAD MVP 3

Implementa exportación:

- .md
- .docx
- .pdf
- .epub
- .zip

Si alguna exportación avanzada no puede implementarse plenamente en esta fase:
- crea una implementación funcional mínima;
- documenta limitaciones;
- agrega tests;
- no la marques como final si no cumple.

FASE 6 — PAQUETES DE PUBLICACIÓN

Genera carpetas:

build/kdp/
build/gumroad/
build/shopify/
build/draft2digital/

Cada una debe incluir:
- archivos correspondientes;
- metadata;
- checklist;
- compliance report;
- instrucciones.

KDP debe quedar como publicación asistida/manual segura.

FASE 7 — UX/UI

Crear pantallas:

1. Dashboard.
2. Nuevo proyecto.
3. Wizard de idea.
4. Preguntas.
5. Investigación.
6. Fórmula editorial.
7. Biblia editorial.
8. Manuscrito por bloques.
9. Auditoría.
10. Visuales.
11. Formatos.
12. Metadata.
13. Compliance.
14. Paquetes de publicación.
15. Historial de versiones.
16. Configuración.

UX obligatoria:
- estados claros;
- barra de progreso por fase;
- botones de aprobar/regenerar;
- advertencias de compliance;
- descarga de archivos;
- historial;
- errores visibles.

FASE 8 — IA Y PROMPTS

Crear un sistema de prompts versionados:

- prompt de investigación;
- prompt de fórmula editorial;
- prompt de biblia;
- prompt de capítulo;
- prompt de auditoría;
- prompt de limpieza;
- prompt de metadata;
- prompt de compliance.

Crear abstracción para proveedor IA.

Debe permitir:
- OpenAI vía API key;
- modo mock SOLO para tests, claramente identificado;
- logs de generación;
- reintentos;
- guardado parcial.

FASE 9 — TESTS

Agregar pruebas:

- unitarias;
- integración API;
- generación de documentos;
- exportación;
- validación de compliance;
- flujo completo demo.

No declares terminado si los tests fallan.

FASE 10 — DOCUMENTACIÓN

Crear:

- README.md
- .env.example
- docs/ARCHITECTURE.md
- docs/LOCAL_SETUP.md
- docs/USER_GUIDE.md
- docs/TESTING_REPORT.md
- docs/PRODUCTION_READINESS.md
- docs/KNOWN_LIMITATIONS.md

FASE 11 — DEMO REAL

Crear un caso demo:

Idea:
"Quiero crear un eBook premium sobre runas para principiantes"

El sistema debe generar:
- proyecto;
- investigación;
- fórmula;
- biblia editorial;
- plan de manuscrito;
- al menos un bloque de muestra;
- auditoría;
- paquete de publicación de ejemplo.

FASE 12 — DEFINICIÓN DE TERMINADO

El proyecto solo está DONE si:

1. App inicia localmente.
2. Frontend funciona.
3. Backend funciona.
4. DB funciona.
5. Crear proyecto funciona.
6. Pipeline MVP funciona.
7. Exportaciones básicas funcionan.
8. Paquetes se generan.
9. Tests pasan.
10. Documentación existe.
11. No hay datos falsos presentados como reales.
12. No se promete publicación automática KDP.
13. PRODUCTION_READINESS.md indica GO, GO condicional o NO-GO con evidencia.

FORMATO FINAL DE RESPUESTA:

Al terminar, responde con:

1. RESUMEN DE IMPLEMENTACIÓN
2. ARCHIVOS CREADOS/MODIFICADOS
3. CÓMO EJECUTAR LOCALMENTE
4. VARIABLES DE ENTORNO
5. TESTS EJECUTADOS Y RESULTADO
6. DEMO DISPONIBLE
7. LIMITACIONES CONOCIDAS
8. GO / NO-GO PARA USO REAL
```
