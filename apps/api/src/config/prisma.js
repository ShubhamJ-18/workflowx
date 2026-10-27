const { PrismaClient } = require('@prisma/client');
const { env, isDev } = require('./env');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: env.NODE_ENV === 'test' && env.TEST_DATABASE_URL ? env.TEST_DATABASE_URL : env.DATABASE_URL,
    },
  },
  log: isDev ? ['warn', 'error'] : ['error'],
});

module.exports = { prisma };
