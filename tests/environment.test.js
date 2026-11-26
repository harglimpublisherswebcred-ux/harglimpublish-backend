const { validateEnvironment, getJwtSecret } = require('../src/config/environment');

const ENV_KEYS = [
  'NODE_ENV',
  'MONGODB_URI',
  'JWT_SECRET',
  'MERCHANT_UPI_ID',
  'MERCHANT_NAME',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'CORS_ORIGINS',
  'FRONTEND_URL',
  'RATE_LIMIT_WINDOW_MS',
  'RATE_LIMIT_MAX',
  'AUTH_RATE_LIMIT_WINDOW_MS',
  'AUTH_RATE_LIMIT_MAX',
  'UPLOAD_RATE_LIMIT_WINDOW_MS',
  'UPLOAD_RATE_LIMIT_MAX',
  'SENSITIVE_RATE_LIMIT_WINDOW_MS',
  'SENSITIVE_RATE_LIMIT_MAX',
  'PUBLISHING_TERMS_ENFORCEMENT_ENABLED',
  'PUBLISHING_TERMS_VERSION',
  'PUBLISHING_TERMS_EFFECTIVE_AT',
  'PAYMENT_EXPIRY_DURATION',
  'QR_EXPIRY_MINUTES',
  'UPLOAD_MAX_BYTES'
];

const snapshotEnv = () => ENV_KEYS.reduce((snapshot, key) => {
  snapshot[key] = process.env[key];
  return snapshot;
}, {});

const restoreEnv = (snapshot) => {
  for (const key of ENV_KEYS) {
    if (snapshot[key] === undefined) delete process.env[key];
    else process.env[key] = snapshot[key];
  }
};

describe('Environment validation', () => {
  let originalEnv;

  beforeEach(() => {
    originalEnv = snapshotEnv();
  });

  afterEach(() => {
    restoreEnv(originalEnv);
  });

  it('passes strict production validation with required runtime configuration', () => {
    process.env.NODE_ENV = 'production';
    process.env.MONGODB_URI = 'mongodb://localhost:27017/hm_backend';
    process.env.JWT_SECRET = 'long-production-secret';
    process.env.MERCHANT_UPI_ID = 'merchant@upi';
    process.env.MERCHANT_NAME = 'Harglim Publishers';
    process.env.CLOUDINARY_CLOUD_NAME = 'real-cloud';
    process.env.CLOUDINARY_API_KEY = 'real-key';
    process.env.CLOUDINARY_API_SECRET = 'real-secret';
    process.env.CORS_ORIGINS = 'https://harglimpublishers.com';

    expect(() => validateEnvironment({ strict: true })).not.toThrow();
  });

  it('fails strict validation for missing or placeholder production secrets', () => {
    process.env.NODE_ENV = 'production';
    process.env.MONGODB_URI = 'mongodb://localhost:27017/hm_backend';
    process.env.JWT_SECRET = 'secret123';
    process.env.MERCHANT_UPI_ID = 'merchant@upi';
    process.env.MERCHANT_NAME = 'Harglim Publishers';
    process.env.CLOUDINARY_CLOUD_NAME = 'disabled';
    process.env.CLOUDINARY_API_KEY = 'CHANGE_ME';
    process.env.CLOUDINARY_API_SECRET = 'your_api_secret';

    expect(() => validateEnvironment({ strict: true })).toThrow(/Invalid environment configuration/);
  });

  it('keeps development JWT fallback but blocks production fallback usage', () => {
    delete process.env.JWT_SECRET;
    process.env.NODE_ENV = 'development';
    expect(getJwtSecret()).toBe('secret123');

    process.env.NODE_ENV = 'production';
    expect(() => getJwtSecret()).toThrow(/JWT_SECRET is required/);
  });

  it('accepts friendly payment expiry duration values and rejects invalid ones', () => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/hm_backend';
    process.env.PAYMENT_EXPIRY_DURATION = '2 days';

    expect(() => validateEnvironment({ strict: false })).not.toThrow();

    process.env.PAYMENT_EXPIRY_DURATION = 'later';
    expect(() => validateEnvironment({ strict: false })).toThrow(/PAYMENT_EXPIRY_DURATION/);
  });

  it('requires a production CORS allowlist and a terms version when enforcement is enabled', () => {
    process.env.NODE_ENV = 'production';
    process.env.MONGODB_URI = 'mongodb://localhost:27017/hm_backend';
    process.env.JWT_SECRET = 'long-production-secret';
    process.env.MERCHANT_UPI_ID = 'merchant@upi';
    process.env.MERCHANT_NAME = 'Harglim Publishers';
    process.env.CLOUDINARY_CLOUD_NAME = 'real-cloud';
    process.env.CLOUDINARY_API_KEY = 'real-key';
    process.env.CLOUDINARY_API_SECRET = 'real-secret';
    process.env.PUBLISHING_TERMS_ENFORCEMENT_ENABLED = 'true';

    expect(() => validateEnvironment({ strict: true })).toThrow(/CORS_ORIGINS/);

    process.env.CORS_ORIGINS = 'https://harglimpublishers.com';
    expect(() => validateEnvironment({ strict: true })).toThrow(/PUBLISHING_TERMS_VERSION/);

    process.env.PUBLISHING_TERMS_VERSION = '2026-11-25';
    process.env.PUBLISHING_TERMS_EFFECTIVE_AT = '2026-11-25T00:00:00.000Z';
    expect(() => validateEnvironment({ strict: true })).not.toThrow();
  });

  it('validates dedicated upload and sensitive-write limiter settings', () => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/hm_backend';
    process.env.UPLOAD_RATE_LIMIT_MAX = '0';
    process.env.SENSITIVE_RATE_LIMIT_WINDOW_MS = '500';
    expect(() => validateEnvironment({ strict: false })).toThrow(/UPLOAD_RATE_LIMIT_MAX/);

    process.env.UPLOAD_RATE_LIMIT_MAX = '30';
    process.env.SENSITIVE_RATE_LIMIT_WINDOW_MS = '900000';
    process.env.SENSITIVE_RATE_LIMIT_MAX = '120';
    expect(() => validateEnvironment({ strict: false })).not.toThrow();
  });
});
