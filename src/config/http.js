const parseBoolean = (value, fallback = false) => {
  if (value === undefined || value === null || String(value).trim() === '') return fallback;
  return ['true', '1', 'yes', 'on'].includes(String(value).trim().toLowerCase());
};

const parsePositiveInteger = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const configuredOrigins = () => String(process.env.CORS_ORIGINS || process.env.FRONTEND_URL || '')
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);

const buildCorsOptions = () => {
  const origins = configuredOrigins();
  const production = process.env.NODE_ENV === 'production';

  return {
    origin(origin, callback) {
      if (!origin || (!production && origins.length === 0) || origins.includes(origin.replace(/\/$/, ''))) {
        callback(null, true);
        return;
      }
      const error = new Error('Origin is not allowed by CORS policy');
      error.statusCode = 403;
      error.code = 'CORS_ORIGIN_DENIED';
      callback(error);
    },
    credentials: parseBoolean(process.env.CORS_ALLOW_CREDENTIALS, false),
    optionsSuccessStatus: 204
  };
};

const getRateLimitSettings = () => ({
  windowMs: parsePositiveInteger(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
  max: parsePositiveInteger(process.env.RATE_LIMIT_MAX, 100),
  authWindowMs: parsePositiveInteger(process.env.AUTH_RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
  authMax: parsePositiveInteger(process.env.AUTH_RATE_LIMIT_MAX, 10)
});

module.exports = {
  buildCorsOptions,
  configuredOrigins,
  getRateLimitSettings,
  parseBoolean,
  parsePositiveInteger
};
