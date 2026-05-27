# Orquestacion multi-IA de Cervantes

## Regla de producto

Cervantes no debe considerar publicable un manuscrito final generado solo con plantillas locales. Para texto editorial premium, el sistema debe intentar IA externa y usar respaldo local solo como borrador de emergencia marcado como `NEEDS_REVISION`.

## Proveedores soportados

El orden por defecto se adapta por tarea. La cadena general es:

1. `cerebras`
2. `deepseek`
3. `groq`
4. `gemini`
5. `cohere`
6. `openrouter`
7. `mistral`
8. `together`
9. `fireworks`
10. `openai`

Se puede sobrescribir con:

```env
AI_PROVIDER_ORDER=cerebras,deepseek,groq,gemini,cohere,openrouter,mistral,openai
```

## Variables de entorno

```env
GROQ_API_KEY=
GEMINI_API_KEY=
OPENROUTER_API_KEY=
CEREBRAS_API_KEY=
DEEPSEEK_API_KEY=
COHERE_API_KEY=
MISTRAL_API_KEY=
TOGETHER_API_KEY=
FIREWORKS_API_KEY=
OPENAI_API_KEY=
STABILITY_API_KEY=
REPLICATE_API_KEY=
FAL_API_KEY=
HUGGINGFACE_API_KEY=
POLLINATIONS_API_KEY=
CLOUDFLARE_API_KEY=
```

Modelos configurables:

```env
GROQ_MODEL=llama-3.3-70b-versatile
GEMINI_MODEL=gemini-2.5-flash
OPENROUTER_MODEL=openrouter/free
CEREBRAS_MODEL=gpt-oss-120b
DEEPSEEK_MODEL=deepseek-chat
COHERE_MODEL=command-a-03-2025
MISTRAL_MODEL=mistral-small-latest
TOGETHER_MODEL=meta-llama/Llama-3.3-70B-Instruct-Turbo-Free
FIREWORKS_MODEL=accounts/fireworks/models/llama-v3p1-70b-instruct
```

## Control de cuota y fallos

- Si falta una clave, el proveedor se omite.
- Si la clave existe pero la cuenta no tiene saldo, el proveedor se considera detectado pero no usable.
- Si una clave es invalida, el proveedor entra en cooldown temporal.
- Si hay `429`, timeout o cuota agotada, el proveedor tambien entra en cooldown.
- Si ningun proveedor externo responde, se genera un borrador local largo para no perder trabajo, pero el bloque queda como `NEEDS_REVISION`.
- Quality Gates bloquea exportacion premium si detecta capitulos sin IA externa valida.

## Proveedores investigados

- Groq: util por velocidad y modelos abiertos, con limites gratuitos por cuenta.
- Gemini: util como proveedor general con free tier, pero debe tener API key valida.
- OpenRouter: util como router de modelos gratuitos y pagados bajo una API.
- Cerebras: util por inferencia rapida y compatibilidad tipo OpenAI.
- DeepSeek: util como proveedor OpenAI-compatible para escritura/revision, segun cuota disponible.
- Mistral: util por API directa y modelos pequenos/medianos para borradores y reescritura.
- Cohere: util para clasificacion, resumen, reescritura breve y QA semantico.
- Together/Fireworks: utiles como proveedores opcionales si hay creditos o tiers disponibles en la cuenta.
- Stability/Replicate/fal.ai/Hugging Face/Pollinations/Cloudflare: detectados como motores visuales o gateways para futuras variantes de assets premium.

Esta capa esta pensada para administrar disponibilidad, no para prometer que todos los proveedores sean gratis ilimitados. Las cuotas cambian por cuenta, region y modelo.
