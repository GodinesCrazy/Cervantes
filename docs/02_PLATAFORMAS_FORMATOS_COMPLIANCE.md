# 02_PLATAFORMAS_FORMATOS_COMPLIANCE.md

# Cervantes — Plataformas, formatos, compliance y calidad gráfica premium

**Proyecto:** Cervantes  
**Ruta objetivo:** `C:/Cervantes/docs/`  
**Archivo:** `02_PLATAFORMAS_FORMATOS_COMPLIANCE.md`  
**Versión:** 1.0  
**Fecha:** 2026-05-25  
**Estado:** Documento base aprobado para diseño de producto y desarrollo posterior  
**Propósito:** Definir las reglas de plataformas, formatos, publicación, compliance, derechos, contenido IA y calidad gráfica premium que Cervantes debe respetar antes de generar, exportar o publicar un eBook.

---

## 1. Resumen ejecutivo

Cervantes no debe ser tratado como un simple generador automático de texto. Debe funcionar como una plataforma editorial capaz de producir un paquete completo de publicación digital con estándares profesionales:

1. manuscrito;
2. portada;
3. diseño interior;
4. sistema gráfico;
5. imágenes o láminas;
6. metadata comercial;
7. PDF premium;
8. EPUB reflowable;
9. DOCX editable;
10. workbook o bonus cuando corresponda;
11. checklist legal y de plataforma;
12. paquete listo para publicación;
13. publicación asistida o automatización parcial donde sea permitido.

La aplicación debe distinguir siempre entre:

- **Generar un eBook**: crear contenido y estructura editorial.
- **Diseñar un eBook premium**: aplicar identidad visual, portada, diagramación, jerarquías, láminas y recursos gráficos.
- **Exportar un eBook**: producir PDF, EPUB, DOCX u otros archivos válidos.
- **Publicar un eBook**: subir o guiar la publicación en plataformas externas.
- **Vender un eBook**: crear producto digital, precio, descripción, checkout y entrega.
- **Distribuir un eBook**: enviarlo a marketplaces o tiendas mediante plataformas de distribución.
- **Cumplir compliance**: verificar IA, derechos, metadata, claims, contenido sensible, portada, formatos y experiencia de cliente.

La regla central para Cervantes es:

> Ningún libro debe pasar a exportación o publicación si no tiene validación editorial, validación gráfica, validación técnica, validación legal/compliance y validación comercial.

---

## 2. Clasificación de plataformas

Cervantes debe clasificar cada plataforma por el tipo de integración realista que permite.

| Plataforma | Uso principal | Nivel recomendado en MVP | Formatos clave | Publicación automática |
|---|---|---:|---|---|
| Amazon KDP | Marketplace principal de eBooks Kindle y libros impresos | Asistida/manual segura | EPUB, DOCX, KPF, PDF según caso | No en MVP |
| Gumroad | Venta directa de productos digitales | Semiautomática o asistida | PDF, EPUB, ZIP, bonus | Posible con revisión |
| Shopify Digital Downloads | Venta directa en tienda propia | Automatizable con controles | PDF, EPUB, ZIP | Posible para producto digital |
| Draft2Digital | Distribución amplia a tiendas | Asistida/semiautomática | DOCX, EPUB | Depende del flujo disponible |
| Payhip / alternativas | Venta directa y checkout simple | Futuro | PDF, EPUB, ZIP | Futuro |
| Sitio propio Cervantes | Landing, checkout, descarga, lead magnet | Futuro avanzado | PDF, EPUB, ZIP | Sí, controlado por el sistema |

---

## 3. Amazon KDP

### 3.1 Uso recomendado

Amazon KDP debe tratarse como la plataforma principal para publicación comercial masiva, pero **no debe ser automatizada totalmente en el MVP**.

La estrategia correcta para Cervantes es:

- generar todos los archivos y campos necesarios;
- validar formato, portada, metadata y compliance;
- entregar una guía paso a paso para subirlos;
- dejar al usuario confirmar manualmente publicación, precio, derechos y declaración IA.

### 3.2 Formatos aceptados o recomendados

Cervantes debe generar o preparar para KDP:

- **EPUB reflowable** como archivo principal recomendado para eBooks Kindle;
- **DOCX** como formato editable fuente;
- **KPF** como posible salida si se integra con Kindle Create o flujo equivalente;
- **PDF** solo para casos adecuados, principalmente idiomas soportados y/o maquetaciones específicas;
- **JPG/JPEG de portada** para eBook Kindle;
- **PDF print-ready** si se decide crear paperback o hardcover.

KDP soporta DOC/DOCX, KPF y EPUB como formatos comunes; además recomienda validar EPUB con Kindle Previewer antes de subirlo. También indica que MOBI dejaría de aceptarse para eBooks de diseño fijo desde marzo de 2025, por lo que Cervantes no debe basar su flujo moderno en MOBI.

### 3.3 Reglas técnicas para Cervantes en KDP

Cervantes debe validar:

- tabla de contenidos navegable;
- títulos jerárquicos limpios;
- imágenes optimizadas;
- portada separada del manuscrito;
- ausencia de imágenes pixeladas;
- ausencia de saltos de página defectuosos;
- ausencia de caracteres corruptos;
- ausencia de enlaces rotos;
- compatibilidad con Kindle Previewer;
- coherencia entre título, subtítulo, autor y portada;
- metadata sin spam;
- categorías relevantes;
- keywords no engañosas;
- declaración IA cuando corresponda.

### 3.4 Metadata KDP

Campos mínimos que Cervantes debe generar:

- título;
- subtítulo;
- nombre de autor;
- contribuyentes si existen;
- descripción comercial;
- keywords;
- categorías sugeridas;
- público objetivo;
- idioma;
- edad de lectura si aplica;
- marketplace principal sugerido;
- derechos territoriales;
- declaración de contenido IA;
- precio recomendado;
- estado de KDP Select recomendado o no recomendado.

Regla esencial:

> El título y subtítulo deben coincidir con la portada y no deben incluir frases promocionales, keywords artificiales, afirmaciones como “best seller”, precios, descuentos ni claims engañosos.

### 3.5 Portada para KDP

Cervantes debe generar una portada de eBook compatible con estándares de alta calidad:

- formato vertical;
- ratio recomendado aproximado 1.6:1;
- archivo JPG/JPEG o PNG según exportación;
- título legible en miniatura;
- subtítulo claro;
- autor visible;
- contraste alto;
- composición profesional;
- sin parecer copia de otro libro;
- sin usar imágenes sin derechos;
- sin claims engañosos;
- sin tipografías ilegibles;
- sin exceso de elementos.

Para paperback o hardcover, Cervantes debe calcular portada completa con:

- frontal;
- lomo;
- contraportada;
- sangrado;
- tamaño de corte;
- cantidad de páginas;
- tipo de papel;
- código de barras/ISBN si corresponde.

### 3.6 Contenido generado por IA en KDP

Cervantes debe llevar un registro interno de uso de IA:

- texto generado por IA;
- imágenes generadas por IA;
- traducciones generadas por IA;
- texto asistido por IA;
- imágenes asistidas por IA;
- edición, corrección y refinamiento mediante IA;
- prompts usados;
- modelo o proveedor usado si el usuario desea conservar trazabilidad;
- fecha de generación;
- estado de revisión humana.

Criterio interno:

- Si la IA crea el contenido final o una parte sustancial del texto, imagen o traducción, debe marcarse como **AI-generated** para declaración.
- Si el humano crea el contenido y la IA solo ayuda a corregir, editar, mejorar o revisar, puede marcarse como **AI-assisted**.
- Cervantes debe advertir que la plataforma puede exigir declaración de contenido IA aunque el usuario haya editado el contenido después.
- El usuario siempre debe aprobar la declaración final.

### 3.7 Automatización recomendada para KDP

| Acción | Nivel en Cervantes MVP |
|---|---|
| Investigación de metadata | Automática |
| Generación de descripción | Automática con revisión |
| Generación de keywords | Automática con revisión |
| Generación de categorías sugeridas | Automática con revisión |
| Generación EPUB | Automática |
| Validación EPUB | Automática + checklist |
| Portada eBook | Automática/semiautomática |
| Subida a KDP | Manual asistida |
| Declaración IA | Asistida con confirmación humana |
| Publicar libro | Manual |
| Cambios posteriores | Manual asistida |

Motivo: KDP implica derechos, declaraciones, precios, alcance territorial y aceptación de políticas. Cervantes debe reducir fricción, no saltarse la decisión humana.

---

## 4. Gumroad

### 4.1 Uso recomendado

Gumroad debe tratarse como plataforma ideal para venta directa de:

- PDF premium ilustrado;
- EPUB;
- workbook;
- guía rápida;
- plantillas;
- bundle completo;
- preventa;
- edición especial;
- descuento de lanzamiento.

A diferencia de KDP, Gumroad funciona mejor para productos digitales con alto valor percibido y packaging visual. Cervantes debe aprovecharlo como canal de venta directa.

### 4.2 Producto ideal en Gumroad

Cervantes debe generar paquetes como:

```text
Producto principal:
- ebook_premium.pdf
- ebook_reflowable.epub
- ebook_editable.docx opcional interno, no siempre para cliente

Bonus:
- workbook.pdf
- guia_rapida_visual.pdf
- laminas_imprimibles.zip
- prompts_personales.txt si aplica
- portada_wallpaper.jpg si aplica
```

### 4.3 Metadata para Gumroad

Campos recomendados:

- nombre del producto;
- descripción larga;
- descripción corta;
- imagen/cover de producto;
- mockup 3D opcional;
- precio;
- precio mínimo si se usa pay-what-you-want;
- archivos adjuntos;
- tags;
- licencia de uso;
- instrucciones de descarga;
- mensaje post-compra;
- email de entrega;
- actualización de producto.

### 4.4 Automatización recomendada

| Acción | Nivel en Cervantes MVP |
|---|---|
| Crear paquete ZIP | Automática |
| Generar descripción | Automática |
| Generar portada/mockup | Automática/semiautomática |
| Preparar precio | Automática con recomendación |
| Subir producto | Asistida inicialmente |
| Publicar producto | Manual o semiautomática |
| Actualizar archivos | Manual asistida |
| Email post-compra | Automático generable |

### 4.5 Ventaja estratégica

Gumroad permite vender más que un eBook. Permite vender una **experiencia editorial completa**:

- libro;
- workbook;
- guía rápida;
- láminas imprimibles;
- bonus;
- actualizaciones;
- comunidad futura;
- upsells.

Cervantes debe diseñar el producto pensando en **bundle premium**, no solo en archivo PDF.

---

## 5. Shopify Digital Downloads

### 5.1 Uso recomendado

Shopify debe considerarse cuando el usuario quiere crear una marca editorial propia o vender desde una tienda controlada.

Es ideal para:

- catálogo propio;
- bundles;
- productos digitales;
- funnels;
- email marketing;
- cupones;
- upsells;
- ventas globales;
- integración con marca personal o editorial.

Shopify Digital Downloads permite subir archivos digitales como productos y entregar enlaces de descarga tras la compra. También permite configurar descarga automática, límites de descarga y archivos ZIP, lo que lo hace adecuado para eBook + workbook + bonus.

### 5.2 Producto ideal en Shopify

Cervantes debe poder generar:

- producto digital;
- imagen principal;
- galería visual;
- descripción optimizada;
- precio;
- tags;
- tipo de producto;
- colección;
- archivo PDF;
- archivo EPUB;
- archivo ZIP de bonus;
- email de entrega;
- mensaje post-compra;
- política de uso;
- instrucciones de descarga.

### 5.3 Reglas técnicas

Cervantes debe validar:

- archivo menor al límite de plataforma;
- nombre de archivo limpio;
- ZIP organizado;
- instrucciones claras;
- checkout sin envío físico;
- producto marcado como no físico;
- inventario no rastreado;
- email de descarga configurado;
- límite de descarga si el usuario lo desea;
- archivo reemplazable sin romper experiencia de cliente;
- mensaje de actualización para clientes si hay nueva versión.

### 5.4 Automatización recomendada

| Acción | Nivel en Cervantes MVP |
|---|---|
| Generar producto JSON interno | Automática |
| Generar descripción Shopify | Automática |
| Generar assets visuales | Automática/semiautomática |
| Generar ZIP | Automática |
| Crear producto vía API | Futuro/MVP avanzado |
| Adjuntar archivo digital | Futuro/MVP avanzado |
| Publicar producto | Manual o semiautomática |
| Configurar checkout | Manual asistida |

### 5.5 Consideración comercial

Shopify requiere más configuración que Gumroad, pero ofrece más control sobre marca, datos de cliente y escalabilidad. Cervantes debe recomendar Shopify cuando el usuario quiera construir una línea editorial, no solo vender un libro aislado.

---

## 6. Draft2Digital

### 6.1 Uso recomendado

Draft2Digital debe tratarse como una plataforma de distribución amplia. Es útil cuando el usuario quiere llegar a múltiples tiendas sin cargar manualmente cada una.

Debe analizarse para:

- Apple Books;
- Kobo;
- Barnes & Noble;
- bibliotecas;
- otras tiendas asociadas;
- distribución internacional.

### 6.2 Formatos recomendados

Cervantes debe preparar:

- DOCX limpio;
- EPUB validado;
- portada;
- metadata;
- descripción;
- categorías BISAC o equivalentes;
- keywords;
- bio de autor;
- derechos;
- precio.

### 6.3 Automatización recomendada

| Acción | Nivel en Cervantes MVP |
|---|---|
| Preparar DOCX limpio | Automática |
| Preparar EPUB validado | Automática |
| Preparar metadata | Automática |
| Recomendar canales | Automática con revisión |
| Subida a Draft2Digital | Asistida |
| Publicación final | Manual |
| Distribución multitienda | Manual/asistida |

### 6.4 Reglas de uso

Cervantes debe advertir que la distribución amplia requiere coherencia de derechos. Si el usuario inscribe el libro en KDP Select, debe revisar exclusividad antes de distribuir el eBook en otros canales. Cervantes debe incluir un **Exclusive Distribution Gate** antes de publicar en múltiples plataformas.

---

## 7. Formatos de salida obligatorios

Cervantes debe generar al menos tres formatos principales:

1. **DOCX editable**
2. **EPUB reflowable**
3. **PDF premium**

Además, debe poder generar:

- portada JPG/PNG;
- portada PDF print-ready si aplica;
- ZIP de publicación;
- JSON de metadata;
- checklist de compliance;
- informe de uso de IA;
- informe de derechos de imágenes;
- workbook PDF;
- guía rápida visual PDF.

---

## 8. DOCX

### 8.1 Propósito

El DOCX es el formato editable maestro para revisión humana, corrección editorial y compatibilidad con plataformas que acepten documentos Word.

### 8.2 Reglas internas

Cervantes debe generar DOCX con:

- estilos de título coherentes;
- jerarquía H1/H2/H3;
- tabla de contenidos automática o estructurable;
- saltos de página limpios;
- imágenes insertadas con tamaño optimizado;
- notas de diseño retiradas o convertidas a comentarios internos;
- sin prompts;
- sin metatexto de producción;
- sin placeholders no resueltos;
- sin caracteres corruptos;
- sin doble espacio excesivo;
- sin saltos de línea artificiales.

### 8.3 Validación DOCX

Checklist:

- abre correctamente en Word/LibreOffice;
- exporta a PDF sin perder estructura;
- conserva acentos y caracteres especiales;
- conserva símbolos si son necesarios;
- no tiene marcas internas;
- no tiene comentarios privados visibles;
- no tiene nombres de archivos temporales;
- no contiene prompts ni instrucciones al modelo.

---

## 9. EPUB

### 9.1 Propósito

El EPUB debe ser el formato principal para eBooks reflowable. El estándar EPUB 3.3 define un formato de distribución e intercambio para publicaciones digitales, empaquetando contenido web estructurado como HTML, CSS, SVG y recursos asociados en un contenedor de archivo único.

### 9.2 Reglas EPUB

Cervantes debe generar EPUB con:

- XHTML/HTML limpio;
- CSS simple;
- tabla de contenidos navegable;
- manifest correcto;
- metadata completa;
- idioma correcto;
- imágenes optimizadas;
- portada marcada como cover;
- sin JavaScript innecesario;
- sin recursos remotos;
- sin fuentes no autorizadas;
- sin imágenes enormes;
- sin enlaces rotos;
- validación EPUBCheck si se integra;
- validación Kindle Previewer para KDP.

### 9.3 Reflowable vs fixed-layout

Cervantes debe decidir automáticamente:

- **EPUB reflowable** para libros de texto, guías, manuales, narrativa, no ficción y la mayoría de eBooks.
- **Fixed-layout** solo para libros altamente visuales, infantiles, cómics, recetarios muy maquetados o libros donde el diseño sea inseparable del contenido.

Regla:

> El PDF premium puede tener diseño visual avanzado; el EPUB debe priorizar lectura adaptable.

---

## 10. PDF premium

### 10.1 Propósito

El PDF premium es el formato de mayor valor visual para venta directa en Gumroad, Shopify o sitio propio.

Debe sentirse como un producto de colección:

- portada poderosa;
- apertura visual por partes;
- jerarquía editorial;
- recuadros;
- láminas;
- ilustraciones;
- páginas de respiro;
- tablas limpias;
- workbook integrado o separado;
- coherencia visual total.

### 10.2 Reglas de PDF premium

Cervantes debe generar PDF con:

- tamaño de página definido;
- márgenes profesionales;
- portada;
- página legal;
- índice;
- numeración;
- encabezados/pies si aplica;
- fuentes legibles;
- contraste adecuado;
- imágenes en calidad alta;
- compresión controlada;
- peso final razonable;
- enlaces internos si aplica;
- TOC clicable si se puede;
- sin errores visuales.

### 10.3 Perfil visual premium

Para cada eBook, Cervantes debe generar una **Biblia Visual** con:

- estilo artístico;
- paleta de color;
- tipografías sugeridas;
- sistema de portada;
- sistema de separadores;
- sistema de ilustraciones;
- estilo de iconografía;
- textura o fondo;
- reglas de composición;
- jerarquía visual;
- estilo de recuadros;
- estilo de tablas;
- estilo de láminas premium;
- prompts de imágenes;
- guía de consistencia gráfica.

### 10.4 Diseño gráfico obligatorio

El usuario ha definido un requisito central:

> La aplicación debe considerar dentro del proceso el diseño gráfico para asegurar que el eBook final tenga calidad premium.

Por tanto, Cervantes debe incluir un módulo obligatorio llamado:

## Premium Visual Design Engine

Este módulo debe:

1. analizar el nicho y el tipo de eBook;
2. proponer dirección de arte;
3. definir portada;
4. definir paleta;
5. definir tipografías;
6. definir sistema de maquetación;
7. generar prompts de imágenes;
8. generar láminas y separadores;
9. crear mockups de venta;
10. validar consistencia visual;
11. preparar assets para PDF, Gumroad, Shopify y redes sociales;
12. diferenciar entre diseño para PDF y diseño para EPUB;
13. generar checklist gráfico;
14. impedir publicación si el diseño está incompleto.

### 10.5 Salidas del Premium Visual Design Engine

Archivos esperados:

```text
/assets/cover/
  cover_kdp_ebook.jpg
  cover_gumroad_mockup.png
  cover_shopify_product.png
  cover_source.prompt.md

/assets/interior/
  part_openers/
  chapter_openers/
  dividers/
  callout_boxes/
  tables/
  icons/
  printable_sheets/

/docs/
  VISUAL_BIBLE.md
  IMAGE_PROMPTS.md
  GRAPHIC_ASSET_MANIFEST.md
  PREMIUM_DESIGN_CHECKLIST.md
```

---

## 11. Metadata comercial

Cervantes debe generar metadata distinta para cada canal.

### 11.1 Metadata universal

- título;
- subtítulo;
- autor;
- idioma;
- descripción corta;
- descripción larga;
- género/nicho;
- audiencia;
- nivel de lectura;
- promesa editorial;
- palabras clave;
- categorías;
- precio recomendado;
- formato;
- fecha;
- derechos;
- declaración IA;
- advertencias si aplica.

### 11.2 Metadata por plataforma

| Campo | KDP | Gumroad | Shopify | Draft2Digital |
|---|---:|---:|---:|---:|
| Título | Sí | Sí | Sí | Sí |
| Subtítulo | Sí | En descripción | Sí | Sí |
| Autor | Sí | Opcional/comercial | Sí | Sí |
| Descripción larga | Sí | Sí | Sí | Sí |
| Keywords | Sí | Tags | Tags/SEO | Sí |
| Categorías | Sí | Tags/categoría | Colección/tipo | Sí |
| Precio | Sí | Sí | Sí | Sí |
| Portada | Sí | Sí | Sí | Sí |
| Archivos | EPUB/DOCX/KPF | PDF/EPUB/ZIP | PDF/EPUB/ZIP | EPUB/DOCX |
| Declaración IA | Sí, si aplica | Recomendado interno | Recomendado interno | Según política vigente |
| Checklist derechos | Sí | Sí | Sí | Sí |

---

## 12. Compliance de derechos de autor

Cervantes debe validar:

- texto original;
- citas dentro de límite razonable;
- fuentes citadas;
- imágenes con derechos claros;
- prompts y assets guardados;
- no uso de marcas registradas como si fueran propias;
- no uso de personajes, mundos o títulos protegidos;
- no creación de “companion books” de obras protegidas sin permiso;
- no plagio;
- no claims falsos;
- no biografías o contenido sensible sin revisión;
- no uso de fotos de personas reales sin derecho;
- no uso de letras de canciones;
- no uso de fragmentos extensos de libros recientes.

### 12.1 Asset Rights Ledger

Cervantes debe crear un registro por cada asset:

```text
asset_id:
tipo:
archivo:
origen:
generado_por_IA: sí/no
modelo/herramienta:
prompt:
licencia:
uso permitido:
restricciones:
revisión humana:
aprobado_para_comercial: sí/no
```

---

## 13. Compliance de contenido IA

Cervantes debe crear un **AI Content Ledger** por proyecto.

Campos mínimos:

```text
project_id:
book_title:
text_ai_generated: yes/no/partial
text_ai_assisted: yes/no
images_ai_generated: yes/no/partial
images_ai_assisted: yes/no
translations_ai_generated: yes/no/partial
human_review_completed: yes/no
ip_review_completed: yes/no
platform_disclosure_required:
recommended_disclosure_text:
approval_status:
```

Regla:

> Cervantes no debe ocultar uso de IA. Debe registrar, clasificar y preparar la declaración correcta según plataforma.

---

## 14. Compliance por tipo de contenido

Cervantes debe activar validaciones especiales para:

- salud;
- nutrición;
- psicología;
- finanzas;
- inversiones;
- leyes;
- impuestos;
- educación infantil;
- religión o espiritualidad;
- esoterismo;
- relaciones personales;
- política;
- temas históricos sensibles;
- contenido para menores;
- contenido sexual o violento;
- promesas de resultados.

Para cada uno debe decidir:

- advertencia necesaria;
- nivel de revisión humana;
- fuentes requeridas;
- claims prohibidos;
- tipo de disclaimer;
- plataformas compatibles;
- riesgo de rechazo;
- riesgo de mala experiencia del cliente.

---

## 15. Modos de publicación

Cervantes debe distinguir cuatro modos.

### 15.1 Publicación automática real

El sistema crea o actualiza el producto directamente mediante API o integración autorizada.

Uso recomendado:

- sitio propio;
- Shopify en fase avanzada;
- Gumroad si existe integración validada;
- plataformas con API documentada y permisos del usuario.

No usar para KDP en MVP.

### 15.2 Publicación asistida

El sistema genera todo y guía al usuario paso a paso.

Uso recomendado:

- KDP;
- Draft2Digital;
- plataformas con decisiones legales o comerciales sensibles.

### 15.3 Paquete listo para publicar

El sistema entrega un ZIP con todos los archivos y campos.

Contenido:

```text
/manuscript/
  ebook.docx
  ebook.epub
  ebook_premium.pdf

/cover/
  cover_kdp.jpg
  cover_shopify.png
  cover_gumroad.png

/metadata/
  kdp_metadata.json
  gumroad_metadata.md
  shopify_product.md
  draft2digital_metadata.json

/compliance/
  ai_content_ledger.md
  rights_ledger.md
  platform_checklist.md
  publication_go_nogo.md
```

### 15.4 Guía manual paso a paso

El sistema produce instrucciones para publicación manual, especialmente cuando:

- la plataforma no tiene API;
- hay declaraciones legales;
- hay derechos territoriales;
- hay revisión humana obligatoria;
- hay pago, impuestos o cuenta de autor;
- la publicación automática es riesgosa.

---

## 16. Gates obligatorios antes de exportar

Cervantes debe implementar gates de calidad.

### Gate 1 — Editorial

- índice aprobado;
- capítulos completos;
- tono consistente;
- sin placeholders;
- sin secciones vacías;
- sin contradicciones;
- promesa cumplida.

### Gate 2 — Técnico

- DOCX abre correctamente;
- EPUB valida;
- PDF renderiza bien;
- imágenes existen;
- enlaces internos funcionan;
- tabla de contenidos correcta.

### Gate 3 — Visual Premium

- portada aprobada;
- paleta aplicada;
- tipografías coherentes;
- separadores creados;
- láminas premium creadas;
- tablas diseñadas;
- mockups creados;
- diseño compatible por formato;
- imagen de producto lista.

### Gate 4 — Compliance

- IA clasificada;
- derechos revisados;
- fuentes documentadas;
- claims revisados;
- disclaimers agregados;
- contenido sensible marcado;
- metadata no engañosa.

### Gate 5 — Plataforma

- formato correcto por plataforma;
- metadata lista;
- portada compatible;
- precio definido;
- categorías/keywords revisadas;
- archivos empaquetados;
- checklist GO/NO-GO.

---

## 17. Implicancias para arquitectura de Cervantes

Módulos requeridos:

1. Platform Rules Engine
2. Format Builder
3. EPUB Builder
4. PDF Premium Builder
5. DOCX Builder
6. Premium Visual Design Engine
7. Cover Generator
8. Asset Rights Ledger
9. AI Content Ledger
10. Metadata Generator
11. Compliance Engine
12. Publishing Package Builder
13. Publication Assistant
14. Shopify Connector
15. Gumroad Package Assistant
16. KDP Manual Publishing Assistant
17. Draft2Digital Assistant
18. GO/NO-GO Validator

---

## 18. Estructura de carpetas recomendada

```text
C:/Cervantes/
  docs/
    01_INVESTIGACION_PROFUNDA_MERCADO_EBOOKS_2026.md
    02_PLATAFORMAS_FORMATOS_COMPLIANCE.md
    03_FLUJO_EDITORIAL_VALIDADO_RUNAS_A_CERVANTES.md
    04_ESPECIFICACION_PRODUCTO_CERVANTES.md
    05_ROADMAP_MVP_Y_DEFINICION_DE_TERMINADO.md

  projects/
    {project_id}/
      research/
      editorial_bible/
      manuscript/
      visual_bible/
      assets/
      exports/
      metadata/
      compliance/
      publication_package/
```

---

## 19. Definición de “eBook premium” para Cervantes

Un eBook generado por Cervantes solo puede considerarse premium si cumple:

- contenido bien investigado;
- estructura editorial sólida;
- promesa comercial clara;
- redacción limpia;
- edición y auditoría;
- portada profesional;
- identidad visual completa;
- diagramación cuidada;
- assets originales o con derechos claros;
- PDF visualmente atractivo;
- EPUB funcional;
- metadata comercial;
- compliance documentado;
- paquete de publicación ordenado;
- experiencia de comprador clara.

No basta con generar muchas páginas.

La calidad premium se logra mediante la combinación de:

```text
Investigación + Fórmula editorial + Diseño gráfico + Escritura + Auditoría + Formatos + Compliance + Packaging comercial
```

---

## 20. Recomendación final para Cervantes

Para el MVP, el orden correcto es:

1. crear investigación;
2. generar fórmula editorial;
3. generar biblia editorial;
4. generar biblia visual;
5. generar manuscrito;
6. auditar;
7. diseñar portada y sistema gráfico;
8. exportar DOCX;
9. exportar PDF premium;
10. exportar EPUB;
11. generar metadata;
12. generar compliance;
13. generar paquete de publicación;
14. ofrecer publicación asistida.

KDP debe quedar como publicación asistida manual segura. Gumroad y Shopify pueden avanzar antes hacia flujos semiautomáticos o automatizados, siempre con confirmación humana.

---

## 21. Fuentes consultadas

- Amazon KDP Help — What file formats are supported for eBook manuscripts?  
  https://kdp.amazon.com/help/topic/G200634390

- Amazon KDP Help — Content Guidelines / Artificial intelligence content  
  https://kdp.amazon.com/help/topic/G200672390

- Amazon KDP Help — Metadata Guidelines for Books  
  https://kdp.amazon.com/help/topic/G201097560

- Shopify Help Center — Digital Downloads  
  https://help.shopify.com/en/manual/products/digital-service-product/digital-downloads

- Gumroad Help Center — Adding a product  
  https://gumroad.com/help/article/149-adding-a-product

- W3C — EPUB 3.3 Recommendation  
  https://www.w3.org/TR/epub-33/

---

## 22. Estado del archivo

Este documento queda listo para guardarse en:

```text
C:/Cervantes/docs/02_PLATAFORMAS_FORMATOS_COMPLIANCE.md
```

Debe ser leído por la IA generativa del IDE antes de construir cualquier módulo de exportación, publicación, metadata, diseño gráfico, compliance o integración con plataformas.

