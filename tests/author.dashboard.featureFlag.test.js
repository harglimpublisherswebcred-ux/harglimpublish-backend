process.env.JWT_SECRET = 'test_secret';
process.env.NODE_ENV = 'test';
process.env.MONGOMS_DOWNLOAD_DIR = 'node_modules/.cache/mongodb-binaries';
process.env.MERCHANT_UPI_ID = 'merchant@upi';
process.env.MERCHANT_NAME = 'Harglim Publishers';

const request = require('supertest');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const app = require('../server');
const User = require('../src/models/User');
const AuthorAccessPlan = require('../src/models/AuthorAccessPlan');
const AuthorAccessPurchase = require('../src/models/AuthorAccessPurchase');
const AuthorAccessEntitlement = require('../src/models/AuthorAccessEntitlement');
const Payment = require('../src/models/Payment');

jest.setTimeout(600000);

let mongoServer;
let reader;
let author;
let admin;
let readerToken;
let authorToken;
let adminToken;

const tokenFor = (user) => jwt.sign({ id: user._id }, process.env.JWT_SECRET);
const setPaidAccessFlag = (enabled) => {
  process.env.AUTHOR_DASHBOARD_PAID_ACCESS_ENABLED = enabled ? 'true' : 'false';
};

const createEntitlement = (user, status) => AuthorAccessEntitlement.create({
  user: user._id,
  feature: 'AUTHOR_DASHBOARD',
  status,
  source: 'ADMIN_GRANT',
  grantedAt: new Date(),
  ...(status === 'REVOKED' && { revokedAt: new Date(), revocationReason: 'Legacy revoked entitlement' })
});

const createActivePlan = () => AuthorAccessPlan.create({
  name: 'Author Dashboard Access',
  amount: 999,
  currency: 'INR',
  status: 'ACTIVE',
  version: 1
});

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create({ instance: { launchTimeout: 60000 } });
  await mongoose.connect(mongoServer.getUri());
  await Promise.all([
    User.syncIndexes(),
    AuthorAccessPlan.syncIndexes(),
    AuthorAccessPurchase.syncIndexes(),
    AuthorAccessEntitlement.syncIndexes(),
    Payment.syncIndexes()
  ]);
});

afterAll(async () => {
  delete process.env.AUTHOR_DASHBOARD_PAID_ACCESS_ENABLED;
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

beforeEach(async () => {
  delete process.env.AUTHOR_DASHBOARD_PAID_ACCESS_ENABLED;
  await Promise.all([
    User.deleteMany({}),
    AuthorAccessPlan.deleteMany({}),
    AuthorAccessPurchase.deleteMany({}),
    AuthorAccessEntitlement.deleteMany({}),
    Payment.deleteMany({})
  ]);

  reader = await User.create({ name: 'Reader', email: 'reader-flag@example.com', password: 'password123', role: 'reader' });
  author = await User.create({ name: 'Author', email: 'author-flag@example.com', password: 'password123', role: 'author' });
  admin = await User.create({ name: 'Admin', email: 'admin-flag@example.com', password: 'password123', role: 'admin' });
  readerToken = tokenFor(reader);
  authorToken = tokenFor(author);
  adminToken = tokenFor(admin);
});

test('flag OFF denies readers but allows approved authors without fake entitlement records', async () => {
  setPaidAccessFlag(false);

  const readerContext = await request(app).get('/api/users/me/context').set('Authorization', `Bearer ${readerToken}`).expect(200);
  expect(readerContext.body.data.capabilities).toMatchObject({
    canPublish: false,
    canAccessAuthorDashboard: false,
    canAdminister: false
  });
  expect(readerContext.body.data.features.paidAuthorDashboardAccess).toBe(false);

  await request(app).get('/api/authors/me/dashboard').set('Authorization', `Bearer ${readerToken}`).expect(403);

  const authorContext = await request(app).get('/api/users/me/context').set('Authorization', `Bearer ${authorToken}`).expect(200);
  expect(authorContext.body.data.capabilities).toMatchObject({
    canPublish: true,
    canAccessAuthorDashboard: true,
    canAdminister: false
  });
  expect(authorContext.body.data.states.dashboardAccessStatus).toBe('NOT_PURCHASED');
  expect(authorContext.body.data.features.paidAuthorDashboardAccess).toBe(false);

  await request(app).get('/api/authors/me/dashboard').set('Authorization', `Bearer ${authorToken}`).expect(200);

  expect(await AuthorAccessEntitlement.countDocuments()).toBe(0);
  expect(await AuthorAccessPurchase.countDocuments()).toBe(0);
  expect(await Payment.countDocuments({ purpose: 'AUTHOR_ACCESS' })).toBe(0);
});

test('flag OFF allows legacy ACTIVE and REVOKED authors while preserving historical records', async () => {
  setPaidAccessFlag(false);

  const active = await createEntitlement(author, 'ACTIVE');
  await request(app).get('/api/authors/me/dashboard').set('Authorization', `Bearer ${authorToken}`).expect(200);
  let context = await request(app).get('/api/users/me/context').set('Authorization', `Bearer ${authorToken}`).expect(200);
  expect(context.body.data.capabilities.canAccessAuthorDashboard).toBe(true);
  expect(context.body.data.states.dashboardAccessStatus).toBe('ACTIVE');

  active.status = 'REVOKED';
  active.revokedAt = new Date();
  active.revocationReason = 'Legacy revoked entitlement';
  await active.save();

  await request(app).get('/api/authors/me/dashboard').set('Authorization', `Bearer ${authorToken}`).expect(200);
  context = await request(app).get('/api/users/me/context').set('Authorization', `Bearer ${authorToken}`).expect(200);
  expect(context.body.data.capabilities.canAccessAuthorDashboard).toBe(true);
  expect(context.body.data.states.dashboardAccessStatus).toBe('REVOKED');

  const preserved = await AuthorAccessEntitlement.findById(active._id).lean();
  expect(preserved.status).toBe('REVOKED');
});

test('flag OFF allows admin and blocks new dashboard purchases without creating purchase or payment', async () => {
  setPaidAccessFlag(false);
  await createActivePlan();

  const adminContext = await request(app).get('/api/users/me/context').set('Authorization', `Bearer ${adminToken}`).expect(200);
  expect(adminContext.body.data.capabilities).toMatchObject({
    canPublish: true,
    canAccessAuthorDashboard: true,
    canAdminister: true
  });
  expect(adminContext.body.data.features.paidAuthorDashboardAccess).toBe(false);

  await request(app).get('/api/authors/me/dashboard').set('Authorization', `Bearer ${adminToken}`).expect(200);

  const purchase = await request(app)
    .post('/api/authors/me/dashboard-access/purchase')
    .set('Authorization', `Bearer ${authorToken}`)
    .expect(409);

  expect(purchase.body.error).toBe('AUTHOR_DASHBOARD_PAID_ACCESS_DISABLED');
  expect(await AuthorAccessPurchase.countDocuments()).toBe(0);
  expect(await Payment.countDocuments({ purpose: 'AUTHOR_ACCESS' })).toBe(0);
});

test('flag ON preserves old paid entitlement gate behavior and purchase flow', async () => {
  setPaidAccessFlag(true);
  await createActivePlan();

  let context = await request(app).get('/api/users/me/context').set('Authorization', `Bearer ${authorToken}`).expect(200);
  expect(context.body.data.capabilities.canPublish).toBe(true);
  expect(context.body.data.capabilities.canAccessAuthorDashboard).toBe(false);
  expect(context.body.data.features.paidAuthorDashboardAccess).toBe(true);
  await request(app).get('/api/authors/me/dashboard').set('Authorization', `Bearer ${authorToken}`).expect(403);

  const active = await createEntitlement(author, 'ACTIVE');
  await request(app).get('/api/authors/me/dashboard').set('Authorization', `Bearer ${authorToken}`).expect(200);
  context = await request(app).get('/api/users/me/context').set('Authorization', `Bearer ${authorToken}`).expect(200);
  expect(context.body.data.capabilities.canAccessAuthorDashboard).toBe(true);

  active.status = 'REVOKED';
  active.revokedAt = new Date();
  await active.save();
  await request(app).get('/api/authors/me/dashboard').set('Authorization', `Bearer ${authorToken}`).expect(403);
  context = await request(app).get('/api/users/me/context').set('Authorization', `Bearer ${authorToken}`).expect(200);
  expect(context.body.data.capabilities.canAccessAuthorDashboard).toBe(false);

  await AuthorAccessEntitlement.deleteMany({});
  const purchase = await request(app)
    .post('/api/authors/me/dashboard-access/purchase')
    .set('Authorization', `Bearer ${authorToken}`)
    .expect(201);

  expect(purchase.body.data.purchase.status).toBe('PENDING');
  expect(await AuthorAccessPurchase.countDocuments()).toBe(1);
  expect(await Payment.countDocuments({ purpose: 'AUTHOR_ACCESS' })).toBe(1);
});

test('missing feature flag defaults to old paid entitlement behavior', async () => {
  delete process.env.AUTHOR_DASHBOARD_PAID_ACCESS_ENABLED;

  const context = await request(app).get('/api/users/me/context').set('Authorization', `Bearer ${authorToken}`).expect(200);
  expect(context.body.data.features.paidAuthorDashboardAccess).toBe(true);
  expect(context.body.data.capabilities.canAccessAuthorDashboard).toBe(false);
  await request(app).get('/api/authors/me/dashboard').set('Authorization', `Bearer ${authorToken}`).expect(403);
});
