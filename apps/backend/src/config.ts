import dotenv from 'dotenv';
import path from 'path';

// Cargar .env desde la raíz del proyecto
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
// Fallback en caso de que esté en el directorio de backend
dotenv.config();

function maskSecret(secret?: string): string {
  if (!secret) return 'ausente';
  if (secret === 'changeme' || secret === 'your_api_key_here') return 'no configurado';
  return 'presente';
}

export const envConfig = {
  ai: {
    provider: process.env.AI_PROVIDER || 'auto',
    model: process.env.AI_MODEL,
    providerOrder: process.env.AI_PROVIDER_ORDER || '',
    requestTimeoutMs: Number(process.env.AI_REQUEST_TIMEOUT_MS) || 30000,
    maxAttempts: Number(process.env.AI_MAX_ATTEMPTS) || 3,
  },
  credentials: {
    openai: process.env.OPENAI_API_KEY,
    gemini: process.env.GEMINI_API_KEY,
    groq: process.env.GROQ_API_KEY,
    openrouter: process.env.OPENROUTER_API_KEY,
    mistral: process.env.MISTRAL_API_KEY,
    cerebras: process.env.CEREBRAS_API_KEY,
    deepseek: process.env.DEEPSEEK_API_KEY,
    together: process.env.TOGETHER_API_KEY,
    fireworks: process.env.FIREWORKS_API_KEY,
    cohere: process.env.COHERE_API_KEY,
  },
  models: {
    openai: process.env.OPENAI_MODEL,
    gemini: process.env.GEMINI_MODEL,
    groq: process.env.GROQ_MODEL,
    openrouter: process.env.OPENROUTER_MODEL,
    mistral: process.env.MISTRAL_MODEL,
    cerebras: process.env.CEREBRAS_MODEL,
    deepseek: process.env.DEEPSEEK_MODEL,
    together: process.env.TOGETHER_MODEL,
    fireworks: process.env.FIREWORKS_MODEL,
    cohere: process.env.COHERE_MODEL,
  },
  databaseUrl: process.env.DATABASE_URL,
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  isTest: process.env.NODE_ENV === 'test' || process.env.VITEST,
  aiTestExternal: process.env.AI_TEST_EXTERNAL === 'true',
};

// Validar estado de credenciales (usar en logs en lugar de imprimir process.env entero)
export function getCredentialsStatus() {
  return {
    openai: maskSecret(envConfig.credentials.openai),
    gemini: maskSecret(envConfig.credentials.gemini),
    groq: maskSecret(envConfig.credentials.groq),
    openrouter: maskSecret(envConfig.credentials.openrouter),
    mistral: maskSecret(envConfig.credentials.mistral),
    cerebras: maskSecret(envConfig.credentials.cerebras),
    deepseek: maskSecret(envConfig.credentials.deepseek),
    together: maskSecret(envConfig.credentials.together),
    fireworks: maskSecret(envConfig.credentials.fireworks),
    cohere: maskSecret(envConfig.credentials.cohere),
  };
}

export function hasProviderCredential(provider: string): boolean {
  const creds = envConfig.credentials as Record<string, string | undefined>;
  const key = creds[provider];
  return Boolean(key && !/^(changeme|xxx|your_|placeholder)$/i.test(key.trim()));
}
