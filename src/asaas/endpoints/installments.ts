import { getAsaasClient } from '../client.js';
import type { Installment, InstallmentCreateRequest, PaginatedResponse } from '../types.js';

export async function createInstallment(
  data: InstallmentCreateRequest,
  idempotencyKey?: string
): Promise<Installment> {
  const client = getAsaasClient();
  return client.post<Installment>('/installments', data, idempotencyKey);
}

export async function createInstallmentWithCreditCard(
  data: InstallmentCreateRequest & { creditCard: object },
  idempotencyKey?: string
): Promise<Installment> {
  const client = getAsaasClient();
  return client.post<Installment>('/installments', data, idempotencyKey);
}

export async function getInstallment(installmentId: string): Promise<Installment> {
  const client = getAsaasClient();
  return client.get<Installment>(`/installments/${installmentId}`);
}

export async function listInstallments(
  params: {
    limit?: number;
    offset?: number;
    customer?: string;
    billingType?: string;
    deleted?: boolean;
  } = {}
): Promise<PaginatedResponse<Installment>> {
  const client = getAsaasClient();
  return client.get<PaginatedResponse<Installment>>('/installments', {
    limit: params.limit,
    offset: params.offset,
    customer: params.customer,
    billingType: params.billingType,
    deleted: params.deleted,
  });
}

export async function deleteInstallment(installmentId: string): Promise<void> {
  const client = getAsaasClient();
  await client.delete<void>(`/installments/${installmentId}`);
}

export async function listInstallmentPayments(
  installmentId: string,
  params: {
    limit?: number;
    offset?: number;
  } = {}
): Promise<PaginatedResponse<unknown>> {
  const client = getAsaasClient();
  return client.get<PaginatedResponse<unknown>>(`/installments/${installmentId}/payments`, {
    limit: params.limit,
    offset: params.offset,
  });
}

export async function generateInstallmentBooklet(installmentId: string): Promise<{ url: string }> {
  const client = getAsaasClient();
  return client.post<{ url: string }>(`/installments/${installmentId}/booklet`);
}

export async function updateInstallmentSplits(
  installmentId: string,
  splits: Array<{
    walletId: string;
    fixedValue?: number;
    percentualValue?: number;
    totalFixedValue?: number;
    externalReference?: string;
    description?: string;
    installmentNumber?: number;
  }>
): Promise<Installment> {
  const client = getAsaasClient();
  return client.post<Installment>(`/installments/${installmentId}/splits`, { splits });
}

export async function cancelInstallmentPayments(installmentId: string): Promise<void> {
  const client = getAsaasClient();
  await client.post<void>(`/installments/${installmentId}/cancel-payments`);
}
