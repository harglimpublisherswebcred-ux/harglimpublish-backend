require('dotenv').config();
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

let server;
let isShuttingDown = false;
const bodyLimit = process.env.REQUEST_BODY_LIMIT || '1mb';

const shutdown = async (signal, exitCode = 0) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  logger.info('server.shutdown_started', { signal });

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

// Railway/Render/Heroku/Nginx terminate TLS and forward the real client IP in
// X-Forwarded-For; trust one proxy hop in production so rate limiting uses it.
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

registerSubscribers();

// Middleware
app.use(helmet());
app.use(cors());
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
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: { success: false, message: 'Too many requests from this IP, please try again later.' }
});
app.use('/api', limiter); // Apply to all API routes
mountSwagger(app);

// Auth Specific Rate Limiting (Stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // Limit each IP to 10 login/register requests per window
  message: { success: false, message: 'Too many login attempts, please try again later.' }
});

// Health check endpoint
app.get('/', renderDeveloperPortal);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Routes will be imported here
app.use('/api/auth', authLimiter, require('./src/routes/authRoutes'));
app.use('/api/books', require('./src/routes/bookRoutes'));
app.use('/api/categories', require('./src/routes/categoryRoutes'));
app.use('/api/search', require('./src/routes/searchRoutes'));
app.use('/api/orders', require('./src/routes/orderRoutes'));
app.use('/api/admin', require('./src/routes/adminRoutes'));
app.use('/api/uploads', require('./src/routes/uploadsRoutes'));
app.use('/api/users', require('./src/routes/userRoutes'));
app.use('/api/authors', require('./src/routes/authorRoutes'));
app.use('/api', require('./src/routes/publishRoutes')); // Since the endpoints are /publish-requests and /publish-packages

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global Error handling middleware
app.use((err, req, res, next) => {
  logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const startServer = async () => {
  validateEnvironment();
  await connectDB();
  const PORT = process.env.PORT || 5000;
  server = app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
  });
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
