import { getAsaasClient } from '../client.js';
import type { Payment, Refund } from '../types.js';

export interface RefundRequest {
  value?: number;
  description?: string;
  splitRefunds?: Array<{
    id: string;
    value: number;
  }>;
}

export async function refundPayment(paymentId: string, data: RefundRequest): Promise<Payment> {
  const client = getAsaasClient();
  return client.post<Payment>(`/payments/${paymentId}/refund`, data);
}

export async function listPaymentRefunds(paymentId: string): Promise<Refund[]> {
  const client = getAsaasClient();
  return client.get<Refund[]>(`/payments/${paymentId}/refunds`);
}

export async function refundInstallment(
  installmentId: string,
  data: RefundRequest
): Promise<unknown> {
  const client = getAsaasClient();
  return client.post<unknown>(`/installments/${installmentId}/refund`, data);
}

export async function refundBankSlip(
  paymentId: string,
  data: { value?: number; description?: string }
): Promise<Payment> {
  const client = getAsaasClient();
  return client.post<Payment>(`/payments/${paymentId}/refund/bank-slip`, data);
}
