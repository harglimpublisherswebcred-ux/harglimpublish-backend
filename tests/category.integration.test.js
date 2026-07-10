jest.mock('../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));

const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const categoryRoutes = require('../src/routes/categoryRoutes');
const adminRoutes = require('../src/routes/adminRoutes');
const Category = require('../src/models/Category');
const Book = require('../src/models/Book');
const User = require('../src/models/User');

jest.setTimeout(600000);
process.env.MONGOMS_DOWNLOAD_DIR = 'node_modules/.cache/mongodb-binaries';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'secret123';

describe('Category APIs', () => {
  let mongoServer;
  let app;
  let admin;
  let reader;
  let author;
  let adminToken;
  let readerToken;

  const tokenFor = (user) => jwt.sign({ id: user._id }, process.env.JWT_SECRET);

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    await Promise.all([Category.syncIndexes(), Book.syncIndexes(), User.syncIndexes()]);

    app = express();
    app.use(express.json());
    app.use('/api/categories', categoryRoutes);
    app.use('/api/admin', adminRoutes);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) await mongoServer.stop();
  });

  beforeEach(async () => {
    await Promise.all([Category.deleteMany({}), Book.deleteMany({}), User.deleteMany({})]);
    admin = await User.create({ name: 'Admin', email: 'admin-category@example.com', password: 'password123', role: 'admin' });
    reader = await User.create({ name: 'Reader', email: 'reader-category@example.com', password: 'password123', role: 'reader' });
    author = await User.create({ name: 'Author', email: 'author-category@example.com', password: 'password123', role: 'author' });
    adminToken = tokenFor(admin);
    readerToken = tokenFor(reader);
  });

  it('serves public category list, detail, and books', async () => {
    const category = await Category.create({ name: 'Technology', slug: 'technology', active: true, isActive: true, featured: true });
    await Book.create({
      title: 'Tech Book',
      slug: 'tech-book',
      description: 'A book',
      author: author._id,
      category: category._id,
      price: 100,
      status: 'published'
    });

    const list = await request(app).get('/api/categories?featured=true').expect(200);
    const detail = await request(app).get('/api/categories/technology').expect(200);
    const books = await request(app).get('/api/categories/technology/books').expect(200);

    expect(list.body.pagination.total).toBe(1);
    expect(detail.body.data.slug).toBe('technology');
    expect(books.body.data[0].slug).toBe('tech-book');
    expect(books.body.category.slug).toBe('technology');
  });

  it('protects admin category APIs and supports CRUD without changing response envelope', async () => {
    await request(app)
      .post('/api/admin/categories')
      .send({ name: 'Business' })
      .expect(401);

    await request(app)
      .post('/api/admin/categories')
      .set('Authorization', `Bearer ${readerToken}`)
      .send({ name: 'Business' })
      .expect(403);

    const created = await request(app)
      .post('/api/admin/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Business', featured: true })
      .expect(201);

    const categoryId = created.body.data._id;
    expect(created.body.success).toBe(true);
    expect(created.body.data.slug).toBe('business');

    const duplicate = await request(app)
      .post('/api/admin/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Business' })
      .expect(409);
    expect(duplicate.body.success).toBe(false);

    const inactive = await request(app)
      .patch(`/api/admin/categories/${categoryId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ active: false })
      .expect(200);
    expect(inactive.body.data.active).toBe(false);
  });

  it('soft deletes empty categories and blocks deleting categories with active books', async () => {
    const empty = await Category.create({ name: 'Empty', slug: 'empty' });
    const used = await Category.create({ name: 'Used', slug: 'used' });
    await Book.create({
      title: 'Used Book',
      slug: 'used-book',
      description: 'A book',
      author: author._id,
      category: used._id,
      price: 100,
      status: 'published'
    });

    const blocked = await request(app)
      .delete(`/api/admin/categories/${used._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(409);
    expect(blocked.body.message).toMatch(/active books/i);

    const deleted = await request(app)
      .delete(`/api/admin/categories/${empty._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(deleted.body.data.active).toBe(false);
  });
});
