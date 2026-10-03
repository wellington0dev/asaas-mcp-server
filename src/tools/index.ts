import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerCustomerTools } from './customers/index.js';
import { registerPaymentTools } from './payments/index.js';
import { registerSubscriptionTools } from './subscriptions/index.js';
import { registerInstallmentTools } from './installments/index.js';
import { registerRefundTools } from './refunds/index.js';
import { registerWebhookTools } from './webhooks/index.js';

export function registerAllTools(server: McpServer): void {
  registerCustomerTools(server);
  registerPaymentTools(server);
  registerSubscriptionTools(server);
  registerInstallmentTools(server);
  registerRefundTools(server);
  registerWebhookTools(server);
}
