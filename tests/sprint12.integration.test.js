process.env.JWT_SECRET = 'test_secret';
process.env.NODE_ENV = 'test';

const request = require('supertest');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server');
const User = require('../src/models/User');
const Book = require('../src/models/Book');
const Category = require('../src/models/Category');
const Order = require('../src/models/Order');
const Invoice = require('../src/models/Invoice');
const Notification = require('../src/models/Notification');
const Review = require('../src/models/Review');
const AuthorApplication = require('../src/models/AuthorApplication');
const Content = require('../src/models/Content');

jest.setTimeout(600000);
process.env.MONGOMS_DOWNLOAD_DIR = 'node_modules/.cache/mongodb-binaries';

let mongoServer;
let reader;
let admin;
let author;
let book;
let order;
let invoice;
let notification;
let readerToken;
let adminToken;

const tokenFor = (user) => jwt.sign({ id: user._id }, process.env.JWT_SECRET);

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create({ instance: { launchTimeout: 60000 } });
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

beforeEach(async () => {
  await Promise.all([User.deleteMany({}), Book.deleteMany({}), Category.deleteMany({}), Order.deleteMany({}), Invoice.deleteMany({}), Notification.deleteMany({}), Review.deleteMany({}), AuthorApplication.deleteMany({}), Content.deleteMany({})]);
  admin = await User.create({ name: 'Admin', email: 'admin12@example.com', password: 'password123', role: 'admin' });
  reader = await User.create({ name: 'Reader', email: 'reader12@example.com', password: 'password123', role: 'reader' });
  author = await User.create({ name: 'Author', email: 'author12@example.com', password: 'password123', role: 'author' });
  const category = await Category.create({ name: 'Sprint 12', slug: 'sprint-12' });
  book = await Book.create({ title: 'Sprint 12 Book', slug: 'sprint-12-book', description: 'Book', author: author._id, category: category._id, price: 100, status: 'published' });
  order = await Order.create({ orderNumber: 'HM-S12-1', user: reader._id, items: [{ book: book._id, quantity: 1, price: 100 }], shippingAddress: { fullName: 'Reader', addressLine1: 'A', city: 'B', postalCode: '1', country: 'IN' }, subtotal: 100, tax: 0, shippingPrice: 0, totalPrice: 100 });
  invoice = await Invoice.create({ invoiceNumber: 'INV-S12-1', order: order._id, payment: new mongoose.Types.ObjectId(), customer: reader._id, items: [{ book: book._id, title: book.title, quantity: 1, unitPrice: 100, lineTotal: 100 }], subtotal: 100, taxTotal: 0, discountTotal: 0, shippingTotal: 0, total: 100, document: { fileName: 'invoice.pdf', data: Buffer.from('pdf') } });
  notification = await Notification.create({ idempotencyKey: 's12-notification', user: reader._id, eventType: 'InvoiceGenerated', channel: 'IN_APP', subject: 'Invoice', body: 'Invoice ready', status: 'SENT' });
  readerToken = tokenFor(reader);
  adminToken = tokenFor(admin);
});

test('supports author application frontend contract and admin approval promotes role', async () => {
  const missing = await request(app).get('/api/users/me/author-application').set('Authorization', `Bearer ${readerToken}`).expect(404);
  expect(missing.body.success).toBe(false);

  const created = await request(app).post('/api/author-applications').set('Authorization', `Bearer ${readerToken}`).send({ penName: 'Reader Pen', portfolioUrl: 'https://example.com' }).expect(201);
  expect(created.body.application.status).toBe('pending');

  const list = await request(app).get('/api/admin/author-applications?status=pending').set('Authorization', `Bearer ${adminToken}`).expect(200);
  expect(list.body.data).toHaveLength(1);

  await request(app).put(`/api/admin/author-applications/${created.body.application._id}/status`).set('Authorization', `Bearer ${adminToken}`).send({ status: 'approved' }).expect(200);
  expect((await User.findById(reader._id)).role).toBe('author');
});

test('supports customer order, invoice, and notification account APIs', async () => {
  const orderRes = await request(app).get(`/api/orders/${order._id}`).set('Authorization', `Bearer ${readerToken}`).expect(200);
  expect(orderRes.body.data.orderNumber).toBe('HM-S12-1');

  const invoices = await request(app).get('/api/users/me/invoices').set('Authorization', `Bearer ${readerToken}`).expect(200);
  expect(invoices.body.data[0].invoiceNumber).toBe(invoice.invoiceNumber);

  await request(app).get(`/api/users/me/invoices/${invoice._id}/download`).set('Authorization', `Bearer ${readerToken}`).expect(200);

  const notifications = await request(app).get('/api/users/me/notifications').set('Authorization', `Bearer ${readerToken}`).expect(200);
  expect(notifications.body.data[0].notificationId).toBe(notification.notificationId);

  const read = await request(app).patch(`/api/users/me/notifications/${notification._id}/read`).set('Authorization', `Bearer ${readerToken}`).expect(200);
  expect(read.body.data.readAt).toBeTruthy();
});

test('supports review lifecycle and admin moderation', async () => {
  const created = await request(app).post('/api/reviews').set('Authorization', `Bearer ${readerToken}`).send({ book: book._id, rating: 5, comment: 'Great' }).expect(201);
  expect(created.body.data.rating).toBe(5);

  await request(app).put(`/api/reviews/${created.body.data._id}`).set('Authorization', `Bearer ${readerToken}`).send({ rating: 4, comment: 'Still good' }).expect(200);

  const reviews = await request(app).get('/api/admin/reviews').set('Authorization', `Bearer ${adminToken}`).expect(200);
  expect(reviews.body.pagination.total).toBe(1);

  await request(app).patch(`/api/admin/reviews/${created.body.data._id}/status`).set('Authorization', `Bearer ${adminToken}`).send({ status: 'rejected' }).expect(200);
  expect((await Review.findById(created.body.data._id)).status).toBe('rejected');
});

test('supports auth hardening and admin user management', async () => {
  const refresh = await request(app).post('/api/auth/refresh').set('Authorization', `Bearer ${readerToken}`).expect(200);
  expect(refresh.body.data.token).toBeTruthy();

  const forgot = await request(app).post('/api/auth/forgot-password').send({ email: reader.email }).expect(200);
  expect(forgot.body.data.resetToken).toBeTruthy();

  await request(app).post(`/api/auth/reset-password/${forgot.body.data.resetToken}`).send({ password: 'newpass123' }).expect(200);

  const users = await request(app).get('/api/admin/users').set('Authorization', `Bearer ${adminToken}`).expect(200);
  expect(users.body.pagination.total).toBeGreaterThanOrEqual(3);

  await request(app).put(`/api/admin/users/${reader._id}/role`).set('Authorization', `Bearer ${adminToken}`).send({ role: 'author' }).expect(200);
  await request(app).patch(`/api/admin/users/${reader._id}/status`).set('Authorization', `Bearer ${adminToken}`).send({ isActive: false }).expect(200);
  await request(app).post(`/api/admin/users/${reader._id}/reset-password`).set('Authorization', `Bearer ${adminToken}`).send({ password: 'admin123' }).expect(200);
  expect((await User.findById(reader._id)).isActive).toBe(false);
});

test('supports CMS content frontend contract', async () => {
  const empty = await request(app).get('/api/content').expect(200);
  expect(empty.body.success).toBe(true);
  expect(empty.body.data.hero).toBeTruthy();
  expect(empty.body.homeTitle).toBeTruthy();

  const payload = {
    homeTitle: 'Frontend Home',
    homeSubtitle: 'Frontend Subtitle',
    hero: { title: 'Hero', subtitle: 'Sub', body: 'Body' },
    about: { title: 'About', body: 'About body' },
    contact: { email: 'support@example.com' },
    faq: [{ question: 'Q?', answer: 'A.' }],
    footer: { title: 'Footer' },
    socialLinks: { instagram: 'https://instagram.com/harglim' },
    seo: { title: 'SEO', description: 'SEO desc', keywords: ['books'] },
    announcements: [{ title: 'Launch', message: 'Live', active: true }],
    siteSettings: { siteName: 'Harglim', maintenanceMode: false },
    packagesJson: '[]',
    ignored: 'nope'
  };

  const updated = await request(app).put('/api/admin/content').set('Authorization', `Bearer ${adminToken}`).send(payload).expect(200);
  expect(updated.body.success).toBe(true);
  expect(updated.body.data.homeTitle).toBe('Frontend Home');
  expect(updated.body.data.ignored).toBeUndefined();

  const stored = await request(app).get('/api/content').expect(200);
  expect(stored.body.data.homeTitle).toBe('Frontend Home');
});

test('supports /api/users/me profile contract', async () => {
  const me = await request(app).get('/api/users/me').set('Authorization', `Bearer ${readerToken}`).expect(200);
  expect(me.body.success).toBe(true);
  expect(me.body.data.email).toBe(reader.email);
  expect(me.body.data.password).toBeUndefined();
});

test('supports combined admin user update and frontend value normalization', async () => {
  const suspended = await request(app)
    .put(`/api/admin/users/${reader._id}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ role: 'user', status: 'Suspended' })
    .expect(200);

  expect(suspended.body.data.role).toBe('reader');
  expect(suspended.body.data.isActive).toBe(false);

  const active = await request(app)
    .put(`/api/admin/users/${reader._id}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ isActive: true })
    .expect(200);

  expect(active.body.data.isActive).toBe(true);
});

test('normalizes frontend order statuses without changing stored enum definitions', async () => {
  await request(app)
    .put(`/api/admin/orders/${order._id}/status`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ status: 'Processing' })
    .expect(200);

  expect((await Order.findById(order._id)).status).toBe('PROCESSING');
});

test('supports book royalty percentage through admin book APIs', async () => {
  const created = await request(app)
    .post('/api/admin/books')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      title: 'Royalty Book',
      description: 'Royalty enabled book',
      category: book.category,
      mrp: 250,
      price: 250,
      royaltyPercentage: 15,
      status: 'published'
    })
    .expect(201);

  expect(created.body.data.royaltyPercentage).toBe(15);
  expect(created.body.data.mrp).toBe(250);
  expect(created.body.data.price).toBe(250);

  const updated = await request(app)
    .put(`/api/admin/books/${created.body.data._id}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ mrp: 275, royaltyPercentage: 18 })
    .expect(200);

  expect(updated.body.data.royaltyPercentage).toBe(18);
  expect(updated.body.data.mrp).toBe(275);
  expect(updated.body.data.price).toBe(275);
});

test('supports legacy book price compatibility and rejects mrp conflicts', async () => {
  const legacy = await request(app)
    .post('/api/admin/books')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      title: 'Legacy Price Book',
      description: 'Legacy price compatibility book',
      category: book.category,
      price: 300,
      status: 'published'
    })
    .expect(201);

  expect(legacy.body.data.mrp).toBe(300);
  expect(legacy.body.data.price).toBe(300);

  await request(app)
    .post('/api/admin/books')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      title: 'Conflicting Price Book',
      description: 'Conflicting price compatibility book',
      category: book.category,
      mrp: 300,
      price: 350,
      status: 'published'
    })
    .expect(400);
});
