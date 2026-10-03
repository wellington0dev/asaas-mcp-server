import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import {
  AsaasError,
  AsaasAuthenticationError,
  AsaasPermissionError,
  AsaasNotFoundError,
  AsaasValidationError,
  AsaasConflictError,
  AsaasRateLimitError,
  AsaasServiceError,
  AsaasTimeoutError,
  AsaasIdempotencyError,
} from '../asaas/errors.js';

export function toMcpError(error: Error): McpError {
  if (error instanceof AsaasAuthenticationError) {
    return new McpError(ErrorCode.InvalidRequest, `Authentication failed: ${error.message}`, {
      code: error.code,
      status: error.status,
    });
  }

  if (error instanceof AsaasPermissionError) {
    return new McpError(ErrorCode.InvalidRequest, `Permission denied: ${error.message}`, {
      code: error.code,
      status: error.status,
    });
  }

  if (error instanceof AsaasNotFoundError) {
    return new McpError(ErrorCode.InvalidRequest, error.message, {
      code: error.code,
      status: error.status,
    });
  }

  if (error instanceof AsaasValidationError) {
    return new McpError(ErrorCode.InvalidParams, `Validation error: ${error.message}`, {
      code: error.code,
      status: error.status,
      details: error.details,
    });
  }

  if (error instanceof AsaasConflictError) {
    return new McpError(ErrorCode.InvalidRequest, `Conflict: ${error.message}`, {
      code: error.code,
      status: error.status,
    });
  }

  if (error instanceof AsaasRateLimitError) {
    return new McpError(ErrorCode.InternalError, `Rate limited: ${error.message}`, {
      code: error.code,
      status: error.status,
      retryAfter: error.retryAfter,
    });
  }

  if (error instanceof AsaasServiceError) {
    return new McpError(ErrorCode.InternalError, `Service error: ${error.message}`, {
      code: error.code,
      status: error.status,
    });
  }

  if (error instanceof AsaasTimeoutError) {
    return new McpError(ErrorCode.InternalError, `Timeout: ${error.message}`, {
      code: error.code,
      status: error.status,
    });
  }

  if (error instanceof AsaasIdempotencyError) {
    return new McpError(ErrorCode.InvalidRequest, `Idempotency conflict: ${error.message}`, {
      code: error.code,
      status: error.status,
    });
  }

  if (error instanceof AsaasError) {
    return new McpError(ErrorCode.InternalError, `Asaas error: ${error.message}`, {
      code: error.code,
      status: error.status,
      details: error.details,
    });
  }

  return new McpError(ErrorCode.InternalError, `Unexpected error: ${error.message}`);
}

export function createValidationError(message: string, field?: string): McpError {
  return new McpError(ErrorCode.InvalidParams, message, { field });
}

export function createNotFoundError(resource: string, id: string): McpError {
  return new McpError(ErrorCode.InvalidRequest, `${resource} not found: ${id}`, { resource, id });
}

export function createFinancialOperationError(message: string): McpError {
  return new McpError(ErrorCode.InvalidRequest, message, { financialOperation: true });
}
