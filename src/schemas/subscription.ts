import { z } from 'zod';

export const BillingTypeSchema = z.enum([
  'UNDEFINED',
  'BOLETO',
  'CREDIT_CARD',
  'DEBIT_CARD',
  'TRANSFER',
  'DEPOSIT',
  'PIX',
]);

export const SubscriptionCycleSchema = z.enum([
  'WEEKLY',
  'BIWEEKLY',
  'MONTHLY',
  'BIMONTHLY',
  'QUARTERLY',
  'SEMIANNUALLY',
  'YEARLY',
]);

export const DiscountSchema = z.object({
  value: z.number().positive('Discount value must be positive'),
  dueDateLimitDays: z.number().int().min(0).optional(),
  type: z.enum(['FIXED', 'PERCENTAGE']).optional(),
});

export const InterestSchema = z.object({
  value: z.number().min(0).max(100, 'Interest must be between 0 and 100%'),
});

export const FineSchema = z.object({
  value: z.number().min(0).max(100, 'Fine must be between 0 and 100%'),
  type: z.enum(['FIXED', 'PERCENTAGE']).optional(),
});

export const SubscriptionSplitRequestSchema = z.object({
  walletId: z.string().min(1, 'Wallet ID is required'),
  fixedValue: z.number().positive().optional(),
  percentualValue: z.number().min(0).max(100).optional(),
  externalReference: z.string().max(100).optional(),
  description: z.string().max(255).optional(),
});

export const CallbackSchema = z.object({
  successUrl: z.string().url('Invalid success URL').max(255),
  autoRedirect: z.boolean().optional(),
});

export const SubscriptionCreateSchema = z.object({
  customer: z.string().min(1, 'Customer ID is required'),
  billingType: BillingTypeSchema,
  value: z.number().positive('Value must be positive'),
  nextDueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Next due date must be in YYYY-MM-DD format'),
  cycle: SubscriptionCycleSchema,
  discount: DiscountSchema.optional(),
  interest: InterestSchema.optional(),
  fine: FineSchema.optional(),
  description: z.string().max(500).optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format')
    .optional(),
  maxPayments: z.number().int().min(1).optional(),
  externalReference: z.string().max(100).optional(),
  split: z.array(SubscriptionSplitRequestSchema).optional(),
  callback: CallbackSchema.optional(),
});

export const SubscriptionUpdateSchema = z.object({
  billingType: BillingTypeSchema.optional(),
  value: z.number().positive().optional(),
  nextDueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Next due date must be in YYYY-MM-DD format')
    .optional(),
  cycle: SubscriptionCycleSchema.optional(),
  discount: DiscountSchema.optional(),
  interest: InterestSchema.optional(),
  fine: FineSchema.optional(),
  description: z.string().max(500).optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format')
    .optional(),
  maxPayments: z.number().int().min(1).optional(),
  externalReference: z.string().max(100).optional(),
  split: z.array(SubscriptionSplitRequestSchema).optional(),
  callback: CallbackSchema.optional(),
});

export const SubscriptionListSchema = z.object({
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().min(0).optional(),
  customer: z.string().optional(),
  status: z.string().optional(),
  billingType: BillingTypeSchema.optional(),
  externalReference: z.string().optional(),
  deleted: z.boolean().optional(),
});

export const SubscriptionGetSchema = z.object({
  subscriptionId: z.string().min(1),
});

export type SubscriptionCreateInput = z.infer<typeof SubscriptionCreateSchema>;
export type SubscriptionUpdateInput = z.infer<typeof SubscriptionUpdateSchema>;
export type SubscriptionListInput = z.infer<typeof SubscriptionListSchema>;
export type SubscriptionGetInput = z.infer<typeof SubscriptionGetSchema>;
