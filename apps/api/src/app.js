const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const { env, isDev } = require('./config/env');
const v1Router = require('./routes');
const { errorHandler } = require('./middleware/errorHandler');
const { csrfProtection } = require('./middleware/csrf');
const { generalLimiter } = require('./middleware/rateLimiter');
const { sendError } = require('./utils/response');

const app = express();

// Trust reverse proxy if deployed behind Cloudflare, NGINX, or Vercel
app.set('trust proxy', 1);

// Security Headers
app.use(
  helmet({
    contentSecurityPolicy: isDev ? false : undefined,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS allowlist configuration
const allowedOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim());
if (isDev) {
  allowedOrigins.push('http://localhost:3000', 'http://127.0.0.1:3000');
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      const isAllowed = allowedOrigins.some(
        (allowed) => origin === allowed || origin.startsWith(allowed)
      );
      if (isAllowed) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked request from origin: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['Set-Cookie'],
  })
);

// Body and Cookie Parsers with sensible size limits
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(cookieParser());

// CSRF & Origin validation on state-changing cookie requests
app.use(csrfProtection);

// Root Health Check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// Apply general rate limiter to API endpoints
app.use('/api/', generalLimiter);

// Versioned API Routes
app.use('/api/v1', v1Router);

// Catch-all 404 Handler
app.use((req, res) => {
  return sendError(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
});

// Centralized Error Handler
app.use(errorHandler);

module.exports = app;
