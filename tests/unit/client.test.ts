import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Set env vars before importing modules that use config
vi.hoisted(() => {
  process.env.ASAAS_API_KEY = 'test_api_key';
  process.env.ASAAS_API_URL = 'https://api-sandbox.asaas.com/v3';
});

import { AsaasClient } from '../../src/asaas/client.js';
import { AsaasError, AsaasAuthenticationError, AsaasValidationError, AsaasNotFoundError, AsaasRateLimitError, AsaasServiceError, mapAsaasError, isRetryableError } from '../../src/asaas/errors.js';
import { resetConfig } from '../../src/config.js';

describe('AsaasClient', () => {
  let client: AsaasClient;
  const originalFetch = global.fetch;

  beforeEach(() => {
    resetConfig();
    client = new AsaasClient('https://api-sandbox.asaas.com/v3', 'test_api_key', 5000);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    global.fetch = originalFetch;
  });

  it('builds URL with query params', () => {
    const url = client.buildUrl('/customers', { limit: 10, offset: 0, name: 'John' });
    expect(url).toContain('/customers');
    expect(url).toContain('limit=10');
    expect(url).toContain('offset=0');
    expect(url).toContain('name=John');
  });

  it('omits undefined query params', () => {
    const url = client.buildUrl('/customers', { limit: 10, name: undefined });
    expect(url).toContain('limit=10');
    expect(url).not.toContain('name');
  });

  it('calculates exponential backoff delay', () => {
    expect(client.calculateDelay(0)).toBe(1000);
    expect(client.calculateDelay(1)).toBe(2000);
    expect(client.calculateDelay(2)).toBe(4000);
    expect(client.calculateDelay(10)).toBe(10000); // max delay
  });
});

describe('Error mapping', () => {
  it('maps 400 to AsaasValidationError', () => {
    const error = mapAsaasError(400, { errors: [{ code: 'invalid_field', description: 'Field is required' }] });
    expect(error).toBeInstanceOf(AsaasValidationError);
    expect(error.status).toBe(400);
    expect(error.code).toBe('ASAAS_VALIDATION_ERROR');
  });

  it('maps 401 to AsaasAuthenticationError', () => {
    const error = mapAsaasError(401, { errors: [{ code: 'invalid_access_token', description: 'Invalid key' }] });
    expect(error).toBeInstanceOf(AsaasAuthenticationError);
    expect(error.status).toBe(401);
  });

  it('maps 404 to AsaasNotFoundError', () => {
    const error = mapAsaasError(404, { errors: [{ code: 'not_found', description: 'Not found' }] });
    expect(error).toBeInstanceOf(AsaasNotFoundError);
    expect(error.status).toBe(404);
  });

  it('maps 429 to AsaasRateLimitError with retryAfter', () => {
    const error = mapAsaasError(429, { errors: [{ code: 'rate_limit', description: 'Too many requests' }], retryAfter: 60 });
    expect(error).toBeInstanceOf(AsaasRateLimitError);
    expect(error.status).toBe(429);
    expect(error.retryAfter).toBe(60);
  });

  it('maps 500 to AsaasServiceError', () => {
    const error = mapAsaasError(500, { errors: [{ code: 'internal_error', description: 'Server error' }] });
    expect(error).toBeInstanceOf(AsaasServiceError);
    expect(error.status).toBe(500);
  });

  it('handles unknown status', () => {
    const error = mapAsaasError(418, { errors: [{ code: 'teapot', description: 'I am a teapot' }] });
    expect(error).toBeInstanceOf(AsaasError);
    expect(error.status).toBe(418);
  });
});

describe('Retryable errors', () => {
  it('returns true for rate limit errors', () => {
    const error = new AsaasRateLimitError();
    expect(isRetryableError(error)).toBe(true);
  });

  it('returns true for service errors', () => {
    const error = new AsaasServiceError();
    expect(isRetryableError(error)).toBe(true);
  });

  it('returns false for authentication errors', () => {
    const error = new AsaasAuthenticationError();
    expect(isRetryableError(error)).toBe(false);
  });

  it('returns false for validation errors', () => {
    const error = new AsaasValidationError('Invalid');
    expect(isRetryableError(error)).toBe(false);
  });

  it('returns false for not found errors', () => {
    const error = new AsaasNotFoundError('Resource', 'id');
    expect(isRetryableError(error)).toBe(false);
  });

  it('returns false for conflict errors', () => {
    const error = new AsaasError('ASAAS_CONFLICT', 'Conflict', 409);
    expect(isRetryableError(error)).toBe(false);
  });
});