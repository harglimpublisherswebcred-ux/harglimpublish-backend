const logger = require('../utils/logger');
const { getMissingCloudinaryConfig } = require('./cloudinary');

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
  }

  validateNumber('QR_EXPIRY_MINUTES', errors, { min: 1 });
  validateNumber('UPLOAD_MAX_BYTES', errors, { min: 1 });

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
