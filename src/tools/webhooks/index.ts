import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import {
  createWebhook,
  getWebhook,
  listWebhooks,
  updateWebhook,
  deleteWebhook,
  removeWebhookPenalty,
  WEBHOOK_EVENTS,
  type WebhookEvent,
  type WebhookEventPayload,
  parseWebhookEvent,
  validateWebhookEvent,
} from '../../asaas/endpoints/webhooks.js';
import { logger } from '../../utils/logging.js';
import {
  toMcpError,
  createNotFoundError,
  createFinancialOperationError,
} from '../../utils/errors.js';
import { generateIdempotencyKey } from '../../utils/formatting.js';

export function registerWebhookTools(server: McpServer): void {
  server.tool(
    'asaas_create_webhook',
    'Create a new webhook configuration in Asaas.\n\nWebhooks receive real-time notifications for events like payment updates, subscription changes, etc.\n\n⚠️ Requires a publicly accessible HTTPS endpoint.\nThe authToken is returned only once - store it securely to validate incoming webhooks.\nMaximum 10 webhooks per account.',
    {
      name: z.string().min(1).max(100).describe('Webhook name for identification'),
      url: z.string().url().describe('HTTPS endpoint URL to receive events'),
      email: z.string().email().describe('Email for webhook notifications'),
      enabled: z.boolean().describe('Whether the webhook is active'),
      interrupted: z.boolean().describe('Whether the sync queue is paused'),
      apiVersion: z.literal(3).describe('API version (must be 3)'),
      authToken: z
        .string()
        .min(32)
        .max(255)
        .describe('Authentication token (min 32 chars) - generate a secure random string'),
      sendType: z
        .enum(['SEQUENTIALLY', 'NON_SEQUENTIALLY'])
        .describe('SEQUENTIALLY preserves event order, NON_SEQUENTIALLY allows parallel delivery'),
      events: z
        .array(z.enum(WEBHOOK_EVENTS as [string, ...string[]]))
        .min(1)
        .describe('List of events to subscribe to'),
    },
    async params => {
      const startTime = Date.now();
      const requestId = generateIdempotencyKey('create_webhook', params.name);

      logger.info(
        { requestId, name: params.name, url: params.url, eventsCount: params.events.length },
        'Creating webhook'
      );

      try {
        const webhook = await createWebhook({
          ...params,
          events: params.events as WebhookEvent[],
        });

        logger.info(
          { requestId, webhookId: webhook.id, duration: Date.now() - startTime },
          'Webhook created'
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  webhook: {
                    id: webhook.id,
                    name: webhook.name,
                    url: webhook.url,
                    email: webhook.email,
                    enabled: webhook.enabled,
                    interrupted: webhook.interrupted,
                    apiVersion: webhook.apiVersion,
                    hasAuthToken: webhook.hasAuthToken,
                    sendType: webhook.sendType,
                    events: webhook.events,
                    penalizedRequestsCount: webhook.penalizedRequestsCount,
                  },
                  warning:
                    'The authToken was returned only in this response. Store it securely to validate incoming webhooks.',
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
          'Failed to create webhook'
        );
        throw toMcpError(error as Error);
      }
    }
  );

  server.tool(
    'asaas_get_webhook',
    'Retrieve a webhook configuration by its ID.',
    {
      webhookId: z.string().min(1).describe('Webhook ID (UUID format)'),
    },
    async ({ webhookId }) => {
      const startTime = Date.now();
      const requestId = generateIdempotencyKey('get_webhook', webhookId);

      logger.info({ requestId, webhookId }, 'Getting webhook');

      try {
        const webhook = await getWebhook(webhookId);

        logger.info(
          { requestId, webhookId, duration: Date.now() - startTime },
          'Webhook retrieved'
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  webhook: {
                    id: webhook.id,
                    name: webhook.name,
                    url: webhook.url,
                    email: webhook.email,
                    enabled: webhook.enabled,
                    interrupted: webhook.interrupted,
                    apiVersion: webhook.apiVersion,
                    hasAuthToken: webhook.hasAuthToken,
                    sendType: webhook.sendType,
                    events: webhook.events,
                    penalizedRequestsCount: webhook.penalizedRequestsCount,
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
          throw createNotFoundError('Webhook', webhookId);
        }
        logger.error(
          {
            requestId,
            webhookId,
            error: (error as Error).message,
            duration: Date.now() - startTime,
          },
          'Failed to get webhook'
        );
        throw toMcpError(error as Error);
      }
    }
  );

  server.tool(
    'asaas_list_webhooks',
    'List all webhook configurations with pagination.',
    {
      limit: z
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .describe('Results per page (default: 50, max: 100)'),
      offset: z.number().int().min(0).optional().describe('Results to skip (default: 0)'),
    },
    async params => {
      const startTime = Date.now();
      const requestId = generateIdempotencyKey('list_webhooks', JSON.stringify(params));

      logger.info({ requestId, params }, 'Listing webhooks');

      try {
        const response = await listWebhooks(params);

        logger.info(
          {
            requestId,
            count: response.data.length,
            total: response.totalCount,
            duration: Date.now() - startTime,
          },
          'Webhooks listed'
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  webhooks: response.data.map(w => ({
                    id: w.id,
                    name: w.name,
                    url: w.url,
                    email: w.email,
                    enabled: w.enabled,
                    interrupted: w.interrupted,
                    apiVersion: w.apiVersion,
                    hasAuthToken: w.hasAuthToken,
                    sendType: w.sendType,
                    events: w.events,
                    penalizedRequestsCount: w.penalizedRequestsCount,
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
          'Failed to list webhooks'
        );
        throw toMcpError(error as Error);
      }
    }
  );

  server.tool(
    'asaas_update_webhook',
    'Update an existing webhook configuration.\n\nOnly provided fields will be updated.',
    {
      webhookId: z.string().min(1).describe('Webhook ID (UUID format)'),
      name: z.string().min(1).max(100).optional().describe('Webhook name'),
      url: z.string().url().optional().describe('HTTPS endpoint URL'),
      email: z.string().email().optional().describe('Notification email'),
      enabled: z.boolean().optional().describe('Whether the webhook is active'),
      interrupted: z.boolean().optional().describe('Whether the sync queue is paused'),
      apiVersion: z.number().optional().describe('API version'),
      authToken: z.string().min(32).max(255).optional().describe('Authentication token'),
      sendType: z.enum(['SEQUENTIALLY', 'NON_SEQUENTIALLY']).optional().describe('Delivery type'),
      events: z
        .array(z.enum(WEBHOOK_EVENTS as [string, ...string[]]))
        .optional()
        .describe('Events to subscribe to'),
    },
    async ({ webhookId, ...params }) => {
      const startTime = Date.now();
      const requestId = generateIdempotencyKey('update_webhook', webhookId);

      logger.info({ requestId, webhookId }, 'Updating webhook');

      try {
        const webhook = await updateWebhook(webhookId, {
          ...params,
          events: params.events as WebhookEvent[] | undefined,
        });

        logger.info({ requestId, webhookId, duration: Date.now() - startTime }, 'Webhook updated');

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  webhook: {
                    id: webhook.id,
                    name: webhook.name,
                    url: webhook.url,
                    email: webhook.email,
                    enabled: webhook.enabled,
                    interrupted: webhook.interrupted,
                    apiVersion: webhook.apiVersion,
                    hasAuthToken: webhook.hasAuthToken,
                    sendType: webhook.sendType,
                    events: webhook.events,
                    penalizedRequestsCount: webhook.penalizedRequestsCount,
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
          throw createNotFoundError('Webhook', webhookId);
        }
        logger.error(
          {
            requestId,
            webhookId,
            error: (error as Error).message,
            duration: Date.now() - startTime,
          },
          'Failed to update webhook'
        );
        throw toMcpError(error as Error);
      }
    }
  );

  server.tool(
    'asaas_delete_webhook',
    'Delete a webhook configuration.\n\n⚠️ DESTRUCTIVE OPERATION: This stops all event deliveries for this webhook.',
    {
      webhookId: z.string().min(1).describe('Webhook ID (UUID format)'),
      confirm: z.boolean().describe('Confirmation that you want to delete this webhook'),
    },
    async ({ webhookId, confirm }) => {
      if (!confirm) {
        throw createFinancialOperationError(
          'Webhook deletion requires explicit confirmation. Set confirm=true to proceed.'
        );
      }

      const startTime = Date.now();
      const requestId = generateIdempotencyKey('delete_webhook', webhookId);

      logger.warn({ requestId, webhookId }, 'Deleting webhook');

      try {
        await deleteWebhook(webhookId);

        logger.info({ requestId, webhookId, duration: Date.now() - startTime }, 'Webhook deleted');

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  message: `Webhook ${webhookId} has been deleted`,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        if (error instanceof Error && error.message.includes('404')) {
          throw createNotFoundError('Webhook', webhookId);
        }
        logger.error(
          {
            requestId,
            webhookId,
            error: (error as Error).message,
            duration: Date.now() - startTime,
          },
          'Failed to delete webhook'
        );
        throw toMcpError(error as Error);
      }
    }
  );

  server.tool(
    'asaas_remove_webhook_penalty',
    'Remove penalty from all penalized webhooks.\n\nUse when webhook delivery was penalized due to failures and you have fixed the endpoint.',
    {},
    async () => {
      const startTime = Date.now();
      const requestId = generateIdempotencyKey('remove_webhook_penalty', 'all');

      logger.info({ requestId }, 'Removing webhook penalties');

      try {
        await removeWebhookPenalty();

        logger.info({ requestId, duration: Date.now() - startTime }, 'Webhook penalties removed');

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  message: 'Penalties removed from all webhooks',
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
          'Failed to remove webhook penalties'
        );
        throw toMcpError(error as Error);
      }
    }
  );

  server.tool(
    'asaas_list_webhook_events',
    'List all available webhook events that can be subscribed to.',
    {},
    () => {
      const startTime = Date.now();
      const requestId = generateIdempotencyKey('list_webhook_events', 'all');

      logger.info({ requestId }, 'Listing webhook events');

      const categorizedEvents = {
        payments: WEBHOOK_EVENTS.filter(e => e.startsWith('PAYMENT_')),
        subscriptions: WEBHOOK_EVENTS.filter(e => e.startsWith('SUBSCRIPTION_')),
        invoices: WEBHOOK_EVENTS.filter(e => e.startsWith('INVOICE_')),
        transfers: WEBHOOK_EVENTS.filter(e => e.startsWith('TRANSFER_')),
        bills: WEBHOOK_EVENTS.filter(e => e.startsWith('BILL_')),
        anticipations: WEBHOOK_EVENTS.filter(e => e.startsWith('RECEIVABLE_ANTICIPATION_')),
        mobileRecharges: WEBHOOK_EVENTS.filter(e => e.startsWith('MOBILE_PHONE_RECHARGE_')),
        accountStatus: WEBHOOK_EVENTS.filter(e => e.startsWith('ACCOUNT_STATUS_')),
        checkouts: WEBHOOK_EVENTS.filter(e => e.startsWith('CHECKOUT_')),
        balance: WEBHOOK_EVENTS.filter(e => e.startsWith('BALANCE_')),
        internalTransfers: WEBHOOK_EVENTS.filter(e => e.startsWith('INTERNAL_TRANSFER_')),
        accessTokens: WEBHOOK_EVENTS.filter(e => e.startsWith('ACCESS_TOKEN_')),
        pixAutomatic: WEBHOOK_EVENTS.filter(e => e.startsWith('PIX_AUTOMATIC_')),
      };

      logger.info({ requestId, duration: Date.now() - startTime }, 'Webhook events listed');

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: true,
                events: categorizedEvents,
                total: WEBHOOK_EVENTS.length,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );
}

// Export webhook event processing utilities for external use
export {
  WEBHOOK_EVENTS,
  validateWebhookEvent,
  parseWebhookEvent,
  type WebhookEvent,
  type WebhookEventPayload,
};
