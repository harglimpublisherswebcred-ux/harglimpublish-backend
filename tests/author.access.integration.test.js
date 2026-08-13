const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const request = require('supertest');

const authorRoutes = require('../src/routes/authorRoutes');
const adminRoutes = require('../src/routes/adminRoutes');
const publishRoutes = require('../src/routes/publishRoutes');

const User = require('../src/models/User');
const Book = require('../src/models/Book');
const Category = require('../src/models/Category');
const Payment = require('../src/models/Payment');
const PaymentLedger = require('../src/models/PaymentLedger');
const PublishRequest = require('../src/models/PublishRequest');
const PublishPackage = require('../src/models/PublishPackage');
const AuthorAccessPlan = require('../src/models/AuthorAccessPlan');
const AuthorAccessPurchase = require('../src/models/AuthorAccessPurchase');
const AuthorAccessEntitlement = require('../src/models/AuthorAccessEntitlement');
const Invoice = require('../src/models/Invoice');
const Shipment = require('../src/models/Shipment');

const authorAccessService = require('../src/services/authorAccessService');
const adminOperationsService = require('../src/services/adminOperationsService');
const eventBus = require('../src/events/eventBus');
const { registerSubscribers } = require('../src/events/registerSubscribers');
const { generateToken } = require('../src/utils/tokenUtils');

jest.setTimeout(600000);
process.env.MONGOMS_DOWNLOAD_DIR = 'node_modules/.cache/mongodb-binaries';

describe('Phase 3: Author Publishing Access + Paid Dashboard Entitlement Integration', () => {
  let replSet;
  let app;
  let readerUser;
  let authorUser1;
  let authorUser2;
  let adminUser;

  let readerToken;
  let authorToken1;
  let authorToken2;
  let adminToken;

  let activePlan;
  let publishPackage;

  beforeAll(async () => {
    process.env.MERCHANT_UPI_ID = 'merchant@upi';
    process.env.MERCHANT_NAME = 'Harglim Publishers';

    replSet = await MongoMemoryReplSet.create({
      replSet: { count: 1 },
      instanceOpts: [{ launchTimeout: 60000 }]
    });
    await mongoose.connect(replSet.getUri());

    app = express();
    app.use(express.json());
    app.use('/api/authors', authorRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api', publishRoutes);

    await Promise.all([
      User.syncIndexes(),
      Book.syncIndexes(),
      Category.syncIndexes(),
      Payment.syncIndexes(),
      PaymentLedger.syncIndexes(),
      PublishRequest.syncIndexes(),
      PublishPackage.syncIndexes(),
      AuthorAccessPlan.syncIndexes(),
      AuthorAccessPurchase.syncIndexes(),
      AuthorAccessEntitlement.syncIndexes()
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
      Payment.deleteMany({}),
      PaymentLedger.collection.deleteMany({}),
      PublishRequest.deleteMany({}),
      PublishPackage.deleteMany({}),
      AuthorAccessPlan.deleteMany({}),
      AuthorAccessPurchase.deleteMany({}),
      AuthorAccessEntitlement.deleteMany({}),
      Invoice.deleteMany({}),
      Shipment.deleteMany({})
    ]);

    readerUser = await User.create({
      name: 'Reader User',
      email: 'reader@example.com',
      password: 'password123',
      role: 'reader'
    });

    authorUser1 = await User.create({
      name: 'Approved Author One',
      email: 'author1@example.com',
      password: 'password123',
      role: 'author'
    });

    authorUser2 = await User.create({
      name: 'Approved Author Two',
      email: 'author2@example.com',
      password: 'password123',
      role: 'author'
    });

    adminUser = await User.create({
      name: 'System Admin',
      email: 'admin@example.com',
      password: 'password123',
      role: 'admin'
    });

    readerToken = generateToken(readerUser._id);
    authorToken1 = generateToken(authorUser1._id);
    authorToken2 = generateToken(authorUser2._id);
    adminToken = generateToken(adminUser._id);

    publishPackage = await PublishPackage.create({
      name: 'Standard Publishing Package',
      description: 'Basic editing and distribution',
      price: 5000,
      features: ['Editing', 'Distribution']
    });

    activePlan = await authorAccessService.adminConfigurePlan(adminUser, {
      name: 'Author Pro Dashboard',
      amount: 2999,
      currency: 'INR',
      status: 'ACTIVE'
    });
  });

  describe('Level 1 — Approved Author Publishing (No Plan Required)', () => {
    it('allows approved author without paid plan to submit PublishRequest and upload files', async () => {
      const res = await request(app)
        .post('/api/publish-requests')
        .set('Authorization', `Bearer ${authorToken1}`)
        .send({
          title: 'My Great Novel',
          genre: 'Fiction',
          wordCount: 50000,
          packageId: publishPackage._id,
          fileUrl: 'https://cloudinary.com/manuscript.pdf'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.publishRequest.title).toBe('My Great Novel');
    });

    it('denies dashboard stats, analytics, and royalties for approved author without paid plan', async () => {
      const statsRes = await request(app)
        .get(`/api/authors/${authorUser1._id}/stats`)
        .set('Authorization', `Bearer ${authorToken1}`);
      expect(statsRes.status).toBe(403);
      expect(statsRes.body.error).toBe('AUTHOR_DASHBOARD_ACCESS_REQUIRED');

      const analyticsRes = await request(app)
        .get(`/api/authors/${authorUser1._id}/analytics`)
        .set('Authorization', `Bearer ${authorToken1}`);
      expect(analyticsRes.status).toBe(403);
      expect(analyticsRes.body.error).toBe('AUTHOR_DASHBOARD_ACCESS_REQUIRED');

      const royaltiesRes = await request(app)
        .get(`/api/authors/${authorUser1._id}/royalties/history`)
        .set('Authorization', `Bearer ${authorToken1}`);
      expect(royaltiesRes.status).toBe(403);
      expect(royaltiesRes.body.error).toBe('AUTHOR_DASHBOARD_ACCESS_REQUIRED');
    });
  });

  describe('Level 2 — Paid Author Dashboard Purchase & Verification Flow', () => {
    it('executes purchase flow, UTR submission, payment verification, and grants dashboard entitlement', async () => {
      // 1. Check initial status
      const statusRes1 = await request(app)
        .get('/api/authors/me/dashboard-access')
        .set('Authorization', `Bearer ${authorToken1}`);
      expect(statusRes1.status).toBe(200);
      expect(statusRes1.body.data.dashboardAccess.status).toBe('APPROVED_AUTHOR_NO_PLAN');
      expect(statusRes1.body.data.dashboardAccess.hasAccess).toBe(false);

      // 2. Initiate Purchase
      const purchaseRes = await request(app)
        .post('/api/authors/me/dashboard-access/purchase')
        .set('Authorization', `Bearer ${authorToken1}`);
      expect(purchaseRes.status).toBe(201);
      expect(purchaseRes.body.success).toBe(true);

      const purchaseId = purchaseRes.body.data.purchase._id;
      const paymentId = purchaseRes.body.data.purchase.payment;
      expect(purchaseRes.body.data.purchase.amount).toBe(2999);

      // Verify payment details
      const paymentDoc = await Payment.findById(paymentId);
      expect(paymentDoc.purpose).toBe('AUTHOR_ACCESS');
      expect(paymentDoc.subjectType).toBe('AUTHOR_ACCESS_PURCHASE');
      expect(String(paymentDoc.subjectId)).toBe(String(purchaseId));
      expect(paymentDoc.order).toBeUndefined();

      // 3. Submit UTR
      const utrRes = await request(app)
        .put(`/api/authors/me/dashboard-access/purchases/${purchaseId}/verify-payment`)
        .set('Authorization', `Bearer ${authorToken1}`)
        .send({ utr: 'UTR-AUTHOR-PRO-100' });
      expect(utrRes.status).toBe(200);

      // Status should now be VERIFICATION_PENDING
      const statusRes2 = await request(app)
        .get('/api/authors/me/dashboard-access')
        .set('Authorization', `Bearer ${authorToken1}`);
      expect(statusRes2.body.data.dashboardAccess.status).toBe('VERIFICATION_PENDING');

      // 4. Admin Approves Payment
      await adminOperationsService.approvePayment(paymentId, adminUser._id, { reason: 'Author plan verified' });

      // 5. Verify entitlement granted
      const statusRes3 = await request(app)
        .get('/api/authors/me/dashboard-access')
        .set('Authorization', `Bearer ${authorToken1}`);
      expect(statusRes3.body.data.dashboardAccess.status).toBe('ACTIVE');
      expect(statusRes3.body.data.dashboardAccess.hasAccess).toBe(true);

      // 6. Access Dashboard Metrics successfully
      const statsRes = await request(app)
        .get(`/api/authors/${authorUser1._id}/stats`)
        .set('Authorization', `Bearer ${authorToken1}`);
      expect(statsRes.status).toBe(200);

      const analyticsRes = await request(app)
        .get(`/api/authors/${authorUser1._id}/analytics`)
        .set('Authorization', `Bearer ${authorToken1}`);
      expect(analyticsRes.status).toBe(200);

      const royaltiesRes = await request(app)
        .get(`/api/authors/${authorUser1._id}/royalties/history`)
        .set('Authorization', `Bearer ${authorToken1}`);
      expect(royaltiesRes.status).toBe(200);

      // 7. Purpose Isolation Check: NO order side-effects triggered
      const invoiceCount = await Invoice.countDocuments({ payment: paymentId });
      expect(invoiceCount).toBe(0);

      const shipmentCount = await Shipment.countDocuments({});
      expect(shipmentCount).toBe(0);
    });
  });

  describe('Admin Operations: Manual Grant, Revoke, Restore & Security Rules', () => {
    it('allows admin manual grant without creating payments', async () => {
      const grantRes = await request(app)
        .post('/api/admin/author-access/entitlements/grant')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userId: authorUser2._id, reason: 'Promotional grant for author' });

      expect(grantRes.status).toBe(200);
      expect(grantRes.body.data.status).toBe('ACTIVE');
      expect(grantRes.body.data.source).toBe('ADMIN_GRANT');

      // Author 2 now has dashboard access
      const statsRes = await request(app)
        .get(`/api/authors/${authorUser2._id}/stats`)
        .set('Authorization', `Bearer ${authorToken2}`);
      expect(statsRes.status).toBe(200);
    });

    it('handles admin revocation: blocks dashboard, preserves author role and publishing, and resists event replay', async () => {
      // 1. Setup active entitlement for Author 1
      await authorAccessService.adminGrantEntitlement(adminUser, authorUser1._id);

      // 2. Admin Revokes Entitlement
      const revokeRes = await request(app)
        .post(`/api/admin/author-access/entitlements/${authorUser1._id}/revoke`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Violated terms of service' });

      expect(revokeRes.status).toBe(200);
      expect(revokeRes.body.data.status).toBe('REVOKED');

      // 3. Prove Dashboard is denied
      const statsRes = await request(app)
        .get(`/api/authors/${authorUser1._id}/stats`)
        .set('Authorization', `Bearer ${authorToken1}`);
      expect(statsRes.status).toBe(403);
      expect(statsRes.body.error).toBe('AUTHOR_DASHBOARD_ACCESS_REQUIRED');

      // 4. Prove User.role remains 'author'
      const updatedUser = await User.findById(authorUser1._id);
      expect(updatedUser.role).toBe('author');

      // 5. Prove Level 1 Publishing request STILL WORKS
      const pubRes = await request(app)
        .post('/api/publish-requests')
        .set('Authorization', `Bearer ${authorToken1}`)
        .send({
          title: 'Post Revocation Book',
          genre: 'Non-Fiction',
          wordCount: 40000,
          packageId: publishPackage._id,
          fileUrl: 'https://cloudinary.com/manuscript.pdf'
        });
      expect(pubRes.status).toBe(201);

      // 6. Security Event Replay Check: Simulated PaymentVerified event must NOT restore access
      const mockPayment = await Payment.create({
        purpose: 'AUTHOR_ACCESS',
        subjectType: 'AUTHOR_ACCESS_PURCHASE',
        subjectId: new mongoose.Types.ObjectId(),
        user: authorUser1._id,
        amount: 2999,
        status: 'PAYMENT_VERIFIED'
      });

      const mockPurchase = await AuthorAccessPurchase.create({
        user: authorUser1._id,
        plan: activePlan._id,
        planVersion: 1,
        planNameSnapshot: activePlan.name,
        amount: 2999,
        payment: mockPayment._id,
        status: 'PENDING'
      });

      mockPayment.subjectId = mockPurchase._id;
      await mockPayment.save();

      // Trigger grant logic
      await authorAccessService.grantEntitlementOnVerifiedPayment(mockPayment._id);

      // Entitlement must remain REVOKED!
      const entitlement = await AuthorAccessEntitlement.findOne({ user: authorUser1._id });
      expect(entitlement.status).toBe('REVOKED');

      // 7. Admin Restores Entitlement
      const restoreRes = await request(app)
        .post(`/api/admin/author-access/entitlements/${authorUser1._id}/restore`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Appeal accepted' });
      expect(restoreRes.status).toBe(200);
      expect(restoreRes.body.data.status).toBe('ACTIVE');

      // Dashboard access works again
      const statsRes2 = await request(app)
        .get(`/api/authors/${authorUser1._id}/stats`)
        .set('Authorization', `Bearer ${authorToken1}`);
      expect(statsRes2.status).toBe(200);
    });
  });

  describe('Authorization & Security Edge Cases', () => {
    it('denies reader role from purchasing author dashboard plan', async () => {
      const res = await request(app)
        .post('/api/authors/me/dashboard-access/purchase')
        .set('Authorization', `Bearer ${readerToken}`);

      expect(res.status).toBe(403);
    });

    it('prevents Author 1 from accessing Author 2 dashboard stats', async () => {
      // Grant Author 1 dashboard access
      await authorAccessService.adminGrantEntitlement(adminUser, authorUser1._id);

      // Author 1 attempts to query Author 2 stats endpoint
      const res = await request(app)
        .get(`/api/authors/${authorUser2._id}/stats`)
        .set('Authorization', `Bearer ${authorToken1}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('AUTHOR_DASHBOARD_ACCESS_DENIED');
    });
  });
});
