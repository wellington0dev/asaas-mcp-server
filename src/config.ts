import { z } from 'zod';

const envSchema = z.object({
  ASAAS_API_KEY: z.string().min(1, 'ASAAS_API_KEY is required'),
  ASAAS_API_URL: z.string().url().default('https://api-sandbox.asaas.com/v3'),
  ASAAS_WEBHOOK_AUTH_TOKEN: z.string().optional(),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  HTTP_TIMEOUT_MS: z.coerce.number().int().positive().default(30000),
  HTTP_MAX_RETRIES: z.coerce.number().int().min(0).max(5).default(3),
  HTTP_RETRY_DELAY_MS: z.coerce.number().int().positive().default(1000),
});

export type Config = z.infer<typeof envSchema>;

let cachedConfig: Config | null = null;

export function getConfig(): Config {
  if (cachedConfig) {
    return cachedConfig;
  }

  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
    throw new Error(`Configuration validation failed: ${errors}`);
  }

  cachedConfig = result.data;
  return cachedConfig;
}

export function resetConfig(): void {
  cachedConfig = null;
}

export const ASAAS_API_VERSION = 'v3';
export const MAX_PAYMENTS_PER_REQUEST = 100;
export const DEFAULT_PAGE_LIMIT = 50;
