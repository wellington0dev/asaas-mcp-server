import { getAsaasClient } from '../client.js';
import type {
  WebhookConfig,
  WebhookCreateRequest,
  WebhookUpdateRequest,
  PaginatedResponse,
  WebhookEvent,
} from '../types.js';

export type { WebhookEvent };

export async function createWebhook(data: WebhookCreateRequest): Promise<WebhookConfig> {
  const client = getAsaasClient();
  return client.post<WebhookConfig>('/webhooks', data);
}

export async function getWebhook(webhookId: string): Promise<WebhookConfig> {
  const client = getAsaasClient();
  return client.get<WebhookConfig>(`/webhooks/${webhookId}`);
}

export async function listWebhooks(
  params: {
    limit?: number;
    offset?: number;
  } = {}
): Promise<PaginatedResponse<WebhookConfig>> {
  const client = getAsaasClient();
  return client.get<PaginatedResponse<WebhookConfig>>('/webhooks', {
    limit: params.limit,
    offset: params.offset,
  });
}

export async function updateWebhook(
  webhookId: string,
  data: WebhookUpdateRequest
): Promise<WebhookConfig> {
  const client = getAsaasClient();
  return client.put<WebhookConfig>(`/webhooks/${webhookId}`, data);
}

export async function deleteWebhook(webhookId: string): Promise<void> {
  const client = getAsaasClient();
  await client.delete<void>(`/webhooks/${webhookId}`);
}

export async function removeWebhookPenalty(): Promise<void> {
  const client = getAsaasClient();
  await client.post<void>('/webhooks/remove-penalty');
}

export const WEBHOOK_EVENTS: WebhookEvent[] = [
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
];

export function validateWebhookEvent(event: string): event is WebhookEvent {
  return WEBHOOK_EVENTS.includes(event as WebhookEvent);
}

export interface WebhookEventPayload {
  id: string;
  event: WebhookEvent;
  dateCreated: string;
  payment?: { id: string };
  subscription?: { id: string };
  installment?: { id: string };
  transfer?: { id: string };
  invoice?: { id: string };
  bill?: { id: string };
  anticipation?: { id: string };
  mobilePhoneRecharge?: { id: string };
  checkout?: { id: string };
  [key: string]: unknown;
}

export function parseWebhookEvent(payload: unknown): WebhookEventPayload {
  return payload as WebhookEventPayload;
}
