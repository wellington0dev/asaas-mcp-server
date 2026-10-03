import pino from 'pino';
import { getConfig } from '../config.js';

const config = getConfig();
const isProduction = process.env['NODE_ENV'] === 'production';

const loggerOptions: pino.LoggerOptions = {
  level: config.LOG_LEVEL,
  base: {
    service: 'asaas-mcp-server',
  },
  redact: {
    paths: [
      '*.apiKey',
      '*.access_token',
      '*.authorization',
      '*.creditCard*',
      '*.cardNumber',
      '*.cvv',
      '*.password',
      '*.secret',
      '*.token',
    ],
    censor: '[REDACTED]',
  },
};

if (!isProduction) {
  loggerOptions.transport = {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss Z',
      ignore: 'pid,hostname',
    },
  };
}

export const logger = pino(loggerOptions);

export function createChildLogger(context: Record<string, unknown>) {
  return logger.child(context);
}
