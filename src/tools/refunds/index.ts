import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import {
  refundPayment,
  listPaymentRefunds,
  refundInstallment,
  refundBankSlip,
} from '../../asaas/endpoints/refunds.js';
import { logger } from '../../utils/logging.js';
import { toMcpError, createNotFoundError } from '../../utils/errors.js';
import { generateIdempotencyKey } from '../../utils/formatting.js';

export function registerRefundTools(server: McpServer): void {
  server.tool(
    'asaas_refund_payment',
    'Refund (estornar) a payment in Asaas.\n\n⚠️ HIGH IMPACT FINANCIAL OPERATION: This moves real money back to the customer.\n\nOnly works for CONFIRMED or RECEIVED payments via PIX or CREDIT_CARD.\nFull refund: omit value. Partial refund: specify value.\nFor split payments, use splitRefunds to refund specific portions to each wallet.',
    {
      paymentId: z.string().min(1).describe('Asaas payment ID (format: pay_xxxxxxxxxxxx)'),
      value: z.number().positive().optional().describe('Refund amount (omit for full refund)'),
      description: z.string().max(500).optional().describe('Reason for refund'),
      splitRefunds: z
        .array(
          z.object({
            id: z.string().min(1).describe('Split ID'),
            value: z.number().positive().describe('Amount to refund from this split'),
          })
        )
        .optional()
        .describe('Partial refunds per split'),
    },
    async ({ paymentId, ...params }) => {
      const startTime = Date.now();
      const requestId = generateIdempotencyKey('refund_payment', paymentId);

      logger.warn({ requestId, paymentId, value: params.value }, 'Processing refund');

      try {
        const payment = await refundPayment(paymentId, params);

        logger.info({ requestId, paymentId, duration: Date.now() - startTime }, 'Refund processed');

        const refund = payment.refunds?.[payment.refunds.length - 1];

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  refund: {
                    paymentId: payment.id,
                    status: refund?.status,
                    value: refund?.value,
                    description: refund?.description,
                    dateCreated: refund?.dateCreated,
                    effectiveDate: refund?.effectiveDate,
                  },
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
          'Failed to refund payment'
        );
        throw toMcpError(error as Error);
      }
    }
  );

  server.tool(
    'asaas_list_payment_refunds',
    'List all refunds for a payment.\n\nReturns history of all refund attempts and their statuses.',
    {
      paymentId: z.string().min(1).describe('Asaas payment ID (format: pay_xxxxxxxxxxxx)'),
    },
    async ({ paymentId }) => {
      const startTime = Date.now();
      const requestId = generateIdempotencyKey('list_refunds', paymentId);

      logger.info({ requestId, paymentId }, 'Listing payment refunds');

      try {
        const refunds = await listPaymentRefunds(paymentId);

        logger.info(
          { requestId, paymentId, count: refunds.length, duration: Date.now() - startTime },
          'Refunds listed'
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  refunds: refunds.map(r => ({
                    dateCreated: r.dateCreated,
                    status: r.status,
                    value: r.value,
                    description: r.description,
                    effectiveDate: r.effectiveDate,
                    transactionReceiptUrl: r.transactionReceiptUrl,
                    refundedSplits: r.refundedSplits,
                  })),
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
          'Failed to list refunds'
        );
        throw toMcpError(error as Error);
      }
    }
  );

  server.tool(
    'asaas_refund_installment',
    'Refund an installment payment.\n\n⚠️ HIGH IMPACT FINANCIAL OPERATION: This moves real money back to the customer.\n\nWorks for credit card installments that are RECEIVED or CONFIRMED.',
    {
      installmentId: z.string().min(1).describe('Asaas installment ID (UUID format)'),
      value: z.number().positive().optional().describe('Refund amount (omit for full refund)'),
      description: z.string().max(500).optional().describe('Reason for refund'),
      splitRefunds: z
        .array(
          z.object({
            id: z.string().min(1),
            value: z.number().positive(),
          })
        )
        .optional()
        .describe('Partial refunds per split'),
    },
    async ({ installmentId, ...params }) => {
      const startTime = Date.now();
      const requestId = generateIdempotencyKey('refund_installment', installmentId);

      logger.warn(
        { requestId, installmentId, value: params.value },
        'Processing installment refund'
      );

      try {
        const result = await refundInstallment(installmentId, params);

        logger.info(
          { requestId, installmentId, duration: Date.now() - startTime },
          'Installment refund processed'
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  result,
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
          'Failed to refund installment'
        );
        throw toMcpError(error as Error);
      }
    }
  );

  server.tool(
    'asaas_refund_bank_slip',
    'Refund a bank slip (boleto) payment.\n\n⚠️ HIGH IMPACT FINANCIAL OPERATION: This moves real money back to the customer.\n\nOnly works for RECEIVED boleto payments.',
    {
      paymentId: z.string().min(1).describe('Asaas payment ID (format: pay_xxxxxxxxxxxx)'),
      value: z.number().positive().optional().describe('Refund amount (omit for full refund)'),
      description: z.string().max(500).optional().describe('Reason for refund'),
    },
    async ({ paymentId, ...params }) => {
      const startTime = Date.now();
      const requestId = generateIdempotencyKey('refund_bank_slip', paymentId);

      logger.warn({ requestId, paymentId, value: params.value }, 'Processing boleto refund');

      try {
        const payment = await refundBankSlip(paymentId, params);

        logger.info(
          { requestId, paymentId, duration: Date.now() - startTime },
          'Boleto refund processed'
        );

        const refund = payment.refunds?.[payment.refunds.length - 1];

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  refund: {
                    paymentId: payment.id,
                    status: refund?.status,
                    value: refund?.value,
                    description: refund?.description,
                    dateCreated: refund?.dateCreated,
                  },
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
          'Failed to refund bank slip'
        );
        throw toMcpError(error as Error);
      }
    }
  );
}
