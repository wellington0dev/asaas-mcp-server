import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import {
  createPayment,
  getPayment,
  listPayments,
  updatePayment,
  deletePayment,
  restorePayment,
  getPaymentStatus,
  getPixQrCode,
  getBankSlip,
  confirmCashReceipt,
  undoCashReceipt,
} from '../../asaas/endpoints/payments.js';
import { logger } from '../../utils/logging.js';
import {
  toMcpError,
  createNotFoundError,
  createFinancialOperationError,
} from '../../utils/errors.js';
import { generateIdempotencyKey } from '../../utils/formatting.js';

export function registerPaymentTools(server: McpServer): void {
  server.tool(
    'asaas_create_payment',
    'Create a new payment/charge in Asaas for an existing customer.\n\n⚠️ FINANCIAL OPERATION: This creates a real charge that will be sent to the customer for payment.\n\nSupported billing types: BOLETO (bank slip), PIX, CREDIT_CARD, UNDEFINED (customer chooses).\nFor installments: provide installmentCount (2-60) with either totalValue or installmentValue.\nUse externalReference to link with your internal order/invoice ID for idempotency.',
    {
      customer: z.string().min(1).describe('Asaas customer ID (format: cus_xxxxxxxxxxxx)'),
      billingType: z
        .enum(['UNDEFINED', 'BOLETO', 'CREDIT_CARD', 'DEBIT_CARD', 'TRANSFER', 'DEPOSIT', 'PIX'])
        .describe('Payment method'),
      value: z.number().positive().describe('Payment amount in BRL (e.g., 150.00)'),
      dueDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .describe('Due date in YYYY-MM-DD format'),
      description: z
        .string()
        .max(500)
        .optional()
        .describe('Payment description (e.g., "Order #12345")'),
      daysAfterDueDateToRegistrationCancellation: z
        .number()
        .int()
        .min(0)
        .optional()
        .describe('Days after due date to cancel bank slip registration (boleto only)'),
      externalReference: z
        .string()
        .max(100)
        .optional()
        .describe('Your internal reference (order ID, invoice ID) - enables idempotency'),
      installmentCount: z
        .number()
        .int()
        .min(2)
        .max(60)
        .optional()
        .describe('Number of installments (2-60)'),
      totalValue: z
        .number()
        .positive()
        .optional()
        .describe('Total value for installment (calculates installment value automatically)'),
      installmentValue: z
        .number()
        .positive()
        .optional()
        .describe('Value per installment (alternative to totalValue)'),
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
        .describe('Monthly interest percentage for late payment'),
      fine: z
        .object({
          value: z.number().min(0).max(100),
          type: z.enum(['FIXED', 'PERCENTAGE']).optional(),
        })
        .optional()
        .describe('Late payment fine'),
      postalService: z.boolean().optional().describe('Send physical boleto via mail'),
      split: z
        .array(
          z.object({
            walletId: z.string().min(1),
            fixedValue: z.number().positive().optional(),
            percentualValue: z.number().min(0).max(100).optional(),
            totalFixedValue: z.number().positive().optional(),
            externalReference: z.string().max(100).optional(),
            description: z.string().max(255).optional(),
          })
        )
        .optional()
        .describe('Split payment configuration'),
      callback: z
        .object({
          successUrl: z.string().url().max(255),
          autoRedirect: z.boolean().optional(),
        })
        .optional()
        .describe('Redirect URL after payment'),
      pixAutomaticAuthorizationId: z
        .string()
        .optional()
        .describe('Pix Automatic authorization ID for recurring Pix'),
    },
    async params => {
      const startTime = Date.now();
      const requestId = generateIdempotencyKey(
        'create_payment',
        params.externalReference || Date.now().toString()
      );

      logger.info(
        {
          requestId,
          customer: params.customer,
          billingType: params.billingType,
          value: params.value,
        },
        'Creating payment'
      );

      try {
        const payment = await createPayment(params, requestId);

        logger.info(
          { requestId, paymentId: payment.id, duration: Date.now() - startTime },
          'Payment created'
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  payment: {
                    id: payment.id,
                    status: payment.status,
                    value: payment.value,
                    netValue: payment.netValue,
                    billingType: payment.billingType,
                    dueDate: payment.dueDate,
                    description: payment.description,
                    externalReference: payment.externalReference,
                    invoiceUrl: payment.invoiceUrl,
                    bankSlipUrl: payment.bankSlipUrl,
                    dateCreated: payment.dateCreated,
                    installment: payment.installment,
                    subscription: payment.subscription,
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
          'Failed to create payment'
        );
        throw toMcpError(error as Error);
      }
    }
  );

  server.tool(
    'asaas_get_payment',
    'Retrieve a payment by its Asaas ID.\n\nReturns full payment details including status, amounts, URLs, and metadata.',
    {
      paymentId: z.string().min(1).describe('Asaas payment ID (format: pay_xxxxxxxxxxxx)'),
    },
    async ({ paymentId }) => {
      const startTime = Date.now();
      const requestId = generateIdempotencyKey('get_payment', paymentId);

      logger.info({ requestId, paymentId }, 'Getting payment');

      try {
        const payment = await getPayment(paymentId);

        logger.info(
          { requestId, paymentId, duration: Date.now() - startTime },
          'Payment retrieved'
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  payment: {
                    id: payment.id,
                    status: payment.status,
                    value: payment.value,
                    netValue: payment.netValue,
                    originalValue: payment.originalValue,
                    interestValue: payment.interestValue,
                    billingType: payment.billingType,
                    dueDate: payment.dueDate,
                    originalDueDate: payment.originalDueDate,
                    paymentDate: payment.paymentDate,
                    clientPaymentDate: payment.clientPaymentDate,
                    description: payment.description,
                    externalReference: payment.externalReference,
                    invoiceUrl: payment.invoiceUrl,
                    invoiceNumber: payment.invoiceNumber,
                    bankSlipUrl: payment.bankSlipUrl,
                    nossoNumero: payment.nossoNumero,
                    pixTransaction: payment.pixTransaction,
                    pixQrCodeId: payment.pixQrCodeId,
                    canBePaidAfterDueDate: payment.canBePaidAfterDueDate,
                    installmentNumber: payment.installmentNumber,
                    installment: payment.installment,
                    subscription: payment.subscription,
                    discount: payment.discount,
                    fine: payment.fine,
                    interest: payment.interest,
                    split: payment.split,
                    postalService: payment.postalService,
                    anticipated: payment.anticipated,
                    anticipable: payment.anticipable,
                    creditDate: payment.creditDate,
                    estimatedCreditDate: payment.estimatedCreditDate,
                    deleted: payment.deleted,
                    dateCreated: payment.dateCreated,
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
          throw createNotFoundError('Payment', paymentId);
        }
        logger.error(
          {
            requestId,
            paymentId,
            error: (error as Error).message,
            duration: Date.now() - startTime,
          },
          'Failed to get payment'
        );
        throw toMcpError(error as Error);
      }
    }
  );

  server.tool(
    'asaas_list_payments',
    'List payments with optional filters and pagination.\n\nSupports filtering by customer, status, billingType, date ranges, and externalReference.\nReturns paginated results.',
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
      status: z
        .string()
        .optional()
        .describe(
          'Filter by payment status (PENDING, RECEIVED, CONFIRMED, OVERDUE, REFUNDED, etc.)'
        ),
      billingType: z
        .enum(['UNDEFINED', 'BOLETO', 'CREDIT_CARD', 'DEBIT_CARD', 'TRANSFER', 'DEPOSIT', 'PIX'])
        .optional()
        .describe('Filter by billing type'),
      dateCreated: z.string().optional().describe('Filter by creation date (YYYY-MM-DD)'),
      dueDate: z.string().optional().describe('Filter by due date (YYYY-MM-DD)'),
      externalReference: z.string().optional().describe('Filter by external reference'),
      deleted: z.boolean().optional().describe('Include deleted payments'),
    },
    async params => {
      const startTime = Date.now();
      const requestId = generateIdempotencyKey('list_payments', JSON.stringify(params));

      logger.info({ requestId, params }, 'Listing payments');

      try {
        const response = await listPayments(params);

        logger.info(
          {
            requestId,
            count: response.data.length,
            total: response.totalCount,
            duration: Date.now() - startTime,
          },
          'Payments listed'
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  payments: response.data.map(p => ({
                    id: p.id,
                    status: p.status,
                    value: p.value,
                    netValue: p.netValue,
                    billingType: p.billingType,
                    dueDate: p.dueDate,
                    paymentDate: p.paymentDate,
                    description: p.description,
                    externalReference: p.externalReference,
                    invoiceUrl: p.invoiceUrl,
                    bankSlipUrl: p.bankSlipUrl,
                    customer: p.customer,
                    installment: p.installment,
                    subscription: p.subscription,
                    dateCreated: p.dateCreated,
                    deleted: p.deleted,
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
          'Failed to list payments'
        );
        throw toMcpError(error as Error);
      }
    }
  );

  server.tool(
    'asaas_update_payment',
    'Update an existing payment in Asaas.\n\nOnly provided fields will be updated. Limited fields can be updated after creation.\n\n⚠️ This modifies real payment data.',
    {
      paymentId: z.string().min(1).describe('Asaas payment ID (format: pay_xxxxxxxxxxxx)'),
      description: z.string().max(500).optional().describe('Payment description'),
      externalReference: z.string().max(100).optional().describe('Your internal reference'),
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
      postalService: z.boolean().optional().describe('Send physical boleto via mail'),
      split: z
        .array(
          z.object({
            walletId: z.string().min(1),
            fixedValue: z.number().positive().optional(),
            percentualValue: z.number().min(0).max(100).optional(),
            totalFixedValue: z.number().positive().optional(),
            externalReference: z.string().max(100).optional(),
            description: z.string().max(255).optional(),
          })
        )
        .optional()
        .describe('Split payment configuration'),
      callback: z
        .object({
          successUrl: z.string().url().max(255),
          autoRedirect: z.boolean().optional(),
        })
        .optional()
        .describe('Redirect URL after payment'),
    },
    async ({ paymentId, ...params }) => {
      const startTime = Date.now();
      const requestId = generateIdempotencyKey('update_payment', paymentId);

      logger.info({ requestId, paymentId }, 'Updating payment');

      try {
        const payment = await updatePayment(paymentId, params);

        logger.info({ requestId, paymentId, duration: Date.now() - startTime }, 'Payment updated');

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  payment: {
                    id: payment.id,
                    status: payment.status,
                    value: payment.value,
                    billingType: payment.billingType,
                    dueDate: payment.dueDate,
                    description: payment.description,
                    externalReference: payment.externalReference,
                    dateCreated: payment.dateCreated,
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
          throw createNotFoundError('Payment', paymentId);
        }
        logger.error(
          {
            requestId,
            paymentId,
            error: (error as Error).message,
            duration: Date.now() - startTime,
          },
          'Failed to update payment'
        );
        throw toMcpError(error as Error);
      }
    }
  );

  server.tool(
    'asaas_delete_payment',
    'Delete/cancel a payment in Asaas.\n\n⚠️ DESTRUCTIVE FINANCIAL OPERATION: This cancels a charge.\n\nOnly use when explicitly requested. Payments that are already RECEIVED or CONFIRMED cannot be deleted.\nRequires explicit confirmation.',
    {
      paymentId: z.string().min(1).describe('Asaas payment ID (format: pay_xxxxxxxxxxxx)'),
      confirm: z.boolean().describe('Confirmation that you want to delete this payment'),
    },
    async ({ paymentId, confirm }) => {
      if (!confirm) {
        throw createFinancialOperationError(
          'Payment deletion requires explicit confirmation. Set confirm=true to proceed.'
        );
      }

      const startTime = Date.now();
      const requestId = generateIdempotencyKey('delete_payment', paymentId);

      logger.warn({ requestId, paymentId }, 'Deleting payment');

      try {
        await deletePayment(paymentId);

        logger.info({ requestId, paymentId, duration: Date.now() - startTime }, 'Payment deleted');

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  message: `Payment ${paymentId} has been deleted`,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        if (error instanceof Error && error.message.includes('404')) {
          throw createNotFoundError('Payment', paymentId);
        }
        logger.error(
          {
            requestId,
            paymentId,
            error: (error as Error).message,
            duration: Date.now() - startTime,
          },
          'Failed to delete payment'
        );
        throw toMcpError(error as Error);
      }
    }
  );

  server.tool(
    'asaas_get_payment_status',
    'Get simplified payment status information.\n\nReturns a concise summary of the payment current state, ideal for quick status checks.',
    {
      paymentId: z.string().min(1).describe('Asaas payment ID (format: pay_xxxxxxxxxxxx)'),
    },
    async ({ paymentId }) => {
      const startTime = Date.now();
      const requestId = generateIdempotencyKey('get_payment_status', paymentId);

      logger.info({ requestId, paymentId }, 'Getting payment status');

      try {
        const status = await getPaymentStatus(paymentId);

        const statusDescriptions: Record<string, string> = {
          PENDING: 'Aguardando pagamento',
          RECEIVED: 'Pagamento recebido',
          CONFIRMED: 'Pagamento confirmado',
          OVERDUE: 'Vencido',
          REFUNDED: 'Estornado',
          RECEIVED_IN_CASH: 'Recebido em dinheiro',
          REFUND_REQUESTED: 'Estorno solicitado',
          REFUND_IN_PROGRESS: 'Estorno em andamento',
          CHARGEBACK_REQUESTED: 'Chargeback solicitado',
          CHARGEBACK_DISPUTE: 'Chargeback em disputa',
          AWAITING_CHARGEBACK_REVERSAL: 'Aguardando reversão de chargeback',
          DUNNING_REQUESTED: 'Negativação solicitada',
          DUNNING_RECEIVED: 'Negativação recebida',
          AWAITING_RISK_ANALYSIS: 'Aguardando análise de risco',
        };

        logger.info(
          { requestId, paymentId, status: status.status, duration: Date.now() - startTime },
          'Payment status retrieved'
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  paymentId: status.paymentId,
                  status: status.status,
                  statusDescription: statusDescriptions[status.status] || status.status,
                  value: status.value,
                  paidValue: status.paidValue,
                  dueDate: status.dueDate,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        if (error instanceof Error && error.message.includes('404')) {
          throw createNotFoundError('Payment', paymentId);
        }
        logger.error(
          {
            requestId,
            paymentId,
            error: (error as Error).message,
            duration: Date.now() - startTime,
          },
          'Failed to get payment status'
        );
        throw toMcpError(error as Error);
      }
    }
  );

  server.tool(
    'asaas_get_payment_pix_qrcode',
    'Get PIX QR Code for a payment.\n\nReturns the PIX payload (copia e cola) and base64 encoded QR Code image.\nOnly works for payments with billingType PIX.',
    {
      paymentId: z.string().min(1).describe('Asaas payment ID (format: pay_xxxxxxxxxxxx)'),
    },
    async ({ paymentId }) => {
      const startTime = Date.now();
      const requestId = generateIdempotencyKey('get_pix_qrcode', paymentId);

      logger.info({ requestId, paymentId }, 'Getting PIX QR Code');

      try {
        const qrCode = await getPixQrCode(paymentId);

        logger.info(
          { requestId, paymentId, duration: Date.now() - startTime },
          'PIX QR Code retrieved'
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  pix: {
                    payload: qrCode.payload,
                    qrCodeBase64: qrCode.encodedImage,
                    expirationDate: qrCode.expirationDate,
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
          throw createNotFoundError('Payment', paymentId);
        }
        logger.error(
          {
            requestId,
            paymentId,
            error: (error as Error).message,
            duration: Date.now() - startTime,
          },
          'Failed to get PIX QR Code'
        );
        throw toMcpError(error as Error);
      }
    }
  );

  server.tool(
    'asaas_get_payment_bank_slip',
    'Get bank slip (boleto) information for a payment.\n\nReturns the digitable line, nosso numero, and download URL.\nOnly works for payments with billingType BOLETO.',
    {
      paymentId: z.string().min(1).describe('Asaas payment ID (format: pay_xxxxxxxxxxxx)'),
    },
    async ({ paymentId }) => {
      const startTime = Date.now();
      const requestId = generateIdempotencyKey('get_bank_slip', paymentId);

      logger.info({ requestId, paymentId }, 'Getting bank slip');

      try {
        const bankSlip = await getBankSlip(paymentId);

        logger.info(
          { requestId, paymentId, duration: Date.now() - startTime },
          'Bank slip retrieved'
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  bankSlip: {
                    digitableLine: bankSlip.digitableLine,
                    nossoNumero: bankSlip.nossoNumero,
                    bankSlipUrl: bankSlip.bankSlipUrl,
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
          throw createNotFoundError('Payment', paymentId);
        }
        logger.error(
          {
            requestId,
            paymentId,
            error: (error as Error).message,
            duration: Date.now() - startTime,
          },
          'Failed to get bank slip'
        );
        throw toMcpError(error as Error);
      }
    }
  );

  server.tool(
    'asaas_restore_payment',
    'Restore a previously deleted payment.\n\nOnly works for payments that were soft-deleted.',
    {
      paymentId: z.string().min(1).describe('Asaas payment ID (format: pay_xxxxxxxxxxxx)'),
    },
    async ({ paymentId }) => {
      const startTime = Date.now();
      const requestId = generateIdempotencyKey('restore_payment', paymentId);

      logger.info({ requestId, paymentId }, 'Restoring payment');

      try {
        const payment = await restorePayment(paymentId);

        logger.info({ requestId, paymentId, duration: Date.now() - startTime }, 'Payment restored');

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  payment: {
                    id: payment.id,
                    status: payment.status,
                    value: payment.value,
                    billingType: payment.billingType,
                    dueDate: payment.dueDate,
                    dateCreated: payment.dateCreated,
                    deleted: payment.deleted,
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
          throw createNotFoundError('Payment', paymentId);
        }
        logger.error(
          {
            requestId,
            paymentId,
            error: (error as Error).message,
            duration: Date.now() - startTime,
          },
          'Failed to restore payment'
        );
        throw toMcpError(error as Error);
      }
    }
  );

  server.tool(
    'asaas_confirm_cash_receipt',
    'Confirm cash receipt for a payment.\n\nUse when customer pays in cash and you need to mark the payment as received.\n\n⚠️ FINANCIAL OPERATION: This marks a payment as received without actual bank processing.',
    {
      paymentId: z.string().min(1).describe('Asaas payment ID (format: pay_xxxxxxxxxxxx)'),
    },
    async ({ paymentId }) => {
      const startTime = Date.now();
      const requestId = generateIdempotencyKey('confirm_cash_receipt', paymentId);

      logger.warn({ requestId, paymentId }, 'Confirming cash receipt');

      try {
        const payment = await confirmCashReceipt(paymentId);

        logger.info(
          { requestId, paymentId, duration: Date.now() - startTime },
          'Cash receipt confirmed'
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  payment: {
                    id: payment.id,
                    status: payment.status,
                    value: payment.value,
                    paymentDate: payment.paymentDate,
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
          throw createNotFoundError('Payment', paymentId);
        }
        logger.error(
          {
            requestId,
            paymentId,
            error: (error as Error).message,
            duration: Date.now() - startTime,
          },
          'Failed to confirm cash receipt'
        );
        throw toMcpError(error as Error);
      }
    }
  );

  server.tool(
    'asaas_undo_cash_receipt',
    'Undo a cash receipt confirmation.\n\nReverts a previous cash receipt confirmation.\n\n⚠️ FINANCIAL OPERATION: This reverses a manual payment confirmation.',
    {
      paymentId: z.string().min(1).describe('Asaas payment ID (format: pay_xxxxxxxxxxxx)'),
    },
    async ({ paymentId }) => {
      const startTime = Date.now();
      const requestId = generateIdempotencyKey('undo_cash_receipt', paymentId);

      logger.warn({ requestId, paymentId }, 'Undoing cash receipt');

      try {
        const payment = await undoCashReceipt(paymentId);

        logger.info(
          { requestId, paymentId, duration: Date.now() - startTime },
          'Cash receipt undone'
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  payment: {
                    id: payment.id,
                    status: payment.status,
                    value: payment.value,
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
          throw createNotFoundError('Payment', paymentId);
        }
        logger.error(
          {
            requestId,
            paymentId,
            error: (error as Error).message,
            duration: Date.now() - startTime,
          },
          'Failed to undo cash receipt'
        );
        throw toMcpError(error as Error);
      }
    }
  );
}
