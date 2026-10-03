import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerAllTools } from '../tools/index.js';
import { getConfig, resetConfig } from '../config.js';
import { logger } from '../utils/logging.js';
import { setAsaasClient, type AsaasClient } from '../asaas/client.js';

let server: McpServer | null = null;

export function createServer(): McpServer {
  const mcpServer = new McpServer({
    name: 'asaas-mcp-server',
    version: '1.0.0',
    description:
      'MCP Server for Asaas integration - payments, customers, subscriptions, and financial management',
  });

  registerAllTools(mcpServer);

  return mcpServer;
}

export async function startServer(customClient?: AsaasClient): Promise<void> {
  if (customClient) {
    setAsaasClient(customClient);
  } else {
    resetConfig();
    getConfig();
  }

  server = createServer();

  const transport = new StdioServerTransport();
  await server.connect(transport);

  logger.info('Asaas MCP Server started and listening on stdio');
}

export function getServer(): McpServer | null {
  return server;
}
