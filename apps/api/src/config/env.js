const path = require('path');
const dotenv = require('dotenv');
const { z } = require('zod');

// Load environment variables from root .env if present
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
dotenv.config(); // Fallback to current directory

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().default('4000').transform((v) => parseInt(v, 10)),
  API_URL: z.string().default('http://localhost:4000'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  TEST_DATABASE_URL: z.string().optional(),
  SESSION_SECRET: z.string().default('dev_session_secret_default_change_in_production_32char'),
  SESSION_COOKIE_NAME: z.string().default('workflowx_session'),
  SESSION_MAX_AGE_HOURS: z.string().default('24').transform((v) => parseInt(v, 10)),
  SESSION_SECURE_COOKIE: z.string().default('false').transform((v) => v === 'true'),
  SESSION_SAME_SITE: z.enum(['lax', 'strict', 'none']).default('lax'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  RATE_LIMIT_WINDOW_MINUTES: z.string().default('15').transform((v) => parseInt(v, 10)),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('500').transform((v) => parseInt(v, 10)),
  AUTH_RATE_LIMIT_MAX_REQUESTS: z.string().default('50').transform((v) => parseInt(v, 10)),
  ENABLE_DEV_PASSWORD_RECOVERY: z.string().default('true').transform((v) => v === 'true'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Environment validation failed:');
  console.error(JSON.stringify(parsed.error.format(), null, 2));
  process.exit(1);
}

module.exports = {
  env: parsed.data,
  isProduction: parsed.data.NODE_ENV === 'production',
  isTest: parsed.data.NODE_ENV === 'test',
  isDev: parsed.data.NODE_ENV === 'development',
};
