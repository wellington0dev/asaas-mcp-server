import { describe, it, expect } from 'vitest';
import { toMcpError, createValidationError, createNotFoundError, createFinancialOperationError } from '../../src/utils/errors.js';
import {
  AsaasAuthenticationError,
  AsaasPermissionError,
  AsaasNotFoundError,
  AsaasValidationError,
  AsaasConflictError,
  AsaasRateLimitError,
  AsaasServiceError,
  AsaasTimeoutError,
  AsaasIdempotencyError,
  AsaasError,
} from '../../src/asaas/errors.js';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

describe('MCP error conversion', () => {
  it('converts authentication error', () => {
    const error = new AsaasAuthenticationError('Invalid key');
    const mcpError = toMcpError(error);

    expect(mcpError).toBeInstanceOf(McpError);
    expect(mcpError.code).toBe(ErrorCode.InvalidRequest);
    expect(mcpError.message).toContain('Authentication failed');
    expect(mcpError.data).toMatchObject({ code: 'ASAAS_AUTHENTICATION_ERROR', status: 401 });
  });

  it('converts permission error', () => {
    const error = new AsaasPermissionError('No access');
    const mcpError = toMcpError(error);

    expect(mcpError.code).toBe(ErrorCode.InvalidRequest);
    expect(mcpError.message).toContain('Permission denied');
  });

  it('converts not found error', () => {
    const error = new AsaasNotFoundError('Customer', 'cus_123');
    const mcpError = toMcpError(error);

    expect(mcpError.code).toBe(ErrorCode.InvalidRequest);
    expect(mcpError.message).toContain('Customer not found: cus_123');
  });

  it('converts validation error', () => {
    const error = new AsaasValidationError('Invalid field', { field: 'email' });
    const mcpError = toMcpError(error);

    expect(mcpError.code).toBe(ErrorCode.InvalidParams);
    expect(mcpError.message).toContain('Validation error');
    expect(mcpError.data).toMatchObject({ code: 'ASAAS_VALIDATION_ERROR', status: 400, details: { field: 'email' } });
  });

  it('converts conflict error', () => {
    const error = new AsaasConflictError('Already exists');
    const mcpError = toMcpError(error);

    expect(mcpError.code).toBe(ErrorCode.InvalidRequest);
    expect(mcpError.message).toContain('Conflict');
  });

  it('converts rate limit error', () => {
    const error = new AsaasRateLimitError('Too many', 60);
    const mcpError = toMcpError(error);

    expect(mcpError.code).toBe(ErrorCode.InternalError);
    expect(mcpError.data).toMatchObject({ code: 'ASAAS_RATE_LIMITED', status: 429, retryAfter: 60 });
  });

  it('converts service error', () => {
    const error = new AsaasServiceError('Server down');
    const mcpError = toMcpError(error);

    expect(mcpError.code).toBe(ErrorCode.InternalError);
    expect(mcpError.message).toContain('Service error');
  });

  it('converts timeout error', () => {
    const error = new AsaasTimeoutError('Timeout');
    const mcpError = toMcpError(error);

    expect(mcpError.code).toBe(ErrorCode.InternalError);
    expect(mcpError.message).toContain('Timeout');
  });

  it('converts idempotency error', () => {
    const error = new AsaasIdempotencyError('Duplicate');
    const mcpError = toMcpError(error);

    expect(mcpError.code).toBe(ErrorCode.InvalidRequest);
    expect(mcpError.message).toContain('Idempotency conflict');
  });

  it('converts generic Asaas error', () => {
    const error = new AsaasError('CUSTOM_CODE', 'Custom message', 418);
    const mcpError = toMcpError(error);

    expect(mcpError.code).toBe(ErrorCode.InternalError);
    expect(mcpError.data).toMatchObject({ code: 'CUSTOM_CODE', status: 418 });
  });

  it('converts unknown error', () => {
    const error = new Error('Unknown error');
    const mcpError = toMcpError(error);

    expect(mcpError.code).toBe(ErrorCode.InternalError);
    expect(mcpError.message).toContain('Unexpected error');
  });
});

describe('Error creators', () => {
  it('creates validation error', () => {
    const error = createValidationError('Invalid email', 'email');
    expect(error).toBeInstanceOf(McpError);
    expect(error.code).toBe(ErrorCode.InvalidParams);
    expect(error.data).toMatchObject({ field: 'email' });
  });

  it('creates not found error', () => {
    const error = createNotFoundError('Payment', 'pay_123');
    expect(error).toBeInstanceOf(McpError);
    expect(error.code).toBe(ErrorCode.InvalidRequest);
    expect(error.message).toContain('Payment not found: pay_123');
    expect(error.data).toMatchObject({ resource: 'Payment', id: 'pay_123' });
  });

  it('creates financial operation error', () => {
    const error = createFinancialOperationError('Cannot refund');
    expect(error).toBeInstanceOf(McpError);
    expect(error.code).toBe(ErrorCode.InvalidRequest);
    expect(error.data).toMatchObject({ financialOperation: true });
  });
});