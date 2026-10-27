const app = require('./app');
const { env } = require('./config/env');
const { prisma } = require('./config/prisma');
const { logger } = require('./utils/logger');

const server = app.listen(env.PORT, () => {
  logger.info(`🚀 WorkFlowX API Server running on port ${env.PORT} [${env.NODE_ENV}]`);
  logger.info(`📡 API Base URL: ${env.API_URL}/api/v1`);
  logger.info(`🔒 CORS Origin: ${env.CORS_ORIGIN}`);
});

// Graceful shutdown handling
async function shutdown(signal) {
  logger.info(`Received ${signal}. Gracefully shutting down WorkFlowX API...`);
  server.close(async () => {
    logger.info('HTTP server closed.');
    await prisma.$disconnect();
    logger.info('Prisma disconnected.');
    process.exit(0);
  });

  // Force exit after 10s if connections linger
  setTimeout(() => {
    logger.error('Forceful shutdown timeout reached. Terminating process.');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
