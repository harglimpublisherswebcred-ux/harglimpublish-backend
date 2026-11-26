process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'frontend_requirements_test_secret';
process.env.AUTHOR_DASHBOARD_PAID_ACCESS_ENABLED = 'false';

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server');
const User = require('../src/models/User');
const Book = require('../src/models/Book');
const Category = require('../src/models/Category');
const ManualRoyaltyStatement = require('../src/models/ManualRoyaltyStatement');
const { generateToken } = require('../src/utils/tokenUtils');
const { buildCorsOptions, getRateLimitSettings } = require('../src/config/http');

jest.setTimeout(600000);
process.env.MONGOMS_DOWNLOAD_DIR = 'node_modules/.cache/mongodb-binaries';

let mongoServer;
let admin;
let author;
let secondAuthor;
let category;
let adminToken;
let authorToken;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create({ instance: { launchTimeout: 60000 } });
  await mongoose.connect(mongoServer.getUri());
  await Promise.all([Book.syncIndexes(), ManualRoyaltyStatement.syncIndexes()]);
});

afterAll(async () => {
  delete process.env.AUTHOR_DASHBOARD_PAID_ACCESS_ENABLED;
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

beforeEach(async () => {
  await Promise.all([
    ManualRoyaltyStatement.deleteMany({}),
    Book.deleteMany({}),
    Category.deleteMany({}),
    User.deleteMany({})
  ]);
  admin = await User.create({ name: 'Frontend Admin', email: 'frontend-admin@example.com', password: 'password123', role: 'admin' });
  author = await User.create({ name: 'Frontend Author', email: 'frontend-author@example.com', password: 'password123', role: 'author' });
  secondAuthor = await User.create({ name: 'Second Author', email: 'second-author@example.com', password: 'password123', role: 'author' });
  category = await Category.create({ name: 'Frontend Requirements', slug: 'frontend-requirements' });
  adminToken = generateToken(admin._id);
  authorToken = generateToken(author._id);
});

const adminBookPayload = (overrides = {}) => ({
  title: 'Unicode Language Book',
  description: 'Language contract test',
  author: author._id.toString(),
  category: category._id.toString(),
  mrp: 499,
  status: 'published',
  ...overrides
});

test('book language persists across admin, public, and author projections without unrelated-update loss', async () => {
  const created = await request(app)
    .post('/api/admin/books')
    .set('Authorization', `Bearer ${adminToken}`)
    .send(adminBookPayload({ language: '  తెలుగు  ' }))
    .expect(201);

  expect(created.body.data.language).toBe('తెలుగు');
  const bookId = created.body.data._id;
  const slug = created.body.data.slug;

  const adminRead = await request(app)
    .get(`/api/admin/books/${bookId}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .expect(200);
  expect(adminRead.body.data.language).toBe('తెలుగు');

  const publicRead = await request(app).get(`/api/books/${slug}`).expect(200);
  expect(publicRead.body.data.language).toBe('తెలుగు');

  const authorRead = await request(app)
    .get(`/api/authors/me/books/${bookId}`)
    .set('Authorization', `Bearer ${authorToken}`)
    .expect(200);
  expect(authorRead.body.data.book.language).toBe('తెలుగు');

  await request(app)
    .put(`/api/admin/books/${bookId}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ isFeatured: true })
    .expect(200);
  expect((await Book.findById(bookId)).language).toBe('తెలుగు');

  const invalid = await request(app)
    .put(`/api/admin/books/${bookId}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ language: 123 })
    .expect(400);
  expect(invalid.body.error).toBe('BOOK_LANGUAGE_INVALID_TYPE');
});

test('author book creation uses the same canonical language validation', async () => {
  const created = await request(app)
    .post('/api/authors/me/books')
    .set('Authorization', `Bearer ${authorToken}`)
    .send({
      title: 'Author Language Draft',
      description: 'Author-created draft',
      category: category._id.toString(),
      mrp: 199,
      language: '  English   (India) '
    })
    .expect(201);
  expect(created.body.data.book.language).toBe('English (India)');
});

test('manual royalty creation is decimal-safe, idempotent, private, and replacement-audited', async () => {
  const book = await Book.create(adminBookPayload({
    title: 'Royalty Source', slug: 'royalty-source', language: 'English', price: 499
  }));
  const payload = {
    authorId: author._id.toString(),
    periodStart: '2026-11-01T00:00:00.000Z',
    periodEnd: '2026-11-30T23:59:59.000Z',
    items: [{ bookId: book._id.toString(), bookTitle: 'Ignored snapshot', royaltyPerBook: 0.1, unitsSold: 3 }]
  };

  const first = await request(app)
    .post('/api/admin/manual-royalties')
    .set('Authorization', `Bearer ${adminToken}`)
    .set('Idempotency-Key', 'statement-2026-11-author-1')
    .send(payload)
    .expect(201);
  const replay = await request(app)
    .post('/api/admin/manual-royalties')
    .set('Authorization', `Bearer ${adminToken}`)
    .set('Idempotency-Key', 'statement-2026-11-author-1')
    .send(payload)
    .expect(201);

  expect(replay.body.data._id).toBe(first.body.data._id);
  expect(first.body.data.totalRoyalty).toBe(0.3);
  expect(await ManualRoyaltyStatement.countDocuments()).toBe(1);

  const conflict = await request(app)
    .post('/api/admin/manual-royalties')
    .set('Authorization', `Bearer ${adminToken}`)
    .set('Idempotency-Key', 'statement-2026-11-author-1')
    .send({ ...payload, note: 'Different request' })
    .expect(409);
  expect(conflict.body.error).toBe('MANUAL_ROYALTY_IDEMPOTENCY_CONFLICT');

  const authorList = await request(app)
    .get('/api/authors/me/manual-royalties')
    .set('Authorization', `Bearer ${authorToken}`)
    .expect(200);
  expect(authorList.headers['cache-control']).toBe('no-store');
  expect(authorList.body.data[0].createdBy).toBeUndefined();
  expect(JSON.stringify(authorList.body.data)).not.toContain(admin.email);

  await request(app)
    .post(`/api/admin/manual-royalties/${first.body.data._id}/void`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ reason: 'Correcting imported statement' })
    .expect(200);

  const replacement = await request(app)
    .post('/api/admin/manual-royalties')
    .set('Authorization', `Bearer ${adminToken}`)
    .set('Idempotency-Key', 'statement-2026-11-author-1-replacement')
    .send({ ...payload, replacementFor: first.body.data._id, items: [{ bookId: book._id, royaltyPerBook: 10.25, unitsSold: 2 }] })
    .expect(201);
  expect(String(replacement.body.data.replacementFor)).toBe(first.body.data._id);

  await request(app)
    .get('/api/admin/manual-royalties?from=not-a-date')
    .set('Authorization', `Bearer ${adminToken}`)
    .expect(400);
});

test('manual royalties reject books and replacements belonging to another author', async () => {
  const otherBook = await Book.create(adminBookPayload({
    title: 'Other Author Book', slug: 'other-author-book', author: secondAuthor._id, mrp: 100, price: 100
  }));
  await request(app)
    .post('/api/admin/manual-royalties')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      authorId: author._id,
      items: [{ bookId: otherBook._id, royaltyPerBook: 10, unitsSold: 1 }]
    })
    .expect(400);
});

test('analytics validates dates and publishes explicit period summary metadata', async () => {
  await request(app)
    .get('/api/authors/me/analytics?from=invalid&to=2026-11-30')
    .set('Authorization', `Bearer ${authorToken}`)
    .expect(400);

  const response = await request(app)
    .get('/api/authors/me/analytics?range=30d')
    .set('Authorization', `Bearer ${authorToken}`)
    .expect(200);
  expect(response.body.data.bounds).toMatchObject({ timezone: 'UTC', inclusion: 'inclusive' });
  expect(response.body.data.summary).toMatchObject({
    units: 0,
    revenue: 0,
    knownRoyalty: 0,
    unresolvedLegacyCount: 0,
    currency: 'INR',
    dataStatus: 'COMPLETE'
  });
});

test('CORS exposes operational headers and dedicated limiter settings are configurable', () => {
  const options = buildCorsOptions();
  expect(options.exposedHeaders).toEqual(expect.arrayContaining([
    'X-Request-Id', 'Retry-After', 'RateLimit', 'RateLimit-Policy'
  ]));
  expect(getRateLimitSettings()).toEqual(expect.objectContaining({
    uploadMax: expect.any(Number),
    sensitiveMax: expect.any(Number)
  }));
});
