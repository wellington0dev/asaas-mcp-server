import { describe, it, expect } from 'vitest';
import {
  toCents,
  fromCents,
  formatCurrency,
  parseCurrency,
  formatDate,
  formatDateTime,
  parseDate,
  isValidDate,
  addDays,
  differenceInDays,
  sanitizeString,
  sanitizeCpfCnpj,
  sanitizePhone,
  sanitizePostalCode,
  buildExternalReference,
  parseExternalReference,
  generateIdempotencyKey,
  generateRequestId,
} from '../../src/utils/formatting.js';

describe('Currency formatting', () => {
  it('converts to cents correctly', () => {
    expect(toCents(100.00)).toBe(10000);
    expect(toCents(99.99)).toBe(9999);
    expect(toCents(0.01)).toBe(1);
    expect(toCents(0)).toBe(0);
  });

  it('converts from cents correctly', () => {
    expect(fromCents(10000)).toBe(100.00);
    expect(fromCents(9999)).toBe(99.99);
    expect(fromCents(1)).toBe(0.01);
    expect(fromCents(0)).toBe(0);
  });

  it('formats currency correctly', () => {
    expect(formatCurrency(10000)).toContain('100,00');
    expect(formatCurrency(9999)).toContain('99,99');
  });

  it('parses currency strings', () => {
    expect(parseCurrency('100,00')).toBe(10000);
    expect(parseCurrency('R$ 99,99')).toBe(9999);
    expect(parseCurrency('$100.00')).toBe(10000);
  });

  it('throws on invalid currency', () => {
    expect(() => parseCurrency('invalid')).toThrow();
  });
});

describe('Date formatting', () => {
  it('formats date as YYYY-MM-DD', () => {
    const date = new Date('2026-10-15T10:30:00Z');
    expect(formatDate(date)).toBe('2026-10-15');
    expect(formatDate('2026-10-15T10:30:00Z')).toBe('2026-10-15');
  });

  it('formats datetime as ISO string', () => {
    const date = new Date('2026-10-15T10:30:00Z');
    expect(formatDateTime(date)).toBe('2026-10-15T10:30:00.000Z');
  });

  it('parses valid dates', () => {
    const parsed = parseDate('2026-10-15');
    expect(parsed).toBeInstanceOf(Date);
    expect(parsed.getFullYear()).toBe(2026);
  });

  it('validates dates', () => {
    expect(isValidDate('2026-10-15')).toBe(true);
    expect(isValidDate('invalid')).toBe(false);
  });

  it('adds days correctly', () => {
    expect(addDays('2026-10-15', 5)).toBe('2026-10-20');
    expect(addDays('2026-10-30', 2)).toBe('2026-11-01');
  });

  it('calculates difference in days', () => {
    expect(differenceInDays('2026-10-15', '2026-10-20')).toBe(5);
    expect(differenceInDays('2026-10-20', '2026-10-15')).toBe(5);
  });
});

describe('Sanitization', () => {
  it('sanitizes strings', () => {
    expect(sanitizeString('  hello  ')).toBe('hello');
    expect(sanitizeString('hello\x00world')).toBe('helloworld');
    expect(sanitizeString('a'.repeat(100), 10)).toHaveLength(10);
  });

  it('sanitizes CPF/CNPJ', () => {
    expect(sanitizeCpfCnpj('123.456.789-01')).toBe('12345678901');
    expect(sanitizeCpfCnpj('12.345.678/0001-99')).toBe('12345678000199');
  });

  it('sanitizes phone', () => {
    expect(sanitizePhone('(11) 99999-9999')).toBe('11999999999');
    expect(sanitizePhone('+55 11 99999-9999')).toBe('5511999999999');
  });

  it('sanitizes postal code', () => {
    expect(sanitizePostalCode('01310-000')).toBe('01310000');
    expect(sanitizePostalCode('01310 000')).toBe('01310000');
  });
});

describe('External reference', () => {
  it('builds external reference', () => {
    const ref = buildExternalReference({ userId: '123', orderId: '456' });
    expect(ref).toBe('userId:123|orderId:456');
  });

  it('parses external reference', () => {
    const parsed = parseExternalReference('userId:123|orderId:456');
    expect(parsed).toEqual({ userId: '123', orderId: '456' });
  });

  it('handles empty values', () => {
    const ref = buildExternalReference({ userId: '123', empty: '' });
    expect(ref).toBe('userId:123');
  });
});

describe('ID generation', () => {
  it('generates idempotency key', () => {
    const key = generateIdempotencyKey('create_payment', 'order_123');
    expect(key).toMatch(/^create_payment_order_123_\d+_[a-z0-9]+$/);
  });

  it('generates request ID', () => {
    const id = generateRequestId();
    expect(id).toMatch(/^req_\d+_[a-z0-9]+$/);
  });
});