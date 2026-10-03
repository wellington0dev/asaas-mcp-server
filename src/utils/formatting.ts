/**
 * Currency formatting utilities
 * All monetary values are handled in cents (integer) to avoid floating-point issues
 */

export function toCents(value: number): number {
  return Math.round(value * 100);
}

export function fromCents(cents: number): number {
  return cents / 100;
}

export function formatCurrency(cents: number, currency = 'BRL', locale = 'pt-BR'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(fromCents(cents));
}

export function parseCurrency(value: string): number {
  const cleaned = value.replace(/[^\d.,-]/g, '').replace(',', '.');
  const parsed = parseFloat(cleaned);
  if (isNaN(parsed)) {
    throw new Error(`Invalid currency value: ${value}`);
  }
  return toCents(parsed);
}

/**
 * Date formatting utilities
 * All dates are handled as ISO 8601 strings (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss)
 */

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const isoString = d.toISOString();
  return isoString.split('T')[0] as string;
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString();
}

export function parseDate(value: string): Date {
  const parsed = new Date(value);
  if (isNaN(parsed.getTime())) {
    throw new Error(`Invalid date value: ${value}`);
  }
  return parsed;
}

export function isValidDate(value: string): boolean {
  const parsed = new Date(value);
  return !isNaN(parsed.getTime());
}

export function addDays(date: Date | string, days: number): string {
  const d = typeof date === 'string' ? new Date(date) : new Date(date);
  d.setDate(d.getDate() + days);
  return formatDate(d);
}

export function differenceInDays(date1: Date | string, date2: Date | string): number {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Sanitization utilities
 */

export function sanitizeString(value: string, maxLength?: number): string {
  // Remove control characters (ASCII 0-31 and 127)
  const controlCharRegex = new RegExp(`[\\x00-\\x1F\\x7F]`, 'g');
  let sanitized = value.trim().replace(controlCharRegex, '');
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  return sanitized;
}

export function sanitizeCpfCnpj(value: string): string {
  return value.replace(/\D/g, '');
}

export function sanitizePhone(value: string): string {
  return value.replace(/\D/g, '');
}

export function sanitizePostalCode(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * External reference utilities
 */

export function buildExternalReference(parts: Record<string, string | number>): string {
  return Object.entries(parts)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${key}:${value}`)
    .join('|');
}

export function parseExternalReference(reference: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const part of reference.split('|')) {
    const [key, ...valueParts] = part.split(':');
    if (key && valueParts.length > 0) {
      result[key] = valueParts.join(':');
    }
  }
  return result;
}

/**
 * ID generation
 */

export function generateIdempotencyKey(prefix: string, identifier: string): string {
  return `${prefix}_${identifier}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}
