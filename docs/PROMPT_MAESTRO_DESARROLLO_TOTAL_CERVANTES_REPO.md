# PROMPT MAESTRO DEFINITIVO — DESARROLLO TOTAL DE CERVANTES SOBRE REPOSITORIO GITHUB

## 0. Identidad del encargo

Actúa como un equipo completo de desarrollo senior compuesto por:

- CTO full-stack senior.
- Arquitecto de software.
- Product manager senior.
- Especialista en aplicaciones editoriales.
- Especialista en generación de eBooks.
- Especialista en PDF premium.
- Especialista en EPUB/DOCX.
- Especialista en diseño editorial premium.
- Especialista en UX/UI.
- Especialista en automatización con IA.
- Especialista en investigación de mercado editorial.
- Especialista en Amazon KDP.
- Especialista en Gumroad.
- Especialista en Shopify Digital Downloads.
- Especialista en Draft2Digital.
- Especialista en testing.
- Especialista en seguridad local.
- Especialista en documentación técnica.

Tu tarea es desarrollar **la aplicación completa Cervantes**, sobre el repositorio oficial:

```text
https://github.com/GodinesCrazy/Cervantes.git
```

La aplicación debe quedar **funcional, operativa, probada, documentada y lista para uso real**.

---

## 1. Contexto del proyecto

El proyecto se llama:

```text
Cervantes
```

Ruta local esperada:

```text
C:/Cervantes
```

Repositorio oficial:

```text
https://github.com/GodinesCrazy/Cervantes.git
```

Cervantes es una aplicación privada, **mono-usuario**, diseñada exclusivamente para el uso personal de Iván Marty.

No es un SaaS multiusuario.

No debe diseñarse como plataforma pública.

No debe incluir registro de usuarios externos, planes de suscripción, paneles de administración multiusuario, billing SaaS ni onboarding público.

El objetivo principal es:

```text
Crear una aplicación personal capaz de transformar una idea simple de eBook en un producto editorial completo, premium, comercialmente competitivo y listo para venderse/publicarse con enfoque de rentabilidad personal.
```

Ejemplo de entrada:

```text
Quiero crear un eBook premium sobre runas para principiantes.
```

Salida esperada:

```text
Investigación de mercado
+ selección de idioma comercial óptimo
+ fórmula editorial rentable
+ biblia editorial
+ biblia visual premium
+ estructura completa
+ manuscrito por bloques
+ auditoría editorial
+ recuperación de faltantes
+ diseño gráfico del eBook
+ portada
+ prompts visuales
+ workbook/bonus
+ PDF premium
+ DOCX editable
+ EPUB compatible
+ metadata comercial
+ descripción de venta
+ keywords
+ checklist de publicación
+ paquete ZIP listo para publicar/vender
```

---

## 2. Regla absoluta: trabajar sobre el repositorio oficial

Debes desarrollar la aplicación directamente sobre el repositorio:

```text
https://github.com/GodinesCrazy/Cervantes.git
```

Procedimiento obligatorio:

1. Verificar si existe la carpeta local:

```text
C:/Cervantes
```

2. Si existe, entrar a esa carpeta y verificar que sea el repositorio correcto:

```text
git remote -v
```

Debe apuntar a:

```text
https://github.com/GodinesCrazy/Cervantes.git
```

3. Si no existe, clonar el repositorio:

```text
git clone https://github.com/GodinesCrazy/Cervantes.git C:/Cervantes
```

4. Trabajar siempre dentro de:

```text
C:/Cervantes
```

5. Antes de modificar, auditar el estado actual:

```text
git status
```

6. No borrar archivos existentes sin justificarlo.

7. No sobrescribir documentación importante.

8. Si el repositorio ya tiene stack definido, respetarlo.

9. Si el repositorio está vacío o incompleto, crear una arquitectura profesional adecuada para una aplicación mono-usuario.

10. Al finalizar, dejar el repositorio con:

```text
git status
```

limpio o con un resumen exacto de los archivos modificados.

---

## 3. Documentos base obligatorios

Antes de programar, debes leer y respetar los documentos de investigación ubicados en:

```text
C:/Cervantes/docs/
```

Documentos esperados:

```text
01_INVESTIGACION_PROFUNDA_MERCADO_EBOOKS_2026.md
02_PLATAFORMAS_FORMATOS_COMPLIANCE.md
03_FLUJO_EDITORIAL_VALIDADO_RUNAS_A_CERVANTES.md
04_ESPECIFICACION_PRODUCTO_CERVANTES.md
05_ROADMAP_MVP_Y_DEFINICION_DE_TERMINADO.md
```

También debes considerar cualquier archivo adicional ubicado en:

```text
C:/Cervantes/prompts/
C:/Cervantes/docs/
```

Si alguno de estos documentos no existe, debes:

1. reportarlo en un archivo de auditoría;
2. crear el directorio correspondiente si falta;
3. continuar con una implementación razonable basada en este prompt;
4. no detener el desarrollo salvo que sea imposible compilar o ejecutar.

---

## 4. Objetivo funcional principal

La aplicación Cervantes debe permitir ejecutar un flujo completo:

```text
Idea simple
→ preguntas inteligentes de clarificación
→ investigación de mercado
→ análisis de nicho
→ análisis de competencia
→ selección de idioma(s) con mayor potencial comercial
→ GO / NO-GO editorial
→ fórmula comercial ganadora
→ biblia editorial
→ biblia visual premium
→ índice maestro
→ planificación de capítulos
→ redacción por bloques
→ auditoría por bloque
→ control de faltantes
→ recuperación/reconstrucción
→ ensamblaje maestro
→ corrección editorial
→ generación de portada y assets visuales
→ generación de PDF premium
→ generación de DOCX editable
→ generación de EPUB compatible
→ generación de workbook/bonus
→ metadata comercial
→ descripción de venta
→ keywords
→ categorías sugeridas
→ estrategia de precio
→ checklist de publicación
→ paquete ZIP listo para publicar/vender
```

---

## 5. Enfoque de rentabilidad personal

La aplicación debe estar optimizada para generar rentabilidad personal para Iván Marty.

Esto significa que cada proyecto de eBook debe analizar:

- Potencial comercial del nicho.
- Demanda.
- Competencia.
- Diferenciación.
- Precio recomendado.
- Plataformas recomendadas.
- Idioma(s) con mayor probabilidad de venta.
- Tipo de producto más rentable.
- Posibilidad de bundle.
- Posibilidad de workbook.
- Posibilidad de guía rápida.
- Posibilidad de versión premium ilustrada.
- Posibilidad de venta directa en Gumroad/Shopify.
- Posibilidad de publicación asistida en Amazon KDP.
- Posibilidad de distribución por Draft2Digital.
- Riesgos de saturación.
- Riesgos legales o de compliance.
- Tiempo estimado de producción.
- Complejidad visual.
- Score de oportunidad.

Debe existir un resultado claro:

```text
GO
GO CONDICIONAL
NO-GO
```

La app no debe prometer “best seller garantizado”.  
Debe prometer generación de un producto editorial competitivo, premium y comercialmente orientado.

---

## 6. Tipo de aplicación

Como es mono-usuario, prioriza una arquitectura simple, robusta y local-first.

Puedes elegir la mejor arquitectura según el estado del repositorio, pero se recomienda una de estas opciones:

### Opción preferida si el repositorio está vacío o no tiene stack sólido

Aplicación web local full-stack:

```text
Frontend: React + TypeScript + Vite
Backend: Node.js + Express + TypeScript
Base de datos: SQLite local con Prisma
Cola interna: BullMQ solo si realmente es necesario; si no, jobs simples persistidos en DB
Exportación: Markdown, DOCX, PDF, EPUB, ZIP
Almacenamiento: filesystem local en /storage
```

### Alternativa si conviene app de escritorio

```text
Electron + React + TypeScript
SQLite local
Filesystem local
Exportadores integrados
```

### Regla

No sobredimensionar.  
No crear infraestructura SaaS innecesaria.  
No agregar multiusuario.  
No agregar pagos.  
No agregar cloud obligatorio.

---

## 7. Estructura recomendada del proyecto

Si el repositorio no tiene estructura clara, crear:

```text
C:/Cervantes
├─ README.md
├─ package.json
├─ .env.example
├─ docs/
│  ├─ 01_INVESTIGACION_PROFUNDA_MERCADO_EBOOKS_2026.md
│  ├─ 02_PLATAFORMAS_FORMATOS_COMPLIANCE.md
│  ├─ 03_FLUJO_EDITORIAL_VALIDADO_RUNAS_A_CERVANTES.md
│  ├─ 04_ESPECIFICACION_PRODUCTO_CERVANTES.md
│  ├─ 05_ROADMAP_MVP_Y_DEFINICION_DE_TERMINADO.md
│  ├─ DEVELOPMENT_REPORT.md
│  ├─ TEST_REPORT.md
│  └─ USER_GUIDE.md
├─ apps/
│  ├─ frontend/
│  └─ backend/
├─ packages/
│  ├─ shared/
│  ├─ exporters/
│  ├─ prompt-engine/
│  ├─ visual-engine/
│  └─ compliance-engine/
├─ prisma/
│  └─ schema.prisma
├─ storage/
│  ├─ projects/
│  ├─ exports/
│  ├─ covers/
│  ├─ assets/
│  └─ backups/
└─ scripts/
   ├─ dev.*
   ├─ build.*
   ├─ test.*
   └─ export-demo.*
```

Si eliges otra estructura, justificarla en:

```text
docs/DEVELOPMENT_REPORT.md
```

---

## 8. Módulos obligatorios de Cervantes

Debes implementar los siguientes módulos como parte real del producto.

### 8.1 Idea Intake Engine

Debe permitir ingresar una idea simple de eBook y transformarla en un proyecto.

Debe capturar:

- idea base;
- tema;
- audiencia;
- nivel del lector;
- objetivo comercial;
- tono deseado;
- plataformas objetivo;
- idioma base preferido;
- si se permite IA generativa;
- si se desea PDF premium;
- si se desea EPUB;
- si se desea DOCX;
- si se desea workbook;
- si se desea guía rápida;
- si se desea publicación asistida.

Debe generar preguntas inteligentes antes de avanzar.

---

### 8.2 Market Research Engine

Debe permitir registrar o generar investigación de mercado.

Como mínimo debe manejar:

- nicho;
- subnicho;
- audiencia;
- dolor/deseo del lector;
- competidores;
- precios;
- cantidad de reseñas;
- formatos;
- extensión aproximada;
- promesas comerciales;
- portadas observadas;
- keywords;
- idioma;
- oportunidad;
- riesgo;
- score final.

Si no existe API externa configurada, debe funcionar con investigación manual asistida y plantillas estructuradas.

---

### 8.3 Language Opportunity Engine

Módulo obligatorio.

La aplicación debe determinar en qué idioma(s) conviene producir el eBook según rentabilidad probable.

Debe analizar:

- idioma del mercado objetivo;
- tamaño del mercado;
- poder adquisitivo;
- competencia;
- saturación;
- facilidad de posicionamiento;
- plataformas recomendadas;
- necesidad de localización cultural;
- keywords por idioma;
- precio esperado por idioma;
- esfuerzo de traducción/localización;
- riesgo de baja conversión.

Debe generar una recomendación como:

```text
Idioma principal recomendado: Inglés internacional
Idioma secundario recomendado: Español neutro
Motivo: mayor mercado KDP/Gumroad en inglés, pero ventaja del autor en producción inicial en español.
Estrategia: crear primero español premium, luego versión localizada en inglés si el score supera 75/100.
```

No debe traducir automáticamente todo sin una fase de localización.

Debe distinguir entre:

```text
traducción literal
localización editorial
adaptación comercial
adaptación de keywords
adaptación de portada
adaptación de metadata
```

---

### 8.4 Editorial Formula Engine

Debe definir la fórmula comercial del producto.

Opciones:

- eBook simple;
- eBook premium ilustrado;
- eBook + workbook;
- eBook + guía rápida;
- eBook + plantillas;
- bundle completo;
- preventa;
- edición PDF premium;
- edición EPUB limpia;
- edición DOCX editable;
- versión para KDP;
- versión para Gumroad;
- versión para Shopify.

Debe recomendar una fórmula final.

Ejemplo:

```text
Producto recomendado:
eBook premium ilustrado + workbook + guía rápida visual.

Motivo:
Aumenta valor percibido, permite precio superior en venta directa y mantiene EPUB más limpio para KDP.
```

---

### 8.5 Editorial Bible Generator

Debe generar una Biblia Editorial completa del eBook:

- título;
- subtítulo;
- promesa central;
- audiencia;
- tono;
- estilo;
- estructura;
- índice;
- extensión;
- reglas de contenido;
- reglas de claims;
- reglas éticas;
- plantillas de capítulo;
- plantillas de ejercicios;
- criterios de calidad;
- checklist de aprobación.

---

### 8.6 Premium Visual Design Engine

Módulo obligatorio.

Cervantes debe considerar el diseño gráfico como parte central del producto, no como adorno final.

Debe generar una **Biblia Visual Premium** con:

- concepto visual;
- dirección de arte;
- paleta de colores;
- tipografías sugeridas;
- estilo de portada;
- estilo de contraportada;
- estilo de separadores;
- estilo de láminas;
- estilo de tablas;
- estilo de recuadros;
- estilo de iconografía;
- prompts de imágenes;
- assets requeridos;
- checklist visual;
- criterios de exportación.

Debe producir instrucciones para:

- portada KDP;
- portada Gumroad;
- portada Shopify;
- mockups;
- banners;
- miniaturas;
- láminas internas;
- guía rápida visual;
- workbook;
- recursos promocionales.

El objetivo visual debe ser:

```text
eBook premium, vendible, profesional, de alta percepción de valor, no genérico.
```

Debe validar:

- coherencia visual;
- legibilidad;
- contraste;
- jerarquía;
- consistencia;
- estilo comercial;
- compatibilidad PDF;
- compatibilidad EPUB;
- assets faltantes;
- imágenes con derechos adecuados.

---

### 8.7 Manuscript Planner

Debe dividir el libro en:

- partes;
- capítulos;
- bloques;
- entregas;
- objetivos por bloque;
- extensión estimada;
- dependencias;
- criterios de aprobación;
- estado.

Estados sugeridos:

```text
PENDING
GENERATING
GENERATED
UNDER_REVIEW
APPROVED
APPROVED_WITH_FIXES
NEEDS_RECOVERY
RECOVERED
FINAL
```

---

### 8.8 Manuscript Generator

Debe generar el manuscrito por bloques.

No debe generar un libro completo de una sola vez.

Debe permitir:

- generar bloque;
- regenerar bloque;
- aprobar bloque;
- comentar bloque;
- marcar faltantes;
- versionar bloque;
- exportar bloque;
- comparar versiones.

Debe conservar historial.

---

### 8.9 Editorial Auditor

Debe auditar:

- coherencia;
- tono;
- estructura;
- repeticiones;
- faltantes;
- contradicciones;
- promesa editorial;
- cumplimiento de la Biblia Editorial;
- cumplimiento de la Biblia Visual;
- claims riesgosos;
- errores de formato;
- metatexto interno;
- prompts filtrados;
- placeholders;
- citas o fuentes faltantes.

Debe generar informes:

```text
audit_report.md
missing_sections_report.md
editorial_quality_report.md
visual_quality_report.md
compliance_report.md
```

---

### 8.10 Recovery & Assembly Engine

Este módulo es esencial porque el proyecto Runas demostró que los manuscritos largos pueden quedar repartidos en bloques, respuestas parciales o archivos incompletos.

Debe permitir:

- detectar faltantes;
- comparar bloques;
- identificar mejor fuente disponible;
- recuperar contenido;
- reemplazar notas editoriales;
- ensamblar manuscrito maestro;
- eliminar metatexto;
- eliminar prompts;
- eliminar controles internos;
- conservar solo contenido final;
- generar informe de reconstrucción.

Debe impedir marcar como “maquetable” un manuscrito incompleto.

---

### 8.11 Format Builder

Debe generar:

```text
.md
.docx
.pdf
.epub
.zip
```

Requisitos:

- Markdown como formato maestro editable.
- DOCX para revisión/manual.
- PDF premium para venta directa.
- EPUB reflowable para KDP/Draft2Digital.
- ZIP con paquete completo de publicación.

El PDF premium debe considerar:

- portada;
- portadilla;
- página legal;
- índice;
- jerarquía tipográfica;
- notas de diseño;
- láminas;
- tablas;
- recuadros;
- imágenes;
- numeración;
- márgenes;
- exportación limpia.

El EPUB debe ser más limpio y compatible:

- sin maquetación pesada incompatible;
- imágenes optimizadas;
- tabla de contenidos;
- metadata;
- validación básica.

---

### 8.12 Metadata & Sales Package Generator

Debe generar:

- título comercial;
- subtítulo;
- descripción larga;
- descripción corta;
- bullets de venta;
- keywords;
- categorías sugeridas;
- precio recomendado;
- estrategia de lanzamiento;
- ficha KDP;
- ficha Gumroad;
- ficha Shopify;
- ficha Draft2Digital;
- copy promocional;
- texto de preventa;
- lista de assets requeridos.

---

### 8.13 Publishing Assistant

Debe distinguir claramente:

```text
Publicación automática real
Publicación asistida
Paquete listo para publicar
Guía manual paso a paso
```

No asumir publicación automática en KDP.

KDP debe quedar como:

```text
Publicación asistida/manual segura.
```

Gumroad/Shopify pueden tener mayor automatización si se implementan integraciones o si el usuario entrega credenciales, pero para MVP pueden quedar como paquete listo + guía.

Draft2Digital debe quedar como distribución asistida o checklist.

---

## 9. Reglas de compliance

La aplicación debe incluir validaciones para:

- contenido generado por IA;
- contenido asistido por IA;
- derechos de autor;
- plagio;
- uso de imágenes;
- prompts visuales;
- fuentes;
- claims médicos;
- claims financieros;
- claims legales;
- promesas exageradas;
- promesas de “best seller garantizado”;
- metadata engañosa;
- contenido sensible;
- contenido espiritual/esotérico presentado como certeza absoluta;
- privacidad;
- términos de plataforma.

Debe generar un checklist final antes de exportar.

---

## 10. Reglas sobre IA generativa

Cervantes puede usar IA para:

- investigar;
- estructurar;
- redactar;
- auditar;
- resumir;
- generar prompts visuales;
- crear metadata;
- traducir/localizar bajo revisión.

Pero debe marcar si el contenido es:

```text
IA generada
IA asistida
humana
mixta
```

Debe dejar advertencias para plataformas que exijan declaración de contenido IA.

---

## 11. Funcionalidades mínimas del MVP operativo

El MVP final debe permitir, desde la interfaz:

1. Crear nuevo proyecto de eBook.
2. Ingresar una idea simple.
3. Responder preguntas de clarificación.
4. Generar o registrar investigación de mercado.
5. Calcular score GO / NO-GO.
6. Recomendar idioma(s) comerciales.
7. Generar fórmula editorial.
8. Generar Biblia Editorial.
9. Generar Biblia Visual Premium.
10. Generar índice maestro.
11. Crear bloques de manuscrito.
12. Generar contenido por bloque.
13. Auditar bloque.
14. Aprobar bloque.
15. Detectar faltantes.
16. Ensamblar manuscrito maestro.
17. Crear portada conceptual o prompts de portada.
18. Generar assets visuales como prompts o placeholders.
19. Exportar Markdown.
20. Exportar DOCX.
21. Exportar PDF.
22. Exportar EPUB.
23. Generar metadata comercial.
24. Generar checklist de publicación.
25. Generar ZIP final.
26. Ver historial del proyecto.
27. Guardar todo localmente.

---

## 12. Interfaz UX/UI obligatoria

Crear pantallas claras:

```text
Dashboard
Nuevo Proyecto
Wizard de Idea
Investigación de Mercado
Análisis de Idiomas
GO / NO-GO
Fórmula Editorial
Biblia Editorial
Biblia Visual Premium
Índice Maestro
Bloques del Manuscrito
Editor de Bloque
Auditoría
Faltantes y Recuperación
Diseño Visual
Formatos y Exportación
Metadata Comercial
Paquete de Publicación
Historial / Versiones
Configuración
```

Diseño visual de la app:

- limpio;
- profesional;
- oscuro o claro sobrio;
- orientado a productividad;
- con estados claros;
- sin exceso decorativo;
- con dashboards visuales;
- con botones de acción evidentes;
- con progreso por fases.

---

## 13. Modelo de datos mínimo

Diseñar base de datos con entidades similares a:

```text
Project
EbookIdea
ClarificationAnswer
MarketResearchReport
CompetitorBook
LanguageOpportunity
EditorialFormula
EditorialBible
VisualBible
ChapterPlan
ManuscriptBlock
AuditReport
RecoveryReport
VisualAsset
FormatBuild
MetadataPackage
PublishingChecklist
VersionSnapshot
ExportPackage
AppSettings
```

Debe haber persistencia local real.

---

## 14. Exportaciones requeridas

Cada proyecto debe poder exportarse a:

```text
/storage/exports/{projectSlug}/
```

Con estructura:

```text
project-name/
├─ manuscript/
│  ├─ manuscript_master.md
│  ├─ manuscript_master.docx
│  ├─ manuscript_master.pdf
│  └─ manuscript_master.epub
├─ visual/
│  ├─ cover_prompt.md
│  ├─ visual_bible.md
│  ├─ asset_list.md
│  └─ mockup_prompts.md
├─ commercial/
│  ├─ metadata_kdp.md
│  ├─ metadata_gumroad.md
│  ├─ metadata_shopify.md
│  ├─ keywords.md
│  ├─ pricing_strategy.md
│  └─ sales_page.md
├─ compliance/
│  ├─ ai_content_declaration.md
│  ├─ copyright_checklist.md
│  ├─ platform_checklist.md
│  └─ risk_report.md
├─ workbook/
│  ├─ workbook.md
│  └─ workbook.pdf
└─ publication_package.zip
```

---

## 15. Integración con modelos IA

La app debe estar preparada para usar proveedores IA configurables.

Debe permitir configurar por `.env`:

```text
OPENAI_API_KEY=
AI_PROVIDER=openai
AI_MODEL=
```

No hardcodear claves.

Si no hay API key, la app debe permitir modo manual/plantilla, no romperse.

Debe existir un servicio abstracto:

```text
AIService
```

Capaz de:

- generar texto;
- resumir;
- auditar;
- generar prompts visuales;
- generar metadata;
- generar checklist.

---

## 16. Testing obligatorio

Debes dejar pruebas funcionales o scripts verificables.

Como mínimo:

```text
npm install
npm run dev
npm run build
npm run test
```

Si usas otros comandos, documentarlos.

Crear:

```text
docs/TEST_REPORT.md
```

Debe indicar:

- qué se probó;
- qué funciona;
- qué queda pendiente;
- cómo ejecutar;
- errores encontrados;
- correcciones aplicadas.

---

## 17. Documentación obligatoria

Crear o actualizar:

```text
README.md
docs/DEVELOPMENT_REPORT.md
docs/USER_GUIDE.md
docs/TEST_REPORT.md
docs/PRODUCTION_READINESS_REPORT.md
```

La documentación debe explicar:

- cómo instalar;
- cómo ejecutar;
- cómo configurar IA;
- cómo crear proyecto;
- cómo generar un eBook;
- cómo exportar;
- cómo encontrar archivos;
- limitaciones;
- qué es publicación asistida;
- qué no se automatiza todavía.

---

## 18. Criterios de terminado

No consideres el desarrollo terminado hasta cumplir:

### Funcional

- La app abre correctamente.
- Se puede crear un proyecto.
- Se puede ingresar una idea.
- Se puede avanzar por el pipeline.
- Se pueden generar documentos base.
- Se pueden generar bloques.
- Se puede auditar.
- Se puede ensamblar.
- Se puede exportar.
- Se puede generar paquete final.

### Técnico

- Sin errores de compilación.
- Sin imports rotos.
- Sin rutas inexistentes.
- Sin claves hardcodeadas.
- Sin dependencias innecesarias.
- Persistencia funcionando.
- Exportadores funcionando.

### Editorial

- Biblia Editorial generada.
- Biblia Visual generada.
- Manuscrito por bloques.
- Auditoría editorial.
- Detección de faltantes.
- Ensamblaje maestro.

### Visual

- Premium Visual Design Engine disponible.
- Portada/prompt de portada generado.
- Paleta y tipografías sugeridas.
- Láminas y assets definidos.
- Checklist visual.

### Comercial

- Metadata generada.
- Keywords generadas.
- Precio recomendado.
- Plataformas recomendadas.
- Estrategia de venta.
- Idioma recomendado por oportunidad.

### Compliance

- IA declarable.
- Derechos revisables.
- Claims revisados.
- Checklist de plataforma.
- Diferencia clara entre publicación automática/asistida/manual.

---

## 19. Restricciones estrictas

No hacer:

- No convertirlo en SaaS.
- No agregar usuarios externos.
- No agregar pagos.
- No agregar Stripe.
- No agregar suscripciones.
- No crear landing pública como prioridad.
- No prometer best seller garantizado.
- No asumir que KDP puede automatizarse completamente.
- No hardcodear API keys.
- No borrar docs de investigación.
- No eliminar historial útil.
- No dejar código roto.
- No entregar solo prototipo visual.
- No entregar solo documentación.
- No terminar sin pruebas.
- No dejar placeholders críticos sin declarar.

---

## 20. Fases de trabajo obligatorias

Debes trabajar en este orden:

### FASE A — Auditoría inicial del repositorio

- Revisar estructura.
- Identificar stack.
- Identificar faltantes.
- Crear reporte.

Salida:

```text
docs/DEVELOPMENT_REPORT.md
```

### FASE B — Arquitectura y setup

- Instalar dependencias.
- Crear estructura.
- Configurar base de datos.
- Configurar backend/frontend.
- Configurar scripts.

### FASE C — Modelo de datos

- Crear schema.
- Migraciones.
- Persistencia local.

### FASE D — Backend/API

- Proyectos.
- Ideas.
- Investigación.
- Fórmula.
- Biblia editorial.
- Biblia visual.
- Bloques.
- Auditorías.
- Exportaciones.
- Configuración.

### FASE E — Frontend

- Dashboard.
- Wizard.
- Pantallas de módulos.
- Editor.
- Exportador.
- Reportes.

### FASE F — Motores internos

- Idea Intake Engine.
- Market Research Engine.
- Language Opportunity Engine.
- Editorial Formula Engine.
- Editorial Bible Generator.
- Premium Visual Design Engine.
- Manuscript Planner.
- Manuscript Generator.
- Editorial Auditor.
- Recovery & Assembly Engine.
- Format Builder.
- Metadata Generator.
- Publishing Assistant.

### FASE G — Exportadores

- Markdown.
- DOCX.
- PDF.
- EPUB.
- ZIP.

### FASE H — Testing

- Build.
- Tests.
- Flujo demo.
- Exportación demo.

### FASE I — Documentación

- README.
- Guía de usuario.
- Reporte técnico.
- Reporte de pruebas.
- Readiness.

---

## 21. Caso demo obligatorio

Crear un proyecto demo interno:

```text
Demo: Runas Premium
```

Debe probar el flujo con una idea como:

```text
Crear un eBook premium sobre runas para principiantes e intermedios, con enfoque histórico, simbólico y práctico, orientado a venta digital.
```

El demo debe demostrar que la app puede generar:

- investigación estructurada;
- idioma recomendado;
- fórmula editorial;
- biblia editorial;
- biblia visual;
- índice;
- bloque de muestra;
- auditoría;
- metadata;
- paquete de exportación.

No es necesario generar un libro completo de 200 páginas en el demo, pero el sistema debe estar preparado para hacerlo por bloques.

---

## 22. Respuesta final esperada de la IA del IDE

Al terminar, responde con:

1. Resumen de lo implementado.
2. Stack final usado.
3. Archivos principales creados/modificados.
4. Comandos para ejecutar.
5. Comandos de prueba.
6. Ubicación de exportaciones.
7. Limitaciones conocidas.
8. Estado GO / NO-GO.
9. Próximos pasos recomendados.

Formato final:

```text
ESTADO FINAL: GO / GO CONDICIONAL / NO-GO

Repositorio:
https://github.com/GodinesCrazy/Cervantes.git

Ruta local:
C:/Cervantes

Comandos:
npm install
npm run dev
npm run build
npm run test

Resultado:
[describir]
```

---

## 23. Mandato final

Desarrolla ahora la aplicación completa Cervantes sobre el repositorio:

```text
https://github.com/GodinesCrazy/Cervantes.git
```

Trabaja en:

```text
C:/Cervantes
```

El resultado debe ser una aplicación mono-usuario, privada, funcional, probada, documentada y orientada a rentabilidad personal mediante la generación de eBooks premium listos para publicación asistida o venta directa.

No entregues solo planificación.

No entregues solo diseño.

No entregues solo documentación.

Entrega software operativo.
