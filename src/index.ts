import { startServer } from './server/mcp-server.js';
import { logger } from './utils/logging.js';

async function main(): Promise<void> {
  try {
    await startServer();
  } catch (error) {
    logger.fatal({ error: (error as Error).message }, 'Failed to start server');
    process.exit(1);
  }
}

process.on('unhandledRejection', reason => {
  logger.fatal({ reason }, 'Unhandled rejection');
  process.exit(1);
});

process.on('uncaughtException', error => {
  logger.fatal({ error: error.message }, 'Uncaught exception');
  process.exit(1);
});

void main();
