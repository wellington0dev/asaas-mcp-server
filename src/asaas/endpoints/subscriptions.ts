import { getAsaasClient } from '../client.js';
import type {
  Subscription,
  SubscriptionCreateRequest,
  SubscriptionUpdateRequest,
  PaginatedResponse,
} from '../types.js';

export async function createSubscription(
  data: SubscriptionCreateRequest,
  idempotencyKey?: string
): Promise<Subscription> {
  const client = getAsaasClient();
  return client.post<Subscription>('/subscriptions', data, idempotencyKey);
}

export async function createSubscriptionWithCreditCard(
  data: SubscriptionCreateRequest & { creditCard: object },
  idempotencyKey?: string
): Promise<Subscription> {
  const client = getAsaasClient();
  return client.post<Subscription>('/subscriptions', data, idempotencyKey);
}

export async function getSubscription(subscriptionId: string): Promise<Subscription> {
  const client = getAsaasClient();
  return client.get<Subscription>(`/subscriptions/${subscriptionId}`);
}

export async function listSubscriptions(
  params: {
    limit?: number;
    offset?: number;
    customer?: string;
    status?: string;
    billingType?: string;
    externalReference?: string;
    deleted?: boolean;
  } = {}
): Promise<PaginatedResponse<Subscription>> {
  const client = getAsaasClient();
  return client.get<PaginatedResponse<Subscription>>('/subscriptions', {
    limit: params.limit,
    offset: params.offset,
    customer: params.customer,
    status: params.status,
    billingType: params.billingType,
    externalReference: params.externalReference,
    deleted: params.deleted,
  });
}

export async function updateSubscription(
  subscriptionId: string,
  data: SubscriptionUpdateRequest
): Promise<Subscription> {
  const client = getAsaasClient();
  return client.put<Subscription>(`/subscriptions/${subscriptionId}`, data);
}

export async function deleteSubscription(subscriptionId: string): Promise<void> {
  const client = getAsaasClient();
  await client.delete<void>(`/subscriptions/${subscriptionId}`);
}

export async function updateSubscriptionCreditCard(
  subscriptionId: string,
  creditCard: object
): Promise<Subscription> {
  const client = getAsaasClient();
  return client.post<Subscription>(`/subscriptions/${subscriptionId}/credit-card`, creditCard);
}

export async function listSubscriptionPayments(
  subscriptionId: string,
  params: {
    limit?: number;
    offset?: number;
  } = {}
): Promise<PaginatedResponse<unknown>> {
  const client = getAsaasClient();
  return client.get<PaginatedResponse<unknown>>(`/subscriptions/${subscriptionId}/payments`, {
    limit: params.limit,
    offset: params.offset,
  });
}
