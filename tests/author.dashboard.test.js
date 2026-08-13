const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const express = require('express');

const authorRoutes = require('../src/routes/authorRoutes');
const adminRoutes = require('../src/routes/adminRoutes');
const bookRoutes = require('../src/routes/bookRoutes');

const User = require('../src/models/User');
const Book = require('../src/models/Book');
const Category = require('../src/models/Category');
const Order = require('../src/models/Order');
const Payment = require('../src/models/Payment');
const PaymentLedger = require('../src/models/PaymentLedger');
const AuthorAccessPlan = require('../src/models/AuthorAccessPlan');
const AuthorAccessPurchase = require('../src/models/AuthorAccessPurchase');
const AuthorAccessEntitlement = require('../src/models/AuthorAccessEntitlement');

const authorAccessService = require('../src/services/authorAccessService');
const orderPaymentBridgeService = require('../src/services/orderPaymentBridgeService');
const { registerSubscribers } = require('../src/events/registerSubscribers');
const { generateToken } = require('../src/utils/tokenUtils');

jest.setTimeout(60000);
process.env.MONGOMS_DOWNLOAD_DIR = 'node_modules/.cache/mongodb-binaries';

describe('Phase 5: Production Author Dashboard Analytics & Royalty Read Model', () => {
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

  let category;
  let activePlan;

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
    app.use('/api/books', bookRoutes);
    app.use((err, req, res, next) => {
      res.status(err.statusCode || err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error'
      });
    });

    await Promise.all([
      User.syncIndexes(),
      Book.syncIndexes(),
      Category.syncIndexes(),
      Order.syncIndexes(),
      Payment.syncIndexes(),
      PaymentLedger.syncIndexes(),
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
      Order.deleteMany({}),
      Payment.deleteMany({}),
      PaymentLedger.collection.deleteMany({}),
      AuthorAccessPlan.deleteMany({}),
      AuthorAccessPurchase.deleteMany({}),
      AuthorAccessEntitlement.deleteMany({})
    ]);

    readerUser = await User.create({
      name: 'Customer Reader',
      email: 'customer@example.com',
      password: 'password123',
      role: 'reader'
    });

    authorUser1 = await User.create({
      name: 'Author One',
      email: 'author1@example.com',
      password: 'password123',
      role: 'author'
    });

    authorUser2 = await User.create({
      name: 'Author Two',
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

    category = await Category.create({
      name: 'Technology',
      slug: 'technology',
      description: 'Tech books',
      isActive: true
    });

    activePlan = await authorAccessService.adminConfigurePlan(adminUser, {
      name: 'Author Pro Dashboard',
      amount: 2999,
      currency: 'INR',
      status: 'ACTIVE'
    });
  });

  describe('Financial Calculations & Royalty Snapshots', () => {
    it('calculates verified sales and royalties accurately using purchase-time snapshots', async () => {
      // Grant Author 1 dashboard access
      await authorAccessService.adminGrantEntitlement(adminUser, authorUser1._id);

      const book = await Book.create({
        title: 'Mastering Node.js',
        slug: 'mastering-node-js',
        description: 'Deep dive into backend node',
        category: category._id,
        author: authorUser1._id,
        mrp: 500,
        price: 500,
        royaltyPercentage: 10,
        status: 'published',
        stock: 50
      });

      // Create a verified purchase order for 2 copies of book
      const { order, payment } = await createVerifiedOrder(readerUser, [
        { book: book._id, quantity: 2, price: 500, author: authorUser1._id, royaltyPercentage: 10 }
      ]);

      const res = await request(app)
        .get('/api/authors/me/dashboard')
        .set('Authorization', `Bearer ${authorToken1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.sales.unitsSold).toBe(2);
      expect(res.body.data.sales.grossBookRevenue).toBe(1000);
      expect(res.body.data.royalties.accrued).toBe(100); // 10% of 1000 = 100
      expect(res.body.data.topBooks[0].title).toBe('Mastering Node.js');
    });

    it('proves royalty percentage change invariance (historical sales preserve historical snapshot)', async () => {
      await authorAccessService.adminGrantEntitlement(adminUser, authorUser1._id);

      const book = await Book.create({
        title: 'Evolving Royalty Book',
        slug: 'evolving-royalty-book',
        description: 'Book with changing royalty',
        category: category._id,
        author: authorUser1._id,
        mrp: 500,
        price: 500,
        royaltyPercentage: 10, // 10% at launch
        status: 'published',
        stock: 100
      });

      // Sale 1: Purchased when royalty was 10%
      await createVerifiedOrder(readerUser, [
        { book: book._id, quantity: 1, price: 500, author: authorUser1._id, royaltyPercentage: 10 }
      ]);

      // Admin updates Book.royaltyPercentage to 20%
      book.royaltyPercentage = 20;
      await book.save();

      // Sale 2: Purchased when royalty was 20%
      await createVerifiedOrder(readerUser, [
        { book: book._id, quantity: 1, price: 500, author: authorUser1._id, royaltyPercentage: 20 }
      ]);

      const res = await request(app)
        .get('/api/authors/me/royalties')
        .set('Authorization', `Bearer ${authorToken1}`);

      expect(res.status).toBe(200);
      expect(res.body.data.accruedTotal).toBe(150); // Sale 1 (50) + Sale 2 (100) = 150
      expect(res.body.data.history).toHaveLength(2);
      
      const sale1 = res.body.data.history.find((h) => h.royaltyPercentageSnapshot === 10);
      const sale2 = res.body.data.history.find((h) => h.royaltyPercentageSnapshot === 20);

      expect(sale1.royaltyAmount).toBe(50);
      expect(sale2.royaltyAmount).toBe(100);
    });

    it('CRITICAL: legacy order item without royalty snapshot MUST NOT use current Book.royaltyPercentage as historical rate', async () => {
      await authorAccessService.adminGrantEntitlement(adminUser, authorUser1._id);

      // Book created with current royalty = 20%
      const book = await Book.create({
        title: 'Legacy Rate Book',
        slug: 'legacy-rate-book',
        description: 'Book for legacy test',
        category: category._id,
        author: authorUser1._id,
        mrp: 500,
        price: 500,
        royaltyPercentage: 20, // Current book rate is 20%
        status: 'published',
        stock: 50
      });

      // Legacy order created WITHOUT royaltyPercentage snapshot on order item
      const legacyOrder = await Order.create({
        orderNumber: 'HM-LEGACY-001',
        user: readerUser._id,
        items: [
          {
            book: book._id,
            author: authorUser1._id,
            quantity: 1,
            price: 500
            // royaltyPercentage is omitted (missing snapshot)
          }
        ],
        subtotal: 500,
        tax: 0,
        shippingPrice: 0,
        totalPrice: 500,
        isPaid: true,
        status: 'PROCESSING',
        shippingAddress: { fullName: 'Test', addressLine1: 'Test', city: 'City', postalCode: '1000', country: 'IN' }
      });

      await Payment.create({
        user: readerUser._id,
        amount: 500,
        purpose: 'ORDER_PURCHASE',
        subjectType: 'ORDER',
        subjectId: legacyOrder._id,
        order: legacyOrder._id,
        status: 'VERIFIED',
        provider: 'manual_upi'
      });

      // Check Royalty History
      const royaltiesRes = await request(app)
        .get('/api/authors/me/royalties')
        .set('Authorization', `Bearer ${authorToken1}`);

      expect(royaltiesRes.status).toBe(200);
      expect(royaltiesRes.body.data.dataStatus).toBe('PARTIAL');
      expect(royaltiesRes.body.data.unresolvedLegacySales).toBe(1);

      const legacyRow = royaltiesRes.body.data.history.find((h) => h.orderNumber === 'HM-LEGACY-001');
      expect(legacyRow).toBeDefined();
      expect(legacyRow.grossBookRevenue).toBe(500); // Immutable price & qty preserve gross revenue!
      expect(legacyRow.royaltyPercentageSnapshot).toBeNull(); // MUST NOT BE 20!
      expect(legacyRow.royaltyAmount).toBeNull(); // MUST NOT BE 100!
      expect(legacyRow.royaltyStatus).toBe('HISTORICAL_RATE_UNAVAILABLE');

      // Check Dashboard Summary
      const summaryRes = await request(app)
        .get('/api/authors/me/dashboard')
        .set('Authorization', `Bearer ${authorToken1}`);

      expect(summaryRes.status).toBe(200);
      expect(summaryRes.body.data.royalties.dataStatus).toBe('PARTIAL');
      expect(summaryRes.body.data.royalties.unresolvedLegacySales).toBe(1);
      expect(summaryRes.body.data.royalties.accruedKnown).toBe(0); // Legacy unknown not added to known total!
    });

    it('handles known zero percent royalty snapshot (0%) correctly as calculated ₹0', async () => {
      await authorAccessService.adminGrantEntitlement(adminUser, authorUser1._id);

      const book = await Book.create({
        title: 'Zero Royalty Book',
        slug: 'zero-royalty-book',
        description: 'Book with 0% royalty',
        category: category._id,
        author: authorUser1._id,
        mrp: 300,
        price: 300,
        royaltyPercentage: 0, // 0% royalty
        status: 'published',
        stock: 50
      });

      await createVerifiedOrder(readerUser, [
        { book: book._id, quantity: 2, price: 300, author: authorUser1._id, royaltyPercentage: 0 }
      ]);

      const res = await request(app)
        .get('/api/authors/me/royalties')
        .set('Authorization', `Bearer ${authorToken1}`);

      expect(res.status).toBe(200);
      const zeroRow = res.body.data.history.find((h) => h.bookId === String(book._id));
      expect(zeroRow).toBeDefined();
      expect(zeroRow.royaltyPercentageSnapshot).toBe(0);
      expect(zeroRow.royaltyAmount).toBe(0); // 0 is calculated, NOT null!
      expect(zeroRow.royaltyStatus).toBe('CALCULATED');
    });
  });

  describe('Unverified Sales & Multiple Payment Attempts Isolation', () => {
    it('excludes pending, cancelled, or unverified orders from dashboard stats', async () => {
      await authorAccessService.adminGrantEntitlement(adminUser, authorUser1._id);

      const book = await Book.create({
        title: 'Unverified Order Book',
        slug: 'unverified-order-book',
        description: 'Unverified order book description',
        category: category._id,
        author: authorUser1._id,
        mrp: 400,
        price: 400,
        royaltyPercentage: 15,
        status: 'published',
        stock: 50
      });

      // Order 1: Unpaid pending order
      await Order.create({
        orderNumber: 'HM-PENDING-001',
        user: readerUser._id,
        items: [{ book: book._id, quantity: 2, price: 400, author: authorUser1._id, royaltyPercentage: 15 }],
        subtotal: 800,
        tax: 0,
        shippingPrice: 0,
        totalPrice: 800,
        isPaid: false,
        status: 'PENDING',
        shippingAddress: { fullName: 'Test', addressLine1: 'Test', city: 'City', postalCode: '1000', country: 'IN' }
      });

      // Order 2: Cancelled order
      await Order.create({
        orderNumber: 'HM-CANCELLED-002',
        user: readerUser._id,
        items: [{ book: book._id, quantity: 3, price: 400, author: authorUser1._id, royaltyPercentage: 15 }],
        subtotal: 1200,
        tax: 0,
        shippingPrice: 0,
        totalPrice: 1200,
        isPaid: false,
        status: 'CANCELLED',
        shippingAddress: { fullName: 'Test', addressLine1: 'Test', city: 'City', postalCode: '1000', country: 'IN' }
      });

      const res = await request(app)
        .get('/api/authors/me/dashboard')
        .set('Authorization', `Bearer ${authorToken1}`);

      expect(res.status).toBe(200);
      expect(res.body.data.sales.unitsSold).toBe(0);
      expect(res.body.data.sales.grossBookRevenue).toBe(0);
      expect(res.body.data.royalties.accrued).toBe(0);
    });

    it('prevents double-counting when single order has multiple payment attempts', async () => {
      await authorAccessService.adminGrantEntitlement(adminUser, authorUser1._id);

      const book = await Book.create({
        title: 'Single Order Multiple Payments',
        slug: 'single-order-multiple-payments',
        description: 'Multiple payments description',
        category: category._id,
        author: authorUser1._id,
        mrp: 600,
        price: 600,
        royaltyPercentage: 10,
        status: 'published',
        stock: 50
      });

      const order = await Order.create({
        orderNumber: 'HM-MULTI-PAY-01',
        user: readerUser._id,
        items: [{ book: book._id, quantity: 1, price: 600, author: authorUser1._id, royaltyPercentage: 10 }],
        subtotal: 600,
        tax: 0,
        shippingPrice: 0,
        totalPrice: 600,
        isPaid: true,
        status: 'PROCESSING',
        shippingAddress: { fullName: 'Test', addressLine1: 'Test', city: 'City', postalCode: '1000', country: 'IN' }
      });

      // Failed Payment attempt 1
      await Payment.create({
        user: readerUser._id,
        amount: 600,
        purpose: 'ORDER_PURCHASE',
        subjectType: 'ORDER',
        subjectId: order._id,
        order: order._id,
        status: 'FAILED',
        provider: 'manual_upi'
      });

      // Verified Payment attempt 2
      await Payment.create({
        user: readerUser._id,
        amount: 600,
        purpose: 'ORDER_PURCHASE',
        subjectType: 'ORDER',
        subjectId: order._id,
        order: order._id,
        status: 'VERIFIED',
        provider: 'manual_upi'
      });

      const res = await request(app)
        .get('/api/authors/me/dashboard')
        .set('Authorization', `Bearer ${authorToken1}`);

      expect(res.status).toBe(200);
      expect(res.body.data.sales.unitsSold).toBe(1); // Counted ONCE
      expect(res.body.data.sales.grossBookRevenue).toBe(600);
      expect(res.body.data.royalties.accrued).toBe(60);
    });
  });

  describe('Multi-Author Orders & Shipping Charge Exclusion', () => {
    it('correctly splits multi-author orders and excludes shipping charges from book revenue', async () => {
      await authorAccessService.adminGrantEntitlement(adminUser, authorUser1._id);
      await authorAccessService.adminGrantEntitlement(adminUser, authorUser2._id);

      const bookAuthor1 = await Book.create({
        title: 'Author 1 Masterpiece',
        slug: 'author-1-masterpiece',
        description: 'Author 1 book description',
        category: category._id,
        author: authorUser1._id,
        mrp: 400,
        price: 400,
        royaltyPercentage: 10,
        status: 'published',
        stock: 50
      });

      const bookAuthor2 = await Book.create({
        title: 'Author 2 Bestseller',
        slug: 'author-2-bestseller',
        description: 'Author 2 book description',
        category: category._id,
        author: authorUser2._id,
        mrp: 300,
        price: 300,
        royaltyPercentage: 15,
        status: 'published',
        stock: 50
      });

      // Order containing books from BOTH Author 1 (400) and Author 2 (300) + Shipping (50) = Total (750)
      await Order.create({
        orderNumber: 'HM-MULTI-AUTHOR-01',
        user: readerUser._id,
        items: [
          { book: bookAuthor1._id, quantity: 1, price: 400, author: authorUser1._id, royaltyPercentage: 10 },
          { book: bookAuthor2._id, quantity: 1, price: 300, author: authorUser2._id, royaltyPercentage: 15 }
        ],
        subtotal: 700,
        tax: 0,
        shippingPrice: 50, // Shipping charge should NOT be included in author book revenue
        totalPrice: 750,
        isPaid: true,
        status: 'PROCESSING',
        shippingAddress: { fullName: 'Test', addressLine1: 'Test', city: 'City', postalCode: '1000', country: 'IN' }
      });

      // Check Author 1 Dashboard
      const resAuthor1 = await request(app)
        .get('/api/authors/me/dashboard')
        .set('Authorization', `Bearer ${authorToken1}`);

      expect(resAuthor1.status).toBe(200);
      expect(resAuthor1.body.data.sales.unitsSold).toBe(1);
      expect(resAuthor1.body.data.sales.grossBookRevenue).toBe(400); // Excludes shipping & Author 2 book!
      expect(resAuthor1.body.data.royalties.accrued).toBe(40); // 10% of 400 = 40

      // Check Author 2 Dashboard
      const resAuthor2 = await request(app)
        .get('/api/authors/me/dashboard')
        .set('Authorization', `Bearer ${authorToken2}`);

      expect(resAuthor2.status).toBe(200);
      expect(resAuthor2.body.data.sales.unitsSold).toBe(1);
      expect(resAuthor2.body.data.sales.grossBookRevenue).toBe(300); // Excludes shipping & Author 1 book!
      expect(resAuthor2.body.data.royalties.accrued).toBe(45); // 15% of 300 = 45
    });
  });

  describe('Security, Entitlement Enforcement & Privacy', () => {
    it('prevents Author 1 from accessing Author 2 private stats (/api/authors/:id/stats)', async () => {
      await authorAccessService.adminGrantEntitlement(adminUser, authorUser1._id);
      await authorAccessService.adminGrantEntitlement(adminUser, authorUser2._id);

      const res = await request(app)
        .get(`/api/authors/${authorUser2._id}/stats`)
        .set('Authorization', `Bearer ${authorToken1}`);

      expect(res.status).toBe(403);
      expect(res.body.message || res.body.error).toMatch(/Cannot access another author dashboard|Not authorized/);
    });

    it('allows Admin to inspect any author dashboard without purchasing a plan', async () => {
      // Author 1 has NO plan entitlement
      const adminRes = await request(app)
        .get(`/api/admin/authors/${authorUser1._id}/dashboard`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(adminRes.status).toBe(200);
      expect(adminRes.body.success).toBe(true);
      expect(adminRes.body.data.books).toBeDefined();
    });

    it('enforces entitlement matrix: No plan -> publishing ALLOWED, dashboard DENIED', async () => {
      // Author has NO plan
      const dashboardRes = await request(app)
        .get('/api/authors/me/dashboard')
        .set('Authorization', `Bearer ${authorToken1}`);

      expect(dashboardRes.status).toBe(403);
      expect(dashboardRes.body.error).toBe('AUTHOR_DASHBOARD_ACCESS_REQUIRED');

      // Publishing remains ALLOWED
      const createDraftRes = await request(app)
        .post('/api/authors/me/books')
        .set('Authorization', `Bearer ${authorToken1}`)
        .send({
          title: 'Publishing Works Fine Without Plan',
          description: 'Draft description works fine',
          category: category._id,
          mrp: 350
        });

      expect(createDraftRes.status).toBe(201);
    });

    it('verifies privacy: royalty history omits customer email, phone, UTR, and address', async () => {
      await authorAccessService.adminGrantEntitlement(adminUser, authorUser1._id);

      const book = await Book.create({
        title: 'Privacy Verification Book',
        slug: 'privacy-verification-book',
        description: 'Privacy description',
        category: category._id,
        author: authorUser1._id,
        mrp: 450,
        price: 450,
        royaltyPercentage: 10,
        status: 'published',
        stock: 50
      });

      await createVerifiedOrder(readerUser, [
        { book: book._id, quantity: 1, price: 450, author: authorUser1._id, royaltyPercentage: 10 }
      ]);

      const res = await request(app)
        .get('/api/authors/me/royalties')
        .set('Authorization', `Bearer ${authorToken1}`);

      expect(res.status).toBe(200);
      const transaction = res.body.data.history[0];

      expect(transaction.customerEmail).toBeUndefined();
      expect(transaction.shippingAddress).toBeUndefined();
      expect(transaction.utr).toBeUndefined();
      expect(transaction.orderNumber).toBeDefined();
      expect(transaction.grossBookRevenue).toBe(450);
      expect(transaction.royaltyAmount).toBe(45);
    });
  });
});

async function createVerifiedOrder(user, items) {
  const subtotal = items.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const order = await Order.create({
    orderNumber: `HM-TEST-${Math.floor(Math.random() * 100000)}`,
    user: user._id,
    items,
    subtotal,
    tax: 0,
    shippingPrice: 0,
    totalPrice: subtotal,
    isPaid: true,
    status: 'PROCESSING',
    shippingAddress: {
      fullName: 'John Customer',
      addressLine1: '123 Main St',
      city: 'Mumbai',
      postalCode: '400001',
      country: 'IN'
    }
  });

  const payment = await Payment.create({
    user: user._id,
    amount: subtotal,
    purpose: 'ORDER_PURCHASE',
    subjectType: 'ORDER',
    subjectId: order._id,
    order: order._id,
    status: 'VERIFIED',
    provider: 'manual_upi'
  });

  return { order, payment };
}
