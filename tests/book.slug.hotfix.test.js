process.env.JWT_SECRET = 'test_secret';
process.env.NODE_ENV = 'test';
process.env.MONGOMS_DOWNLOAD_DIR = 'node_modules/.cache/mongodb-binaries';

const request = require('supertest');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const app = require('../server');
const Book = require('../src/models/Book');
const Category = require('../src/models/Category');
const User = require('../src/models/User');
const { AdminCoreService } = require('../src/services/adminCoreService');
const { buildBookSlugMigrationPlan, applyBookSlugMigration } = require('../scripts/bookSlugMigration');

jest.setTimeout(600000);

let mongoServer;
let admin;
let author;
let category;
let adminToken;

const tokenFor = (user) => jwt.sign({ id: user._id }, process.env.JWT_SECRET);

const adminPayload = (overrides = {}) => ({
  title: 'Enterprise Publishing Systems',
  description: 'A practical book about modern publishing operations.',
  category: category._id.toString(),
  author: author._id.toString(),
  mrp: 499,
  royaltyPercentage: 10,
  coverImage: 'https://example.com/cover.jpg',
  stock: 100,
  status: 'published',
  discountPrice: 399,
  isFeatured: true,
  isbn: '9781234567890',
  pages: 320,
  format: 'paperback',
  ...overrides
});

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create({ instance: { launchTimeout: 60000 } });
  await mongoose.connect(mongoServer.getUri());
  await Promise.all([User.syncIndexes(), Book.syncIndexes(), Category.syncIndexes()]);
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

beforeEach(async () => {
  await Promise.all([User.deleteMany({}), Book.deleteMany({}), Category.deleteMany({})]);
  admin = await User.create({ name: 'Admin', email: 'admin-slug@example.com', password: 'password123', role: 'admin' });
  author = await User.create({ name: 'Author', email: 'author-slug@example.com', password: 'password123', role: 'author' });
  category = await Category.create({ name: 'Slug Category', slug: 'slug-category', active: true, isActive: true });
  adminToken = tokenFor(admin);
});

test('admin create without slug succeeds with canonical server-generated slug and preserves MRP', async () => {
  const res = await request(app)
    .post('/api/admin/books')
    .set('Authorization', `Bearer ${adminToken}`)
    .send(adminPayload())
    .expect(201);

  expect(res.body.success).toBe(true);
  expect(res.body.data.slug).toBe('enterprise-publishing-systems');
  expect(res.body.data.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  expect(res.body.data.mrp).toBe(499);
  expect(res.body.data.price).toBe(499);

  const persisted = await Book.findById(res.body.data._id).lean();
  expect(persisted.slug).toBe('enterprise-publishing-systems');
  expect(persisted.slug).not.toBeNull();
});

test('duplicate admin titles generate unique slugs without requiring frontend slug input', async () => {
  const first = await request(app)
    .post('/api/admin/books')
    .set('Authorization', `Bearer ${adminToken}`)
    .send(adminPayload({ isbn: '9781234567890' }))
    .expect(201);

  const second = await request(app)
    .post('/api/admin/books')
    .set('Authorization', `Bearer ${adminToken}`)
    .send(adminPayload({ isbn: '9781234567891' }))
    .expect(201);

  expect(first.body.data.slug).toBe('enterprise-publishing-systems');
  expect(second.body.data.slug).toBe('enterprise-publishing-systems-2');
  expect(second.body.data.slug).not.toBe(first.body.data.slug);
});

test('author draft creation uses the same canonical slug system', async () => {
  const authorToken = tokenFor(author);

  const res = await request(app)
    .post('/api/authors/me/books')
    .set('Authorization', `Bearer ${authorToken}`)
    .send({
      title: 'Enterprise Publishing Systems',
      description: 'Author draft using canonical slugs',
      category: category._id,
      mrp: 499
    })
    .expect(201);

  expect(res.body.data.book.slug).toBe('enterprise-publishing-systems');
  expect(res.body.data.book.status).toBe('draft');
  expect(res.body.data.book.mrp).toBe(499);
  expect(res.body.data.book.price).toBe(499);
});

test('Book model rejects null, empty, and missing slugs for lower-level writes', async () => {
  const base = {
    title: 'Invalid Slug Book',
    description: 'Invalid slug should not persist',
    author: author._id,
    category: category._id,
    mrp: 100,
    price: 100
  };

  await expect(Book.create({ ...base })).rejects.toThrow(/slug/i);
  await expect(Book.create({ ...base, slug: null })).rejects.toThrow(/slug/i);
  await expect(Book.create({ ...base, slug: '' })).rejects.toThrow(/slug/i);

  expect(await Book.countDocuments({ $or: [{ slug: null }, { slug: '' }, { slug: { $exists: false } }] })).toBe(0);
});

test('generated slug resolves through public book detail API when published', async () => {
  const created = await request(app)
    .post('/api/admin/books')
    .set('Authorization', `Bearer ${adminToken}`)
    .send(adminPayload())
    .expect(201);

  const detail = await request(app)
    .get(`/api/books/${created.body.data.slug}`)
    .expect(200);

  expect(detail.body.success).toBe(true);
  expect(detail.body.data._id).toBe(created.body.data._id);
  expect(detail.body.data.slug).toBe(created.body.data.slug);
});

test('title update keeps existing slug stable', async () => {
  const created = await request(app)
    .post('/api/admin/books')
    .set('Authorization', `Bearer ${adminToken}`)
    .send(adminPayload())
    .expect(201);

  const updated = await request(app)
    .put(`/api/admin/books/${created.body.data._id}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ title: 'Enterprise Publishing Systems Revised', mrp: 499 })
    .expect(200);

  expect(updated.body.data.title).toBe('Enterprise Publishing Systems Revised');
  expect(updated.body.data.slug).toBe('enterprise-publishing-systems');
});

test('duplicate slug race retry is bounded and does not leak raw Mongo duplicate errors', async () => {
  const duplicateError = new Error('E11000 duplicate key error collection: test.books index: slug_1 dup key');
  duplicateError.code = 11000;
  duplicateError.keyPattern = { slug: 1 };

  const createBook = jest.fn()
    .mockRejectedValueOnce(duplicateError)
    .mockImplementation(async (data) => data);

  const service = new AdminCoreService({
    findBookBySlug: jest.fn().mockResolvedValue(null),
    createBook
  });

  const created = await service.createBookWithServerSlug({
    title: 'Enterprise Publishing Systems',
    description: 'Race-safe book',
    author: author._id,
    category: category._id,
    mrp: 499,
    price: 499
  });

  expect(createBook).toHaveBeenCalledTimes(2);
  expect(createBook.mock.calls[0][0].slug).toBe('enterprise-publishing-systems');
  expect(createBook.mock.calls[1][0].slug).toBe('enterprise-publishing-systems-2');
  expect(created.slug).toBe('enterprise-publishing-systems-2');
});

test('duplicate slug retry exhaustion returns safe service error', async () => {
  const duplicateError = new Error('E11000 duplicate key error collection: test.books index: slug_1 dup key');
  duplicateError.code = 11000;
  duplicateError.keyPattern = { slug: 1 };

  const service = new AdminCoreService({
    findBookBySlug: jest.fn().mockResolvedValue(null),
    createBook: jest.fn().mockRejectedValue(duplicateError)
  });

  await expect(service.createBookWithServerSlug({
    title: 'Enterprise Publishing Systems',
    description: 'Race-safe book',
    author: author._id,
    category: category._id,
    mrp: 499,
    price: 499
  })).rejects.toMatchObject({
    statusCode: 409,
    message: 'Unable to generate a unique book slug'
  });
});

test('book slug migration audits legacy invalid slug rows and is idempotent on isolated DB apply', async () => {
  await Book.collection.insertOne({
    title: 'Legacy Missing Slug',
    description: 'Legacy row inserted before slug invariant',
    author: author._id,
    category: category._id,
    price: 100,
    mrp: 100,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  const dryRun = await buildBookSlugMigrationPlan();
  expect(dryRun.summary.totalBooks).toBe(1);
  expect(dryRun.summary.missingSlugs).toBe(1);
  expect(dryRun.summary.backfilled).toBe(1);
  expect(dryRun.plannedUpdates[0].proposedSlug).toBe('legacy-missing-slug');

  const applied = await applyBookSlugMigration({ options: { dryRun: false, useTransaction: false } });
  expect(applied.summary.backfilled).toBe(1);

  const migrated = await Book.findOne({ title: 'Legacy Missing Slug' }).lean();
  expect(migrated.slug).toBe('legacy-missing-slug');

  const secondDryRun = await buildBookSlugMigrationPlan();
  expect(secondDryRun.summary.backfilled).toBe(0);
});
