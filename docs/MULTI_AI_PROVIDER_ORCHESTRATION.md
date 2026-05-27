# Orquestacion multi-IA de Cervantes

## Regla de producto

Cervantes no debe considerar publicable un manuscrito final generado solo con plantillas locales. Para texto editorial premium, el sistema debe intentar IA externa y usar respaldo local solo como borrador de emergencia marcado como `NEEDS_REVISION`.

## Proveedores soportados

El orden por defecto es:

1. `groq`
2. `gemini`
3. `openrouter`
4. `cerebras`
5. `mistral`
6. `together`
7. `fireworks`
8. `openai`

Se puede sobrescribir con:

```env
AI_PROVIDER_ORDER=groq,openrouter,cerebras,mistral,gemini,openai
```

## Variables de entorno

```env
GROQ_API_KEY=
GEMINI_API_KEY=
OPENROUTER_API_KEY=
CEREBRAS_API_KEY=
MISTRAL_API_KEY=
TOGETHER_API_KEY=
FIREWORKS_API_KEY=
OPENAI_API_KEY=
```

Modelos configurables:

```env
GROQ_MODEL=llama-3.3-70b-versatile
GEMINI_MODEL=gemini-2.5-flash
OPENROUTER_MODEL=openrouter/free
CEREBRAS_MODEL=gpt-oss-120b
MISTRAL_MODEL=mistral-small-latest
TOGETHER_MODEL=meta-llama/Llama-3.3-70B-Instruct-Turbo-Free
FIREWORKS_MODEL=accounts/fireworks/models/llama-v3p1-70b-instruct
```

## Control de cuota y fallos

- Si falta una clave, el proveedor se omite.
- Si una clave es invalida, el proveedor entra en cooldown temporal.
- Si hay `429`, timeout o cuota agotada, el proveedor tambien entra en cooldown.
- Si ningun proveedor externo responde, se genera un borrador local largo para no perder trabajo, pero el bloque queda como `NEEDS_REVISION`.
- Quality Gates bloquea exportacion premium si detecta capitulos sin IA externa valida.

## Proveedores investigados

- Groq: util por velocidad y modelos abiertos, con limites gratuitos por cuenta.
- Gemini: util como proveedor general con free tier, pero debe tener API key valida.
- OpenRouter: util como router de modelos gratuitos y pagados bajo una API.
- Cerebras: util por inferencia rapida y compatibilidad tipo OpenAI.
- Mistral: util por API directa y modelos pequenos/medianos para borradores y reescritura.
- Together/Fireworks: utiles como proveedores opcionales si hay creditos o tiers disponibles en la cuenta.

Esta capa esta pensada para administrar disponibilidad, no para prometer que todos los proveedores sean gratis ilimitados. Las cuotas cambian por cuenta, region y modelo.
