export type AIResult<T> = {
  provider: 'template' | 'openai' | 'gemini' | 'groq';
  model?: string;
  data: T;
  prompt?: string;
  error?: string;
};

type AIProvider = Exclude<AIResult<unknown>['provider'], 'template'>;

const systemPrompt =
  'You are Cervantes, a production editorial engine. Return strict JSON only. Preserve all required fields and avoid unsupported claims.';

export class AIService {
  private provider = (process.env.AI_PROVIDER || 'auto').toLowerCase();
  private providers: Record<AIProvider, { apiKey?: string; model: string }> = {
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || process.env.AI_MODEL || 'gpt-4o',
    },
    gemini: {
      apiKey: process.env.GEMINI_API_KEY,
      model: process.env.GEMINI_MODEL || process.env.AI_MODEL || 'gemini-2.5-flash',
    },
    groq: {
      apiKey: process.env.GROQ_API_KEY,
      model: process.env.GROQ_MODEL || process.env.AI_MODEL || 'llama-3.3-70b-versatile',
    },
  };

  async generate<T>(templateData: T, options: { engine?: string; prompt?: string } = {}): Promise<AIResult<T>> {
    if (!options.prompt) {
      return {
        provider: 'template',
        data: templateData,
        prompt: options.prompt,
      };
    }

    const errors: string[] = [];
    for (const provider of this.providerChain()) {
      const config = this.providers[provider];
      if (!config.apiKey) {
        errors.push(`${provider}: API key missing`);
        continue;
      }

      try {
        const data = provider === 'gemini'
          ? await this.callGemini<T>(options.prompt, templateData, config.apiKey, config.model)
          : await this.callOpenAICompatible<T>(
              provider,
              provider === 'openai' ? 'https://api.openai.com/v1/chat/completions' : 'https://api.groq.com/openai/v1/chat/completions',
              options.prompt,
              templateData,
              config.apiKey,
              config.model,
            );

        return {
          provider,
          model: config.model,
          data,
          prompt: options.prompt,
        };
      } catch (error) {
        errors.push(`${provider}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return {
      provider: 'template',
      data: templateData,
      prompt: options.prompt,
      error: errors.join(' | ') || 'No AI provider configured',
    };
  }

  private providerChain(): AIProvider[] {
    if (this.provider === 'template') {
      return [];
    }
    if (this.provider === 'openai' || this.provider === 'gemini' || this.provider === 'groq') {
      return [this.provider];
    }
    return ['openai', 'gemini', 'groq'];
  }

  private async callOpenAICompatible<T>(
    provider: AIProvider,
    endpoint: string,
    prompt: string,
    templateData: T,
    apiKey: string,
    model: string,
  ): Promise<T> {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          { role: 'user', content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`${provider} request failed: ${response.status}`);
    }

    const json = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = json.choices?.[0]?.message?.content;
    if (!content) throw new Error(`${provider} returned an empty response`);

    return this.parseProviderJson(content, templateData);
  }

  private async callGemini<T>(prompt: string, templateData: T, apiKey: string, model: string): Promise<T> {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
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
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          responseMimeType: 'application/json',
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
      throw new Error(`gemini request failed: ${response.status}${body ? ` ${body.slice(0, 300)}` : ''}`);
    }

    const json = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const content = json.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('').trim();
    if (!content) throw new Error('gemini returned an empty response');

    return this.parseProviderJson(content, templateData);
  }

  private parseProviderJson<T>(content: string, templateData: T): T {
    let cleanContent = content.replace(/```(?:json)?\s*/g, '').replace(/```\s*$/g, '').trim();
    if (cleanContent.startsWith('```')) cleanContent = cleanContent.replace(/^```\s*/, '');
    const parsed = JSON.parse(cleanContent) as unknown;
    
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
    });
    return {
      ...result,
    };
  }
}
