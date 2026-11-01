process.env.JWT_SECRET = 'frontend_alignment_secret';
process.env.NODE_ENV = 'test';
process.env.AUTHOR_DASHBOARD_PAID_ACCESS_ENABLED = 'true';

const request = require('supertest');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server');
const User = require('../src/models/User');
const Book = require('../src/models/Book');
const Category = require('../src/models/Category');
const Order = require('../src/models/Order');
const PublishPackage = require('../src/models/PublishPackage');
const PublishRequest = require('../src/models/PublishRequest');
const AuthorAccessEntitlement = require('../src/models/AuthorAccessEntitlement');
const Spotlight = require('../src/models/Spotlight');
const Content = require('../src/models/Content');
const spotlightService = require('../src/services/spotlightService');

jest.setTimeout(600000);
process.env.MONGOMS_DOWNLOAD_DIR = 'node_modules/.cache/mongodb-binaries';

const tokenFor = (user) => jwt.sign({ id: user._id }, process.env.JWT_SECRET);

describe('Frontend alignment contracts', () => {
  let mongoServer;
  let admin;
  let author;
  let category;
  let activePackage;
  let adminToken;
  let authorToken;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create({ instance: { launchTimeout: 60000 } });
    await mongoose.connect(mongoServer.getUri());
    await Promise.all([
      User.syncIndexes(), Book.syncIndexes(), Category.syncIndexes(), Order.syncIndexes(),
      PublishPackage.syncIndexes(), PublishRequest.syncIndexes(), AuthorAccessEntitlement.syncIndexes(),
      Spotlight.syncIndexes(), Content.syncIndexes(),
    ]);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) await mongoServer.stop();
  });

  beforeEach(async () => {
    await Promise.all([
      User.deleteMany({}), Book.deleteMany({}), Category.deleteMany({}), Order.deleteMany({}),
      PublishPackage.deleteMany({}), PublishRequest.deleteMany({}), AuthorAccessEntitlement.deleteMany({}),
      Spotlight.deleteMany({}), Content.deleteMany({}),
    ]);
    admin = await User.create({ name: 'Admin', email: 'alignment-admin@example.com', password: 'password123', role: 'admin' });
    author = await User.create({ name: 'Assigned Author', email: 'alignment-author@example.com', password: 'password123', role: 'author' });
    category = await Category.create({ name: 'Alignment', slug: 'alignment' });
    activePackage = await PublishPackage.create({ name: 'Active Package', description: 'Active', price: 999, isActive: true });
    await AuthorAccessEntitlement.create({
      user: author._id,
      feature: 'AUTHOR_DASHBOARD',
      status: 'ACTIVE',
      source: 'ADMIN_GRANT',
      grantedBy: admin._id,
    });
    adminToken = tokenFor(admin);
    authorToken = tokenFor(author);
  });

  test('author sees every assigned book, current royalty, zero-sale performance, and no-store headers', async () => {
    const books = [];
    for (let index = 0; index < 6; index += 1) {
      books.push(await Book.create({
        title: `Admin Assigned ${index}`,
        slug: `admin-assigned-${index}`,
        description: 'Assigned by publishing team',
        author: author._id,
        category: category._id,
        mrp: 499,
        printingCost: 100,
        platformCharges: 30,
        deliveryCharges: 50,
        status: index === 0 ? 'published' : 'draft',
      }));
    }

    const list = await request(app)
      .get('/api/authors/me/books?limit=20')
      .set('Authorization', `Bearer ${authorToken}`)
      .expect(200);
    expect(list.headers['cache-control']).toContain('no-store');
    expect(list.body.data).toHaveLength(6);
    expect(list.body.data[0].royaltyPerCopy).toBe(319);

    const dashboard = await request(app)
      .get('/api/authors/me/dashboard')
      .set('Authorization', `Bearer ${authorToken}`)
      .expect(200);
    expect(dashboard.body.data.books.total).toBe(6);
    expect(dashboard.body.data.topBooks).toHaveLength(6);

    const performance = await request(app)
      .get('/api/authors/me/books/performance')
      .set('Authorization', `Bearer ${authorToken}`)
      .expect(200);
    expect(performance.body.data).toHaveLength(6);
    expect(performance.body.data.every((item) => item.unitsSold === 0)).toBe(true);
  });

  test('royalty history exposes immutable charge snapshot values', async () => {
    const book = await Book.create({
      title: 'Snapshot Book', slug: 'snapshot-book', description: 'Snapshot', author: author._id,
      category: category._id, mrp: 499, printingCost: 100, platformCharges: 30, deliveryCharges: 50,
      status: 'published',
    });
    const reader = await User.create({ name: 'Reader', email: 'alignment-reader@example.com', password: 'password123' });
    await Order.create({
      orderNumber: 'HM-ALIGN-1', user: reader._id,
      items: [{ book: book._id, author: author._id, quantity: 2, price: 499, royaltyPerCopySnapshot: 319,
        printingCostSnapshot: 100, platformChargesSnapshot: 30, deliveryChargesSnapshot: 50 }],
      shippingAddress: { fullName: 'Reader', addressLine1: 'Street', city: 'City', postalCode: '1', country: 'India' },
      subtotal: 998, tax: 0, shippingPrice: 0, totalPrice: 998, isPaid: true, status: 'PROCESSING',
    });

    const result = await request(app)
      .get('/api/authors/me/royalties')
      .set('Authorization', `Bearer ${authorToken}`)
      .expect(200);
    expect(result.body.data.history[0]).toMatchObject({ royaltyPerCopy: 319, royaltyPerCopySnapshot: 319, royaltyAmount: 638 });
  });

  test('submission requires a valid active package', async () => {
    const book = await Book.create({
      title: 'Submission Book', slug: 'submission-book', description: 'Submission', author: author._id,
      category: category._id, mrp: 299, status: 'draft',
    });
    const endpoint = `/api/authors/me/books/${book._id}/submit`;
    const headers = { Authorization: `Bearer ${authorToken}` };

    const missing = await request(app).post(endpoint).set(headers).send({ fileUrl: 'https://example.com/book.pdf' }).expect(400);
    expect(missing.body.message).toBe('packageId is required');

    const archived = await PublishPackage.create({ name: 'Archived', description: 'Archived', price: 1, isActive: false });
    await request(app).post(endpoint).set(headers)
      .send({ fileUrl: 'https://example.com/book.pdf', packageId: archived._id }).expect(400);

    await request(app).post(endpoint).set(headers)
      .send({ fileUrl: 'https://example.com/book.pdf', packageId: activePackage._id }).expect(201);
  });

  test('admin can invite an author without password and paid dashboard access is granted', async () => {
    const response = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Invited Author', email: 'invited-author@example.com', role: 'author' })
      .expect(201);
    expect(response.body.data).toMatchObject({ role: 'author', invited: true });

    const invited = await User.findOne({ email: 'invited-author@example.com' }).select('+password +passwordResetToken');
    expect(invited.password).toBeUndefined();
    expect(invited.passwordResetToken).toHaveLength(64);
    expect(await AuthorAccessEntitlement.exists({ user: invited._id, status: 'ACTIVE' })).toBeTruthy();

    await request(app).post(`/api/admin/users/${invited._id}/resend-invite`)
      .set('Authorization', `Bearer ${adminToken}`).expect(200);
    invited.password = 'password123';
    await invited.save();
    await request(app).post(`/api/admin/users/${invited._id}/resend-invite`)
      .set('Authorization', `Bearer ${adminToken}`).expect(409);
  });

  test('admin book assignment grants paid dashboard entitlement to an existing author', async () => {
    await AuthorAccessEntitlement.deleteMany({ user: author._id });
    await request(app).post('/api/admin/books')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Publishing Team Assignment',
        description: 'Assigned to an existing author',
        author: author._id,
        category: category._id,
        mrp: 399,
        status: 'published',
      }).expect(201);
    expect(await AuthorAccessEntitlement.exists({ user: author._id, status: 'ACTIVE' })).toBeTruthy();
    await request(app).get('/api/authors/me/dashboard')
      .set('Authorization', `Bearer ${authorToken}`).expect(200);
  });

  test('spotlight public/admin lifecycle preserves pagination and soft deletion', async () => {
    const created = await spotlightService.create({
      author_name: 'Featured Author', caption: 'Launch day', authorId: author._id, sortOrder: 1,
    }, {
      image: 'https://res.cloudinary.com/demo/image/upload/spotlight.jpg',
      thumbnail: 'https://res.cloudinary.com/demo/image/upload/c_fill,w_400,h_400/spotlight.jpg',
      publicId: 'harglim/spotlights/spotlight',
    }, admin);

    const publicList = await request(app).get('/api/spotlights?page=1&limit=6').expect(200);
    expect(publicList.body.data).toHaveLength(1);
    expect(publicList.body.pagination).toMatchObject({ page: 1, limit: 6, total: 1, pages: 1 });

    await request(app).patch(`/api/admin/spotlights/${created._id}`)
      .set('Authorization', `Bearer ${adminToken}`).send({ caption: 'Updated caption' }).expect(200);
    await request(app).delete(`/api/admin/spotlights/${created._id}`)
      .set('Authorization', `Bearer ${adminToken}`).expect(200);
    const hidden = await request(app).get('/api/spotlights?page=1&limit=6').expect(200);
    expect(hidden.body.data).toHaveLength(0);
  });

  test('CMS preserves flat page sections and nested site content', async () => {
    await request(app).put('/api/admin/content')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        announcementText: 'Frontend alignment announcement',
        homeWhyChooseJson: '[{"title":"Editorial support"}]',
        siteSettings: { siteContent: { homeWhyChooseJson: '[{"title":"Editorial support"}]', customKey: 'kept' } },
      }).expect(200);
    const content = await request(app).get('/api/content').expect(200);
    expect(content.body.data.announcementText).toBe('Frontend alignment announcement');
    expect(content.body.data.homeWhyChooseJson).toBe('[{"title":"Editorial support"}]');
    expect(content.body.data.siteSettings.siteContent.customKey).toBe('kept');
  });
});
