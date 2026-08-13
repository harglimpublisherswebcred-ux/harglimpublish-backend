const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const express = require('express');

const userRoutes = require('../src/routes/userRoutes');
const authorRoutes = require('../src/routes/authorRoutes');
const adminRoutes = require('../src/routes/adminRoutes');
const authRoutes = require('../src/routes/authRoutes');

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

describe('Phase 7: Admin Management + Production Frontend Contracts', () => {
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
    app.use((err, req, res, next) => {
      res.status(err.statusCode || err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
        error: err.code || (err.code === 'AUTHOR_DASHBOARD_ACCESS_REQUIRED' ? 'AUTHOR_DASHBOARD_ACCESS_REQUIRED' : undefined)
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

    category = await Category.create({ name: 'Engineering', slug: 'engineering' });

    // 1. Create Admin
    adminUser = await User.create({
      name: 'System Admin',
      email: 'admin@harglim.com',
      password: 'password123',
      role: 'admin'
    });
    adminToken = generateToken(adminUser._id);

    // Active Plan
    await authorAccessService.adminConfigurePlan(adminUser, {
      name: 'Standard Author Plan',
      amount: 2999,
      durationMonths: 12
    });

    // 2. Create Approved Author (Without Plan)
    authorUser1 = await User.create({
      name: 'Author Without Plan',
      email: 'author1@harglim.com',
      password: 'password123',
      role: 'author',
      authorApprovalStatus: 'approved'
    });
    authorToken1 = generateToken(authorUser1._id);

    // 3. Create Approved Author (With Active Plan)
    authorUser2 = await User.create({
      name: 'Author With Plan',
      email: 'author2@harglim.com',
      password: 'password123',
      role: 'author',
      authorApprovalStatus: 'approved'
    });
    authorToken2 = generateToken(authorUser2._id);
    await authorAccessService.adminGrantEntitlement(adminUser, authorUser2._id);

    // 4. Create Reader
    readerUser = await User.create({
      name: 'Customer Reader',
      email: 'reader@harglim.com',
      password: 'password123',
      role: 'reader'
    });
    readerToken = generateToken(readerUser._id);
  });

  describe('User Bootstrap Session Contract (/api/users/me/context)', () => {
    it('returns capability matrix and state indicators for Reader', async () => {
      const res = await request(app)
        .get('/api/users/me/context')
        .set('Authorization', `Bearer ${readerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe('reader');
      expect(res.body.data.capabilities).toEqual({
        canPublish: false,
        canAccessAuthorDashboard: false,
        canAdminister: false
      });
      expect(res.body.data.states.authorApplicationStatus).toBe('NOT_APPLIED');
      expect(res.body.data.states.dashboardAccessStatus).toBe('NOT_AUTHOR');
    });

    it('returns capability matrix for Approved Author WITHOUT active dashboard plan', async () => {
      const res = await request(app)
        .get('/api/users/me/context')
        .set('Authorization', `Bearer ${authorToken1}`);

      expect(res.status).toBe(200);
      expect(res.body.data.user.role).toBe('author');
      expect(res.body.data.capabilities).toEqual({
        canPublish: true,
        canAccessAuthorDashboard: false,
        canAdminister: false
      });
      expect(res.body.data.states.dashboardAccessStatus).toBe('NOT_PURCHASED');
      expect(res.body.data.states.publishingStatus).toBe('APPROVED');
    });

    it('returns capability matrix for Approved Author WITH ACTIVE dashboard plan', async () => {
      const res = await request(app)
        .get('/api/users/me/context')
        .set('Authorization', `Bearer ${authorToken2}`);

      expect(res.status).toBe(200);
      expect(res.body.data.capabilities).toEqual({
        canPublish: true,
        canAccessAuthorDashboard: true,
        canAdminister: false
      });
      expect(res.body.data.states.dashboardAccessStatus).toBe('ACTIVE');
    });

    it('returns capability matrix for System Admin', async () => {
      const res = await request(app)
        .get('/api/users/me/context')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.capabilities).toEqual({
        canPublish: true,
        canAccessAuthorDashboard: true,
        canAdminister: true
      });
      expect(res.body.data.states.dashboardAccessStatus).toBe('ACTIVE');
    });
  });

  describe('Admin Operations Dashboard Overview (/api/admin/dashboard)', () => {
    it('returns actionable operational counts across verification queues, applications, and settlements', async () => {
      // Create pending author application
      await AuthorApplication.create({
        user: readerUser._id,
        bio: 'Aspiring author bio',
        sampleWritingUrl: 'https://example.com/sample.pdf',
        status: 'pending'
      });

      // Create author access payment awaiting verification
      await Payment.create({
        user: authorUser1._id,
        amount: 2999,
        purpose: 'AUTHOR_ACCESS',
        subjectType: 'AUTHOR_ACCESS_PURCHASE',
        status: 'VERIFICATION_PENDING',
        provider: 'manual_upi'
      });

      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.operationalCounts.pendingAuthorApplications).toBe(1);
      expect(res.body.data.operationalCounts.authorAccessPaymentsAwaitingVerification).toBe(1);
      expect(res.body.data.operationalCounts.activeAuthors).toBe(2);
    });

    it('denies access to non-admin users', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${authorToken1}`);

      expect(res.status).toBe(403);
    });
  });

  describe('Admin Author Detail Aggregate Profile (/api/admin/authors/:authorId)', () => {
    it('returns comprehensive author aggregate details including application, entitlements, books, and royalties', async () => {
      // Create book for Author 1
      await Book.create({
        title: 'Author 1 Published Book',
        slug: 'author-1-published-book',
        description: 'Test description',
        category: category._id,
        author: authorUser1._id,
        mrp: 500,
        price: 500,
        royaltyPercentage: 15,
        status: 'published',
        stock: 100
      });

      const res = await request(app)
        .get(`/api/admin/authors/${authorUser1._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.author.id).toBe(String(authorUser1._id));
      expect(res.body.data.author.role).toBe('author');
      expect(res.body.data.bookCounts.published).toBe(1);
      expect(res.body.data.royalties).toBeDefined();
    });

    it('returns 404 for non-existent author ID', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/admin/authors/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('Core Contract Compatibility & Security Matrix', () => {
    it('preserves Book.mrp canonical pricing alongside price compatibility alias', async () => {
      const book = await Book.create({
        title: 'MRP Canonical Book',
        slug: 'mrp-canonical-book',
        description: 'Test description',
        category: category._id,
        author: authorUser1._id,
        mrp: 450,
        status: 'published',
        stock: 50
      });

      expect(book.mrp).toBe(450);
      expect(book.price).toBe(450);
    });

    it('strictly isolates ORDER_PURCHASE and AUTHOR_ACCESS payment purposes', async () => {
      const orderId = new mongoose.Types.ObjectId();
      const payment1 = await Payment.create({
        user: readerUser._id,
        amount: 500,
        purpose: 'ORDER_PURCHASE',
        subjectType: 'ORDER',
        subjectId: orderId,
        order: orderId,
        status: 'VERIFIED',
        provider: 'manual_upi'
      });

      const payment2 = await Payment.create({
        user: authorUser1._id,
        amount: 2999,
        purpose: 'AUTHOR_ACCESS',
        subjectType: 'AUTHOR_ACCESS_PURCHASE',
        status: 'VERIFIED',
        provider: 'manual_upi'
      });

      expect(payment1.purpose).toBe('ORDER_PURCHASE');
      expect(payment2.purpose).toBe('AUTHOR_ACCESS');
    });

    it('ensures clean error response envelope without leaking database internal trace details', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/authors/me/royalty-settlements/${fakeId}`)
        .set('Authorization', `Bearer ${authorToken2}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBeDefined();
      expect(res.body.stack).toBeUndefined();
    });
  });
});
