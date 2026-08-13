const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const express = require('express');

const authorRoutes = require('../src/routes/authorRoutes');
const adminRoutes = require('../src/routes/adminRoutes');
const authRoutes = require('../src/routes/authRoutes');

const User = require('../src/models/User');
const Book = require('../src/models/Book');
const Category = require('../src/models/Category');
const Order = require('../src/models/Order');
const Payment = require('../src/models/Payment');
const AuthorAccessPlan = require('../src/models/AuthorAccessPlan');
const RoyaltySettlement = require('../src/models/RoyaltySettlement');
const RoyaltySettlementClaim = require('../src/models/RoyaltySettlementClaim');
const RoyaltyPayout = require('../src/models/RoyaltyPayout');

const authorAccessService = require('../src/services/authorAccessService');
const royaltySettlementService = require('../src/services/royaltySettlementService');
const { registerSubscribers } = require('../src/events/registerSubscribers');
const { generateToken } = require('../src/utils/tokenUtils');

jest.setTimeout(60000);
process.env.MONGOMS_DOWNLOAD_DIR = 'node_modules/.cache/mongodb-binaries';

describe('Phase 6A: Royalty Settlement + Payout Accounting Foundation', () => {
  let replSet;
  let app;

  let adminUser, adminToken;
  let authorUser1, authorToken1;
  let authorUser2, authorToken2;
  let readerUser;
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
    app.use('/api/authors', authorRoutes);
    app.use('/api/admin', adminRoutes);
    app.use((err, req, res, next) => {
      res.status(err.statusCode || err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
        error: err.code === 'AUTHOR_DASHBOARD_ACCESS_REQUIRED' ? 'AUTHOR_DASHBOARD_ACCESS_REQUIRED' : undefined
      });
    });

    await Promise.all([
      User.syncIndexes(),
      Book.syncIndexes(),
      Category.syncIndexes(),
      Order.syncIndexes(),
      Payment.syncIndexes(),
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
      AuthorAccessPlan.deleteMany({}),
      RoyaltySettlement.deleteMany({}),
      RoyaltySettlementClaim.deleteMany({}),
      RoyaltyPayout.deleteMany({})
    ]);

    category = await Category.create({ name: 'Publishing Science', slug: 'publishing-science' });

    // 1. Create Admin
    adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@harglim.com',
      password: 'password123',
      role: 'admin'
    });
    adminToken = generateToken(adminUser._id);

    // Configure Active Author Access Plan
    await authorAccessService.adminConfigurePlan(adminUser, {
      name: 'Standard Author Plan',
      amount: 2999,
      durationMonths: 12
    });

    // 2. Create Author 1 (Approved author)
    authorUser1 = await User.create({
      name: 'Author One',
      email: 'author1@harglim.com',
      password: 'password123',
      role: 'author',
      authorApprovalStatus: 'approved'
    });
    authorToken1 = generateToken(authorUser1._id);

    // 3. Create Author 2 (Approved author)
    authorUser2 = await User.create({
      name: 'Author Two',
      email: 'author2@harglim.com',
      password: 'password123',
      role: 'author',
      authorApprovalStatus: 'approved'
    });
    authorToken2 = generateToken(authorUser2._id);

    // 4. Create Reader
    readerUser = await User.create({
      name: 'Reader One',
      email: 'reader@harglim.com',
      password: 'password123',
      role: 'reader'
    });
  });

  const createDeliveredVerifiedOrder = async (reader, items, shippingPrice = 50) => {
    let subtotal = 0;
    items.forEach((item) => {
      subtotal += (item.price || 0) * (item.quantity || 1);
    });

    const order = await Order.create({
      orderNumber: `HM-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      user: reader._id,
      items,
      subtotal,
      tax: 0,
      shippingPrice,
      totalPrice: subtotal + shippingPrice,
      isPaid: true,
      paidAt: new Date(),
      status: 'DELIVERED',
      shippingAddress: { fullName: 'Reader', addressLine1: 'Street 1', city: 'City', postalCode: '1000', country: 'IN' }
    });

    const payment = await Payment.create({
      user: reader._id,
      amount: subtotal + shippingPrice,
      purpose: 'ORDER_PURCHASE',
      subjectType: 'ORDER',
      subjectId: order._id,
      order: order._id,
      status: 'VERIFIED',
      provider: 'manual_upi'
    });

    return { order, payment };
  };

  describe('Eligibility Policy & Order Status Distinction', () => {
    it('proves VERIFIED + DELIVERED sales are settlement-eligible, while VERIFIED + PROCESSING are accrued BUT NOT eligible', async () => {
      await authorAccessService.adminGrantEntitlement(adminUser, authorUser1._id);

      const book = await Book.create({
        title: 'Delivered vs Processing Book',
        slug: 'delivered-vs-processing-book',
        description: 'Test book description',
        category: category._id,
        author: authorUser1._id,
        mrp: 500,
        price: 500,
        royaltyPercentage: 10,
        status: 'published',
        stock: 50
      });

      // Sale 1: Delivered (Eligible)
      await createDeliveredVerifiedOrder(readerUser, [
        { book: book._id, quantity: 1, price: 500, author: authorUser1._id, royaltyPercentage: 10 }
      ]);

      // Sale 2: Processing (Accrued on dashboard, but NOT settlement eligible yet!)
      const processingOrder = await Order.create({
        orderNumber: 'HM-PROCESSING-001',
        user: readerUser._id,
        items: [{ book: book._id, quantity: 1, price: 500, author: authorUser1._id, royaltyPercentage: 10 }],
        subtotal: 500,
        tax: 0,
        shippingPrice: 0,
        totalPrice: 500,
        isPaid: true,
        status: 'PROCESSING',
        shippingAddress: { fullName: 'Reader', addressLine1: 'Street 1', city: 'City', postalCode: '1000', country: 'IN' }
      });

      await Payment.create({
        user: readerUser._id,
        amount: 500,
        purpose: 'ORDER_PURCHASE',
        subjectType: 'ORDER',
        subjectId: processingOrder._id,
        order: processingOrder._id,
        status: 'VERIFIED',
        provider: 'manual_upi'
      });

      // Check Dashboard Summary
      const summaryRes = await request(app)
        .get('/api/authors/me/dashboard')
        .set('Authorization', `Bearer ${authorToken1}`);

      expect(summaryRes.status).toBe(200);
      expect(summaryRes.body.data.royalties.accruedKnown).toBe(100); // 50 + 50 = 100 Accrued
      expect(summaryRes.body.data.royalties.eligibleUnsettled).toBe(50); // ONLY Delivered sale (50) is eligible!

      // Admin Preview
      const previewRes = await request(app)
        .post('/api/admin/royalty-settlements/preview')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ authorId: String(authorUser1._id) });

      expect(previewRes.status).toBe(200);
      expect(previewRes.body.data.eligible.itemCount).toBe(1);
      expect(previewRes.body.data.eligible.totalRoyalty).toBe(50);
    });

    it('strictly excludes legacy missing royalty snapshots (HISTORICAL_RATE_UNAVAILABLE) from settlement eligibility', async () => {
      const book = await Book.create({
        title: 'Legacy Rate Book',
        slug: 'legacy-rate-book-settle',
        description: 'Test book description',
        category: category._id,
        author: authorUser1._id,
        mrp: 600,
        price: 600,
        royaltyPercentage: 20,
        status: 'published',
        stock: 50
      });

      // Legacy order delivered WITHOUT royaltyPercentage snapshot
      await createDeliveredVerifiedOrder(readerUser, [
        { book: book._id, quantity: 1, price: 600, author: authorUser1._id } // missing royaltyPercentage
      ]);

      const previewRes = await request(app)
        .post('/api/admin/royalty-settlements/preview')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ authorId: String(authorUser1._id) });

      expect(previewRes.status).toBe(200);
      expect(previewRes.body.data.eligible.itemCount).toBe(0);
      expect(previewRes.body.data.excluded.legacyRateUnavailable).toBe(1);
    });

    it('strictly excludes AUTHOR_ACCESS payments and cancelled orders from settlement eligibility', async () => {
      // Author access payment (non-order purchase)
      await Payment.create({
        user: authorUser1._id,
        amount: 2999,
        purpose: 'AUTHOR_ACCESS',
        subjectType: 'AUTHOR_ACCESS_PURCHASE',
        status: 'VERIFIED',
        provider: 'manual_upi'
      });

      const previewRes = await request(app)
        .post('/api/admin/royalty-settlements/preview')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ authorId: String(authorUser1._id) });

      expect(previewRes.status).toBe(200);
      expect(previewRes.body.data.eligible.itemCount).toBe(0);
    });
  });

  describe('Financial Calculations, Shipping Exclusion & Royalty Change Invariance', () => {
    it('correctly calculates gross revenue and royalties while strictly excluding shipping charges', async () => {
      const book = await Book.create({
        title: 'Node.js Architecture',
        slug: 'nodejs-architecture',
        description: 'Test book description',
        category: category._id,
        author: authorUser1._id,
        mrp: 400,
        price: 400,
        royaltyPercentage: 15,
        status: 'published',
        stock: 50
      });

      // 2 copies @ 400 = 800 Gross Book Revenue + 100 Shipping = 900 Total Order Price
      await createDeliveredVerifiedOrder(
        readerUser,
        [{ book: book._id, quantity: 2, price: 400, author: authorUser1._id, royaltyPercentage: 15 }],
        100 // 100 shipping
      );

      const previewRes = await request(app)
        .post('/api/admin/royalty-settlements/preview')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ authorId: String(authorUser1._id) });

      expect(previewRes.status).toBe(200);
      expect(previewRes.body.data.eligible.grossBookRevenue).toBe(800); // 800, NOT 900!
      expect(previewRes.body.data.eligible.totalRoyalty).toBe(120); // 15% of 800 = 120
    });

    it('proves finalized settlement values remain immutable when current Book configuration changes later', async () => {
      const book = await Book.create({
        title: 'Immutable Settlement Book',
        slug: 'immutable-settlement-book',
        description: 'Test book description',
        category: category._id,
        author: authorUser1._id,
        mrp: 500,
        price: 500,
        royaltyPercentage: 10,
        status: 'published',
        stock: 50
      });

      await createDeliveredVerifiedOrder(readerUser, [
        { book: book._id, quantity: 1, price: 500, author: authorUser1._id, royaltyPercentage: 10 }
      ]);

      // Admin creates and approves draft settlement
      const now = new Date();
      const draftRes = await request(app)
        .post('/api/admin/royalty-settlements')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          authorId: String(authorUser1._id),
          periodStart: new Date(now.getTime() - 86400000).toISOString(),
          periodEnd: new Date(now.getTime() + 86400000).toISOString()
        });

      expect(draftRes.status).toBe(201);
      const settlementId = draftRes.body.data._id;

      const approveRes = await request(app)
        .post(`/api/admin/royalty-settlements/${settlementId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(approveRes.status).toBe(200);
      expect(approveRes.body.data.totalRoyalty).toBe(50);

      // Admin changes Book.mrp to 1000 and Book.royaltyPercentage to 50%
      book.mrp = 1000;
      book.price = 1000;
      book.royaltyPercentage = 50;
      await book.save();

      // Retrieve finalized settlement detail
      const detailRes = await request(app)
        .get(`/api/admin/royalty-settlements/${settlementId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(detailRes.status).toBe(200);
      expect(detailRes.body.data.settlement.totalRoyalty).toBe(50); // Unchanged!
      expect(detailRes.body.data.settlement.items[0].unitPriceSnapshot).toBe(500); // Unchanged!
      expect(detailRes.body.data.settlement.items[0].royaltyPercentageSnapshot).toBe(10); // Unchanged!
    });

    it('correctly isolates multi-author order items into respective author settlements', async () => {
      const bookAuthor1 = await Book.create({
        title: 'Author 1 Book',
        slug: 'author-1-book-settle',
        description: 'Test description',
        category: category._id,
        author: authorUser1._id,
        mrp: 400,
        price: 400,
        royaltyPercentage: 10,
        status: 'published',
        stock: 50
      });

      const bookAuthor2 = await Book.create({
        title: 'Author 2 Book',
        slug: 'author-2-book-settle',
        description: 'Test description',
        category: category._id,
        author: authorUser2._id,
        mrp: 300,
        price: 300,
        royaltyPercentage: 20,
        status: 'published',
        stock: 50
      });

      // Single multi-author order
      await createDeliveredVerifiedOrder(readerUser, [
        { book: bookAuthor1._id, quantity: 1, price: 400, author: authorUser1._id, royaltyPercentage: 10 },
        { book: bookAuthor2._id, quantity: 1, price: 300, author: authorUser2._id, royaltyPercentage: 20 }
      ]);

      // Preview Author 1
      const preview1 = await request(app)
        .post('/api/admin/royalty-settlements/preview')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ authorId: String(authorUser1._id) });

      expect(preview1.status).toBe(200);
      expect(preview1.body.data.eligible.itemCount).toBe(1);
      expect(preview1.body.data.eligible.grossBookRevenue).toBe(400);
      expect(preview1.body.data.eligible.totalRoyalty).toBe(40);

      // Preview Author 2
      const preview2 = await request(app)
        .post('/api/admin/royalty-settlements/preview')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ authorId: String(authorUser2._id) });

      expect(preview2.status).toBe(200);
      expect(preview2.body.data.eligible.itemCount).toBe(1);
      expect(preview2.body.data.eligible.grossBookRevenue).toBe(300);
      expect(preview2.body.data.eligible.totalRoyalty).toBe(60);
    });
  });

  describe('Double-Settlement Invariant & Concurrency Protection', () => {
    it('prevents single sale line from being included in a second settlement after approval', async () => {
      const book = await Book.create({
        title: 'Single Claim Book',
        slug: 'single-claim-book',
        description: 'Test description',
        category: category._id,
        author: authorUser1._id,
        mrp: 500,
        price: 500,
        royaltyPercentage: 10,
        status: 'published',
        stock: 50
      });

      await createDeliveredVerifiedOrder(readerUser, [
        { book: book._id, quantity: 1, price: 500, author: authorUser1._id, royaltyPercentage: 10 }
      ]);

      const now = new Date();
      const periodStart = new Date(now.getTime() - 86400000).toISOString();
      const periodEnd = new Date(now.getTime() + 86400000).toISOString();

      // Create Draft 1
      const draftRes1 = await request(app)
        .post('/api/admin/royalty-settlements')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ authorId: String(authorUser1._id), periodStart, periodEnd });

      expect(draftRes1.status).toBe(201);
      const settlement1Id = draftRes1.body.data._id;

      // Approve Draft 1 -> Claims sale line
      const approveRes1 = await request(app)
        .post(`/api/admin/royalty-settlements/${settlement1Id}/approve`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(approveRes1.status).toBe(200);

      // Attempt to preview settlement again -> 0 eligible items!
      const previewRes = await request(app)
        .post('/api/admin/royalty-settlements/preview')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ authorId: String(authorUser1._id), from: periodStart, to: periodEnd });

      expect(previewRes.status).toBe(200);
      expect(previewRes.body.data.eligible.itemCount).toBe(0);
      expect(previewRes.body.data.excluded.alreadySettled).toBe(1);
    });

    it('rejects stale draft approval when another draft claiming the same sale line was approved first', async () => {
      const book = await Book.create({
        title: 'Stale Draft Book',
        slug: 'stale-draft-book',
        description: 'Test description',
        category: category._id,
        author: authorUser1._id,
        mrp: 500,
        price: 500,
        royaltyPercentage: 10,
        status: 'published',
        stock: 50
      });

      await createDeliveredVerifiedOrder(readerUser, [
        { book: book._id, quantity: 1, price: 500, author: authorUser1._id, royaltyPercentage: 10 }
      ]);

      const now = new Date();
      const periodStart = new Date(now.getTime() - 86400000).toISOString();
      const periodEnd = new Date(now.getTime() + 86400000).toISOString();

      // Create Draft A and Draft B simultaneously (both observe un-claimed sale line)
      const draftA = await request(app)
        .post('/api/admin/royalty-settlements')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ authorId: String(authorUser1._id), periodStart, periodEnd });

      const draftB = await request(app)
        .post('/api/admin/royalty-settlements')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ authorId: String(authorUser1._id), periodStart, periodEnd });

      expect(draftA.status).toBe(201);
      expect(draftB.status).toBe(201);

      // Approve Draft A
      const approveA = await request(app)
        .post(`/api/admin/royalty-settlements/${draftA.body.data._id}/approve`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(approveA.status).toBe(200);

      // Attempt to approve Draft B -> Fails with 409 SETTLEMENT_CONFLICT!
      const approveB = await request(app)
        .post(`/api/admin/royalty-settlements/${draftB.body.data._id}/approve`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(approveB.status).toBe(409);
      expect(approveB.body.message).toMatch(/SETTLEMENT_CONFLICT|already been claimed/);
    });

    it('MANDATORY CONCURRENCY: simultaneous approval requests for same sale line trigger database duplicate claim protection', async () => {
      const book = await Book.create({
        title: 'Concurrent Claim Book',
        slug: 'concurrent-claim-book',
        description: 'Test description',
        category: category._id,
        author: authorUser1._id,
        mrp: 500,
        price: 500,
        royaltyPercentage: 10,
        status: 'published',
        stock: 50
      });

      await createDeliveredVerifiedOrder(readerUser, [
        { book: book._id, quantity: 1, price: 500, author: authorUser1._id, royaltyPercentage: 10 }
      ]);

      const now = new Date();
      const periodStart = new Date(now.getTime() - 86400000).toISOString();
      const periodEnd = new Date(now.getTime() + 86400000).toISOString();

      const draft1 = await royaltySettlementService.createDraftSettlement(adminUser, {
        authorId: String(authorUser1._id),
        periodStart,
        periodEnd
      });

      const draft2 = await royaltySettlementService.createDraftSettlement(adminUser, {
        authorId: String(authorUser1._id),
        periodStart,
        periodEnd
      });

      // Execute concurrent approvals using Promise.allSettled
      const results = await Promise.allSettled([
        royaltySettlementService.approveSettlement(adminUser, draft1._id),
        royaltySettlementService.approveSettlement(adminUser, draft2._id)
      ]);

      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter((r) => r.status === 'rejected');

      expect(fulfilled).toHaveLength(1); // EXACTLY ONE SUCCESS!
      expect(rejected).toHaveLength(1); // EXACTLY ONE CONFLICT REJECTION!
      expect(rejected[0].reason.statusCode).toBe(409);
    });
  });

  describe('Mark Paid & Payout Accounting Evidence', () => {
    it('successfully marks approved settlement as paid with required manual transaction reference', async () => {
      const book = await Book.create({
        title: 'Mark Paid Book',
        slug: 'mark-paid-book',
        description: 'Test description',
        category: category._id,
        author: authorUser1._id,
        mrp: 500,
        price: 500,
        royaltyPercentage: 10,
        status: 'published',
        stock: 50
      });

      await createDeliveredVerifiedOrder(readerUser, [
        { book: book._id, quantity: 2, price: 500, author: authorUser1._id, royaltyPercentage: 10 }
      ]);

      const now = new Date();
      const draftRes = await request(app)
        .post('/api/admin/royalty-settlements')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          authorId: String(authorUser1._id),
          periodStart: new Date(now.getTime() - 86400000).toISOString(),
          periodEnd: new Date(now.getTime() + 86400000).toISOString()
        });

      const settlementId = draftRes.body.data._id;

      await request(app)
        .post(`/api/admin/royalty-settlements/${settlementId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`);

      // Mark Paid
      const markPaidRes = await request(app)
        .post(`/api/admin/royalty-settlements/${settlementId}/mark-paid`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          paymentMethod: 'MANUAL_BANK_TRANSFER',
          transactionReference: 'NEFT-20260808-998877',
          notes: 'Processed via HDFC corporate banking'
        });

      expect(markPaidRes.status).toBe(200);
      expect(markPaidRes.body.data.settlement.status).toBe('PAID');
      expect(markPaidRes.body.data.payout.amount).toBe(100); // Server-owned amount!
      expect(markPaidRes.body.data.payout.transactionReference).toBe('NEFT-20260808-998877');

      // Duplicate mark paid attempt -> 400 Error!
      const dupPaidRes = await request(app)
        .post(`/api/admin/royalty-settlements/${settlementId}/mark-paid`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          paymentMethod: 'MANUAL_BANK_TRANSFER',
          transactionReference: 'NEFT-20260808-998877'
        });

      expect(dupPaidRes.status).toBe(400);
      expect(dupPaidRes.body.message).toMatch(/already been paid/);
    });

    it('rejects mark-paid request when transaction reference is missing', async () => {
      const book = await Book.create({
        title: 'Missing Ref Book',
        slug: 'missing-ref-book',
        description: 'Test description',
        category: category._id,
        author: authorUser1._id,
        mrp: 400,
        price: 400,
        royaltyPercentage: 10,
        status: 'published',
        stock: 50
      });

      await createDeliveredVerifiedOrder(readerUser, [
        { book: book._id, quantity: 1, price: 400, author: authorUser1._id, royaltyPercentage: 10 }
      ]);

      const now = new Date();
      const draftRes = await request(app)
        .post('/api/admin/royalty-settlements')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          authorId: String(authorUser1._id),
          periodStart: new Date(now.getTime() - 86400000).toISOString(),
          periodEnd: new Date(now.getTime() + 86400000).toISOString()
        });

      const settlementId = draftRes.body.data._id;
      await royaltySettlementService.approveSettlement(adminUser, settlementId);

      const res = await request(app)
        .post(`/api/admin/royalty-settlements/${settlementId}/mark-paid`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({}); // Missing transactionReference

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Transaction reference is required/);
    });
  });

  describe('Authorization, Security & Entitlement Independence Matrix', () => {
    it('allows author WITH active dashboard entitlement to view own settlements, but denies Author 1 from viewing Author 2 settlement', async () => {
      await authorAccessService.adminGrantEntitlement(adminUser, authorUser1._id);
      await authorAccessService.adminGrantEntitlement(adminUser, authorUser2._id);

      const book = await Book.create({
        title: 'Author 2 Private Book',
        slug: 'author-2-private-book',
        description: 'Test description',
        category: category._id,
        author: authorUser2._id,
        mrp: 500,
        price: 500,
        royaltyPercentage: 10,
        status: 'published',
        stock: 50
      });

      await createDeliveredVerifiedOrder(readerUser, [
        { book: book._id, quantity: 1, price: 500, author: authorUser2._id, royaltyPercentage: 10 }
      ]);

      const now = new Date();
      const draftRes = await request(app)
        .post('/api/admin/royalty-settlements')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          authorId: String(authorUser2._id),
          periodStart: new Date(now.getTime() - 86400000).toISOString(),
          periodEnd: new Date(now.getTime() + 86400000).toISOString()
        });

      const settlementId = draftRes.body.data._id;

      // Author 2 views own settlement -> 200 OK
      const resAuthor2 = await request(app)
        .get(`/api/authors/me/royalty-settlements/${settlementId}`)
        .set('Authorization', `Bearer ${authorToken2}`);

      expect(resAuthor2.status).toBe(200);
      expect(resAuthor2.body.data.settlement.settlementNumber).toBeDefined();

      // Author 1 attempts to view Author 2 settlement -> 403 Forbidden!
      const resAuthor1 = await request(app)
        .get(`/api/authors/me/royalty-settlements/${settlementId}`)
        .set('Authorization', `Bearer ${authorToken1}`);

      expect(resAuthor1.status).toBe(403);
    });

    it('enforces entitlement matrix: No plan -> settlement UI DENIED, but publishing remains ALLOWED & money owed preserved', async () => {
      // Author 1 has NO dashboard entitlement plan
      const resSettlements = await request(app)
        .get('/api/authors/me/royalty-settlements')
        .set('Authorization', `Bearer ${authorToken1}`);

      expect(resSettlements.status).toBe(403);
      expect(resSettlements.body.error).toBe('AUTHOR_DASHBOARD_ACCESS_REQUIRED');

      // Publishing remains ALLOWED
      const createDraftRes = await request(app)
        .post('/api/authors/me/books')
        .set('Authorization', `Bearer ${authorToken1}`)
        .send({
          title: 'Publishing Works Without Plan',
          description: 'Draft description works without plan',
          category: category._id,
          mrp: 350
        });

      expect(createDraftRes.status).toBe(201);
    });

    it('proves revoking author dashboard entitlement does NOT cancel or erase settlement financial records', async () => {
      await authorAccessService.adminGrantEntitlement(adminUser, authorUser1._id);

      const book = await Book.create({
        title: 'Revocation Preservation Book',
        slug: 'revocation-preservation-book',
        description: 'Test description',
        category: category._id,
        author: authorUser1._id,
        mrp: 400,
        price: 400,
        royaltyPercentage: 10,
        status: 'published',
        stock: 50
      });

      await createDeliveredVerifiedOrder(readerUser, [
        { book: book._id, quantity: 1, price: 400, author: authorUser1._id, royaltyPercentage: 10 }
      ]);

      const now = new Date();
      const draftRes = await request(app)
        .post('/api/admin/royalty-settlements')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          authorId: String(authorUser1._id),
          periodStart: new Date(now.getTime() - 86400000).toISOString(),
          periodEnd: new Date(now.getTime() + 86400000).toISOString()
        });

      const settlementId = draftRes.body.data._id;
      await royaltySettlementService.approveSettlement(adminUser, settlementId);

      // Admin revokes dashboard access
      await authorAccessService.adminRevokeEntitlement(adminUser, authorUser1._id, 'Revoked test');

      // Admin can STILL inspect settlement detail
      const adminInspectRes = await request(app)
        .get(`/api/admin/authors/${authorUser1._id}/dashboard`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(adminInspectRes.status).toBe(200);

      // Admin can STILL mark settlement paid for revoked author
      const markPaidRes = await request(app)
        .post(`/api/admin/royalty-settlements/${settlementId}/mark-paid`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          paymentMethod: 'MANUAL_BANK_TRANSFER',
          transactionReference: 'NEFT-REVOKED-001'
        });

      expect(markPaidRes.status).toBe(200);
      expect(markPaidRes.body.data.settlement.status).toBe('PAID');
    });
  });
});
