# Cervantes — Paquete de investigación y diseño previo

Fecha: 2026-05-25

Este paquete está preparado para copiarse dentro de:

`C:/Cervantes`

Estructura recomendada:

```text
C:/Cervantes/
├─ docs/
│  ├─ 01_INVESTIGACION_PROFUNDA_MERCADO_EBOOKS.md
│  ├─ 02_PLATAFORMAS_FORMATOS_COMPLIANCE.md
│  ├─ 03_FLUJO_EDITORIAL_VALIDADO_RUNAS_A_CERVANTES.md
│  ├─ 04_ESPECIFICACION_PRODUCTO_CERVANTES.md
│  └─ 05_ROADMAP_MVP_Y_DEFINICION_DE_TERMINADO.md
└─ prompts/
   └─ PROMPT_DESARROLLO_COMPLETO_CERVANTES_IDE.md
```

## Decisión estructural

Cervantes se divide en dos grandes etapas:

1. **Investigación profunda y diseño de producto**
   - Esta etapa la realiza ChatGPT como director de producto/editorial.
   - El resultado son documentos base guardables en `C:/Cervantes/docs`.
   - No se programa todavía.
   - Se definen mercado, plataformas, riesgos, compliance, arquitectura, pipeline y MVP.

2. **Desarrollo completo en IDE**
   - Una IA generativa dentro del IDE trabaja sobre `C:/Cervantes`.
   - Usa los documentos de `docs/` como fuente de verdad.
   - Debe entregar software operativo, probado, documentado y ejecutable.
   - No debe inventar requisitos ni prometer bestseller garantizado.

## Uso recomendado

1. Copiar esta carpeta dentro de `C:/Cervantes`.
2. Revisar los documentos en `docs/`.
3. Recién después usar el prompt ubicado en `prompts/`.
4. Pedir a la IA del IDE que implemente el software por fases, con pruebas y documentación.
