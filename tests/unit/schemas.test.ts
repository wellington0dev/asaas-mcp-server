import { describe, it, expect } from 'vitest';
import {
  CustomerCreateSchema,
  CustomerUpdateSchema,
  CustomerListSchema,
} from '../../src/schemas/customer.js';
import {
  PaymentCreateSchema,
  PaymentUpdateSchema,
  PaymentListSchema,
  RefundSchema,
} from '../../src/schemas/payment.js';
import {
  SubscriptionCreateSchema,
  SubscriptionUpdateSchema,
  SubscriptionListSchema,
} from '../../src/schemas/subscription.js';
import {
  InstallmentCreateSchema,
  WebhookCreateSchema,
} from '../../src/schemas/common.js';

describe('Customer schemas', () => {
  it('validates customer creation', () => {
    const valid = {
      name: 'João Silva',
      cpfCnpj: '12345678901',
      email: 'joao@email.com',
    };
    expect(() => CustomerCreateSchema.parse(valid)).not.toThrow();
  });

  it('requires name and cpfCnpj', () => {
    expect(() => CustomerCreateSchema.parse({ cpfCnpj: '12345678901' })).toThrow();
    expect(() => CustomerCreateSchema.parse({ name: 'João' })).toThrow();
  });

  it('validates email format', () => {
    expect(() => CustomerCreateSchema.parse({ name: 'João', cpfCnpj: '12345678901', email: 'invalid' })).toThrow();
  });

  it('validates customer update', () => {
    const valid = { name: 'João', email: 'joao@email.com' };
    expect(() => CustomerUpdateSchema.parse(valid)).not.toThrow();
  });

  it('validates customer list params', () => {
    const valid = { limit: 50, offset: 0, name: 'João' };
    expect(() => CustomerListSchema.parse(valid)).not.toThrow();
  });

  it('enforces limit bounds', () => {
    expect(() => CustomerListSchema.parse({ limit: 0 })).toThrow();
    expect(() => CustomerListSchema.parse({ limit: 101 })).toThrow();
  });
});

describe('Payment schemas', () => {
  it('validates payment creation', () => {
    const valid = {
      customer: 'cus_123',
      billingType: 'PIX',
      value: 100.00,
      dueDate: '2026-10-15',
    };
    expect(() => PaymentCreateSchema.parse(valid)).not.toThrow();
  });

  it('requires customer, billingType, value, dueDate', () => {
    expect(() => PaymentCreateSchema.parse({ billingType: 'PIX', value: 100, dueDate: '2026-10-15' })).toThrow();
    expect(() => PaymentCreateSchema.parse({ customer: 'cus_123', value: 100, dueDate: '2026-10-15' })).toThrow();
    expect(() => PaymentCreateSchema.parse({ customer: 'cus_123', billingType: 'PIX', dueDate: '2026-10-15' })).toThrow();
    expect(() => PaymentCreateSchema.parse({ customer: 'cus_123', billingType: 'PIX', value: 100 })).toThrow();
  });

  it('validates dueDate format', () => {
    expect(() => PaymentCreateSchema.parse({ customer: 'cus_123', billingType: 'PIX', value: 100, dueDate: '15/10/2026' })).toThrow();
  });

  it('validates billingType enum', () => {
    expect(() => PaymentCreateSchema.parse({ customer: 'cus_123', billingType: 'INVALID', value: 100, dueDate: '2026-10-15' })).toThrow();
  });

  it('requires totalValue or installmentValue for installments', () => {
    expect(() => PaymentCreateSchema.parse({
      customer: 'cus_123',
      billingType: 'PIX',
      value: 100,
      dueDate: '2026-10-15',
      installmentCount: 3,
    })).toThrow();
  });

  it('accepts totalValue for installments', () => {
    const valid = {
      customer: 'cus_123',
      billingType: 'PIX',
      value: 100,
      dueDate: '2026-10-15',
      installmentCount: 3,
      totalValue: 300,
    };
    expect(() => PaymentCreateSchema.parse(valid)).not.toThrow();
  });

  it('accepts installmentValue for installments', () => {
    const valid = {
      customer: 'cus_123',
      billingType: 'PIX',
      value: 100,
      dueDate: '2026-10-15',
      installmentCount: 3,
      installmentValue: 100,
    };
    expect(() => PaymentCreateSchema.parse(valid)).not.toThrow();
  });

  it('validates payment update', () => {
    const valid = { description: 'Updated', externalReference: 'ref_123' };
    expect(() => PaymentUpdateSchema.parse(valid)).not.toThrow();
  });

  it('validates refund schema', () => {
    const valid = { paymentId: 'pay_123', value: 50, description: 'Partial refund' };
    expect(() => RefundSchema.parse(valid)).not.toThrow();
  });

  it('requires paymentId for refund', () => {
    expect(() => RefundSchema.parse({ value: 50 })).toThrow();
  });
});

describe('Subscription schemas', () => {
  it('validates subscription creation', () => {
    const valid = {
      customer: 'cus_123',
      billingType: 'PIX',
      value: 99.90,
      nextDueDate: '2026-11-01',
      cycle: 'MONTHLY',
    };
    expect(() => SubscriptionCreateSchema.parse(valid)).not.toThrow();
  });

  it('requires all mandatory fields', () => {
    expect(() => SubscriptionCreateSchema.parse({ customer: 'cus_123', billingType: 'PIX', value: 99, nextDueDate: '2026-11-01' })).toThrow();
    expect(() => SubscriptionCreateSchema.parse({ customer: 'cus_123', billingType: 'PIX', value: 99, cycle: 'MONTHLY' })).toThrow();
  });

  it('validates cycle enum', () => {
    expect(() => SubscriptionCreateSchema.parse({ customer: 'cus_123', billingType: 'PIX', value: 99, nextDueDate: '2026-11-01', cycle: 'INVALID' })).toThrow();
  });

  it('validates nextDueDate format', () => {
    expect(() => SubscriptionCreateSchema.parse({ customer: 'cus_123', billingType: 'PIX', value: 99, nextDueDate: '01/11/2026', cycle: 'MONTHLY' })).toThrow();
  });

  it('validates subscription update', () => {
    const valid = { value: 109.90, description: 'Updated plan' };
    expect(() => SubscriptionUpdateSchema.parse(valid)).not.toThrow();
  });
});

describe('Installment schemas', () => {
  it('validates installment creation', () => {
    const valid = {
      installmentCount: 3,
      customer: 'cus_123',
      value: 100,
      billingType: 'BOLETO',
      dueDate: '2026-10-15',
    };
    expect(() => InstallmentCreateSchema.parse(valid)).not.toThrow();
  });

  it('requires minimum 2 installments', () => {
    expect(() => InstallmentCreateSchema.parse({ installmentCount: 1, customer: 'cus_123', value: 100, billingType: 'BOLETO', dueDate: '2026-10-15' })).toThrow();
  });

  it('limits to 60 installments', () => {
    expect(() => InstallmentCreateSchema.parse({ installmentCount: 61, customer: 'cus_123', value: 100, billingType: 'BOLETO', dueDate: '2026-10-15' })).toThrow();
  });
});

describe('Webhook schemas', () => {
  it('validates webhook creation', () => {
    const valid = {
      name: 'Test Webhook',
      url: 'https://example.com/webhook',
      email: 'test@example.com',
      enabled: true,
      interrupted: false,
      apiVersion: 3,
      authToken: 'whsec_12345678901234567890123456789012',
      sendType: 'SEQUENTIALLY',
      events: ['PAYMENT_RECEIVED', 'PAYMENT_CONFIRMED'],
    };
    expect(() => WebhookCreateSchema.parse(valid)).not.toThrow();
  });

  it('requires all mandatory fields', () => {
    expect(() => WebhookCreateSchema.parse({ name: 'Test', url: 'https://example.com', email: 'test@test.com', enabled: true, interrupted: false, apiVersion: 3, authToken: 'a'.repeat(32), sendType: 'SEQUENTIALLY', events: [] })).toThrow();
  });

  it('validates authToken length', () => {
    expect(() => WebhookCreateSchema.parse({
      name: 'Test', url: 'https://example.com', email: 'test@test.com', enabled: true, interrupted: false, apiVersion: 3, authToken: 'short', sendType: 'SEQUENTIALLY', events: ['PAYMENT_RECEIVED']
    })).toThrow();
  });

  it('validates URL format', () => {
    expect(() => WebhookCreateSchema.parse({
      name: 'Test', url: 'not-a-url', email: 'test@test.com', enabled: true, interrupted: false, apiVersion: 3, authToken: 'a'.repeat(32), sendType: 'SEQUENTIALLY', events: ['PAYMENT_RECEIVED']
    })).toThrow();
  });

  it('validates email format', () => {
    expect(() => WebhookCreateSchema.parse({
      name: 'Test', url: 'https://example.com', email: 'invalid-email', enabled: true, interrupted: false, apiVersion: 3, authToken: 'a'.repeat(32), sendType: 'SEQUENTIALLY', events: ['PAYMENT_RECEIVED']
    })).toThrow();
  });

  it('requires at least one event', () => {
    expect(() => WebhookCreateSchema.parse({
      name: 'Test', url: 'https://example.com', email: 'test@test.com', enabled: true, interrupted: false, apiVersion: 3, authToken: 'a'.repeat(32), sendType: 'SEQUENTIALLY', events: []
    })).toThrow();
  });
});