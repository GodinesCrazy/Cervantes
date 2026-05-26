# 05 — Roadmap MVP y definición de terminado
## Proyecto Cervantes

**Ruta sugerida:** `C:/Cervantes/docs/05_ROADMAP_MVP_Y_DEFINICION_DE_TERMINADO.md`  
**Proyecto:** Cervantes  
**Repositorio:** `https://github.com/GodinesCrazy/Cervantes.git`  
**Objetivo del documento:** fijar el roadmap de desarrollo del MVP y definir con precisión cuándo Cervantes puede considerarse software terminado, operativo, probado y listo para producir eBooks premium con calidad editorial, visual, comercial y técnica.

---

# 1. Resumen ejecutivo

Cervantes debe construirse como una **plataforma editorial inteligente**, no como un simple generador de texto.

Su función principal será transformar una idea simple de eBook en un proyecto editorial completo, validado y listo para publicación asistida o automatizada según la plataforma. El sistema debe producir no solo manuscritos, sino también investigación de mercado, estructura editorial, diseño visual premium, formatos exportables, metadata comercial, paquetes de publicación y controles de compliance.

El MVP no debe intentar resolverlo todo desde la primera versión. Debe avanzar en fases, cada una con entregables verificables y gates de aprobación.

El criterio central será:

> Cervantes no está terminado cuando genera texto. Cervantes está terminado cuando puede transformar una idea en un paquete editorial premium validado, exportable, auditable y publicable.

---

# 2. Principio rector del roadmap

El desarrollo debe seguir una progresión segura:

1. Primero, **investigar y validar**.
2. Luego, **diseñar el producto editorial**.
3. Después, **generar el manuscrito por bloques**.
4. Más tarde, **auditar, limpiar y reconstruir faltantes**.
5. Luego, **diseñar visualmente el eBook**.
6. Después, **generar formatos exportables**.
7. Finalmente, **preparar publicación asistida o automatizada según plataforma**.

La experiencia del proyecto de runas demostró que intentar saltar directamente desde idea a libro completo genera riesgo de cortes, faltantes, repeticiones, metatexto, desorden de versiones y baja calidad final. Por eso Cervantes debe imponer un flujo controlado.

---

# 3. Roadmap general por fases

## Fase 0 — Preparación del proyecto

### Objetivo
Crear la base técnica y documental del proyecto Cervantes.

### Entregables

- Repositorio inicial configurado.
- Estructura de carpetas.
- Documentación base en `docs/`.
- Variables de entorno documentadas.
- Stack técnico definido.
- Comando de instalación.
- Comando de desarrollo local.
- Comando de pruebas.
- README inicial.

### Carpetas sugeridas

```text
C:/Cervantes
├─ docs/
├─ prompts/
├─ apps/
│  ├─ web/
│  └─ api/
├─ packages/
│  ├─ core/
│  ├─ editorial-engine/
│  ├─ visual-engine/
│  ├─ format-builder/
│  └─ compliance-engine/
├─ storage/
│  ├─ projects/
│  ├─ exports/
│  └─ assets/
└─ tests/
```

### Gate de aprobación

La fase queda aprobada cuando:

- el proyecto instala sin errores;
- el backend inicia localmente;
- el frontend inicia localmente;
- existe documentación mínima;
- existe control de versiones;
- el repositorio queda preparado para desarrollo real.

---

## Fase 1 — Núcleo de proyectos editoriales

### Objetivo
Permitir crear, guardar y administrar proyectos de eBook.

### Funciones mínimas

- Crear proyecto desde idea simple.
- Guardar título provisional.
- Guardar nicho inicial.
- Guardar idioma base.
- Guardar autor, pseudónimo o marca editorial.
- Guardar plataformas objetivo.
- Guardar estado del proyecto.
- Ver historial de avances.
- Editar datos básicos.
- Eliminar o archivar proyecto.

### Entidades mínimas

- `User`
- `Project`
- `EbookIdea`
- `ProjectStatus`
- `VersionSnapshot`

### Estados iniciales del proyecto

```text
IDEA_CREATED
CLARIFICATION_PENDING
RESEARCH_PENDING
RESEARCH_COMPLETED
FORMULA_PENDING
EDITORIAL_BIBLE_PENDING
MANUSCRIPT_PENDING
AUDIT_PENDING
FORMAT_PENDING
PUBLICATION_PACKAGE_PENDING
COMPLETED
ARCHIVED
```

### Gate de aprobación

La fase queda aprobada cuando un usuario puede crear un proyecto, verlo en dashboard, editarlo y recuperar su información después de cerrar sesión.

---

## Fase 2 — Wizard de idea y preguntas de clarificación

### Objetivo
Evitar que Cervantes asuma información crítica sin preguntar.

### Funciones mínimas

El sistema debe hacer preguntas obligatorias sobre:

- tipo de eBook;
- nicho;
- público objetivo;
- idioma base;
- posibles idiomas secundarios;
- plataforma principal;
- nivel de automatización deseado;
- uso de IA;
- autor real, pseudónimo o marca;
- tono editorial;
- profundidad esperada;
- presencia de contenido sensible;
- necesidad de diseño gráfico premium;
- productos complementarios: workbook, bonus, guía rápida, plantillas;
- objetivo comercial: venta directa, KDP, lead magnet, bundle, curso, comunidad.

### Salida esperada

Un documento interno:

```text
PROJECT_BRIEF.md
```

Este documento debe resumir todo lo que Cervantes sabe antes de iniciar investigación.

### Gate de aprobación

La fase queda aprobada cuando Cervantes puede generar un brief claro sin inventar datos no entregados por el usuario.

---

## Fase 3 — Market Research Engine

### Objetivo
Investigar el mercado antes de generar el libro.

### Funciones mínimas

El sistema debe producir un informe de investigación que incluya:

- tamaño aproximado del nicho;
- intención de compra;
- competencia visible;
- saturación;
- precios de referencia;
- promesas comerciales comunes;
- formatos usados;
- extensión promedio;
- tipo de portadas;
- nivel visual esperado;
- oportunidades no cubiertas;
- riesgos;
- posicionamiento recomendado;
- idiomas con mayor potencial;
- plataformas recomendadas;
- primera decisión GO / NO-GO.

### Documento generado

```text
MARKET_RESEARCH_REPORT.md
```

### Requisito de idiomas

Debe operar un módulo llamado:

```text
Language Opportunity Engine
```

Este módulo debe evaluar qué idiomas tienen más potencial para el eBook según:

- nicho;
- país objetivo;
- volumen potencial de compradores;
- competencia;
- dificultad de posicionamiento;
- plataforma;
- precio esperable;
- capacidad de traducción/localización;
- keywords;
- sensibilidad cultural;
- viabilidad comercial.

La salida debe clasificar idiomas así:

```text
IDIOMA_BASE_RECOMENDADO
IDIOMA_SECUNDARIO_PRIORITARIO
IDIOMAS_FUTUROS
IDIOMAS_DESCARTADOS_POR_AHORA
```

### Gate de aprobación

La fase queda aprobada cuando el informe puede justificar:

- si el proyecto debe avanzar;
- en qué idioma comenzar;
- qué plataformas priorizar;
- qué fórmula comercial usar;
- qué nivel visual exige el nicho.

---

## Fase 4 — Editorial Formula Engine

### Objetivo
Definir la fórmula ganadora del producto editorial.

### Funciones mínimas

Debe decidir:

- extensión estimada;
- formato principal;
- formato secundario;
- estilo editorial;
- profundidad;
- estructura de capítulos;
- propuesta de valor;
- promesa comercial responsable;
- producto complementario;
- bonus;
- nivel de diseño gráfico;
- rango de precio sugerido;
- estrategia de publicación inicial.

### Fórmulas posibles

```text
SOLO_EBOOK
EBOOK_PREMIUM_ILUSTRADO
EBOOK_PLUS_WORKBOOK
EBOOK_PLUS_GUIA_RAPIDA
EBOOK_PLUS_PLANTILLAS
BUNDLE_PREMIUM
LEAD_MAGNET_PLUS_PRODUCTO_PAGO
SERIE_DE_EBOOKS
```

### Regla comercial

Cervantes debe priorizar valor percibido sin inflar artificialmente páginas.

Una fórmula fuerte puede ser:

```text
Libro principal + workbook + guía rápida visual + paquete de publicación
```

### Documento generado

```text
EDITORIAL_FORMULA.md
```

### Gate de aprobación

La fase queda aprobada cuando existe una fórmula editorial concreta y defendible, con estructura, precio orientativo, formato, plataforma y nivel visual definidos.

---

## Fase 5 — Editorial Bible Generator

### Objetivo
Crear la Biblia Editorial del eBook antes de redactar.

### Contenido mínimo

La Biblia Editorial debe incluir:

- título provisional;
- subtítulo;
- autor/pseudónimo/marca;
- promesa central;
- público objetivo;
- tono;
- voz narrativa;
- reglas de estilo;
- reglas de estructura;
- índice maestro;
- distribución de capítulos;
- distribución estimada de páginas;
- plantillas de capítulo;
- criterios de calidad;
- límites éticos;
- disclaimers necesarios;
- criterios de citas;
- reglas de no plagio;
- reglas para contenido IA;
- checklist editorial.

### Documento generado

```text
EDITORIAL_BIBLE.md
```

### Gate de aprobación

La fase queda aprobada cuando la Biblia Editorial permite que cualquier generación posterior mantenga coherencia, tono, estructura y límites.

---

## Fase 6 — Premium Visual Design Engine

### Objetivo
Asegurar que el eBook no sea solo texto, sino un producto visual premium.

### Funciones mínimas

Debe generar una Biblia Visual Premium que incluya:

- dirección de arte;
- estilo visual;
- paleta de colores;
- tipografías sugeridas;
- uso de márgenes;
- portada conceptual;
- contraportada si aplica;
- separadores de parte;
- aperturas de capítulo;
- recuadros visuales;
- tablas premium;
- láminas imprimibles;
- prompts de imagen;
- estilo de ilustraciones;
- proporción texto/imagen;
- criterios de legibilidad;
- mockups comerciales;
- checklist de consistencia visual;
- reglas para PDF premium;
- reglas para EPUB limpio;
- reglas para portada KDP/Gumroad/Shopify.

### Documento generado

```text
VISUAL_BIBLE.md
```

### Assets planificados

```text
COVER_FRONT
COVER_3D_MOCKUP
CHAPTER_OPENERS
PART_DIVIDERS
PREMIUM_TABLES
WORKSHEET_PAGES
BONUS_GUIDES
SOCIAL_PROMO_IMAGES
SALES_PAGE_IMAGES
```

### Gate de aprobación

La fase queda aprobada cuando el sistema puede generar una guía visual completa y una lista de assets necesarios para que el producto final tenga apariencia comercial premium.

---

## Fase 7 — Manuscript Planner

### Objetivo
Dividir el manuscrito en bloques controlados para evitar cortes, saltos o contenido incompleto.

### Funciones mínimas

- Crear estructura de partes.
- Crear capítulos.
- Crear bloques de generación.
- Definir objetivo de cada bloque.
- Definir restricciones de cada bloque.
- Definir continuidad editorial.
- Definir criterios de aprobación.

### Documento generado

```text
MANUSCRIPT_PLAN.md
```

### Gate de aprobación

La fase queda aprobada cuando el libro completo queda dividido en bloques generables, auditables y ensamblables.

---

## Fase 8 — Manuscript Generator

### Objetivo
Generar el manuscrito por bloques, no como una sola salida larga.

### Funciones mínimas

Por cada bloque debe generar:

- contenido del bloque;
- notas de diseño;
- control de continuidad;
- advertencias internas;
- checklist de calidad;
- estado del bloque.

### Estados del bloque

```text
PENDING
GENERATING
GENERATED
AUDIT_PENDING
APPROVED
APPROVED_WITH_FIXES
REJECTED
INTEGRATED
```

### Regla de seguridad editorial

Ningún bloque debe integrarse al manuscrito maestro sin auditoría.

### Gate de aprobación

La fase queda aprobada cuando el sistema puede generar, guardar, versionar y aprobar bloques sin mezclarlos con prompts o metatexto interno.

---

## Fase 9 — Editorial Auditor

### Objetivo
Revisar cada bloque y el manuscrito completo antes de exportar.

### Auditorías mínimas

- coherencia temática;
- continuidad entre capítulos;
- repeticiones;
- promesas exageradas;
- tono inconsistente;
- faltantes;
- metatexto accidental;
- errores de autor/pseudónimo;
- notas visuales mal ubicadas;
- secciones duplicadas;
- contradicciones;
- problemas legales;
- problemas de IA;
- contenido sensible;
- exceso de relleno;
- baja calidad visual planificada.

### Documentos generados

```text
BLOCK_AUDIT_REPORT.md
FULL_MANUSCRIPT_AUDIT.md
MISSING_CONTENT_REPORT.md
```

### Gate de aprobación

La fase queda aprobada cuando el sistema puede declarar:

```text
APPROVED
APPROVED_WITH_FIXES
REJECTED
```

con explicación clara y acciones correctivas.

---

## Fase 10 — Versioning and Recovery Engine

### Objetivo
Evitar el problema detectado en el proyecto de runas: entregas válidas dispersas, reconstrucciones parciales y pérdida de trazabilidad.

### Funciones mínimas

- Crear snapshots por bloque.
- Marcar fuente de cada sección.
- Comparar versiones.
- Detectar faltantes.
- Recuperar bloques aprobados.
- Reemplazar notas editoriales de faltante.
- Generar reporte de reconstrucción.

### Documentos generados

```text
VERSION_HISTORY.md
RECOVERY_REPORT.md
SOURCE_MAP.json
```

### Gate de aprobación

La fase queda aprobada cuando Cervantes puede reconstruir un manuscrito desde sus bloques aprobados sin inventar contenido.

---

## Fase 11 — Master Assembly Engine

### Objetivo
Unir todos los bloques aprobados en un manuscrito maestro limpio.

### Reglas de ensamblaje

Debe eliminar:

- prompts;
- aprobaciones;
- frases tipo “procedo con…”;
- controles editoriales internos;
- notas de auditoría no destinadas al lector;
- duplicaciones;
- placeholders no resueltos;
- informes internos;
- referencias a fases de producción;
- pseudónimos descartados.

Debe conservar:

- portada interna;
- página legal;
- dedicatoria;
- nota al lector;
- introducción;
- partes y capítulos;
- notas de diseño si el modo editorial las requiere;
- bibliografía;
- conclusión;
- estructura final aprobada.

### Archivos generados

```text
MANUSCRIPT_MASTER.md
MANUSCRIPT_MASTER_CLEAN.md
MANUSCRIPT_SOURCE_MAP.json
```

### Gate de aprobación

La fase queda aprobada cuando el manuscrito maestro puede leerse de inicio a fin sin metatexto interno ni faltantes visibles.

---

## Fase 12 — Format Builder

### Objetivo
Exportar el proyecto a formatos profesionales.

### Formatos mínimos

```text
PDF_PREMIUM
EPUB_REFLOWABLE
DOCX_EDITABLE
MARKDOWN_MASTER
PUBLICATION_ZIP
```

### PDF premium

Debe incluir:

- diseño editorial visual;
- portada;
- portadilla;
- índice;
- separadores;
- imágenes;
- recuadros;
- tablas premium;
- numeración;
- márgenes;
- estilos consistentes;
- exportación final.

### EPUB

Debe incluir:

- estructura semántica;
- tabla de contenidos;
- estilos limpios;
- imágenes optimizadas;
- metadata interna;
- validación técnica;
- ausencia de diseños demasiado rígidos si es reflowable.

### DOCX

Debe incluir:

- estilos de título;
- estilos de subtítulo;
- cuerpo limpio;
- notas de diseño separadas;
- índice si aplica;
- compatibilidad editorial.

### Gate de aprobación

La fase queda aprobada cuando los tres formatos principales se generan sin errores y pueden abrirse correctamente.

---

## Fase 13 — Metadata and Sales Package Generator

### Objetivo
Preparar todo lo necesario para vender o publicar.

### Salidas mínimas

```text
BOOK_METADATA.md
KDP_PUBLICATION_CHECKLIST.md
GUMROAD_PRODUCT_PAGE.md
SHOPIFY_PRODUCT_PACKAGE.md
DRAFT2DIGITAL_PACKAGE.md
SALES_PAGE_COPY.md
LAUNCH_PLAN.md
```

### Metadata mínima

- título;
- subtítulo;
- autor;
- descripción corta;
- descripción larga;
- categorías sugeridas;
- keywords;
- idioma;
- edad recomendada si aplica;
- disclaimers;
- declaración de IA;
- derechos de autor;
- precio sugerido;
- territorios;
- formatos incluidos;
- bonus;
- assets visuales.

### Gate de aprobación

La fase queda aprobada cuando el paquete de publicación permite subir el producto manualmente sin improvisar contenido comercial.

---

## Fase 14 — Publishing Assistant

### Objetivo
Asistir la publicación sin asumir automatización total en plataformas que no lo permiten o que exigen intervención manual.

### Niveles de publicación

```text
AUTOMATICA_REAL
SEMI_AUTOMATICA
ASISTIDA
PAQUETE_LISTO_PARA_PUBLICAR
GUIA_MANUAL
```

### Reglas por plataforma

#### Amazon KDP

Recomendación inicial: **publicación asistida/manual segura**.

Motivo:

- requiere revisión humana;
- exige metadata correcta;
- exige validación de contenido;
- exige revisión de portada;
- exige declaración de contenido generado por IA cuando corresponda;
- puede cambiar políticas;
- no debe automatizarse sin confirmar compatibilidad técnica y normativa.

#### Gumroad

Recomendación inicial: **semiautomática o asistida**.

Puede prepararse:

- página de producto;
- imágenes;
- precio;
- archivos;
- descripción;
- bonus;
- tags;
- checkout.

#### Shopify

Recomendación inicial: **semiautomática**.

Puede prepararse:

- producto digital;
- archivos descargables;
- descripción;
- imágenes;
- precio;
- entrega mediante app digital;
- página de ventas.

#### Draft2Digital

Recomendación inicial: **asistida**.

Puede prepararse:

- EPUB;
- DOCX;
- metadata;
- descripción;
- categorías;
- distribución;
- checklist.

### Gate de aprobación

La fase queda aprobada cuando Cervantes distingue claramente qué puede automatizarse, qué requiere autorización humana y qué debe hacerse manualmente.

---

# 4. MVP recomendado

## MVP 1 — Producto editorial estratégico

### Incluye

- creación de proyecto;
- wizard de idea;
- investigación inicial;
- Language Opportunity Engine básico;
- fórmula editorial;
- Biblia Editorial;
- Biblia Visual Premium;
- plan de manuscrito;
- documentos descargables `.md`.

### No incluye todavía

- generación completa del manuscrito;
- PDF final;
- EPUB;
- publicación;
- pagos;
- multiusuario avanzado.

### Definición de terminado MVP 1

El MVP 1 está terminado cuando el usuario puede ingresar una idea simple y recibir un paquete estratégico completo que indique si conviene avanzar, cómo debe estructurarse el eBook, en qué idioma conviene comenzar y qué estándar visual debe cumplir.

---

## MVP 2 — Generación de manuscrito por bloques

### Incluye

- generación por bloques;
- auditoría por bloque;
- estados de bloque;
- versionado;
- recuperación de faltantes;
- ensamblaje maestro en `.md`.

### No incluye todavía

- PDF premium final;
- EPUB final;
- publicación en plataformas.

### Definición de terminado MVP 2

El MVP 2 está terminado cuando Cervantes puede producir un manuscrito completo, limpio, auditable y reconstruible desde bloques aprobados.

---

## MVP 3 — Diseño premium y exportación

### Incluye

- generación de guía visual;
- prompts de imágenes;
- portada conceptual;
- láminas internas;
- PDF premium;
- EPUB limpio;
- DOCX editable;
- validación de formatos.

### Definición de terminado MVP 3

El MVP 3 está terminado cuando Cervantes puede entregar un paquete visual y editorial descargable que se pueda revisar y preparar para venta.

---

## MVP 4 — Paquete comercial y publicación asistida

### Incluye

- metadata;
- descripción comercial;
- keywords;
- categorías sugeridas;
- estrategia de precio;
- checklist KDP;
- paquete Gumroad;
- paquete Shopify;
- paquete Draft2Digital;
- declaración IA;
- checklist legal;
- guía paso a paso.

### Definición de terminado MVP 4

El MVP 4 está terminado cuando el usuario puede publicar manualmente o semiautomáticamente usando los archivos, textos, imágenes y checklists generados por Cervantes.

---

# 5. Definición general de software terminado

Cervantes se considera terminado y operativo cuando cumple todos los criterios siguientes.

## 5.1 Criterios funcionales

Debe permitir:

- crear proyecto;
- responder preguntas iniciales;
- investigar nicho;
- evaluar idiomas;
- proponer fórmula editorial;
- generar Biblia Editorial;
- generar Biblia Visual Premium;
- planificar manuscrito;
- generar bloques;
- auditar bloques;
- ensamblar manuscrito;
- recuperar faltantes;
- exportar formatos;
- generar paquete de venta;
- preparar publicación asistida.

## 5.2 Criterios editoriales

Debe verificar:

- coherencia;
- tono;
- estructura;
- extensión;
- promesa comercial;
- ausencia de relleno;
- ausencia de metatexto;
- calidad de capítulos;
- integridad del manuscrito;
- bibliografía si aplica;
- disclaimers si aplica.

## 5.3 Criterios visuales

Debe verificar:

- portada;
- paleta;
- tipografías;
- separación de partes;
- jerarquía visual;
- tablas;
- recuadros;
- láminas;
- legibilidad;
- consistencia;
- exportación correcta.

## 5.4 Criterios técnicos

Debe contar con:

- autenticación;
- persistencia de datos;
- almacenamiento de archivos;
- cola de trabajos si hay tareas largas;
- logs;
- manejo de errores;
- versionado;
- backups;
- tests;
- validación de formatos;
- documentación;
- scripts de instalación;
- despliegue reproducible.

## 5.5 Criterios de compliance

Debe validar:

- derechos de autor;
- plagio;
- uso de IA;
- contenido sensible;
- claims exagerados;
- disclaimers;
- licencias de imágenes;
- metadata no engañosa;
- reglas por plataforma;
- límites de automatización.

## 5.6 Criterios comerciales

Debe generar:

- propuesta de valor;
- descripción de venta;
- keywords;
- categorías;
- precio sugerido;
- bonus;
- mockups;
- estrategia de lanzamiento;
- checklist de publicación.

---

# 6. GO / NO-GO final

## GO para desarrollo inicial

Cervantes puede comenzar implementación si:

- existen los documentos `01` a `05` en `docs/`;
- está definido el stack;
- se acepta construir por MVPs;
- se acepta que KDP sea publicación asistida al inicio;
- se acepta que el diseño gráfico premium sea parte obligatoria;
- se acepta que los idiomas sean determinados por análisis de oportunidad;
- se acepta que el sistema no prometa bestseller garantizado.

## NO-GO para publicación automática completa inicial

No debe intentarse publicación automática total desde la primera versión si:

- no hay API confirmada;
- la plataforma exige revisión humana;
- falta declaración IA;
- falta validación legal;
- faltan derechos de imágenes;
- el EPUB no está validado;
- la metadata no está revisada;
- la portada no cumple estándares;
- no hay autorización explícita del usuario.

---

# 7. Roadmap técnico sugerido

## Sprint 1 — Base del producto

- Configurar repo.
- Crear frontend.
- Crear backend.
- Crear base de datos.
- Crear autenticación.
- Crear modelo Project.
- Crear dashboard inicial.

## Sprint 2 — Wizard de proyecto

- Crear flujo de idea.
- Crear preguntas.
- Guardar brief.
- Crear estados.
- Crear vista de proyecto.

## Sprint 3 — Investigación y fórmula

- Integrar agente de investigación.
- Generar informe.
- Generar GO/NO-GO.
- Generar fórmula editorial.
- Generar selección de idiomas.

## Sprint 4 — Biblia Editorial y Visual

- Generar Biblia Editorial.
- Generar Biblia Visual Premium.
- Crear vista de documentos.
- Permitir edición manual.

## Sprint 5 — Plan de manuscrito

- Crear partes.
- Crear capítulos.
- Crear bloques.
- Crear estados de bloque.
- Crear source map.

## Sprint 6 — Generación por bloques

- Generar bloque.
- Auditar bloque.
- Aprobar bloque.
- Reintentar bloque.
- Versionar bloque.

## Sprint 7 — Ensamblaje maestro

- Unir bloques aprobados.
- Limpiar metatexto.
- Detectar faltantes.
- Generar manuscrito `.md`.
- Generar reporte de integridad.

## Sprint 8 — Exportación

- Exportar DOCX.
- Exportar PDF básico.
- Exportar EPUB básico.
- Validar archivos.
- Guardar paquete ZIP.

## Sprint 9 — Diseño premium

- Aplicar estilos visuales.
- Generar portada conceptual.
- Generar separadores.
- Generar láminas.
- Exportar PDF premium.

## Sprint 10 — Paquete comercial

- Generar metadata.
- Generar descripción.
- Generar keywords.
- Generar checklist KDP.
- Generar paquete Gumroad.
- Generar paquete Shopify.
- Generar paquete Draft2Digital.

---

# 8. Matriz de pruebas

## Pruebas unitarias

- creación de proyecto;
- estados;
- generación de documentos;
- limpieza de metatexto;
- validación de placeholders;
- detección de faltantes;
- exportadores.

## Pruebas de integración

- idea → brief;
- brief → investigación;
- investigación → fórmula;
- fórmula → Biblia Editorial;
- Biblia → plan;
- plan → bloques;
- bloques → ensamblaje;
- ensamblaje → exportación.

## Pruebas de producto

Caso demo obligatorio:

```text
Idea: Crear un eBook premium sobre runas para principiantes.
```

El sistema debe entregar:

- informe de mercado;
- fórmula editorial;
- Biblia Editorial;
- Biblia Visual;
- manuscrito por bloques;
- auditoría;
- PDF/EPUB/DOCX;
- paquete de publicación.

## Pruebas de compliance

- contenido IA declarado;
- derechos de imagen revisados;
- metadata no engañosa;
- disclaimers presentes;
- no prometer bestseller garantizado;
- no publicar sin autorización.

---

# 9. Riesgos principales

## Riesgo 1 — Generar libros superficiales

Mitigación:

- investigación obligatoria;
- Biblia Editorial;
- auditoría;
- generación por bloques;
- revisión de profundidad.

## Riesgo 2 — Diseño visual pobre

Mitigación:

- Premium Visual Design Engine obligatorio;
- checklist visual;
- assets premium;
- revisión PDF.

## Riesgo 3 — Publicación automática riesgosa

Mitigación:

- KDP asistido al inicio;
- autorización humana;
- compliance por plataforma;
- logs.

## Riesgo 4 — Contenido IA no declarado

Mitigación:

- registro de uso de IA;
- declaración por proyecto;
- checklist antes de publicar.

## Riesgo 5 — Pérdida de contenido o versiones

Mitigación:

- Versioning and Recovery Engine;
- source maps;
- snapshots;
- reportes de faltantes.

## Riesgo 6 — Idioma incorrecto para el mercado

Mitigación:

- Language Opportunity Engine;
- análisis por plataforma;
- localización editorial, no traducción literal.

---

# 10. Criterio final de aceptación

Cervantes alcanza estado **GO OPERATIVO** cuando puede completar exitosamente este flujo:

```text
Idea simple
→ preguntas de clarificación
→ investigación de mercado
→ selección de idioma óptimo
→ fórmula editorial
→ Biblia Editorial
→ Biblia Visual Premium
→ plan de manuscrito
→ generación por bloques
→ auditoría
→ recuperación de faltantes
→ ensamblaje maestro
→ PDF premium
→ EPUB limpio
→ DOCX editable
→ metadata
→ paquete de publicación
→ checklist de publicación asistida
```

Sin:

- errores críticos;
- pérdida de contenido;
- metatexto interno en el manuscrito;
- faltantes no declarados;
- promesas comerciales engañosas;
- publicación automática no autorizada;
- omisión de diseño gráfico premium;
- omisión de declaración IA cuando corresponda.

---

# 11. Conclusión

El roadmap correcto para Cervantes es incremental, verificable y orientado a calidad.

La aplicación debe desarrollarse como una fábrica editorial premium con controles de investigación, escritura, diseño, compliance, formatos y publicación. El valor competitivo no estará solo en generar texto, sino en crear un sistema que piense como editor, diseñador, investigador, auditor y asistente de publicación.

Cervantes debe entregar productos editoriales listos para competir visual y comercialmente, pero sin prometer resultados imposibles ni saltarse las políticas de las plataformas.

La definición final es clara:

> Cervantes estará terminado cuando pueda producir, auditar, diseñar, exportar y preparar para publicación un eBook premium completo desde una idea simple, manteniendo trazabilidad, calidad visual, control editorial, compliance y autorización humana en los puntos críticos.

---

# 12. Fuentes normativas y técnicas a revalidar antes de implementación

Estas fuentes deben revisarse de nuevo antes de programar conectores o publicar productos reales, porque las políticas de plataformas pueden cambiar:

1. Amazon KDP — Formatos soportados para manuscritos de eBook.
2. Amazon KDP — Content Guidelines y política de contenido generado/asistido por IA.
3. Shopify Help Center — Digital Downloads.
4. W3C — EPUB 3.3.
5. Draft2Digital — Knowledge Base sobre formatos de manuscrito y distribución.
6. Gumroad — documentación de productos digitales y API si se automatiza publicación.

