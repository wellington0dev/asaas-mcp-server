import { getConfig } from '../config.js';
import { AsaasError, AsaasRateLimitError, mapAsaasError, isRetryableError } from './errors.js';
import { logger } from '../utils/logging.js';

interface RequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined> | undefined;
  idempotencyKey?: string | undefined;
  retryable?: boolean | undefined;
}

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

export class AsaasClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly timeout: number;
  private readonly retryConfig: RetryConfig;

  constructor(baseUrl?: string, apiKey?: string, timeout?: number) {
    const config = getConfig();
    this.baseUrl = (baseUrl || config.ASAAS_API_URL).replace(/\/$/, '');
    this.apiKey = apiKey || config.ASAAS_API_KEY;
    this.timeout = timeout || config.HTTP_TIMEOUT_MS;
    this.retryConfig = {
      maxRetries: config.HTTP_MAX_RETRIES,
      baseDelay: config.HTTP_RETRY_DELAY_MS,
      maxDelay: 10000,
    };
  }

  private buildUrl(
    path: string,
    query?: Record<string, string | number | boolean | undefined>
  ): string {
    const url = new URL(`${this.baseUrl}${path}`);
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    return url.toString();
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private calculateDelay(attempt: number): number {
    const delay = this.retryConfig.baseDelay * Math.pow(2, attempt);
    return Math.min(delay, this.retryConfig.maxDelay);
  }

  async request<T>(options: RequestOptions): Promise<T> {
    const { method, path, body, query, idempotencyKey, retryable = true } = options;
    const url = this.buildUrl(path, query);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'asaas-mcp-server/1.0.0',
      access_token: this.apiKey,
    };

    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }

    const requestBody = body ? JSON.stringify(body) : undefined;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      const startTime = Date.now();
      const requestId = crypto.randomUUID();

      logger.debug(
        {
          requestId,
          method,
          path,
          attempt: attempt + 1,
          maxRetries: this.retryConfig.maxRetries + 1,
        },
        'HTTP request started'
      );

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const fetchOptions: RequestInit = {
          method,
          headers,
          signal: controller.signal,
        };

        if (requestBody !== undefined) {
          fetchOptions.body = requestBody;
        }

        const response = await fetch(url, fetchOptions);

        clearTimeout(timeoutId);
        const duration = Date.now() - startTime;

        const responseText = await response.text();
        let responseData: unknown;

        try {
          responseData = responseText ? JSON.parse(responseText) : null;
        } catch {
          responseData = responseText;
        }

        if (!response.ok) {
          const error = mapAsaasError(response.status, responseData);
          logger.warn(
            {
              requestId,
              method,
              path,
              status: response.status,
              errorCode: error.code,
              duration,
            },
            'HTTP request failed'
          );

          if (attempt < this.retryConfig.maxRetries && retryable && isRetryableError(error)) {
            if (error instanceof AsaasRateLimitError && error.retryAfter) {
              await this.sleep(error.retryAfter * 1000);
            } else {
              await this.sleep(this.calculateDelay(attempt));
            }
            continue;
          }

          throw error;
        }

        logger.info(
          {
            requestId,
            method,
            path,
            status: response.status,
            duration,
          },
          'HTTP request succeeded'
        );

        return responseData as T;
      } catch (error) {
        const duration = Date.now() - startTime;
        lastError = error instanceof Error ? error : new Error(String(error));

        if (error instanceof AsaasError) {
          throw error;
        }

        if (error instanceof DOMException && error.name === 'AbortError') {
          logger.warn({ requestId, method, path, duration }, 'HTTP request timeout');
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          throw new AsaasError('ASAAS_TIMEOUT', 'Request timeout', 408);
        }

        logger.error(
          { requestId, method, path, error: lastError.message, duration },
          'HTTP request error'
        );

        if (attempt < this.retryConfig.maxRetries && retryable) {
          await this.sleep(this.calculateDelay(attempt));
          continue;
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        throw new AsaasError('ASAAS_REQUEST_FAILED', `Request failed: ${lastError.message}`, 500, {
          originalError: lastError.message,
        });
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    throw lastError ?? new AsaasError('ASAAS_REQUEST_FAILED', 'Max retries exceeded', 500);
  }

  async get<T>(
    path: string,
    query?: Record<string, string | number | boolean | undefined>
  ): Promise<T> {
    return this.request<T>({ method: 'GET', path, query });
  }

  async post<T>(path: string, body?: unknown, idempotencyKey?: string): Promise<T> {
    return this.request<T>({ method: 'POST', path, body, idempotencyKey });
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>({ method: 'PUT', path, body });
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>({ method: 'DELETE', path });
  }
}

let defaultClient: AsaasClient | null = null;

export function getAsaasClient(): AsaasClient {
  if (!defaultClient) {
    defaultClient = new AsaasClient();
  }
  return defaultClient;
}

export function setAsaasClient(client: AsaasClient): void {
  defaultClient = client;
}
