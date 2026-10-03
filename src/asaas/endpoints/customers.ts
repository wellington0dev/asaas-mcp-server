import { getAsaasClient } from '../client.js';
import type {
  Customer,
  CustomerCreateRequest,
  CustomerUpdateRequest,
  PaginatedResponse,
} from '../types.js';

export async function createCustomer(
  data: CustomerCreateRequest,
  idempotencyKey?: string
): Promise<Customer> {
  const client = getAsaasClient();
  return client.post<Customer>('/customers', data, idempotencyKey);
}

export async function getCustomer(customerId: string): Promise<Customer> {
  const client = getAsaasClient();
  return client.get<Customer>(`/customers/${customerId}`);
}

export async function listCustomers(
  params: {
    limit?: number;
    offset?: number;
    name?: string;
    email?: string;
    cpfCnpj?: string;
    externalReference?: string;
    deleted?: boolean;
  } = {}
): Promise<PaginatedResponse<Customer>> {
  const client = getAsaasClient();
  return client.get<PaginatedResponse<Customer>>('/customers', {
    limit: params.limit,
    offset: params.offset,
    name: params.name,
    email: params.email,
    cpfCnpj: params.cpfCnpj,
    externalReference: params.externalReference,
    deleted: params.deleted,
  });
}

export async function updateCustomer(
  customerId: string,
  data: CustomerUpdateRequest
): Promise<Customer> {
  const client = getAsaasClient();
  return client.put<Customer>(`/customers/${customerId}`, data);
}

export async function deleteCustomer(customerId: string): Promise<void> {
  const client = getAsaasClient();
  await client.delete<void>(`/customers/${customerId}`);
}

export async function restoreCustomer(customerId: string): Promise<Customer> {
  const client = getAsaasClient();
  return client.post<Customer>(`/customers/${customerId}/restore`);
}
