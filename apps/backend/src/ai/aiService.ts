import { envConfig, getCredentialsStatus } from '../config';

export type AIResult<T> = {
  provider: 'template' | 'openai' | 'gemini' | 'groq' | 'openrouter' | 'mistral' | 'cerebras' | 'deepseek' | 'together' | 'fireworks' | 'cohere';
  model?: string;
  data: T;
  prompt?: string;
  error?: string;
};

export type AIProvider = Exclude<AIResult<unknown>['provider'], 'template'>;

const systemPrompt =
  'You are Cervantes, a production editorial engine. Return strict JSON only. NEVER use markdown blocks like ```json around the response. NEVER inject internal tags like "paragraph" or "checklist" as visible text. Do not invent unverified statistics. Preserve all required fields and avoid unsupported claims. If a claim requires verification, mark it with requiresVerification: true.';

export class AIService {
  private static providerCooldowns = new Map<AIProvider, number>();
  private provider = envConfig.ai.provider;
  private requestTimeoutMs = envConfig.ai.requestTimeoutMs;
  private maxAttempts = envConfig.ai.maxAttempts;
  private providers: Record<AIProvider, { apiKey?: string; model: string }> = {
    openai: {
      apiKey: envConfig.credentials.openai,
      model: envConfig.models.openai || envConfig.ai.model || 'gpt-4o',
    },
    gemini: {
      apiKey: envConfig.credentials.gemini,
      model: envConfig.models.gemini || envConfig.ai.model || 'gemini-2.5-flash',
    },
    groq: {
      apiKey: envConfig.credentials.groq,
      model: envConfig.models.groq || envConfig.ai.model || 'llama-3.3-70b-versatile',
    },
    openrouter: {
      apiKey: envConfig.credentials.openrouter,
      model: envConfig.models.openrouter || 'openrouter/free',
    },
    mistral: {
      apiKey: envConfig.credentials.mistral,
      model: envConfig.models.mistral || 'mistral-small-latest',
    },
    cerebras: {
      apiKey: envConfig.credentials.cerebras,
      model: envConfig.models.cerebras || 'gpt-oss-120b',
    },
    deepseek: {
      apiKey: envConfig.credentials.deepseek,
      model: envConfig.models.deepseek || 'deepseek-chat',
    },
    together: {
      apiKey: envConfig.credentials.together,
      model: envConfig.models.together || 'meta-llama/Llama-3.3-70B-Instruct-Turbo-Free',
    },
    fireworks: {
      apiKey: envConfig.credentials.fireworks,
      model: envConfig.models.fireworks || 'accounts/fireworks/models/llama-v3p1-70b-instruct',
    },
    cohere: {
      apiKey: envConfig.credentials.cohere,
      model: envConfig.models.cohere || 'command-a-03-2025',
    },
  };

  async generate<T>(templateData: T, options: { engine?: string; prompt?: string; provider?: AIProvider; maxTokens?: number; base64Image?: string } = {}): Promise<AIResult<T>> {
    if (!options.prompt) {
      return {
        provider: 'template',
        data: templateData,
        prompt: options.prompt,
      };
    }
    if (envConfig.isTest && !envConfig.aiTestExternal) {
      return {
        provider: 'template',
        data: templateData,
        prompt: options.prompt,
      };
    }

    const errors: string[] = [];
    const chain = options.provider ? [options.provider] : this.providerChain(options.engine);
    
    for (const provider of chain) {
      const cooldownUntil = AIService.providerCooldowns.get(provider) || 0;
      if (cooldownUntil > Date.now()) {
        errors.push(`${provider}: temporarily skipped after recent provider failure`);
        continue;
      }
      const config = this.providerConfig(provider);
      if (!config.apiKey) {
        errors.push(`${provider}: API key missing`);
        continue;
      }

      try {
        const maxTokens = options.maxTokens || this.defaultMaxTokens(options.engine);
        const data = provider === 'gemini'
          ? await this.callGemini<T>(options.prompt, templateData, config.apiKey, config.model, options.base64Image)
          : provider === 'cohere'
            ? await this.callCohere<T>(options.prompt, templateData, config.apiKey, config.model, maxTokens)
            : await this.callOpenAICompatible<T>(
              provider,
              this.openAICompatibleEndpoint(provider),
              options.prompt,
              templateData,
              config.apiKey,
              config.model,
              maxTokens,
              options.base64Image
            );

        return {
          provider,
          model: config.model,
          data,
          prompt: options.prompt,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.cooldownProvider(provider, message);
        errors.push(`${provider}: ${message}`);
      }
    }

    return {
      provider: 'template',
      data: templateData,
      prompt: options.prompt,
      error: errors.join(' | ') || 'No AI provider configured',
    };
  }

  private providerChain(engine?: string): AIProvider[] {
    if (this.provider === 'template') {
      return [];
    }
    if (this.isProvider(this.provider)) {
      return [this.provider];
    }
    const taskRoute = this.taskProviderChain(engine);
    const configured = envConfig.ai.providerOrder
      .split(',')
      .map(provider => provider.trim().toLowerCase())
      .filter((provider): provider is AIProvider => this.isProvider(provider));
    if (taskRoute.length > 0) {
      return Array.from(new Set([...taskRoute, ...configured]));
    }
    if (configured.length > 0) return configured;
    return ['cerebras', 'deepseek', 'groq', 'gemini', 'cohere', 'openrouter', 'mistral', 'together', 'fireworks', 'openai'];
  }

  private taskProviderChain(engine?: string): AIProvider[] {
    if (!engine) return [];
    if (/market|research|language|naming|go-nogo/i.test(engine)) return ['gemini', 'openai', 'openrouter', 'deepseek', 'groq', 'cerebras', 'cohere'];
    if (/chapter|blocks|writer/i.test(engine)) return ['deepseek', 'cerebras', 'groq', 'openai', 'cohere'];
    if (/rewrite|rhythm|recovery/i.test(engine)) return ['deepseek', 'openai', 'groq', 'cerebras', 'cohere'];
    if (/audit|quality|claim|compliance/i.test(engine)) return ['gemini', 'openai', 'cohere', 'mistral', 'groq', 'cerebras'];
    if (/visual|art|prompt|cover/i.test(engine)) return ['openai', 'gemini', 'groq', 'cerebras', 'cohere'];
    if (/metadata|publishing/i.test(engine)) return ['openai', 'gemini', 'cohere', 'groq', 'cerebras'];
    return [];
  }

  private defaultMaxTokens(engine?: string): number {
    if (!engine) return 4000;
    if (/chapter|blocks|writer|rewrite|recovery/i.test(engine)) return 8192;
    return 4000;
  }

  private providerConfig(provider: AIProvider) {
    return this.providers[provider];
  }

  private isProvider(provider: string): provider is AIProvider {
    return provider === 'openai'
      || provider === 'gemini'
      || provider === 'groq'
      || provider === 'openrouter'
      || provider === 'mistral'
      || provider === 'cerebras'
      || provider === 'deepseek'
      || provider === 'together'
      || provider === 'fireworks'
      || provider === 'cohere';
  }

  private openAICompatibleEndpoint(provider: AIProvider) {
    if (provider === 'openai') return 'https://api.openai.com/v1/chat/completions';
    if (provider === 'openrouter') return 'https://openrouter.ai/api/v1/chat/completions';
    if (provider === 'mistral') return 'https://api.mistral.ai/v1/chat/completions';
    if (provider === 'cerebras') return 'https://api.cerebras.ai/v1/chat/completions';
    if (provider === 'deepseek') return 'https://api.deepseek.com/chat/completions';
    if (provider === 'together') return 'https://api.together.xyz/v1/chat/completions';
    if (provider === 'fireworks') return 'https://api.fireworks.ai/inference/v1/chat/completions';
    return 'https://api.groq.com/openai/v1/chat/completions';
  }

  private cooldownProvider(provider: AIProvider, message: string) {
    const invalidCredentials = /request failed:\s*(400|401|403)|API key|invalid|unauthorized|forbidden/i.test(message);
    const quotaOrTimeout = /429|rate|quota|timeout/i.test(message);
    if (!invalidCredentials && !quotaOrTimeout) return;
    const durationMs = invalidCredentials ? 10 * 60 * 1000 : 60 * 1000;
    AIService.providerCooldowns.set(provider, Date.now() + durationMs);
  }

  private supportsJsonResponseFormat(provider: AIProvider) {
    return provider === 'openai' || provider === 'groq' || provider === 'mistral' || provider === 'cerebras' || provider === 'deepseek';
  }

  private async callOpenAICompatible<T>(
    provider: AIProvider,
    endpoint: string,
    prompt: string,
    templateData: T,
    apiKey: string,
    model: string,
    maxTokens: number = 4000,
    base64Image?: string
  ): Promise<T> {
    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
      try {
        const userMessageContent: any = base64Image
          ? [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: `data:image/png;base64,${base64Image}` } }
            ]
          : prompt;

        const response = await this.fetchWithTimeout(endpoint, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            ...(provider === 'openrouter'
              ? {
                  'HTTP-Referer': process.env.APP_PUBLIC_URL || 'http://localhost:5173',
                  'X-Title': 'Cervantes Local Editorial Engine',
                }
              : {}),
          },
          body: JSON.stringify({
            model,
            temperature: 0.3,
            max_tokens: maxTokens,
            ...(this.supportsJsonResponseFormat(provider) ? { response_format: { type: 'json_object' } } : {}),
            messages: [
              {
                role: 'system',
                content: systemPrompt,
              },
              { role: 'user', content: userMessageContent },
            ],
          }),
        });

        if (!response.ok) {
          const body = await response.text().catch(() => '');
          if (response.status === 429 && attempt < this.maxAttempts && !/tokens per day|TPD|daily|insufficient_quota/i.test(body)) {
            await new Promise(r => setTimeout(r, attempt * 8000));
            continue;
          }
          throw new Error(`${provider} request failed: ${response.status} ${body}`);
        }

        const json = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
        const content = json.choices?.[0]?.message?.content;
        if (!content) throw new Error(`${provider} returned an empty response`);

        return this.parseProviderJson(content, templateData);
      } catch (err) {
        lastError = err as Error;
        if (/request failed:\s*(400|401|403)/i.test(lastError.message)) break;
      }
    }
    throw lastError;
  }

  private async callGemini<T>(prompt: string, templateData: T, apiKey: string, model: string, base64Image?: string): Promise<T> {
    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
      try {
        const parts: any[] = [{ text: prompt }];
        if (base64Image) {
          parts.push({
            inline_data: {
              mime_type: 'image/png',
              data: base64Image
            }
          });
        }

        const response = await this.fetchWithTimeout(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
          method: 'POST',
          headers: {
            'x-goog-api-key': apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            system_instruction: {
              parts: [{ text: systemPrompt }],
            },
            contents: [
              {
                parts,
              },
            ],
            generationConfig: {
              temperature: 0.3,
            },
            safetySettings: [
              { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
              { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
              { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
              { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
            ],
          }),
        });

        if (!response.ok) {
          const body = await response.text().catch(() => '');
          if (response.status === 429 && attempt < this.maxAttempts) {
            await new Promise(res => setTimeout(res, attempt * 2000));
            continue;
          }
          throw new Error(`gemini request failed: ${response.status}${body ? ` ${body.slice(0, 300)}` : ''}`);
        }

        const json = (await response.json()) as {
          candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        };
        const content = json.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('').trim();
        if (!content) throw new Error('gemini returned an empty response');

        return this.parseProviderJson(content, templateData);
      } catch (err) {
        lastError = err as Error;
        if (/gemini request failed:\s*(400|401|403)/i.test(lastError.message)) break;
        if (attempt < 4) {
          await new Promise(res => setTimeout(res, attempt * 2000));
        }
      }
    }
    throw lastError;
  }

  private async callCohere<T>(prompt: string, templateData: T, apiKey: string, model: string, maxTokens: number = 4000): Promise<T> {
    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
      try {
        const response = await this.fetchWithTimeout('https://api.cohere.com/v2/chat', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'X-Client-Name': 'Cervantes Local Editorial Engine',
          },
          body: JSON.stringify({
            model,
            max_tokens: maxTokens,
            temperature: 0.3,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: prompt },
            ],
          }),
        });

        if (!response.ok) {
          const body = await response.text().catch(() => '');
          if (response.status === 429 && attempt < this.maxAttempts) {
            await new Promise(res => setTimeout(res, attempt * 3000));
            continue;
          }
          throw new Error(`cohere request failed: ${response.status}${body ? ` ${body.slice(0, 300)}` : ''}`);
        }

        const json = (await response.json()) as {
          message?: { content?: Array<{ type?: string; text?: string }> };
        };
        const content = json.message?.content?.map((part) => part.text || '').join('').trim();
        if (!content) throw new Error('cohere returned an empty response');

        return this.parseProviderJson(content, templateData);
      } catch (err) {
        lastError = err as Error;
        if (/cohere request failed:\s*(400|401|403)/i.test(lastError.message)) break;
      }
    }
    throw lastError;
  }

  private async fetchWithTimeout(url: string, init: RequestInit) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.requestTimeoutMs);
    try {
      return await fetch(url, { ...init, signal: controller.signal });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`AI request timeout after ${this.requestTimeoutMs}ms`);
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  private parseProviderJson<T>(content: string, templateData: T): T {
    let cleanContent = content.replace(/```(?:json)?\s*/g, '').replace(/```\s*$/g, '').trim();
    if (cleanContent.startsWith('```')) cleanContent = cleanContent.replace(/^```\s*/, '');
    
    let parsed: unknown;
    try {
      parsed = JSON.parse(cleanContent);
    } catch (e) {
      if (typeof templateData === 'object' && templateData !== null && 'content' in templateData) {
        let rescued = cleanContent;
        rescued = rescued.replace(/^\{\s*"content"\s*:\s*"/i, '');
        rescued = rescued.replace(/"\}$/, '');
        rescued = rescued.replace(/\\n/g, '\n');
        rescued = rescued.replace(/\\"/g, '"');
        return { ...templateData, content: rescued } as unknown as T;
      }
      throw e;
    }
    
    if (Array.isArray(templateData) && !Array.isArray(parsed)) {
      const obj = parsed as Record<string, unknown>;
      const firstArray = Object.values(obj).find(val => Array.isArray(val));
      if (firstArray) return firstArray as T;
      return templateData;
    }
    
    if (typeof templateData === 'object' && templateData !== null && !Array.isArray(templateData) && typeof parsed === 'object' && parsed !== null) {
      const parsedObj = parsed as Record<string, unknown>;
      const keys = Object.keys(parsedObj);
      if (keys.length === 1 && typeof parsedObj[keys[0]] === 'object' && parsedObj[keys[0]] !== null) {
        return parsedObj[keys[0]] as T;
      }
    }
    
    return parsed as T;
  }

  async log<T>(
    projectId: number | null,
    engine: string,
    result: AIResult<T>,
    persist: (data: {
      projectId?: number;
      engine: string;
      provider: string;
      model?: string;
      prompt?: string;
      result?: string;
      status: string;
      error?: string;
      taskType?: string;
      providerChain?: string;
      selectedProvider?: string;
      fallbackUsed?: boolean;
      humanReadableError?: string;
    }) => Promise<unknown>,
  ) {
    await persist({
      projectId: projectId || undefined,
      engine,
      provider: result.provider,
      model: result.model,
      prompt: result.prompt,
      result: JSON.stringify(result.data),
      status: result.error ? 'FALLBACK' : 'DONE',
      error: result.error,
      taskType: engine,
      selectedProvider: result.provider,
      fallbackUsed: result.provider === 'template' || Boolean(result.error),
      humanReadableError: result.error,
    });
    return {
      ...result,
    };
  }
}
