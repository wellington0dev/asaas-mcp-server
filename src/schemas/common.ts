import { z } from 'zod';

export const InstallmentCreateSchema = z.object({
  installmentCount: z.number().int().min(2, 'Must have at least 2 installments').max(60),
  customer: z.string().min(1, 'Customer ID is required'),
  value: z.number().positive('Installment value must be positive'),
  totalValue: z.number().positive().optional(),
  billingType: z.enum([
    'UNDEFINED',
    'BOLETO',
    'CREDIT_CARD',
    'DEBIT_CARD',
    'TRANSFER',
    'DEPOSIT',
    'PIX',
  ]),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be in YYYY-MM-DD format'),
  description: z.string().max(500).optional(),
  postalService: z.boolean().optional(),
  daysAfterDueDateToRegistrationCancellation: z.number().int().min(0).optional(),
  paymentExternalReference: z.string().max(100).optional(),
  discount: z
    .object({
      value: z.number().positive(),
      dueDateLimitDays: z.number().int().min(0).optional(),
      type: z.enum(['FIXED', 'PERCENTAGE']).optional(),
    })
    .optional(),
  interest: z.object({ value: z.number().min(0).max(100) }).optional(),
  fine: z
    .object({ value: z.number().min(0).max(100), type: z.enum(['FIXED', 'PERCENTAGE']).optional() })
    .optional(),
  splits: z
    .array(
      z.object({
        walletId: z.string().min(1),
        fixedValue: z.number().positive().optional(),
        percentualValue: z.number().min(0).max(100).optional(),
        totalFixedValue: z.number().positive().optional(),
        externalReference: z.string().max(100).optional(),
        description: z.string().max(255).optional(),
        installmentNumber: z.number().int().min(1).optional(),
      })
    )
    .optional(),
});

export const InstallmentListSchema = z.object({
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().min(0).optional(),
  customer: z.string().optional(),
  billingType: z
    .enum(['UNDEFINED', 'BOLETO', 'CREDIT_CARD', 'DEBIT_CARD', 'TRANSFER', 'DEPOSIT', 'PIX'])
    .optional(),
  deleted: z.boolean().optional(),
});

export const InstallmentGetSchema = z.object({
  installmentId: z.string().min(1),
});

export const WebhookEventSchema = z.enum([
  'PAYMENT_AUTHORIZED',
  'PAYMENT_AWAITING_RISK_ANALYSIS',
  'PAYMENT_APPROVED_BY_RISK_ANALYSIS',
  'PAYMENT_REPROVED_BY_RISK_ANALYSIS',
  'PAYMENT_CREATED',
  'PAYMENT_UPDATED',
  'PAYMENT_CONFIRMED',
  'PAYMENT_RECEIVED',
  'PAYMENT_ANTICIPATED',
  'PAYMENT_OVERDUE',
  'PAYMENT_DELETED',
  'PAYMENT_RESTORED',
  'PAYMENT_REFUNDED',
  'PAYMENT_REFUND_IN_PROGRESS',
  'PAYMENT_REFUND_DENIED',
  'PAYMENT_RECEIVED_IN_CASH_UNDONE',
  'PAYMENT_CHARGEBACK_REQUESTED',
  'PAYMENT_CHARGEBACK_DISPUTE',
  'PAYMENT_AWAITING_CHARGEBACK_REVERSAL',
  'PAYMENT_DUNNING_RECEIVED',
  'PAYMENT_DUNNING_REQUESTED',
  'PAYMENT_BANK_SLIP_CANCELLED',
  'PAYMENT_BANK_SLIP_VIEWED',
  'PAYMENT_CHECKOUT_VIEWED',
  'PAYMENT_CREDIT_CARD_CAPTURE_REFUSED',
  'PAYMENT_PARTIALLY_REFUNDED',
  'PAYMENT_SPLIT_CANCELLED',
  'PAYMENT_SPLIT_DIVERGENCE_BLOCK',
  'PAYMENT_SPLIT_DIVERGENCE_BLOCK_FINISHED',
  'PAYMENT_SPLIT_DONE',
  'INVOICE_CREATED',
  'INVOICE_UPDATED',
  'INVOICE_SYNCHRONIZED',
  'INVOICE_AUTHORIZED',
  'INVOICE_PROCESSING_CANCELLATION',
  'INVOICE_CANCELED',
  'INVOICE_CANCELLATION_DENIED',
  'INVOICE_ERROR',
  'TRANSFER_CREATED',
  'TRANSFER_PENDING',
  'TRANSFER_IN_BANK_PROCESSING',
  'TRANSFER_BLOCKED',
  'TRANSFER_DONE',
  'TRANSFER_FAILED',
  'TRANSFER_CANCELLED',
  'BILL_CREATED',
  'BILL_PENDING',
  'BILL_BANK_PROCESSING',
  'BILL_PAID',
  'BILL_CANCELLED',
  'BILL_FAILED',
  'BILL_REFUNDED',
  'RECEIVABLE_ANTICIPATION_CANCELLED',
  'RECEIVABLE_ANTICIPATION_SCHEDULED',
  'RECEIVABLE_ANTICIPATION_PENDING',
  'RECEIVABLE_ANTICIPATION_CREDITED',
  'RECEIVABLE_ANTICIPATION_DEBITED',
  'RECEIVABLE_ANTICIPATION_DENIED',
  'RECEIVABLE_ANTICIPATION_OVERDUE',
  'MOBILE_PHONE_RECHARGE_PENDING',
  'MOBILE_PHONE_RECHARGE_CANCELLED',
  'MOBILE_PHONE_RECHARGE_CONFIRMED',
  'MOBILE_PHONE_RECHARGE_REFUNDED',
  'ACCOUNT_STATUS_BANK_ACCOUNT_INFO_APPROVED',
  'ACCOUNT_STATUS_BANK_ACCOUNT_INFO_AWAITING_APPROVAL',
  'ACCOUNT_STATUS_BANK_ACCOUNT_INFO_PENDING',
  'ACCOUNT_STATUS_BANK_ACCOUNT_INFO_REJECTED',
  'ACCOUNT_STATUS_COMMERCIAL_INFO_APPROVED',
  'ACCOUNT_STATUS_COMMERCIAL_INFO_AWAITING_APPROVAL',
  'ACCOUNT_STATUS_COMMERCIAL_INFO_EXPIRED',
  'ACCOUNT_STATUS_COMMERCIAL_INFO_EXPIRING_SOON',
  'ACCOUNT_STATUS_COMMERCIAL_INFO_PENDING',
  'ACCOUNT_STATUS_COMMERCIAL_INFO_REJECTED',
  'ACCOUNT_STATUS_DOCUMENT_APPROVED',
  'ACCOUNT_STATUS_DOCUMENT_AWAITING_APPROVAL',
  'ACCOUNT_STATUS_DOCUMENT_PENDING',
  'ACCOUNT_STATUS_DOCUMENT_REJECTED',
  'ACCOUNT_STATUS_GENERAL_APPROVAL_APPROVED',
  'ACCOUNT_STATUS_GENERAL_APPROVAL_AWAITING_APPROVAL',
  'ACCOUNT_STATUS_GENERAL_APPROVAL_PENDING',
  'ACCOUNT_STATUS_GENERAL_APPROVAL_REJECTED',
  'SUBSCRIPTION_CREATED',
  'SUBSCRIPTION_UPDATED',
  'SUBSCRIPTION_INACTIVATED',
  'SUBSCRIPTION_DELETED',
  'SUBSCRIPTION_SPLIT_DISABLED',
  'SUBSCRIPTION_SPLIT_DIVERGENCE_BLOCK',
  'SUBSCRIPTION_SPLIT_DIVERGENCE_BLOCK_FINISHED',
  'CHECKOUT_CREATED',
  'CHECKOUT_CANCELED',
  'CHECKOUT_EXPIRED',
  'CHECKOUT_PAID',
  'BALANCE_VALUE_BLOCKED',
  'BALANCE_VALUE_UNBLOCKED',
  'INTERNAL_TRANSFER_CREDIT',
  'INTERNAL_TRANSFER_DEBIT',
  'ACCESS_TOKEN_CREATED',
  'ACCESS_TOKEN_DELETED',
  'ACCESS_TOKEN_DISABLED',
  'ACCESS_TOKEN_ENABLED',
  'ACCESS_TOKEN_EXPIRED',
  'ACCESS_TOKEN_EXPIRING_SOON',
  'PIX_AUTOMATIC_RECURRING_AUTHORIZATION_CREATED',
  'PIX_AUTOMATIC_RECURRING_AUTHORIZATION_ACTIVATED',
  'PIX_AUTOMATIC_RECURRING_AUTHORIZATION_CANCELLED',
  'PIX_AUTOMATIC_RECURRING_AUTHORIZATION_EXPIRED',
  'PIX_AUTOMATIC_RECURRING_AUTHORIZATION_REFUSED',
  'PIX_AUTOMATIC_RECURRING_PAYMENT_INSTRUCTION_CREATED',
  'PIX_AUTOMATIC_RECURRING_PAYMENT_INSTRUCTION_SCHEDULED',
  'PIX_AUTOMATIC_RECURRING_PAYMENT_INSTRUCTION_REFUSED',
  'PIX_AUTOMATIC_RECURRING_PAYMENT_INSTRUCTION_CANCELLED',
  'PIX_AUTOMATIC_RECURRING_ELIGIBILITY_UPDATED',
]);

export const WebhookCreateSchema = z.object({
  name: z.string().min(1).max(100),
  url: z.string().url('Invalid webhook URL'),
  email: z.string().email('Invalid email'),
  enabled: z.boolean(),
  interrupted: z.boolean(),
  apiVersion: z.literal(3),
  authToken: z.string().min(32).max(255),
  sendType: z.enum(['SEQUENTIALLY', 'NON_SEQUENTIALLY']),
  events: z.array(WebhookEventSchema).min(1, 'At least one event is required'),
});

export const WebhookUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  url: z.string().url().optional(),
  email: z.string().email().optional(),
  enabled: z.boolean().optional(),
  interrupted: z.boolean().optional(),
  apiVersion: z.number().optional(),
  authToken: z.string().min(32).max(255).optional(),
  sendType: z.enum(['SEQUENTIALLY', 'NON_SEQUENTIALLY']).optional(),
  events: z.array(WebhookEventSchema).optional(),
});

export const WebhookListSchema = z.object({
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().min(0).optional(),
});

export const WebhookGetSchema = z.object({
  webhookId: z.string().min(1),
});

export type InstallmentCreateInput = z.infer<typeof InstallmentCreateSchema>;
export type InstallmentListInput = z.infer<typeof InstallmentListSchema>;
export type InstallmentGetInput = z.infer<typeof InstallmentGetSchema>;
export type WebhookCreateInput = z.infer<typeof WebhookCreateSchema>;
export type WebhookUpdateInput = z.infer<typeof WebhookUpdateSchema>;
export type WebhookListInput = z.infer<typeof WebhookListSchema>;
export type WebhookGetInput = z.infer<typeof WebhookGetSchema>;
