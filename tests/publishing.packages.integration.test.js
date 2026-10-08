process.env.JWT_SECRET = 'test_secret';
process.env.NODE_ENV = 'test';

const request = require('supertest');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server');
const User = require('../src/models/User');
const PublishPackage = require('../src/models/PublishPackage');
const PublishRequest = require('../src/models/PublishRequest');

jest.setTimeout(600000);
process.env.MONGOMS_DOWNLOAD_DIR = 'node_modules/.cache/mongodb-binaries';

let mongoServer;
let adminToken;
let readerToken;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create({ instance: { launchTimeout: 60000 } });
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

beforeEach(async () => {
  await Promise.all([PublishRequest.deleteMany({}), PublishPackage.deleteMany({}), User.deleteMany({})]);
  const admin = await User.create({ name: 'Admin', email: 'packages-admin@example.com', password: 'password123', role: 'admin' });
  const reader = await User.create({ name: 'Reader', email: 'packages-reader@example.com', password: 'password123', role: 'reader' });
  adminToken = jwt.sign({ id: admin._id }, process.env.JWT_SECRET);
  readerToken = jwt.sign({ id: reader._id }, process.env.JWT_SECRET);
});

test('admin can create, list, view, update and archive a publish package', async () => {
  const created = await request(app)
    .post('/api/admin/publish-packages')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      name: 'Professional',
      description: 'Professional publishing support',
      price: 15000,
      features: ['Editing', 'Cover design']
    })
    .expect(201);

  expect(created.body.data).toMatchObject({
    name: 'Professional',
    price: 15000,
    features: ['Editing', 'Cover design'],
    isActive: true
  });

  const id = created.body.data._id;
  const listed = await request(app)
    .get('/api/admin/publish-packages?search=Professional&page=1&limit=10')
    .set('Authorization', `Bearer ${adminToken}`)
    .expect(200);
  expect(listed.body.pagination).toMatchObject({ total: 1, page: 1, limit: 10, pages: 1 });
  expect(listed.body.data[0]._id).toBe(id);

  await request(app)
    .get(`/api/admin/publish-packages/${id}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .expect(200);

  const updated = await request(app)
    .patch(`/api/admin/publish-packages/${id}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ price: 17500, features: ['Editing', 'Cover design', 'Marketing'] })
    .expect(200);
  expect(updated.body.data.price).toBe(17500);

  const archived = await request(app)
    .delete(`/api/admin/publish-packages/${id}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .expect(200);
  expect(archived.body.data.isActive).toBe(false);

  const publicList = await request(app).get('/api/publish-packages').expect(200);
  expect(publicList.body.data).toEqual([]);
});

test('publish package administration requires admin authorization', async () => {
  await request(app).get('/api/admin/publish-packages').expect(401);
  await request(app)
    .post('/api/admin/publish-packages')
    .set('Authorization', `Bearer ${readerToken}`)
    .send({ name: 'Denied', description: 'Denied', price: 100 })
    .expect(403);
});

test('publish package validation and conflicts return safe client errors', async () => {
  await request(app)
    .post('/api/admin/publish-packages')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: 'Invalid', description: 'Invalid', price: -1 })
    .expect(400);

  await request(app)
    .post('/api/admin/publish-packages')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: 'Invalid features', description: 'Invalid', price: 100, features: [123] })
    .expect(400);

  const first = await request(app)
    .post('/api/admin/publish-packages')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: 'Starter', description: 'Starter package', price: 1000 })
    .expect(201);

  await request(app)
    .post('/api/admin/publish-packages')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: 'starter', description: 'Duplicate package', price: 1200 })
    .expect(409);

  await request(app)
    .patch(`/api/admin/publish-packages/${first.body.data._id}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ unknown: true })
    .expect(400);

  await request(app)
    .get('/api/admin/publish-packages/not-an-id')
    .set('Authorization', `Bearer ${adminToken}`)
    .expect(400);

  await request(app)
    .get(`/api/admin/publish-packages/${new mongoose.Types.ObjectId()}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .expect(404);
});

test('archiving preserves historical publish request package references', async () => {
  const publishPackage = await PublishPackage.create({
    name: 'Historical',
    description: 'Referenced package',
    price: 5000
  });
  const author = await User.create({ name: 'Author', email: 'package-author@example.com', password: 'password123', role: 'author' });
  await PublishRequest.create({
    user: author._id,
    title: 'Historical Manuscript',
    genre: 'Fiction',
    wordCount: 30000,
    packageId: publishPackage._id,
    fileUrl: 'https://example.com/manuscript.pdf'
  });

  await request(app)
    .delete(`/api/admin/publish-packages/${publishPackage._id}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .expect(200);

  expect(await PublishPackage.findById(publishPackage._id)).not.toBeNull();
  expect(await PublishRequest.countDocuments({ packageId: publishPackage._id })).toBe(1);
});
