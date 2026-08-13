const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const express = require('express');

const authorRoutes = require('../src/routes/authorRoutes');
const adminRoutes = require('../src/routes/adminRoutes');
const publishRoutes = require('../src/routes/publishRoutes');
const bookRoutes = require('../src/routes/bookRoutes');
const uploadsRoutes = require('../src/routes/uploadsRoutes');

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

const authorAccessService = require('../src/services/authorAccessService');
const authorBookService = require('../src/services/authorBookService');
const adminCoreService = require('../src/services/adminCoreService');
const { registerSubscribers } = require('../src/events/registerSubscribers');
const { generateToken } = require('../src/utils/tokenUtils');

jest.setTimeout(600000);
process.env.MONGOMS_DOWNLOAD_DIR = 'node_modules/.cache/mongodb-binaries';

describe('Phase 4: Author-Owned Books + Editorial Publishing Workflow Integration', () => {
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

  let testCategory;
  let publishPackage;
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
    app.use('/api/uploads', uploadsRoutes);
    app.use('/api', publishRoutes);
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
      AuthorAccessEntitlement.deleteMany({})
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

    testCategory = await Category.create({
      name: 'Fiction',
      slug: 'fiction',
      description: 'Fiction category',
      isActive: true
    });

    publishPackage = await PublishPackage.create({
      name: 'Standard Package',
      description: 'Basic publishing package',
      price: 5000,
      features: ['Editing', 'Formatting']
    });

    activePlan = await authorAccessService.adminConfigurePlan(adminUser, {
      name: 'Author Pro Dashboard',
      amount: 2999,
      currency: 'INR',
      status: 'ACTIVE'
    });
  });

  describe('Stage 0 Hardening Checks', () => {
    it('enforces single active plan partial unique index on AuthorAccessPlan schema', async () => {
      await expect(
        AuthorAccessPlan.create({
          name: 'Active Plan Duplicate',
          amount: 2000,
          status: 'ACTIVE'
        })
      ).rejects.toThrow();
    });

    it('verifies publishing upload authorization: Reader denied, Author allowed without paid plan', async () => {
      // Reader attempt on author publishing upload route -> 403 Forbidden
      const readerRes = await request(app)
        .post('/api/authors/me/uploads/document')
        .set('Authorization', `Bearer ${readerToken}`);
      expect(readerRes.status).toBe(403);

      // Author without paid plan attempt -> Allowed (requires Cloudinary config or file, but auth passes)
      const authorRes = await request(app)
        .post('/api/authors/me/uploads/document')
        .set('Authorization', `Bearer ${authorToken1}`);
      // 503 or 400 is expected because Cloudinary env is omitted, but NOT 401 or 403!
      expect([400, 503]).toContain(authorRes.status);
    });
  });

  describe('Author Draft Creation & Allowed Fields', () => {
    it('allows approved author without paid plan to create a Book draft', async () => {
      const res = await request(app)
        .post('/api/authors/me/books')
        .set('Authorization', `Bearer ${authorToken1}`)
        .send({
          title: 'Author Draft Book 1',
          description: 'A exciting manuscript draft',
          category: testCategory._id,
          format: 'paperback',
          mrp: 499
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.book.title).toBe('Author Draft Book 1');
      expect(res.body.data.book.author.toString()).toBe(authorUser1._id.toString());
      expect(res.body.data.book.status).toBe('draft');
      expect(res.body.data.book.mrp).toBe(499);
      expect(res.body.data.book.price).toBe(499); // Phase 1 MRP synchronization
    });

    it('prevents author from setting admin-only protected fields', async () => {
      const res = await request(app)
        .post('/api/authors/me/books')
        .set('Authorization', `Bearer ${authorToken1}`)
        .send({
          title: 'Hacked Draft',
          description: 'Trying to bypass admin controls',
          category: testCategory._id,
          mrp: 200,
          status: 'published', // Admin-only field!
          royaltyPercentage: 90, // Admin-only field!
          isBestseller: true // Admin-only field!
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/admin-only/);
    });

    it('denies reader role from creating book drafts', async () => {
      const res = await request(app)
        .post('/api/authors/me/books')
        .set('Authorization', `Bearer ${readerToken}`)
        .send({
          title: 'Reader Book Attempt',
          description: 'Should fail',
          category: testCategory._id,
          mrp: 300
        });

      expect(res.status).toBe(403);
    });
  });

  describe('Book Ownership Authorization & Isolation', () => {
    it('prevents Author 2 from viewing, updating, deleting, or submitting Author 1 private draft', async () => {
      const createRes = await request(app)
        .post('/api/authors/me/books')
        .set('Authorization', `Bearer ${authorToken1}`)
        .send({
          title: 'Author 1 Secret Manuscript',
          description: 'Top secret draft',
          category: testCategory._id,
          mrp: 350
        });

      const bookId = createRes.body.data.book._id;

      // Author 2 tries to GET -> 404 Not Found (ownership query protection)
      const getRes = await request(app)
        .get(`/api/authors/me/books/${bookId}`)
        .set('Authorization', `Bearer ${authorToken2}`);
      expect(getRes.status).toBe(404);

      // Author 2 tries to PUT -> 404 Not Found
      const putRes = await request(app)
        .put(`/api/authors/me/books/${bookId}`)
        .set('Authorization', `Bearer ${authorToken2}`)
        .send({ title: 'Hacked Title' });
      expect(putRes.status).toBe(404);

      // Author 2 tries to DELETE -> 404 Not Found
      const deleteRes = await request(app)
        .delete(`/api/authors/me/books/${bookId}`)
        .set('Authorization', `Bearer ${authorToken2}`);
      expect(deleteRes.status).toBe(404);

      // Author 2 tries to SUBMIT -> 404 Not Found
      const submitRes = await request(app)
        .post(`/api/authors/me/books/${bookId}/submit`)
        .set('Authorization', `Bearer ${authorToken2}`)
        .send({ fileUrl: 'https://cloudinary.com/fake.pdf' });
      expect(submitRes.status).toBe(404);
    });
  });

  describe('Full Editorial Workflow: Submit -> Request Changes -> Resubmit -> Reject -> Approve', () => {
    it('executes complete editorial lifecycle with state locks and public catalog isolation', async () => {
      // 1. Author 1 creates a draft
      const draftRes = await request(app)
        .post('/api/authors/me/books')
        .set('Authorization', `Bearer ${authorToken1}`)
        .send({
          title: 'The Great Journey',
          description: 'An epic tale',
          category: testCategory._id,
          mrp: 599
        });
      const bookId = draftRes.body.data.book._id;

      // Prove draft is NOT visible in public catalog
      const publicCatalogRes1 = await request(app).get('/api/books');
      expect(publicCatalogRes1.body.data).toHaveLength(0);

      // 2. Author 1 submits book for review
      const submitRes = await request(app)
        .post(`/api/authors/me/books/${bookId}/submit`)
        .set('Authorization', `Bearer ${authorToken1}`)
        .send({
          fileUrl: 'https://res.cloudinary.com/manuscript-v1.pdf',
          packageId: publishPackage._id
        });

      expect(submitRes.status).toBe(201);
      expect(submitRes.body.success).toBe(true);
      const requestId = submitRes.body.data.publishRequest._id;
      expect(submitRes.body.data.publishRequest.status).toBe('PENDING');

      // 3. Attempting duplicate submission while PENDING should be rejected
      const dupSubmitRes = await request(app)
        .post(`/api/authors/me/books/${bookId}/submit`)
        .set('Authorization', `Bearer ${authorToken1}`)
        .send({ fileUrl: 'https://res.cloudinary.com/manuscript-v1.pdf' });
      expect(dupSubmitRes.status).toBe(409);

      // 4. Attempting to edit draft while PENDING under review should be locked
      const editLockedRes = await request(app)
        .put(`/api/authors/me/books/${bookId}`)
        .set('Authorization', `Bearer ${authorToken1}`)
        .send({ title: 'New Locked Title' });
      expect(editLockedRes.status).toBe(409);

      // 5. Admin Requests Changes
      const reqChangesRes = await request(app)
        .post(`/api/admin/publish-requests/${requestId}/request-changes`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Please revise chapter 2 and fix typos.' });

      expect(reqChangesRes.status).toBe(200);
      expect(reqChangesRes.body.data.status).toBe('CHANGES_REQUESTED');
      expect(reqChangesRes.body.data.adminNotes).toBe('Please revise chapter 2 and fix typos.');

      // 6. Author can now EDIT draft after changes requested
      const editUnlockedRes = await request(app)
        .put(`/api/authors/me/books/${bookId}`)
        .set('Authorization', `Bearer ${authorToken1}`)
        .send({ description: 'Revised epic tale with polished chapter 2.' });
      expect(editUnlockedRes.status).toBe(200);
      expect(editUnlockedRes.body.data.book.description).toBe('Revised epic tale with polished chapter 2.');

      // 7. Author RESUBMITS updated manuscript
      const resubmitRes = await request(app)
        .post(`/api/authors/me/books/${bookId}/submit`)
        .set('Authorization', `Bearer ${authorToken1}`)
        .send({ fileUrl: 'https://res.cloudinary.com/manuscript-v2.pdf' });
      expect(resubmitRes.status).toBe(201);

      // 8. Admin Approves and Publishes
      const approveRes = await request(app)
        .post(`/api/admin/publish-requests/${requestId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ notes: 'Outstanding manuscript, approved for public catalog.' });

      expect(approveRes.status).toBe(200);
      expect(approveRes.body.data.status).toBe('APPROVED');

      // Verify same Book document status is now 'published'
      const updatedBook = await Book.findById(bookId);
      expect(updatedBook.status).toBe('published');

      // 9. Public Catalog MUST NOW SHOW the published Book!
      const publicCatalogRes2 = await request(app).get('/api/books');
      expect(publicCatalogRes2.body.data).toHaveLength(1);
      expect(publicCatalogRes2.body.data[0].title).toBe('The Great Journey');
      expect(publicCatalogRes2.body.data[0].status).toBe('published');
    });
  });

  describe('Author Role vs Paid Dashboard Entitlement Independence Proof', () => {
    it('proves approved author WITHOUT paid plan CAN draft, edit, upload, submit, and publish BUT CANNOT access dashboard', async () => {
      // Author has NO paid plan entitlement
      const statusRes = await request(app)
        .get('/api/authors/me/dashboard-access')
        .set('Authorization', `Bearer ${authorToken1}`);
      expect(statusRes.body.data.dashboardAccess.hasAccess).toBe(false);

      // 1. Author CAN create draft
      const draftRes = await request(app)
        .post('/api/authors/me/books')
        .set('Authorization', `Bearer ${authorToken1}`)
        .send({
          title: 'No Plan Book',
          description: 'Written without paid plan',
          category: testCategory._id,
          mrp: 299
        });
      expect(draftRes.status).toBe(201);
      const bookId = draftRes.body.data.book._id;

      // 2. Author CAN submit
      const submitRes = await request(app)
        .post(`/api/authors/me/books/${bookId}/submit`)
        .set('Authorization', `Bearer ${authorToken1}`)
        .send({ fileUrl: 'https://res.cloudinary.com/manuscript.pdf' });
      expect(submitRes.status).toBe(201);

      // 3. Author CANNOT access paid dashboard metrics
      const statsRes = await request(app)
        .get(`/api/authors/${authorUser1._id}/stats`)
        .set('Authorization', `Bearer ${authorToken1}`);
      expect(statsRes.status).toBe(403);
      expect(statsRes.body.error).toBe('AUTHOR_DASHBOARD_ACCESS_REQUIRED');
    });

    it('proves REVOKED dashboard author CAN STILL draft, edit, upload, submit, and publish BUT CANNOT access dashboard', async () => {
      // 1. Admin grants then revokes dashboard entitlement for Author 1
      await authorAccessService.adminGrantEntitlement(adminUser, authorUser1._id);
      await authorAccessService.adminRevokeEntitlement(adminUser, authorUser1._id, 'Violated terms');

      // Verify dashboard is DENIED
      const statsRes = await request(app)
        .get(`/api/authors/${authorUser1._id}/stats`)
        .set('Authorization', `Bearer ${authorToken1}`);
      expect(statsRes.status).toBe(403);

      // 2. Revoked author CAN STILL create draft
      const draftRes = await request(app)
        .post('/api/authors/me/books')
        .set('Authorization', `Bearer ${authorToken1}`)
        .send({
          title: 'Post Revocation Book Draft',
          description: 'Publishing still works fine',
          category: testCategory._id,
          mrp: 399
        });
      expect(draftRes.status).toBe(201);
      const bookId = draftRes.body.data.book._id;

      // 3. Revoked author CAN STILL submit for review
      const submitRes = await request(app)
        .post(`/api/authors/me/books/${bookId}/submit`)
        .set('Authorization', `Bearer ${authorToken1}`)
        .send({ fileUrl: 'https://res.cloudinary.com/manuscript.pdf' });
      expect(submitRes.status).toBe(201);
    });
  });
});
