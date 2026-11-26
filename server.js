require('dotenv').config();
const { randomUUID } = require('crypto');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const { clean: cleanXss } = require('xss-clean/lib/xss');
const connectDB = require('./src/config/database');
const logger = require('./src/utils/logger');
const { validateEnvironment } = require('./src/config/environment');
const { registerSubscribers } = require('./src/events/registerSubscribers');
const { mountSwagger } = require('./src/docs/swagger');
const { renderDeveloperPortal } = require('./src/docs/developerPortal');
const maintenanceWorker = require('./src/workers/maintenanceWorker');
const { buildCorsOptions, getRateLimitSettings } = require('./src/config/http');
const runtimeMetrics = require('./src/observability/runtimeMetrics');

let server;
let isShuttingDown = false;
const bodyLimit = process.env.REQUEST_BODY_LIMIT || '1mb';

const shutdown = async (signal, exitCode = 0) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  logger.info('server.shutdown_started', { signal });

  maintenanceWorker.stop();

  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  logger.info('server.shutdown_complete', { signal });
  process.exit(exitCode);
};

// Catch unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  shutdown('unhandledRejection', 1);
});

// Catch uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`);
  process.exit(1);
});

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

const app = express();
const requestTimeoutMs = Number(process.env.SERVER_REQUEST_TIMEOUT_MS || 120000);
const headersTimeoutMs = Number(process.env.SERVER_HEADERS_TIMEOUT_MS || 65000);
const keepAliveTimeoutMs = Number(process.env.SERVER_KEEP_ALIVE_TIMEOUT_MS || 5000);
const rateLimitSettings = getRateLimitSettings();

// Railway/Render/Heroku/Nginx terminate TLS and forward the real client IP in
// X-Forwarded-For; trust one proxy hop in production so rate limiting uses it.
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

registerSubscribers();

// Middleware
app.use((req, res, next) => {
  const startedAt = process.hrtime.bigint();
  runtimeMetrics.requestStarted();
  const incomingRequestId = Array.isArray(req.headers['x-request-id'])
    ? req.headers['x-request-id'][0]
    : req.headers['x-request-id'];
  const requestId = incomingRequestId || randomUUID();
  req.id = requestId;
  res.setHeader('X-Request-Id', requestId);

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
    runtimeMetrics.requestCompleted({ durationMs, statusCode: res.statusCode });
    const level = durationMs > 3000 || res.statusCode >= 500 ? 'warn' : 'info';
    logger[level]('http.request_completed', {
      requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Math.round(durationMs),
      ip: req.ip,
      userId: req.user && req.user._id ? String(req.user._id) : undefined
    });
  });

  next();
});
app.use(helmet());
app.use(cors(buildCorsOptions()));
// Integrate morgan with winston
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(express.json({ limit: bodyLimit }));
app.use(express.urlencoded({ extended: true, limit: bodyLimit }));
app.use(compression());

// Data sanitization against NoSQL query injection.
// express-mongo-sanitize's middleware mutates req.query by assignment, which
// is incompatible with Express 5's read-only query getter. Use the package's
// sanitizer directly so the protection stays active without replacing req.query.
app.use((req, res, next) => {
  mongoSanitize.sanitize(req.body);
  mongoSanitize.sanitize(req.params);
  mongoSanitize.sanitize(req.query);
  next();
});

// Data sanitization against XSS with Express 5-compatible req.query handling.
app.use((req, res, next) => {
  if (req.body) req.body = cleanXss(req.body);
  if (req.params) req.params = cleanXss(req.params);
  if (req.query) {
    const cleanedQuery = cleanXss(req.query);
    Object.keys(req.query).forEach((key) => delete req.query[key]);
    Object.assign(req.query, cleanedQuery);
  }
  next();
});

// Global Rate Limiting
const limiter = rateLimit({
  windowMs: rateLimitSettings.windowMs,
  max: rateLimitSettings.max,
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => req.method === 'OPTIONS',
  message: { success: false, error: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests from this IP, please try again later.' }
});
app.use('/api', limiter); // Apply to all API routes
mountSwagger(app);

// Auth Specific Rate Limiting (Stricter)
const authLimiter = rateLimit({
  windowMs: rateLimitSettings.authWindowMs,
  max: process.env.NODE_ENV === 'test' ? 1000 : rateLimitSettings.authMax,
  skip: (req) => req.method === 'OPTIONS',
  message: { success: false, error: 'AUTH_RATE_LIMIT_EXCEEDED', message: 'Too many login attempts, please try again later.' }
});

const uploadLimiter = rateLimit({
  windowMs: rateLimitSettings.uploadWindowMs,
  max: process.env.NODE_ENV === 'test' ? 1000 : rateLimitSettings.uploadMax,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS',
  message: { success: false, error: 'UPLOAD_RATE_LIMIT_EXCEEDED', message: 'Too many upload requests. Please try again later.' }
});

const sensitiveWriteLimiter = rateLimit({
  windowMs: rateLimitSettings.sensitiveWindowMs,
  max: process.env.NODE_ENV === 'test' ? 1000 : rateLimitSettings.sensitiveMax,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => ['GET', 'HEAD', 'OPTIONS'].includes(req.method),
  message: { success: false, error: 'WRITE_RATE_LIMIT_EXCEEDED', message: 'Too many write requests. Please try again later.' }
});

// Health check endpoint
app.get('/', renderDeveloperPortal);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

app.get('/health/ready', (req, res) => {
  const ready = mongoose.connection.readyState === 1;
  res.status(ready ? 200 : 503).json({
    status: ready ? 'READY' : 'NOT_READY',
    database: ready ? 'connected' : 'disconnected',
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

// Routes will be imported here
app.use('/api/auth', authLimiter, require('./src/routes/authRoutes'));
app.use('/api/books', require('./src/routes/bookRoutes'));
app.use('/api/categories', require('./src/routes/categoryRoutes'));
app.use('/api/content', require('./src/routes/contentRoutes'));
app.use('/api/stats', require('./src/routes/publicStatsRoutes'));
app.use('/api/spotlights', require('./src/routes/spotlightRoutes'));
app.use('/api/contact', require('./src/routes/contactRoutes'));
app.use('/api/contact-requests', require('./src/routes/contactRoutes'));
app.use('/api/author-applications', require('./src/routes/authorApplicationRoutes'));
app.use('/api/reviews', require('./src/routes/reviewRoutes'));
app.use('/api/search', require('./src/routes/searchRoutes'));
app.use('/api/orders', sensitiveWriteLimiter, require('./src/routes/orderRoutes'));
app.use('/api/admin', sensitiveWriteLimiter, require('./src/routes/adminRoutes'));
app.use('/api/uploads', uploadLimiter, require('./src/routes/uploadsRoutes'));
app.use('/api/users', require('./src/routes/userRoutes'));
app.use('/api/authors/me/uploads', uploadLimiter);
app.use('/api/authors', sensitiveWriteLimiter, require('./src/routes/authorRoutes'));
app.use('/api/publish-requests', sensitiveWriteLimiter);
app.use('/api', require('./src/routes/publishRoutes')); // Since the endpoints are /publish-requests and /publish-packages

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: 'ROUTE_NOT_FOUND',
    message: 'Route not found'
  });
});

// Global Error handling middleware
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;
  logger.error(`${statusCode} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  
  res.status(statusCode).json({
    success: false,
    ...(err.code && { error: err.code }),
    message: statusCode >= 500 && process.env.NODE_ENV === 'production'
      ? 'Internal Server Error'
      : (err.message || 'Internal Server Error'),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const startServer = async () => {
  validateEnvironment();
  await connectDB();
  maintenanceWorker.start();
  const PORT = process.env.PORT || 5000;
  server = app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
  });
  server.requestTimeout = requestTimeoutMs;
  server.headersTimeout = headersTimeoutMs;
  server.keepAliveTimeout = keepAliveTimeoutMs;
  return server;
};

// Start server
if (process.env.NODE_ENV !== 'test') {
  startServer().catch((error) => {
    logger.error(`Startup failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = app;
module.exports.startServer = startServer;


