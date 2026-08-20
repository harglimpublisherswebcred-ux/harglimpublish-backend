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
});
