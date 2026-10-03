import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import {
  createInstallment,
  getInstallment,
  listInstallments,
  deleteInstallment,
  listInstallmentPayments,
  generateInstallmentBooklet,
  cancelInstallmentPayments,
} from '../../asaas/endpoints/installments.js';
import { logger } from '../../utils/logging.js';
import {
  toMcpError,
  createNotFoundError,
  createFinancialOperationError,
} from '../../utils/errors.js';
import { generateIdempotencyKey } from '../../utils/formatting.js';

export function registerInstallmentTools(server: McpServer): void {
  server.tool(
    'asaas_create_installment',
    'Create a new installment plan (parcelamento) in Asaas.\n\n⚠️ FINANCIAL OPERATION: This creates a real installment plan with multiple charges.\n\nUnlike single payments with installments, this creates a dedicated installment object.\nEach installment generates its own charge with independent lifecycle.\nSupported billing types: BOLETO, CREDIT_CARD, PIX, UNDEFINED.\nUse totalValue OR let the system calculate from installmentCount * value.',
    {
      installmentCount: z.number().int().min(2).max(60).describe('Number of installments (2-60)'),
      customer: z.string().min(1).describe('Asaas customer ID (format: cus_xxxxxxxxxxxx)'),
      value: z.number().positive().describe('Value per installment in BRL'),
      totalValue: z
        .number()
        .positive()
        .optional()
        .describe('Total value (optional, calculates installment value if not provided)'),
      billingType: z
        .enum(['UNDEFINED', 'BOLETO', 'CREDIT_CARD', 'DEBIT_CARD', 'TRANSFER', 'DEPOSIT', 'PIX'])
        .describe('Payment method'),
      dueDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .describe('First installment due date (YYYY-MM-DD)'),
      description: z.string().max(500).optional().describe('Installment plan description'),
      postalService: z.boolean().optional().describe('Send physical boletos via mail'),
      daysAfterDueDateToRegistrationCancellation: z
        .number()
        .int()
        .min(0)
        .optional()
        .describe('Days after due date to cancel boleto registration'),
      paymentExternalReference: z
        .string()
        .max(100)
        .optional()
        .describe('External reference for generated charges'),
      discount: z
        .object({
          value: z.number().positive(),
          dueDateLimitDays: z.number().int().min(0).optional(),
          type: z.enum(['FIXED', 'PERCENTAGE']).optional(),
        })
        .optional()
        .describe('Early payment discount'),
      interest: z
        .object({ value: z.number().min(0).max(100) })
        .optional()
        .describe('Monthly interest for late payment'),
      fine: z
        .object({
          value: z.number().min(0).max(100),
          type: z.enum(['FIXED', 'PERCENTAGE']).optional(),
        })
        .optional()
        .describe('Late payment fine'),
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
        .optional()
        .describe('Split payment configuration'),
    },
    async params => {
      const startTime = Date.now();
      const requestId = generateIdempotencyKey(
        'create_installment',
        params.paymentExternalReference || Date.now().toString()
      );

      logger.info(
        {
          requestId,
          customer: params.customer,
          installmentCount: params.installmentCount,
          value: params.value,
        },
        'Creating installment'
      );

      try {
        const installment = await createInstallment(params, requestId);

        logger.info(
          { requestId, installmentId: installment.id, duration: Date.now() - startTime },
          'Installment created'
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  installment: {
                    id: installment.id,
                    value: installment.value,
                    netValue: installment.netValue,
                    paymentValue: installment.paymentValue,
                    installmentCount: installment.installmentCount,
                    billingType: installment.billingType,
                    description: installment.description,
                    expirationDay: installment.expirationDay,
                    dateCreated: installment.dateCreated,
                    customer: installment.customer,
                    deleted: installment.deleted,
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
          'Failed to create installment'
        );
        throw toMcpError(error as Error);
      }
    }
  );

  server.tool(
    'asaas_get_installment',
    'Retrieve an installment plan by its Asaas ID.\n\nReturns full installment details including all generated charges status.',
    {
      installmentId: z.string().min(1).describe('Asaas installment ID (UUID format)'),
    },
    async ({ installmentId }) => {
      const startTime = Date.now();
      const requestId = generateIdempotencyKey('get_installment', installmentId);

      logger.info({ requestId, installmentId }, 'Getting installment');

      try {
        const installment = await getInstallment(installmentId);

        logger.info(
          { requestId, installmentId, duration: Date.now() - startTime },
          'Installment retrieved'
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  installment: {
                    id: installment.id,
                    value: installment.value,
                    netValue: installment.netValue,
                    paymentValue: installment.paymentValue,
                    installmentCount: installment.installmentCount,
                    billingType: installment.billingType,
                    description: installment.description,
                    expirationDay: installment.expirationDay,
                    dateCreated: installment.dateCreated,
                    customer: installment.customer,
                    deleted: installment.deleted,
                    creditCard: installment.creditCard,
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
          throw createNotFoundError('Installment', installmentId);
        }
        logger.error(
          {
            requestId,
            installmentId,
            error: (error as Error).message,
            duration: Date.now() - startTime,
          },
          'Failed to get installment'
        );
        throw toMcpError(error as Error);
      }
    }
  );

  server.tool(
    'asaas_list_installments',
    'List installment plans with optional filters and pagination.\n\nSupports filtering by customer, billingType, and deleted status.',
    {
      limit: z
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .describe('Results per page (default: 50, max: 100)'),
      offset: z.number().int().min(0).optional().describe('Results to skip (default: 0)'),
      customer: z.string().optional().describe('Filter by customer ID'),
      billingType: z
        .enum(['UNDEFINED', 'BOLETO', 'CREDIT_CARD', 'DEBIT_CARD', 'TRANSFER', 'DEPOSIT', 'PIX'])
        .optional()
        .describe('Filter by billing type'),
      deleted: z.boolean().optional().describe('Include deleted installments'),
    },
    async params => {
      const startTime = Date.now();
      const requestId = generateIdempotencyKey('list_installments', JSON.stringify(params));

      logger.info({ requestId, params }, 'Listing installments');

      try {
        const response = await listInstallments(params);

        logger.info(
          {
            requestId,
            count: response.data.length,
            total: response.totalCount,
            duration: Date.now() - startTime,
          },
          'Installments listed'
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  installments: response.data.map(i => ({
                    id: i.id,
                    value: i.value,
                    netValue: i.netValue,
                    paymentValue: i.paymentValue,
                    installmentCount: i.installmentCount,
                    billingType: i.billingType,
                    description: i.description,
                    expirationDay: i.expirationDay,
                    dateCreated: i.dateCreated,
                    customer: i.customer,
                    deleted: i.deleted,
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
          'Failed to list installments'
        );
        throw toMcpError(error as Error);
      }
    }
  );

  server.tool(
    'asaas_delete_installment',
    'Delete/cancel an installment plan.\n\n⚠️ DESTRUCTIVE FINANCIAL OPERATION: This removes the installment plan.\n\nPending charges may still need to be cancelled separately.\nRequires explicit confirmation.',
    {
      installmentId: z.string().min(1).describe('Asaas installment ID (UUID format)'),
      confirm: z.boolean().describe('Confirmation that you want to delete this installment'),
    },
    async ({ installmentId, confirm }) => {
      if (!confirm) {
        throw createFinancialOperationError(
          'Installment deletion requires explicit confirmation. Set confirm=true to proceed.'
        );
      }

      const startTime = Date.now();
      const requestId = generateIdempotencyKey('delete_installment', installmentId);

      logger.warn({ requestId, installmentId }, 'Deleting installment');

      try {
        await deleteInstallment(installmentId);

        logger.info(
          { requestId, installmentId, duration: Date.now() - startTime },
          'Installment deleted'
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  message: `Installment ${installmentId} has been deleted`,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        if (error instanceof Error && error.message.includes('404')) {
          throw createNotFoundError('Installment', installmentId);
        }
        logger.error(
          {
            requestId,
            installmentId,
            error: (error as Error).message,
            duration: Date.now() - startTime,
          },
          'Failed to delete installment'
        );
        throw toMcpError(error as Error);
      }
    }
  );

  server.tool(
    'asaas_list_installment_payments',
    'List all payments/charges generated by an installment plan.',
    {
      installmentId: z.string().min(1).describe('Asaas installment ID (UUID format)'),
      limit: z
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .describe('Results per page (default: 50, max: 100)'),
      offset: z.number().int().min(0).optional().describe('Results to skip (default: 0)'),
    },
    async ({ installmentId, limit, offset }) => {
      const startTime = Date.now();
      const requestId = generateIdempotencyKey('list_installment_payments', installmentId);

      logger.info({ requestId, installmentId }, 'Listing installment payments');

      try {
        const response = await listInstallmentPayments(installmentId, { limit, offset });

        logger.info(
          {
            requestId,
            installmentId,
            count: response.data.length,
            duration: Date.now() - startTime,
          },
          'Installment payments listed'
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  payments: response.data,
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
        if (error instanceof Error && error.message.includes('404')) {
          throw createNotFoundError('Installment', installmentId);
        }
        logger.error(
          {
            requestId,
            installmentId,
            error: (error as Error).message,
            duration: Date.now() - startTime,
          },
          'Failed to list installment payments'
        );
        throw toMcpError(error as Error);
      }
    }
  );

  server.tool(
    'asaas_generate_installment_booklet',
    'Generate a carnê (booklet) PDF for an installment plan.\n\nReturns a URL to download the booklet containing all installment boletos.',
    {
      installmentId: z.string().min(1).describe('Asaas installment ID (UUID format)'),
    },
    async ({ installmentId }) => {
      const startTime = Date.now();
      const requestId = generateIdempotencyKey('generate_installment_booklet', installmentId);

      logger.info({ requestId, installmentId }, 'Generating installment booklet');

      try {
        const result = await generateInstallmentBooklet(installmentId);

        logger.info(
          { requestId, installmentId, duration: Date.now() - startTime },
          'Installment booklet generated'
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  bookletUrl: result.url,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        if (error instanceof Error && error.message.includes('404')) {
          throw createNotFoundError('Installment', installmentId);
        }
        logger.error(
          {
            requestId,
            installmentId,
            error: (error as Error).message,
            duration: Date.now() - startTime,
          },
          'Failed to generate installment booklet'
        );
        throw toMcpError(error as Error);
      }
    }
  );

  server.tool(
    'asaas_cancel_installment_payments',
    'Cancel all pending and overdue payments of an installment plan.\n\n⚠️ FINANCIAL OPERATION: This cancels multiple charges at once.',
    {
      installmentId: z.string().min(1).describe('Asaas installment ID (UUID format)'),
      confirm: z.boolean().describe('Confirmation that you want to cancel these payments'),
    },
    async ({ installmentId, confirm }) => {
      if (!confirm) {
        throw createFinancialOperationError(
          'Cancelling installment payments requires explicit confirmation. Set confirm=true to proceed.'
        );
      }

      const startTime = Date.now();
      const requestId = generateIdempotencyKey('cancel_installment_payments', installmentId);

      logger.warn({ requestId, installmentId }, 'Cancelling installment payments');

      try {
        await cancelInstallmentPayments(installmentId);

        logger.info(
          { requestId, installmentId, duration: Date.now() - startTime },
          'Installment payments cancelled'
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  message: `All pending and overdue payments for installment ${installmentId} have been cancelled`,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        if (error instanceof Error && error.message.includes('404')) {
          throw createNotFoundError('Installment', installmentId);
        }
        logger.error(
          {
            requestId,
            installmentId,
            error: (error as Error).message,
            duration: Date.now() - startTime,
          },
          'Failed to cancel installment payments'
        );
        throw toMcpError(error as Error);
      }
    }
  );
}
