export class AsaasError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly details?: unknown;

  constructor(code: string, message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'AsaasError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export class AsaasAuthenticationError extends AsaasError {
  constructor(message = 'Invalid API key', details?: unknown) {
    super('ASAAS_AUTHENTICATION_ERROR', message, 401, details);
    this.name = 'AsaasAuthenticationError';
  }
}

export class AsaasPermissionError extends AsaasError {
  constructor(message = 'Insufficient permissions', details?: unknown) {
    super('ASAAS_PERMISSION_ERROR', message, 403, details);
    this.name = 'AsaasPermissionError';
  }
}

export class AsaasNotFoundError extends AsaasError {
  constructor(resource: string, id: string) {
    super('ASAAS_NOT_FOUND', `${resource} not found: ${id}`, 404, { resource, id });
    this.name = 'AsaasNotFoundError';
  }
}

export class AsaasValidationError extends AsaasError {
  constructor(message: string, details?: unknown) {
    super('ASAAS_VALIDATION_ERROR', message, 400, details);
    this.name = 'AsaasValidationError';
  }
}

export class AsaasConflictError extends AsaasError {
  constructor(message: string, details?: unknown) {
    super('ASAAS_CONFLICT', message, 409, details);
    this.name = 'AsaasConflictError';
  }
}

export class AsaasRateLimitError extends AsaasError {
  public readonly retryAfter?: number;

  constructor(message = 'Rate limit exceeded', retryAfter?: number, details?: unknown) {
    super('ASAAS_RATE_LIMITED', message, 429, details);
    this.name = 'AsaasRateLimitError';
    this.retryAfter = retryAfter;
  }
}

export class AsaasServiceError extends AsaasError {
  constructor(message = 'Asaas service error', details?: unknown) {
    super('ASAAS_SERVICE_ERROR', message, 500, details);
    this.name = 'AsaasServiceError';
  }
}

export class AsaasTimeoutError extends AsaasError {
  constructor(message = 'Request timeout') {
    super('ASAAS_TIMEOUT', message, 408);
    this.name = 'AsaasTimeoutError';
  }
}

export class AsaasIdempotencyError extends AsaasError {
  constructor(message = 'Idempotency key conflict') {
    super('ASAAS_IDEMPOTENCY_CONFLICT', message, 409);
    this.name = 'AsaasIdempotencyError';
  }
}

export function mapAsaasError(status: number, body: unknown): AsaasError {
  const errorBody = body as { errors?: Array<{ code: string; description: string }> } | null;

  const firstError = errorBody?.errors?.[0];
  const message = firstError?.description || 'Unknown error';
  const code = firstError?.code || 'UNKNOWN_ERROR';

  switch (status) {
    case 400:
      return new AsaasValidationError(message, body);
    case 401:
      return new AsaasAuthenticationError(message, body);
    case 403:
      return new AsaasPermissionError(message, body);
    case 404:
      return new AsaasNotFoundError('Resource', 'unknown');
    case 409:
      if (code.includes('idempotency')) {
        return new AsaasIdempotencyError(message);
      }
      return new AsaasConflictError(message, body);
    case 429: {
      const retryAfter =
        typeof body === 'object' && body && 'retryAfter' in body
          ? (body as { retryAfter: number }).retryAfter
          : undefined;
      return new AsaasRateLimitError(message, retryAfter, body);
    }
    case 500:
    case 502:
    case 503:
    case 504:
      return new AsaasServiceError(message, body);
    default:
      return new AsaasError(code, message, status, body);
  }
}

export function isRetryableError(error: Error): boolean {
  if (error instanceof AsaasRateLimitError) return true;
  if (error instanceof AsaasServiceError) return true;
  if (error instanceof AsaasTimeoutError) return true;
  if (error instanceof AsaasAuthenticationError) return false;
  if (error instanceof AsaasPermissionError) return false;
  if (error instanceof AsaasValidationError) return false;
  if (error instanceof AsaasNotFoundError) return false;
  if (error instanceof AsaasConflictError) return false;
  return false;
}
