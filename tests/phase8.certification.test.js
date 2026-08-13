const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const express = require('express');

const userRoutes = require('../src/routes/userRoutes');
const authorRoutes = require('../src/routes/authorRoutes');
const adminRoutes = require('../src/routes/adminRoutes');
const authRoutes = require('../src/routes/authRoutes');
const bookRoutes = require('../src/routes/bookRoutes');
const categoryRoutes = require('../src/routes/categoryRoutes');

const User = require('../src/models/User');
const Book = require('../src/models/Book');
const Category = require('../src/models/Category');
const Order = require('../src/models/Order');
const Payment = require('../src/models/Payment');
const AuthorApplication = require('../src/models/AuthorApplication');
const AuthorAccessPlan = require('../src/models/AuthorAccessPlan');
const RoyaltySettlement = require('../src/models/RoyaltySettlement');
const RoyaltySettlementClaim = require('../src/models/RoyaltySettlementClaim');
const RoyaltyPayout = require('../src/models/RoyaltyPayout');

const authorAccessService = require('../src/services/authorAccessService');
const { registerSubscribers } = require('../src/events/registerSubscribers');
const { generateToken } = require('../src/utils/tokenUtils');

jest.setTimeout(60000);
process.env.MONGOMS_DOWNLOAD_DIR = 'node_modules/.cache/mongodb-binaries';
process.env.JWT_SECRET = 'cert_test_jwt_secret_32bytes_long_key_12345';

describe('Phase 8: Production Certification & Security Suite', () => {
  let replSet;
  let app;

  let adminUser, adminToken;
  let authorUser1, authorToken1;
  let authorUser2, authorToken2;
  let readerUser, readerToken;
  let category;

  beforeAll(async () => {
    replSet = await MongoMemoryReplSet.create({
      replSet: { count: 1 },
      instanceOpts: [{ launchTimeout: 60000 }]
    });
    await mongoose.connect(replSet.getUri());

    app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);
    app.use('/api/users', userRoutes);
    app.use('/api/authors', authorRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api/books', bookRoutes);
    app.use('/api/categories', categoryRoutes);

    app.use((err, req, res, next) => {
      res.status(err.statusCode || err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
      });
    });

    await Promise.all([
      User.syncIndexes(),
      Book.syncIndexes(),
      Category.syncIndexes(),
      Order.syncIndexes(),
      Payment.syncIndexes(),
      AuthorApplication.syncIndexes(),
      AuthorAccessPlan.syncIndexes(),
      RoyaltySettlement.syncIndexes(),
      RoyaltySettlementClaim.syncIndexes(),
      RoyaltyPayout.syncIndexes()
    ]);

    registerSubscribers();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (replSet) await replSet.stop();
  });

  beforeEach(async () => {
    await Promise.all([
      User.deleteMany({}),
      Book.deleteMany({}),
      Category.deleteMany({}),
      Order.deleteMany({}),
      Payment.deleteMany({}),
      AuthorApplication.deleteMany({}),
      AuthorAccessPlan.deleteMany({}),
      RoyaltySettlement.deleteMany({}),
      RoyaltySettlementClaim.deleteMany({}),
      RoyaltyPayout.deleteMany({})
    ]);

    category = await Category.create({ name: 'Architecture', slug: 'architecture' });

    adminUser = await User.create({
      name: 'Super Admin',
      email: 'admin.cert@harglim.com',
      password: 'password123',
      role: 'admin'
    });
    adminToken = generateToken(adminUser._id);

    await authorAccessService.adminConfigurePlan(adminUser, {
      name: 'Cert Author Plan',
      amount: 2999,
      durationMonths: 12
    });

    authorUser1 = await User.create({
      name: 'Cert Author One',
      email: 'author1.cert@harglim.com',
      password: 'password123',
      role: 'author'
    });
    authorToken1 = generateToken(authorUser1._id);
    await authorAccessService.adminGrantEntitlement(adminUser, authorUser1._id);

    authorUser2 = await User.create({
      name: 'Cert Author Two',
      email: 'author2.cert@harglim.com',
      password: 'password123',
      role: 'author'
    });
    authorToken2 = generateToken(authorUser2._id);
    await authorAccessService.adminGrantEntitlement(adminUser, authorUser2._id);

    readerUser = await User.create({
      name: 'Cert Reader User',
      email: 'reader.cert@harglim.com',
      password: 'password123',
      role: 'reader'
    });
    readerToken = generateToken(readerUser._id);
  });

  describe('1. Security & IDOR Protections', () => {
    it('rejects unauthenticated requests to protected endpoints', async () => {
      const res = await request(app).get('/api/users/me/context');
      expect(res.status).toBe(401);
    });

    it('prevents Reader role from creating author draft books', async () => {
      const res = await request(app)
        .post('/api/authors/me/books')
        .set('Authorization', `Bearer ${readerToken}`)
        .send({
          title: 'Illegal Book',
          description: 'Valid description for book creation attempt',
          category: category._id,
          mrp: 500
        });
      expect(res.status).toBe(403);
    });

    it('prevents Author 1 from accessing Author 2 private settlement detail (IDOR protection)', async () => {
      const settlement = await RoyaltySettlement.create({
        settlementNumber: 'SETTLE-TEST-999',
        author: authorUser2._id,
        status: 'APPROVED',
        totalRoyalty: 1500,
        currency: 'INR',
        periodStart: new Date(),
        periodEnd: new Date(),
        grossBookRevenue: 10000,
        itemCount: 5,
        createdBy: adminUser._id
      });

      const res = await request(app)
        .get(`/api/authors/me/royalty-settlements/${settlement._id}`)
        .set('Authorization', `Bearer ${authorToken1}`);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Not authorized to view this settlement');
    });
  });

  describe('2. Mass Assignment Protections', () => {
    it('blocks client attempts to set protected admin fields like status=published or royaltyPercentage', async () => {
      const res = await request(app)
        .post('/api/authors/me/books')
        .set('Authorization', `Bearer ${authorToken1}`)
        .send({
          title: 'Malicious Draft',
          description: 'Detailed description for testing mass assignment override',
          category: category._id,
          mrp: 600,
          status: 'published',
          royaltyPercentage: 90
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('is admin-only');
    });
  });

  describe('3. Database Invariants & Double Settlement Protection', () => {
    it('enforces database-level unique claim index preventing duplicate settlement claims', async () => {
      const sourceKey = `${new mongoose.Types.ObjectId()}:${new mongoose.Types.ObjectId()}`;

      const claim1 = await RoyaltySettlementClaim.create({
        royaltySourceKey: sourceKey,
        author: authorUser2._id,
        settlement: new mongoose.Types.ObjectId(),
        order: new mongoose.Types.ObjectId(),
        orderItem: new mongoose.Types.ObjectId(),
        royaltyAmount: 250
      });
      expect(claim1.royaltySourceKey).toBe(sourceKey);

      let duplicateFailed = false;
      try {
        await RoyaltySettlementClaim.create({
          royaltySourceKey: sourceKey,
          author: authorUser2._id,
          settlement: new mongoose.Types.ObjectId(),
          order: new mongoose.Types.ObjectId(),
          orderItem: new mongoose.Types.ObjectId(),
          royaltyAmount: 250
        });
      } catch (err) {
        duplicateFailed = true;
        expect(err.code).toBe(11000);
      }

      expect(duplicateFailed).toBe(true);
    });
  });

  describe('4. Dynamic Route Parameter Resolution', () => {
    it('resolves /api/authors/me/books/performance before /api/authors/me/books/:bookId', async () => {
      const res = await request(app)
        .get('/api/authors/me/books/performance')
        .set('Authorization', `Bearer ${authorToken1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('correctly resolves /api/authors/me/royalty-settlements/:id without treating ID as authorId', async () => {
      const settlement = await RoyaltySettlement.create({
        settlementNumber: 'SETTLE-TEST-0001',
        author: authorUser2._id,
        status: 'APPROVED',
        totalRoyalty: 800,
        currency: 'INR',
        periodStart: new Date(),
        periodEnd: new Date(),
        grossBookRevenue: 5000,
        itemCount: 2,
        createdBy: adminUser._id
      });

      const res = await request(app)
        .get(`/api/authors/me/royalty-settlements/${settlement._id}`)
        .set('Authorization', `Bearer ${authorToken2}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.settlement._id).toBe(String(settlement._id));
    });
  });

  describe('5. Error Response Hygiene', () => {
    it('ensures clean error envelope without stack trace exposure in non-development mode', async () => {
      const oldEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const res = await request(app)
        .get(`/api/authors/me/royalty-settlements/${new mongoose.Types.ObjectId()}`)
        .set('Authorization', `Bearer ${authorToken2}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.stack).toBeUndefined();

      process.env.NODE_ENV = oldEnv;
    });
  });
});
