process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'production_hardening_test_secret';
process.env.PUBLISHING_TERMS_ENFORCEMENT_ENABLED = 'true';
process.env.PUBLISHING_TERMS_VERSION = '2026-11-25';
process.env.PUBLISHING_TERMS_EFFECTIVE_AT = '2026-11-25T00:00:00.000Z';

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server');
const User = require('../src/models/User');
const Content = require('../src/models/Content');
const PublishRequest = require('../src/models/PublishRequest');
const PublishingTermsAcceptance = require('../src/models/PublishingTermsAcceptance');
const { generateToken } = require('../src/utils/tokenUtils');
const { buildOpenApiSpec } = require('../src/docs/openapiSpec');
const { buildCorsOptions } = require('../src/config/http');
const { RuntimeMetrics } = require('../src/observability/runtimeMetrics');

jest.setTimeout(600000);
process.env.MONGOMS_DOWNLOAD_DIR = 'node_modules/.cache/mongodb-binaries';

let mongoServer;
let author;
let admin;
let authorToken;
let adminToken;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create({ instance: { launchTimeout: 60000 } });
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  delete process.env.PUBLISHING_TERMS_ENFORCEMENT_ENABLED;
  delete process.env.PUBLISHING_TERMS_VERSION;
  delete process.env.PUBLISHING_TERMS_EFFECTIVE_AT;
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

beforeEach(async () => {
  await Promise.all([
    User.deleteMany({}),
    Content.deleteMany({}),
    PublishRequest.deleteMany({}),
    PublishingTermsAcceptance.deleteMany({})
  ]);
  author = await User.create({
    name: 'Terms Author', email: 'terms-author@example.com', password: 'password123', role: 'author'
  });
  admin = await User.create({
    name: 'Terms Admin', email: 'terms-admin@example.com', password: 'password123', role: 'admin'
  });
  authorToken = generateToken(author._id);
  adminToken = generateToken(admin._id);
  await Content.create({
    key: 'global',
    termsSectionsJson: '[{"title":"Publishing terms","content":"Current terms"}]',
    authorGuidelinesText: 'Current publishing guidelines'
  });
});

test('generated OpenAPI contains only valid response keys', () => {
  const spec = buildOpenApiSpec();
  const invalid = [];
  for (const [path, pathItem] of Object.entries(spec.paths)) {
    for (const [method, operation] of Object.entries(pathItem)) {
      for (const key of Object.keys(operation.responses || {})) {
        if (!(key === 'default' || /^[1-5][0-9]{2}$/.test(key) || /^[1-5]XX$/.test(key))) {
          invalid.push({ path, method, key });
        }
      }
    }
  }
  expect(invalid).toEqual([]);
});

test('publishing terms acceptance is versioned, idempotent, and enforced on manuscript submission', async () => {
  const publicTerms = await request(app).get('/api/publishing-terms').expect(200);
  expect(publicTerms.body.data).toMatchObject({
    currentVersion: '2026-11-25', enforcementEnabled: true
  });

  const initialStatus = await request(app)
    .get('/api/authors/me/publishing-terms')
    .set('Authorization', `Bearer ${authorToken}`)
    .expect(200);
  expect(initialStatus.body.data).toMatchObject({ accepted: false, requiresAcceptance: true });

  await request(app)
    .post('/api/publish-requests')
    .set('Authorization', `Bearer ${authorToken}`)
    .send({
      title: 'Blocked Manuscript', genre: 'Business', wordCount: 50000,
      packageId: new mongoose.Types.ObjectId(), fileUrl: 'https://example.com/book.pdf'
    })
    .expect(403);

  const accepted = await request(app)
    .post('/api/authors/me/publishing-terms/accept')
    .set('Authorization', `Bearer ${authorToken}`)
    .send({ version: '2026-11-25' })
    .expect(201);
  const repeated = await request(app)
    .post('/api/authors/me/publishing-terms/accept')
    .set('Authorization', `Bearer ${authorToken}`)
    .send({ version: '2026-11-25' })
    .expect(201);
  expect(repeated.body.data._id).toBe(accepted.body.data._id);
  expect(await PublishingTermsAcceptance.countDocuments()).toBe(1);

  const submitted = await request(app)
    .post('/api/publish-requests')
    .set('Authorization', `Bearer ${authorToken}`)
    .send({
      title: 'Accepted Manuscript', genre: 'Business', wordCount: 50000,
      packageId: new mongoose.Types.ObjectId(), fileUrl: 'https://example.com/book.pdf'
    })
    .expect(201);
  expect(submitted.body.data.publishRequest).toMatchObject({
    termsVersion: '2026-11-25',
    termsAcceptance: accepted.body.data._id
  });
});

test('same terms version cannot silently represent changed legal content', async () => {
  await request(app)
    .post('/api/authors/me/publishing-terms/accept')
    .set('Authorization', `Bearer ${authorToken}`)
    .send({ version: '2026-11-25' })
    .expect(201);

  await Content.updateOne({ key: 'global' }, { termsSectionsJson: '[{"title":"Changed"}]' });

  const status = await request(app)
    .get('/api/authors/me/publishing-terms')
    .set('Authorization', `Bearer ${authorToken}`)
    .expect(200);
  expect(status.body.data).toMatchObject({ accepted: false, requiresAcceptance: true });

  const conflict = await request(app)
    .post('/api/authors/me/publishing-terms/accept')
    .set('Authorization', `Bearer ${authorToken}`)
    .send({ version: '2026-11-25' })
    .expect(409);
  expect(conflict.body.error).toBe('PUBLISHING_TERMS_VERSION_CONFLICT');
});

test('admin operations expose truthful courier capabilities and protected runtime metrics', async () => {
  const couriers = await request(app)
    .get('/api/admin/shipments/couriers')
    .set('Authorization', `Bearer ${adminToken}`)
    .expect(200);
  expect(couriers.body.data.find((item) => item.provider === 'manual')).toMatchObject({ available: true });
  expect(couriers.body.data.find((item) => item.provider === 'shiprocket')).toMatchObject({
    available: false, status: 'NOT_CONFIGURED'
  });

  await request(app).get('/api/admin/operations/runtime-metrics').expect(401);
  const metrics = await request(app)
    .get('/api/admin/operations/runtime-metrics')
    .set('Authorization', `Bearer ${adminToken}`)
    .expect(200);
  expect(metrics.body.data.requests.total).toBeGreaterThan(0);
  expect(metrics.body.data.memoryBytes.heapUsed).toBeGreaterThan(0);
});

test('CORS production allowlist and runtime percentile calculations are deterministic', () => {
  const previousNodeEnv = process.env.NODE_ENV;
  const previousOrigins = process.env.CORS_ORIGINS;
  process.env.NODE_ENV = 'production';
  process.env.CORS_ORIGINS = 'https://harglimpublishers.com';
  const options = buildCorsOptions();

  const allowed = jest.fn();
  options.origin('https://harglimpublishers.com', allowed);
  expect(allowed).toHaveBeenCalledWith(null, true);

  const denied = jest.fn();
  options.origin('https://malicious.example', denied);
  expect(denied.mock.calls[0][0]).toMatchObject({ code: 'CORS_ORIGIN_DENIED', statusCode: 403 });

  process.env.NODE_ENV = previousNodeEnv;
  if (previousOrigins === undefined) delete process.env.CORS_ORIGINS;
  else process.env.CORS_ORIGINS = previousOrigins;

  const metrics = new RuntimeMetrics();
  [10, 20, 30, 100].forEach((durationMs) => {
    metrics.requestStarted();
    metrics.requestCompleted({ durationMs, statusCode: 200 });
  });
  expect(metrics.snapshot().requests.durationMs).toEqual({ average: 40, p50: 20, p95: 100, p99: 100 });
});
