import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import {
  createCustomer,
  getCustomer,
  listCustomers,
  updateCustomer,
  deleteCustomer,
  restoreCustomer,
} from '../../asaas/endpoints/customers.js';
import { logger } from '../../utils/logging.js';
import {
  toMcpError,
  createNotFoundError,
  createFinancialOperationError,
} from '../../utils/errors.js';
import { generateIdempotencyKey } from '../../utils/formatting.js';

export function registerCustomerTools(server: McpServer): void {
  server.tool(
    'asaas_create_customer',
    'Create a new customer in Asaas. Use this to register a payer who will be referenced in payments, subscriptions, and other operations.\n\n⚠️ FINANCIAL OPERATION: This creates a real customer record in Asaas.\n\nRequired fields: name, cpfCnpj\nOptional: email, phone, mobilePhone, address, addressNumber, complement, province, postalCode, externalReference, notificationDisabled, additionalEmails, municipalInscription, stateInscription, observations, groupName, groupNames, company, foreignCustomer',
    {
      name: z.string().min(1).max(255).describe('Customer full name'),
      cpfCnpj: z
        .string()
        .min(11)
        .max(18)
        .describe('CPF (11 digits) or CNPJ (14 digits) - numbers only'),
      email: z.string().email().optional().describe('Customer email address'),
      phone: z.string().max(20).optional().describe('Landline phone (numbers only)'),
      mobilePhone: z.string().max(20).optional().describe('Mobile phone (numbers only)'),
      address: z.string().max(255).optional().describe('Street address'),
      addressNumber: z.string().max(20).optional().describe('Address number'),
      complement: z.string().max(255).optional().describe('Address complement'),
      province: z.string().max(100).optional().describe('Neighborhood/district'),
      postalCode: z.string().max(10).optional().describe('Postal code/CEP (numbers only)'),
      externalReference: z
        .string()
        .max(100)
        .optional()
        .describe('Your internal reference ID for this customer'),
      notificationDisabled: z
        .boolean()
        .optional()
        .describe('Disable payment notifications for this customer'),
      additionalEmails: z
        .string()
        .max(500)
        .optional()
        .describe('Additional emails for notifications, comma-separated'),
      municipalInscription: z.string().max(50).optional().describe('Municipal registration'),
      stateInscription: z.string().max(50).optional().describe('State registration'),
      observations: z
        .string()
        .max(1000)
        .optional()
        .describe('Internal observations about the customer'),
      groupName: z.string().max(100).optional().describe('Group name for organizing customers'),
      groupNames: z
        .array(z.string().max(100))
        .max(20)
        .optional()
        .describe('Multiple group names (max 20)'),
      company: z.string().max(255).optional().describe('Company name'),
      foreignCustomer: z
        .boolean()
        .optional()
        .describe('Whether the customer is foreign (requires account approval in production)'),
    },
    async params => {
      const startTime = Date.now();
      const requestId = generateIdempotencyKey(
        'create_customer',
        params.externalReference || Date.now().toString()
      );

      logger.info({ requestId, externalReference: params.externalReference }, 'Creating customer');

      try {
        const customer = await createCustomer(params, requestId);

        logger.info(
          { requestId, customerId: customer.id, duration: Date.now() - startTime },
          'Customer created'
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  customer: {
                    id: customer.id,
                    name: customer.name,
                    email: customer.email,
                    cpfCnpj: customer.cpfCnpj,
                    phone: customer.phone,
                    mobilePhone: customer.mobilePhone,
                    address: customer.address,
                    addressNumber: customer.addressNumber,
                    complement: customer.complement,
                    province: customer.province,
                    city: customer.cityName,
                    state: customer.state,
                    postalCode: customer.postalCode,
                    personType: customer.personType,
                    externalReference: customer.externalReference,
                    notificationDisabled: customer.notificationDisabled,
                    observations: customer.observations,
                    foreignCustomer: customer.foreignCustomer,
                    dateCreated: customer.dateCreated,
                  },
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        logger.error(
          { requestId, error: (error as Error).message, duration: Date.now() - startTime },
          'Failed to create customer'
        );
        throw toMcpError(error as Error);
      }
    }
  );

  server.tool(
    'asaas_get_customer',
    'Retrieve a customer by their Asaas ID.\n\nReturns full customer details including address, contact info, and metadata.',
    {
      customerId: z.string().min(1).describe('Asaas customer ID (format: cus_xxxxxxxxxxxx)'),
    },
    async ({ customerId }) => {
      const startTime = Date.now();
      const requestId = generateIdempotencyKey('get_customer', customerId);

      logger.info({ requestId, customerId }, 'Getting customer');

      try {
        const customer = await getCustomer(customerId);

        logger.info(
          { requestId, customerId, duration: Date.now() - startTime },
          'Customer retrieved'
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  customer: {
                    id: customer.id,
                    name: customer.name,
                    email: customer.email,
                    cpfCnpj: customer.cpfCnpj,
                    phone: customer.phone,
                    mobilePhone: customer.mobilePhone,
                    address: customer.address,
                    addressNumber: customer.addressNumber,
                    complement: customer.complement,
                    province: customer.province,
                    city: customer.cityName,
                    state: customer.state,
                    postalCode: customer.postalCode,
                    personType: customer.personType,
                    externalReference: customer.externalReference,
                    notificationDisabled: customer.notificationDisabled,
                    observations: customer.observations,
                    foreignCustomer: customer.foreignCustomer,
                    dateCreated: customer.dateCreated,
                    deleted: customer.deleted,
                  },
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        if (error instanceof Error && error.message.includes('404')) {
          throw createNotFoundError('Customer', customerId);
        }
        logger.error(
          {
            requestId,
            customerId,
            error: (error as Error).message,
            duration: Date.now() - startTime,
          },
          'Failed to get customer'
        );
        throw toMcpError(error as Error);
      }
    }
  );

  server.tool(
    'asaas_list_customers',
    'List customers with optional filters and pagination.\n\nSupports filtering by name, email, CPF/CNPJ, externalReference, and deleted status.\nReturns paginated results with limit/offset.',
    {
      limit: z
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .describe('Number of results per page (default: 50, max: 100)'),
      offset: z.number().int().min(0).optional().describe('Number of results to skip (default: 0)'),
      name: z.string().optional().describe('Filter by customer name (partial match)'),
      email: z.string().optional().describe('Filter by customer email'),
      cpfCnpj: z.string().optional().describe('Filter by CPF/CNPJ'),
      externalReference: z.string().optional().describe('Filter by external reference'),
      deleted: z.boolean().optional().describe('Include deleted customers'),
    },
    async params => {
      const startTime = Date.now();
      const requestId = generateIdempotencyKey('list_customers', JSON.stringify(params));

      logger.info({ requestId, params }, 'Listing customers');

      try {
        const response = await listCustomers(params);

        logger.info(
          {
            requestId,
            count: response.data.length,
            total: response.totalCount,
            duration: Date.now() - startTime,
          },
          'Customers listed'
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  customers: response.data.map(c => ({
                    id: c.id,
                    name: c.name,
                    email: c.email,
                    cpfCnpj: c.cpfCnpj,
                    phone: c.phone,
                    mobilePhone: c.mobilePhone,
                    address: c.address,
                    addressNumber: c.addressNumber,
                    province: c.province,
                    city: c.cityName,
                    state: c.state,
                    postalCode: c.postalCode,
                    personType: c.personType,
                    externalReference: c.externalReference,
                    notificationDisabled: c.notificationDisabled,
                    observations: c.observations,
                    foreignCustomer: c.foreignCustomer,
                    dateCreated: c.dateCreated,
                    deleted: c.deleted,
                  })),
                  pagination: {
                    limit: response.limit,
                    offset: response.offset,
                    totalCount: response.totalCount,
                    hasMore: response.hasMore,
                  },
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        logger.error(
          { requestId, error: (error as Error).message, duration: Date.now() - startTime },
          'Failed to list customers'
        );
        throw toMcpError(error as Error);
      }
    }
  );

  server.tool(
    'asaas_update_customer',
    'Update an existing customer in Asaas.\n\nOnly provided fields will be updated. Use this to modify customer contact info, address, or metadata.\n\n⚠️ This modifies real customer data.',
    {
      customerId: z.string().min(1).describe('Asaas customer ID (format: cus_xxxxxxxxxxxx)'),
      name: z.string().min(1).max(255).optional().describe('Customer full name'),
      email: z.string().email().optional().describe('Customer email address'),
      phone: z.string().max(20).optional().describe('Landline phone (numbers only)'),
      mobilePhone: z.string().max(20).optional().describe('Mobile phone (numbers only)'),
      address: z.string().max(255).optional().describe('Street address'),
      addressNumber: z.string().max(20).optional().describe('Address number'),
      complement: z.string().max(255).optional().describe('Address complement'),
      province: z.string().max(100).optional().describe('Neighborhood/district'),
      postalCode: z.string().max(10).optional().describe('Postal code/CEP (numbers only)'),
      externalReference: z
        .string()
        .max(100)
        .optional()
        .describe('Your internal reference ID for this customer'),
      notificationDisabled: z
        .boolean()
        .optional()
        .describe('Disable payment notifications for this customer'),
      additionalEmails: z
        .string()
        .max(500)
        .optional()
        .describe('Additional emails for notifications, comma-separated'),
      municipalInscription: z.string().max(50).optional().describe('Municipal registration'),
      stateInscription: z.string().max(50).optional().describe('State registration'),
      observations: z
        .string()
        .max(1000)
        .optional()
        .describe('Internal observations about the customer'),
      groupName: z.string().max(100).optional().describe('Group name for organizing customers'),
      groupNames: z
        .array(z.string().max(100))
        .max(20)
        .optional()
        .describe('Multiple group names (max 20)'),
      company: z.string().max(255).optional().describe('Company name'),
    },
    async ({ customerId, ...params }) => {
      const startTime = Date.now();
      const requestId = generateIdempotencyKey('update_customer', customerId);

      logger.info({ requestId, customerId }, 'Updating customer');

      try {
        const customer = await updateCustomer(customerId, params);

        logger.info(
          { requestId, customerId, duration: Date.now() - startTime },
          'Customer updated'
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  customer: {
                    id: customer.id,
                    name: customer.name,
                    email: customer.email,
                    cpfCnpj: customer.cpfCnpj,
                    phone: customer.phone,
                    mobilePhone: customer.mobilePhone,
                    address: customer.address,
                    addressNumber: customer.addressNumber,
                    complement: customer.complement,
                    province: customer.province,
                    city: customer.cityName,
                    state: customer.state,
                    postalCode: customer.postalCode,
                    personType: customer.personType,
                    externalReference: customer.externalReference,
                    notificationDisabled: customer.notificationDisabled,
                    observations: customer.observations,
                    foreignCustomer: customer.foreignCustomer,
                    dateCreated: customer.dateCreated,
                    deleted: customer.deleted,
                  },
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        if (error instanceof Error && error.message.includes('404')) {
          throw createNotFoundError('Customer', customerId);
        }
        logger.error(
          {
            requestId,
            customerId,
            error: (error as Error).message,
            duration: Date.now() - startTime,
          },
          'Failed to update customer'
        );
        throw toMcpError(error as Error);
      }
    }
  );

  server.tool(
    'asaas_delete_customer',
    'Delete a customer from Asaas.\n\n⚠️ DESTRUCTIVE OPERATION: This permanently removes the customer.\n\nOnly use when explicitly requested by the user. Customers with active payments or subscriptions cannot be deleted.',
    {
      customerId: z.string().min(1).describe('Asaas customer ID (format: cus_xxxxxxxxxxxx)'),
      confirm: z.boolean().describe('Confirmation that you want to delete this customer'),
    },
    async ({ customerId, confirm }) => {
      if (!confirm) {
        throw createFinancialOperationError(
          'Customer deletion requires explicit confirmation. Set confirm=true to proceed.'
        );
      }

      const startTime = Date.now();
      const requestId = generateIdempotencyKey('delete_customer', customerId);

      logger.warn({ requestId, customerId }, 'Deleting customer');

      try {
        await deleteCustomer(customerId);

        logger.info(
          { requestId, customerId, duration: Date.now() - startTime },
          'Customer deleted'
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  message: `Customer ${customerId} has been deleted`,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        if (error instanceof Error && error.message.includes('404')) {
          throw createNotFoundError('Customer', customerId);
        }
        logger.error(
          {
            requestId,
            customerId,
            error: (error as Error).message,
            duration: Date.now() - startTime,
          },
          'Failed to delete customer'
        );
        throw toMcpError(error as Error);
      }
    }
  );

  server.tool(
    'asaas_restore_customer',
    'Restore a previously deleted customer.\n\nOnly works for customers that were soft-deleted (not permanently removed).',
    {
      customerId: z.string().min(1).describe('Asaas customer ID (format: cus_xxxxxxxxxxxx)'),
    },
    async ({ customerId }) => {
      const startTime = Date.now();
      const requestId = generateIdempotencyKey('restore_customer', customerId);

      logger.info({ requestId, customerId }, 'Restoring customer');

      try {
        const customer = await restoreCustomer(customerId);

        logger.info(
          { requestId, customerId, duration: Date.now() - startTime },
          'Customer restored'
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  customer: {
                    id: customer.id,
                    name: customer.name,
                    email: customer.email,
                    cpfCnpj: customer.cpfCnpj,
                    dateCreated: customer.dateCreated,
                    deleted: customer.deleted,
                  },
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        if (error instanceof Error && error.message.includes('404')) {
          throw createNotFoundError('Customer', customerId);
        }
        logger.error(
          {
            requestId,
            customerId,
            error: (error as Error).message,
            duration: Date.now() - startTime,
          },
          'Failed to restore customer'
        );
        throw toMcpError(error as Error);
      }
    }
  );
}
