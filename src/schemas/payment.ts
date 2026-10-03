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

export const SplitRequestSchema = z.object({
  walletId: z.string().min(1, 'Wallet ID is required'),
  fixedValue: z.number().positive().optional(),
  percentualValue: z.number().min(0).max(100).optional(),
  totalFixedValue: z.number().positive().optional(),
  externalReference: z.string().max(100).optional(),
  description: z.string().max(255).optional(),
});

export const CallbackSchema = z.object({
  successUrl: z.string().url('Invalid success URL').max(255),
  autoRedirect: z.boolean().optional(),
});

export const PaymentCreateSchema = z
  .object({
    customer: z.string().min(1, 'Customer ID is required'),
    billingType: BillingTypeSchema,
    value: z.number().positive('Value must be positive'),
    dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be in YYYY-MM-DD format'),
    description: z.string().max(500).optional(),
    daysAfterDueDateToRegistrationCancellation: z.number().int().min(0).optional(),
    externalReference: z.string().max(100).optional(),
    installmentCount: z.number().int().min(2).max(60).optional(),
    totalValue: z.number().positive().optional(),
    installmentValue: z.number().positive().optional(),
    discount: DiscountSchema.optional(),
    interest: InterestSchema.optional(),
    fine: FineSchema.optional(),
    postalService: z.boolean().optional(),
    split: z.array(SplitRequestSchema).optional(),
    callback: CallbackSchema.optional(),
    pixAutomaticAuthorizationId: z.string().optional(),
  })
  .refine(
    data => {
      if (data.installmentCount && data.installmentCount > 1) {
        return data.totalValue !== undefined || data.installmentValue !== undefined;
      }
      return true;
    },
    {
      message: 'For installment payments, either totalValue or installmentValue must be provided',
      path: ['installmentCount'],
    }
  );

export const PaymentUpdateSchema = z.object({
  description: z.string().max(500).optional(),
  externalReference: z.string().max(100).optional(),
  discount: DiscountSchema.optional(),
  interest: InterestSchema.optional(),
  fine: FineSchema.optional(),
  postalService: z.boolean().optional(),
  split: z.array(SplitRequestSchema).optional(),
  callback: CallbackSchema.optional(),
});

export const PaymentListSchema = z.object({
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().min(0).optional(),
  customer: z.string().optional(),
  status: z.string().optional(),
  billingType: BillingTypeSchema.optional(),
  dateCreated: z.string().optional(),
  dueDate: z.string().optional(),
  externalReference: z.string().optional(),
  deleted: z.boolean().optional(),
});

export const PaymentStatusSchema = z.object({
  paymentId: z.string().min(1),
});

export const PixQrCodeSchema = z.object({
  paymentId: z.string().min(1),
});

export const BankSlipSchema = z.object({
  paymentId: z.string().min(1),
});

export const RefundSchema = z.object({
  paymentId: z.string().min(1),
  value: z.number().positive().optional(),
  description: z.string().max(500).optional(),
  splitRefunds: z
    .array(
      z.object({
        id: z.string().min(1),
        value: z.number().positive(),
      })
    )
    .optional(),
});

export type PaymentCreateInput = z.infer<typeof PaymentCreateSchema>;
export type PaymentUpdateInput = z.infer<typeof PaymentUpdateSchema>;
export type PaymentListInput = z.infer<typeof PaymentListSchema>;
export type PaymentStatusInput = z.infer<typeof PaymentStatusSchema>;
export type PixQrCodeInput = z.infer<typeof PixQrCodeSchema>;
export type BankSlipInput = z.infer<typeof BankSlipSchema>;
export type RefundInput = z.infer<typeof RefundSchema>;
