import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import {
  createSubscription,
  getSubscription,
  listSubscriptions,
  updateSubscription,
  deleteSubscription,
  updateSubscriptionCreditCard,
  listSubscriptionPayments,
} from '../../asaas/endpoints/subscriptions.js';
import { logger } from '../../utils/logging.js';
import {
  toMcpError,
  createNotFoundError,
  createFinancialOperationError,
} from '../../utils/errors.js';
import { generateIdempotencyKey } from '../../utils/formatting.js';

export function registerSubscriptionTools(server: McpServer): void {
  server.tool(
    'asaas_create_subscription',
    'Create a new subscription for recurring charges in Asaas.\n\n⚠️ FINANCIAL OPERATION: This creates a recurring billing plan that will automatically generate charges.\n\nSupported billing types: BOLETO, PIX, CREDIT_CARD, UNDEFINED.\nCycles: WEEKLY, BIWEEKLY, MONTHLY, BIMONTHLY, QUARTERLY, SEMIANNUALLY, YEARLY.\nUse externalReference to link with your internal subscription ID for idempotency.',
    {
      customer: z.string().min(1).describe('Asaas customer ID (format: cus_xxxxxxxxxxxx)'),
      billingType: z
        .enum(['UNDEFINED', 'BOLETO', 'CREDIT_CARD', 'DEBIT_CARD', 'TRANSFER', 'DEPOSIT', 'PIX'])
        .describe('Payment method for recurring charges'),
      value: z.number().positive().describe('Subscription amount in BRL (e.g., 99.90)'),
      nextDueDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .describe('First charge due date (YYYY-MM-DD)'),
      cycle: z
        .enum(['WEEKLY', 'BIWEEKLY', 'MONTHLY', 'BIMONTHLY', 'QUARTERLY', 'SEMIANNUALLY', 'YEARLY'])
        .describe('Billing cycle'),
      discount: z
        .object({
          value: z.number().positive(),
          dueDateLimitDays: z.number().int().min(0).optional(),
          type: z.enum(['FIXED', 'PERCENTAGE']).optional(),
        })
        .optional()
        .describe('Early payment discount for each charge'),
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
      description: z
        .string()
        .max(500)
        .optional()
        .describe('Subscription description (e.g., "Premium Plan Monthly")'),
      endDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional()
        .describe('Last charge due date (optional)'),
      maxPayments: z
        .number()
        .int()
        .min(1)
        .optional()
        .describe('Maximum number of charges to generate'),
      externalReference: z.string().max(100).optional().describe('Your internal subscription ID'),
      split: z
        .array(
          z.object({
            walletId: z.string().min(1),
            fixedValue: z.number().positive().optional(),
            percentualValue: z.number().min(0).max(100).optional(),
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
    async params => {
      const startTime = Date.now();
      const requestId = generateIdempotencyKey(
        'create_subscription',
        params.externalReference || Date.now().toString()
      );

      logger.info(
        {
          requestId,
          customer: params.customer,
          billingType: params.billingType,
          value: params.value,
          cycle: params.cycle,
        },
        'Creating subscription'
      );

      try {
        const subscription = await createSubscription(params, requestId);

        logger.info(
          { requestId, subscriptionId: subscription.id, duration: Date.now() - startTime },
          'Subscription created'
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  subscription: {
                    id: subscription.id,
                    status: subscription.status,
                    value: subscription.value,
                    billingType: subscription.billingType,
                    cycle: subscription.cycle,
                    nextDueDate: subscription.nextDueDate,
                    endDate: subscription.endDate,
                    description: subscription.description,
                    externalReference: subscription.externalReference,
                    maxPayments: subscription.maxPayments,
                    dateCreated: subscription.dateCreated,
                    customer: subscription.customer,
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
          'Failed to create subscription'
        );
        throw toMcpError(error as Error);
      }
    }
  );

  server.tool(
    'asaas_get_subscription',
    'Retrieve a subscription by its Asaas ID.\n\nReturns full subscription details including status, cycle, amounts, and generated charges info.',
    {
      subscriptionId: z
        .string()
        .min(1)
        .describe('Asaas subscription ID (format: sub_xxxxxxxxxxxx)'),
    },
    async ({ subscriptionId }) => {
      const startTime = Date.now();
      const requestId = generateIdempotencyKey('get_subscription', subscriptionId);

      logger.info({ requestId, subscriptionId }, 'Getting subscription');

      try {
        const subscription = await getSubscription(subscriptionId);

        logger.info(
          { requestId, subscriptionId, duration: Date.now() - startTime },
          'Subscription retrieved'
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  subscription: {
                    id: subscription.id,
                    status: subscription.status,
                    value: subscription.value,
                    billingType: subscription.billingType,
                    cycle: subscription.cycle,
                    nextDueDate: subscription.nextDueDate,
                    endDate: subscription.endDate,
                    description: subscription.description,
                    externalReference: subscription.externalReference,
                    maxPayments: subscription.maxPayments,
                    discount: subscription.discount,
                    fine: subscription.fine,
                    interest: subscription.interest,
                    split: subscription.split,
                    deleted: subscription.deleted,
                    dateCreated: subscription.dateCreated,
                    customer: subscription.customer,
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
          throw createNotFoundError('Subscription', subscriptionId);
        }
        logger.error(
          {
            requestId,
            subscriptionId,
            error: (error as Error).message,
            duration: Date.now() - startTime,
          },
          'Failed to get subscription'
        );
        throw toMcpError(error as Error);
      }
    }
  );

  server.tool(
    'asaas_list_subscriptions',
    'List subscriptions with optional filters and pagination.\n\nSupports filtering by customer, status, billingType, and externalReference.\nReturns paginated results.',
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
        .describe('Filter by subscription status (ACTIVE, EXPIRED, INACTIVE)'),
      billingType: z
        .enum(['UNDEFINED', 'BOLETO', 'CREDIT_CARD', 'DEBIT_CARD', 'TRANSFER', 'DEPOSIT', 'PIX'])
        .optional()
        .describe('Filter by billing type'),
      externalReference: z.string().optional().describe('Filter by external reference'),
      deleted: z.boolean().optional().describe('Include deleted subscriptions'),
    },
    async params => {
      const startTime = Date.now();
      const requestId = generateIdempotencyKey('list_subscriptions', JSON.stringify(params));

      logger.info({ requestId, params }, 'Listing subscriptions');

      try {
        const response = await listSubscriptions(params);

        logger.info(
          {
            requestId,
            count: response.data.length,
            total: response.totalCount,
            duration: Date.now() - startTime,
          },
          'Subscriptions listed'
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  subscriptions: response.data.map(s => ({
                    id: s.id,
                    status: s.status,
                    value: s.value,
                    billingType: s.billingType,
                    cycle: s.cycle,
                    nextDueDate: s.nextDueDate,
                    endDate: s.endDate,
                    description: s.description,
                    externalReference: s.externalReference,
                    maxPayments: s.maxPayments,
                    dateCreated: s.dateCreated,
                    customer: s.customer,
                    deleted: s.deleted,
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
          'Failed to list subscriptions'
        );
        throw toMcpError(error as Error);
      }
    }
  );

  server.tool(
    'asaas_update_subscription',
    'Update an existing subscription in Asaas.\n\nOnly provided fields will be updated. Changes apply to future charges.\n\n⚠️ This modifies real subscription data affecting future charges.',
    {
      subscriptionId: z
        .string()
        .min(1)
        .describe('Asaas subscription ID (format: sub_xxxxxxxxxxxx)'),
      billingType: z
        .enum(['UNDEFINED', 'BOLETO', 'CREDIT_CARD', 'DEBIT_CARD', 'TRANSFER', 'DEPOSIT', 'PIX'])
        .optional()
        .describe('Payment method for recurring charges'),
      value: z.number().positive().optional().describe('New subscription amount'),
      nextDueDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional()
        .describe('Next charge due date (YYYY-MM-DD)'),
      cycle: z
        .enum(['WEEKLY', 'BIWEEKLY', 'MONTHLY', 'BIMONTHLY', 'QUARTERLY', 'SEMIANNUALLY', 'YEARLY'])
        .optional()
        .describe('Billing cycle'),
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
      description: z.string().max(500).optional().describe('Subscription description'),
      endDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional()
        .describe('Last charge due date'),
      maxPayments: z.number().int().min(1).optional().describe('Maximum number of charges'),
      externalReference: z.string().max(100).optional().describe('Your internal subscription ID'),
      split: z
        .array(
          z.object({
            walletId: z.string().min(1),
            fixedValue: z.number().positive().optional(),
            percentualValue: z.number().min(0).max(100).optional(),
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
    async ({ subscriptionId, ...params }) => {
      const startTime = Date.now();
      const requestId = generateIdempotencyKey('update_subscription', subscriptionId);

      logger.info({ requestId, subscriptionId }, 'Updating subscription');

      try {
        const subscription = await updateSubscription(subscriptionId, params);

        logger.info(
          { requestId, subscriptionId, duration: Date.now() - startTime },
          'Subscription updated'
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  subscription: {
                    id: subscription.id,
                    status: subscription.status,
                    value: subscription.value,
                    billingType: subscription.billingType,
                    cycle: subscription.cycle,
                    nextDueDate: subscription.nextDueDate,
                    endDate: subscription.endDate,
                    description: subscription.description,
                    externalReference: subscription.externalReference,
                    maxPayments: subscription.maxPayments,
                    dateCreated: subscription.dateCreated,
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
          throw createNotFoundError('Subscription', subscriptionId);
        }
        logger.error(
          {
            requestId,
            subscriptionId,
            error: (error as Error).message,
            duration: Date.now() - startTime,
          },
          'Failed to update subscription'
        );
        throw toMcpError(error as Error);
      }
    }
  );

  server.tool(
    'asaas_cancel_subscription',
    'Cancel a subscription in Asaas.\n\n⚠️ DESTRUCTIVE FINANCIAL OPERATION: This stops all future charges.\n\nPending charges already generated will remain active unless manually cancelled.\nRequires explicit confirmation.',
    {
      subscriptionId: z
        .string()
        .min(1)
        .describe('Asaas subscription ID (format: sub_xxxxxxxxxxxx)'),
      confirm: z.boolean().describe('Confirmation that you want to cancel this subscription'),
    },
    async ({ subscriptionId, confirm }) => {
      if (!confirm) {
        throw createFinancialOperationError(
          'Subscription cancellation requires explicit confirmation. Set confirm=true to proceed.'
        );
      }

      const startTime = Date.now();
      const requestId = generateIdempotencyKey('cancel_subscription', subscriptionId);

      logger.warn({ requestId, subscriptionId }, 'Cancelling subscription');

      try {
        await deleteSubscription(subscriptionId);

        logger.info(
          { requestId, subscriptionId, duration: Date.now() - startTime },
          'Subscription cancelled'
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  message: `Subscription ${subscriptionId} has been cancelled. Future charges will not be generated.`,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        if (error instanceof Error && error.message.includes('404')) {
          throw createNotFoundError('Subscription', subscriptionId);
        }
        logger.error(
          {
            requestId,
            subscriptionId,
            error: (error as Error).message,
            duration: Date.now() - startTime,
          },
          'Failed to cancel subscription'
        );
        throw toMcpError(error as Error);
      }
    }
  );

  server.tool(
    'asaas_update_subscription_credit_card',
    'Update the credit card for a subscription without charging immediately.\n\nAlso updates all pending charges linked to the subscription.',
    {
      subscriptionId: z
        .string()
        .min(1)
        .describe('Asaas subscription ID (format: sub_xxxxxxxxxxxx)'),
      creditCard: z
        .object({
          holderName: z.string().min(1),
          number: z.string().min(13).max(19),
          expiryMonth: z.number().int().min(1).max(12),
          expiryYear: z.number().int().min(2024).max(2035),
          ccv: z.string().min(3).max(4),
        })
        .describe('Credit card details'),
    },
    async ({ subscriptionId, creditCard }) => {
      const startTime = Date.now();
      const requestId = generateIdempotencyKey('update_subscription_cc', subscriptionId);

      logger.info({ requestId, subscriptionId }, 'Updating subscription credit card');

      try {
        const subscription = await updateSubscriptionCreditCard(subscriptionId, creditCard);

        logger.info(
          { requestId, subscriptionId, duration: Date.now() - startTime },
          'Subscription credit card updated'
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  subscription: {
                    id: subscription.id,
                    status: subscription.status,
                    billingType: subscription.billingType,
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
          throw createNotFoundError('Subscription', subscriptionId);
        }
        logger.error(
          {
            requestId,
            subscriptionId,
            error: (error as Error).message,
            duration: Date.now() - startTime,
          },
          'Failed to update subscription credit card'
        );
        throw toMcpError(error as Error);
      }
    }
  );

  server.tool(
    'asaas_list_subscription_payments',
    'List all payments/charges generated by a subscription.\n\nUseful to see the billing history of a recurring subscription.',
    {
      subscriptionId: z
        .string()
        .min(1)
        .describe('Asaas subscription ID (format: sub_xxxxxxxxxxxx)'),
      limit: z
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .describe('Results per page (default: 50, max: 100)'),
      offset: z.number().int().min(0).optional().describe('Results to skip (default: 0)'),
    },
    async ({ subscriptionId, limit, offset }) => {
      const startTime = Date.now();
      const requestId = generateIdempotencyKey('list_subscription_payments', subscriptionId);

      logger.info({ requestId, subscriptionId }, 'Listing subscription payments');

      try {
        const response = await listSubscriptionPayments(subscriptionId, { limit, offset });

        logger.info(
          {
            requestId,
            subscriptionId,
            count: response.data.length,
            duration: Date.now() - startTime,
          },
          'Subscription payments listed'
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
          throw createNotFoundError('Subscription', subscriptionId);
        }
        logger.error(
          {
            requestId,
            subscriptionId,
            error: (error as Error).message,
            duration: Date.now() - startTime,
          },
          'Failed to list subscription payments'
        );
        throw toMcpError(error as Error);
      }
    }
  );
}
