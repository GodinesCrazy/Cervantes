import { AIProvider, AIResult, AIService } from './aiService';
import { envConfig, hasProviderCredential } from '../config';

export type AITaskType =
  | 'market-research'
  | 'naming'
  | 'chapter-writing'
  | 'editorial-rewrite'
  | 'audit'
  | 'visual-prompt'
  | 'rhythm'
  | 'metadata'
  | 'publishing'
  | 'general';

type ProviderCapability = 'research' | 'writing' | 'rewrite' | 'audit' | 'visualPrompt' | 'image' | 'speed' | 'fallback';

export type ProviderStatus = {
  provider: string;
  label: string;
  type: 'text' | 'image' | 'router';
  configured: boolean;
  usableByTextEngine: boolean;
  model?: string;
  role: string;
  status: 'Listo' | 'No configurado';
  capabilities: ProviderCapability[];
};

export type OrchestratedAIResult<T> = AIResult<T> & {
  taskType: AITaskType;
  providerChain: AIProvider[];
  selectedProvider: string;
  latencyMs: number;
  fallbackUsed: boolean;
  qualityScore: number;
  humanReadableError?: string;
};

const textProviderMeta: Record<AIProvider, Omit<ProviderStatus, 'configured' | 'model' | 'status' | 'usableByTextEngine'>> = {
  openai: {
    provider: 'openai',
    label: 'OpenAI',
    type: 'text',
    role: 'Reescritura premium, prompts visuales, metadata y cierre editorial.',
    capabilities: ['writing', 'rewrite', 'audit', 'visualPrompt'],
  },
  gemini: {
    provider: 'gemini',
    label: 'Gemini',
    type: 'text',
    role: 'Investigación, naming, coherencia, auditoría y análisis amplio.',
    capabilities: ['research', 'audit', 'visualPrompt'],
  },
  groq: {
    provider: 'groq',
    label: 'Groq',
    type: 'text',
    role: 'Generación rápida, prompts visuales y fallback veloz.',
    capabilities: ['writing', 'visualPrompt', 'speed', 'fallback'],
  },
  openrouter: {
    provider: 'openrouter',
    label: 'OpenRouter',
    type: 'router',
    role: 'Router alternativo para investigación y generación cuando el proveedor principal falla.',
    capabilities: ['research', 'writing', 'fallback'],
  },
  mistral: {
    provider: 'mistral',
    label: 'Mistral',
    type: 'text',
    role: 'Auditoría, reescritura concisa y validación semántica.',
    capabilities: ['rewrite', 'audit', 'fallback'],
  },
  cerebras: {
    provider: 'cerebras',
    label: 'Cerebras',
    type: 'text',
    role: 'Generación larga rápida y expansión de capítulos.',
    capabilities: ['writing', 'speed'],
  },
  deepseek: {
    provider: 'deepseek',
    label: 'DeepSeek',
    type: 'text',
    role: 'Generación extensa, razonamiento editorial y compactación de ritmo.',
    capabilities: ['writing', 'rewrite', 'fallback'],
  },
  together: {
    provider: 'together',
    label: 'Together',
    type: 'router',
    role: 'Proveedor alternativo para modelos abiertos y fallback de escritura.',
    capabilities: ['writing', 'fallback'],
  },
  fireworks: {
    provider: 'fireworks',
    label: 'Fireworks',
    type: 'router',
    role: 'Proveedor alternativo para modelos rápidos de escritura.',
    capabilities: ['writing', 'speed', 'fallback'],
  },
  cohere: {
    provider: 'cohere',
    label: 'Cohere',
    type: 'text',
    role: 'Clasificación, resumen, auditoría semántica y reescritura breve.',
    capabilities: ['rewrite', 'audit', 'research'],
  },
};

const imageProviderMeta = [
  {
    provider: 'stability',
    label: 'Stability AI',
    envKey: 'STABILITY_API_KEY',
    role: 'Imágenes generativas para portadas y láminas cuando se active flujo externo.',
  },
  {
    provider: 'replicate',
    label: 'Replicate',
    envKey: 'REPLICATE_API_KEY',
    role: 'Modelos visuales externos para assets premium reemplazables.',
  },
  {
    provider: 'fal',
    label: 'fal.ai',
    envKey: 'FAL_API_KEY',
    role: 'Generación visual rápida para variantes de assets.',
  },
  {
    provider: 'huggingface',
    label: 'Hugging Face',
    envKey: 'HUGGINGFACE_API_KEY',
    role: 'Modelos abiertos de texto o imagen según integración futura.',
  },
  {
    provider: 'pollinations',
    label: 'Pollinations',
    envKey: 'POLLINATIONS_API_KEY',
    role: 'Generación visual experimental y fallback creativo.',
  },
  {
    provider: 'cloudflare',
    label: 'Cloudflare AI',
    envKey: 'CLOUDFLARE_API_KEY',
    role: 'Gateway o Workers AI si se configuran cuenta/modelos más adelante.',
  },
];

const taskRoutes: Record<AITaskType, AIProvider[]> = {
  'market-research': ['gemini', 'openai', 'openrouter', 'deepseek'],
  naming: ['gemini', 'openai', 'openrouter', 'deepseek'],
  'chapter-writing': ['deepseek', 'cerebras', 'groq', 'openai'],
  'editorial-rewrite': ['openai', 'deepseek', 'gemini', 'groq'],
  audit: ['gemini', 'openai', 'cohere', 'mistral'],
  'visual-prompt': ['openai', 'gemini', 'groq'],
  rhythm: ['deepseek', 'openai', 'groq'],
  metadata: ['openai', 'gemini', 'deepseek', 'groq'],
  publishing: ['openai', 'gemini', 'cohere', 'groq'],
  general: ['cerebras', 'deepseek', 'groq', 'gemini', 'cohere', 'openrouter', 'mistral', 'together', 'fireworks', 'openai'],
};

const envKeyByProvider: Record<AIProvider, string> = {
  openai: 'OPENAI_API_KEY',
  gemini: 'GEMINI_API_KEY',
  groq: 'GROQ_API_KEY',
  openrouter: 'OPENROUTER_API_KEY',
  mistral: 'MISTRAL_API_KEY',
  cerebras: 'CEREBRAS_API_KEY',
  deepseek: 'DEEPSEEK_API_KEY',
  together: 'TOGETHER_API_KEY',
  fireworks: 'FIREWORKS_API_KEY',
  cohere: 'COHERE_API_KEY',
};

function modelForProvider(provider: AIProvider) {
  const models: Record<AIProvider, string> = {
    openai: envConfig.models.openai || envConfig.ai.model || 'gpt-4o',
    gemini: envConfig.models.gemini || envConfig.ai.model || 'gemini-2.5-flash',
    groq: envConfig.models.groq || envConfig.ai.model || 'llama-3.3-70b-versatile',
    openrouter: envConfig.models.openrouter || 'openrouter/free',
    mistral: envConfig.models.mistral || 'mistral-small-latest',
    cerebras: envConfig.models.cerebras || 'gpt-oss-120b',
    deepseek: envConfig.models.deepseek || 'deepseek-chat',
    together: envConfig.models.together || 'meta-llama/Llama-3.3-70B-Instruct-Turbo-Free',
    fireworks: envConfig.models.fireworks || 'accounts/fireworks/models/llama-v3p1-70b-instruct',
    cohere: envConfig.models.cohere || 'command-a-03-2025',
  };
  return models[provider];
}

function hasUsableValue(value?: string) {
  return Boolean(value && !/^(changeme|xxx|your_|placeholder)$/i.test(value.trim()));
}

function uniqueProviders(providers: AIProvider[]) {
  return Array.from(new Set(providers));
}

export function providerChainForTask(taskType: AITaskType) {
  const configured = envConfig.ai.providerOrder
    .split(',')
    .map((provider) => provider.trim().toLowerCase())
    .filter((provider): provider is AIProvider => provider in textProviderMeta);
  if (envConfig.ai.provider !== 'auto') {
    const selected = envConfig.ai.provider;
    if (selected in textProviderMeta) return [selected as AIProvider];
  }
  return uniqueProviders([...(taskRoutes[taskType] || taskRoutes.general), ...configured]);
}

export function aiProviderInventory(): ProviderStatus[] {
  const textProviders = (Object.keys(textProviderMeta) as AIProvider[]).map((provider) => {
    const configured = hasProviderCredential(provider);
    return {
      ...textProviderMeta[provider],
      configured,
      usableByTextEngine: true,
      model: modelForProvider(provider),
      status: configured ? 'Listo' as const : 'No configurado' as const,
    };
  });

  const imageProviders: ProviderStatus[] = imageProviderMeta.map((provider) => {
    const configured = hasUsableValue(process.env[provider.envKey]);
    return {
      provider: provider.provider,
      label: provider.label,
      type: 'image',
      configured,
      usableByTextEngine: false,
      role: provider.role,
      status: configured ? 'Listo' : 'No configurado',
      capabilities: ['image'],
    };
  });

  return [...textProviders, ...imageProviders];
}

export function humanizeAIError(error?: string) {
  if (!error) return undefined;
  if (/API key|invalid|unauthorized|forbidden|401|403/i.test(error)) return 'Falla credencial: revisa la API key del proveedor.';
  if (/429|rate|quota|tokens per day|insufficient_quota/i.test(error)) return 'Sin cuota o limitado temporalmente: Cervantes usará otro motor disponible.';
  if (/timeout|aborted/i.test(error)) return 'Lento o sin respuesta: se omitió temporalmente para no bloquear el flujo.';
  if (/missing/i.test(error)) return 'Proveedor no configurado: falta su clave en .env.';
  return 'La IA no entregó una respuesta usable; se intentó con el siguiente proveedor.';
}

function estimateQualityScore(result: AIResult<unknown>, latencyMs: number) {
  if (result.error || result.provider === 'template') return 45;
  const serialized = JSON.stringify(result.data || {});
  const lengthScore = Math.min(30, Math.floor(serialized.length / 260));
  const latencyPenalty = latencyMs > 20000 ? 10 : latencyMs > 10000 ? 4 : 0;
  return Math.max(55, Math.min(96, 70 + lengthScore - latencyPenalty));
}

export class AIOrchestrator {
  providers() {
    const inventory = aiProviderInventory();
    const textReady = inventory.filter((provider) => provider.usableByTextEngine && provider.configured).length;
    const imageReady = inventory.filter((provider) => provider.type === 'image' && provider.configured).length;
    return {
      mode: envConfig.ai.provider,
      activeTextProviders: textReady,
      activeImageProviders: imageReady,
      defaultChain: providerChainForTask('general'),
      taskRoutes,
      providers: inventory,
    };
  }

  async run<T>(taskType: AITaskType, templateData: T, prompt: string): Promise<OrchestratedAIResult<T>> {
    const providerChain = providerChainForTask(taskType);
    const ai = new AIService();
    const started = Date.now();
    let result: AIResult<T> | null = null;

    for (const provider of providerChain) {
      if (!hasProviderCredential(provider)) continue;
      result = await ai.generate(templateData, { engine: taskType, prompt, provider });
      if (!result.error && result.provider !== 'template') break;
    }

    if (!result) {
      result = await ai.generate(templateData, { engine: taskType, prompt });
    }

    const latencyMs = Date.now() - started;
    return {
      ...result,
      taskType,
      providerChain,
      selectedProvider: result.provider,
      latencyMs,
      fallbackUsed: result.provider === 'template' || Boolean(result.error),
      qualityScore: estimateQualityScore(result, latencyMs),
      humanReadableError: humanizeAIError(result.error),
    };
  }

  async smokeTest(providers?: string[]) {
    const candidates = providers?.length
      ? providers.filter((provider): provider is AIProvider => provider in textProviderMeta)
      : (Object.keys(textProviderMeta) as AIProvider[]).filter((provider) => hasProviderCredential(provider));
    const ai = new AIService();
    const results = [];
    for (const provider of candidates) {
      const started = Date.now();
      const result = await ai.generate(
        { content: 'fallback' },
        {
          provider,
          engine: 'provider-smoke-test',
          prompt: 'Return JSON only: {"content":"ok"}',
        },
      );
      const ok = !result.error && result.provider === provider && String((result.data as { content?: unknown })?.content || '').toLowerCase().includes('ok');
      results.push({
        provider,
        label: textProviderMeta[provider].label,
        status: ok ? 'Listo' : humanizeAIError(result.error) || 'No respondió correctamente',
        ok,
        model: modelForProvider(provider),
        latencyMs: Date.now() - started,
      });
    }
    return { testedAt: new Date().toISOString(), results };
  }
}
