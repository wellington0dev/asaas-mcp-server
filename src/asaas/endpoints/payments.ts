import { getAsaasClient } from '../client.js';
import type {
  Payment,
  PaymentCreateRequest,
  PaymentUpdateRequest,
  PaginatedResponse,
  PaymentStatusResponse,
  PixQrCodeResponse,
  BankSlipResponse,
} from '../types.js';

export async function createPayment(
  data: PaymentCreateRequest,
  idempotencyKey?: string
): Promise<Payment> {
  const client = getAsaasClient();
  return client.post<Payment>('/payments', data, idempotencyKey);
}

export async function createPaymentWithCreditCard(
  data: PaymentCreateRequest & { creditCard: object },
  idempotencyKey?: string
): Promise<Payment> {
  const client = getAsaasClient();
  return client.post<Payment>('/payments', data, idempotencyKey);
}

export async function getPayment(paymentId: string): Promise<Payment> {
  const client = getAsaasClient();
  return client.get<Payment>(`/payments/${paymentId}`);
}

export async function listPayments(
  params: {
    limit?: number;
    offset?: number;
    customer?: string;
    status?: string;
    billingType?: string;
    dateCreated?: string;
    dueDate?: string;
    externalReference?: string;
    deleted?: boolean;
  } = {}
): Promise<PaginatedResponse<Payment>> {
  const client = getAsaasClient();
  return client.get<PaginatedResponse<Payment>>('/payments', {
    limit: params.limit,
    offset: params.offset,
    customer: params.customer,
    status: params.status,
    billingType: params.billingType,
    dateCreated: params.dateCreated,
    dueDate: params.dueDate,
    externalReference: params.externalReference,
    deleted: params.deleted,
  });
}

export async function updatePayment(
  paymentId: string,
  data: PaymentUpdateRequest
): Promise<Payment> {
  const client = getAsaasClient();
  return client.put<Payment>(`/payments/${paymentId}`, data);
}

export async function deletePayment(paymentId: string): Promise<void> {
  const client = getAsaasClient();
  await client.delete<void>(`/payments/${paymentId}`);
}

export async function restorePayment(paymentId: string): Promise<Payment> {
  const client = getAsaasClient();
  return client.post<Payment>(`/payments/${paymentId}/restore`);
}

export async function getPaymentStatus(paymentId: string): Promise<PaymentStatusResponse> {
  const client = getAsaasClient();
  return client.get<PaymentStatusResponse>(`/payments/${paymentId}/status`);
}

export async function getPixQrCode(paymentId: string): Promise<PixQrCodeResponse> {
  const client = getAsaasClient();
  return client.get<PixQrCodeResponse>(`/payments/${paymentId}/pix/qrcode`);
}

export async function getBankSlip(paymentId: string): Promise<BankSlipResponse> {
  const client = getAsaasClient();
  return client.get<BankSlipResponse>(`/payments/${paymentId}/bank-slip`);
}

export async function getDigitableLine(paymentId: string): Promise<{ digitableLine: string }> {
  const client = getAsaasClient();
  return client.get<{ digitableLine: string }>(`/payments/${paymentId}/digitable-line`);
}

export async function confirmCashReceipt(paymentId: string): Promise<Payment> {
  const client = getAsaasClient();
  return client.post<Payment>(`/payments/${paymentId}/confirm-receipt`);
}

export async function undoCashReceipt(paymentId: string): Promise<Payment> {
  const client = getAsaasClient();
  return client.post<Payment>(`/payments/${paymentId}/undo-receipt`);
}
