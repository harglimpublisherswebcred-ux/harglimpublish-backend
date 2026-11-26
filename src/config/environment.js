const logger = require('../utils/logger');
const { getMissingCloudinaryConfig } = require('./cloudinary');
const { URL } = require('url');

const PLACEHOLDER_VALUES = new Set([
  'change_me',
  'change_me_to_a_long_random_production_secret',
  'change_me_long_random_production_secret',
  'secret123',
  'disabled',
  'your_cloud_name',
  'your_api_key',
  'your_api_secret'
]);

const isProduction = () => process.env.NODE_ENV === 'production';

const hasUsableValue = (value) => {
  if (!value || typeof value !== 'string') return false;
  return !PLACEHOLDER_VALUES.has(value.trim().toLowerCase());
};

const requireValue = (key, errors) => {
  if (!hasUsableValue(process.env[key])) {
    errors.push(`${key} is required and must not use a placeholder value`);
  }
};

const validateNumber = (key, errors, { min } = {}) => {
  if (!process.env[key]) return;
  const value = Number(process.env[key]);
  if (!Number.isFinite(value) || (min !== undefined && value < min)) {
    errors.push(`${key} must be a valid number${min !== undefined ? ` >= ${min}` : ''}`);
  }
};

const validateDuration = (key, errors) => {
  if (!process.env[key]) return;
  const value = process.env[key].trim();
  if (!/^\d+(\.\d+)?\s*(m|min|mins|minute|minutes|h|hr|hrs|hour|hours|d|day|days|w|week|weeks|month|months)?$/i.test(value)) {
    errors.push(`${key} must be a valid duration such as 24h, 1d, 2 days, 1month, or minutes as a number`);
  }
};

const validateUrlList = (key, errors) => {
  if (!process.env[key]) return;
  const values = process.env[key].split(',').map((value) => value.trim()).filter(Boolean);
  if (values.length === 0) {
    errors.push(`${key} must include at least one origin`);
    return;
  }
  for (const value of values) {
    try {
      const parsed = new URL(value);
      if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('invalid protocol');
    } catch {
      errors.push(`${key} contains an invalid origin: ${value}`);
    }
  }
};

const enabled = (key) => ['true', '1', 'yes', 'on'].includes(
  String(process.env[key] || '').trim().toLowerCase()
);

const validateEnvironment = ({ strict = isProduction() } = {}) => {
  const errors = [];

  requireValue('MONGODB_URI', errors);

  if (strict) {
    requireValue('JWT_SECRET', errors);
    requireValue('MERCHANT_UPI_ID', errors);
    requireValue('MERCHANT_NAME', errors);

    for (const key of getMissingCloudinaryConfig()) {
      errors.push(`${key} is required for production uploads`);
    }
    if (!hasUsableValue(process.env.CORS_ORIGINS) && !hasUsableValue(process.env.FRONTEND_URL)) {
      errors.push('CORS_ORIGINS or FRONTEND_URL is required in production');
    }
  }

  validateDuration('PAYMENT_EXPIRY_DURATION', errors);
  validateNumber('QR_EXPIRY_MINUTES', errors, { min: 1 });
  validateNumber('UPLOAD_MAX_BYTES', errors, { min: 1 });
  validateNumber('RATE_LIMIT_WINDOW_MS', errors, { min: 1000 });
  validateNumber('RATE_LIMIT_MAX', errors, { min: 1 });
  validateNumber('AUTH_RATE_LIMIT_WINDOW_MS', errors, { min: 1000 });
  validateNumber('AUTH_RATE_LIMIT_MAX', errors, { min: 1 });
  validateNumber('UPLOAD_RATE_LIMIT_WINDOW_MS', errors, { min: 1000 });
  validateNumber('UPLOAD_RATE_LIMIT_MAX', errors, { min: 1 });
  validateNumber('SENSITIVE_RATE_LIMIT_WINDOW_MS', errors, { min: 1000 });
  validateNumber('SENSITIVE_RATE_LIMIT_MAX', errors, { min: 1 });
  validateUrlList('CORS_ORIGINS', errors);

  if (enabled('PUBLISHING_TERMS_ENFORCEMENT_ENABLED')) {
    requireValue('PUBLISHING_TERMS_VERSION', errors);
  }
  if (process.env.PUBLISHING_TERMS_EFFECTIVE_AT
    && Number.isNaN(Date.parse(process.env.PUBLISHING_TERMS_EFFECTIVE_AT))) {
    errors.push('PUBLISHING_TERMS_EFFECTIVE_AT must be a valid ISO date-time');
  }

  if (errors.length > 0) {
    const error = new Error(`Invalid environment configuration: ${errors.join('; ')}`);
    error.code = 'ENV_VALIDATION_FAILED';
    throw error;
  }

  logger.info('environment.validation_passed', {
    nodeEnv: process.env.NODE_ENV || 'development',
    strict
  });
};

const getJwtSecret = () => {
  if (hasUsableValue(process.env.JWT_SECRET)) return process.env.JWT_SECRET;
  if (isProduction()) {
    throw new Error('JWT_SECRET is required in production');
  }
  return 'secret123';
};

module.exports = {
  validateEnvironment,
  getJwtSecret,
  hasUsableValue
};
