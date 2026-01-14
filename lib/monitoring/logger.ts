import pino from 'pino';

const pinoConfig: pino.LoggerOptions = {
  level: process.env.LOG_LEVEL || 'info',
};

// Only use pino-pretty in development
if (process.env.NODE_ENV !== 'production') {
  pinoConfig.transport = {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  };
}

export const logger = pino(pinoConfig);

export function auditLog(action: string, shopDomain: string, details?: object) {
  logger.info({
    type: 'audit',
    action,
    shopDomain,
    timestamp: new Date().toISOString(),
    ...details,
  });
}

export function errorLog(error: Error, context?: object) {
  logger.error({
    type: 'error',
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    ...context,
  });
}
