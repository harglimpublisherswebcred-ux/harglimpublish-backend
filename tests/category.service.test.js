jest.mock('../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const categoryService = require('../src/services/categoryService');
const eventBus = require('../src/events/eventBus');
const { DOMAIN_EVENTS } = require('../src/events/eventCatalog');
const Category = require('../src/models/Category');
const Book = require('../src/models/Book');
const User = require('../src/models/User');

jest.setTimeout(600000);
process.env.MONGOMS_DOWNLOAD_DIR = 'node_modules/.cache/mongodb-binaries';

describe('CategoryService', () => {
  let mongoServer;
  let admin;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    await Promise.all([Category.syncIndexes(), Book.syncIndexes(), User.syncIndexes()]);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) await mongoServer.stop();
  });

  beforeEach(async () => {
    eventBus.reset();
    await Promise.all([Category.deleteMany({}), Book.deleteMany({}), User.deleteMany({})]);
    admin = await User.create({ name: 'Admin', email: 'cat-admin@example.com', password: 'password123', role: 'admin' });
  });

  it('generates a unique slug and publishes create/update/status events', async () => {
    const events = [];
    [
      DOMAIN_EVENTS.CATEGORY_CREATED,
      DOMAIN_EVENTS.CATEGORY_UPDATED,
      DOMAIN_EVENTS.CATEGORY_DEACTIVATED
    ].forEach((eventName) => eventBus.subscribe(eventName, async (event) => events.push(event.eventName)));

    const created = await categoryService.createCategory({ name: 'Science Fiction' }, admin);
    const updated = await categoryService.updateCategory(created._id, { description: 'Speculative books' }, admin);
    const inactive = await categoryService.updateCategoryStatus(created._id, false, admin);

    expect(created.slug).toBe('science-fiction');
    expect(updated.description).toBe('Speculative books');
    expect(inactive.active).toBe(false);
    expect(inactive.isActive).toBe(false);
    expect(events).toEqual([
      DOMAIN_EVENTS.CATEGORY_CREATED,
      DOMAIN_EVENTS.CATEGORY_UPDATED,
      DOMAIN_EVENTS.CATEGORY_DEACTIVATED
    ]);
  });

  it('prevents duplicate categories and blocks delete when active books exist', async () => {
    const category = await categoryService.createCategory({ name: 'Poetry' }, admin);
    const author = await User.create({ name: 'Author', email: 'cat-service-author@example.com', password: 'password123' });
    await Book.create({
      title: 'Poetry Book',
      slug: 'poetry-book',
      description: 'A book',
      author: author._id,
      category: category._id,
      price: 120,
      status: 'published'
    });

    await expect(categoryService.createCategory({ name: 'Poetry' }, admin))
      .rejects
      .toHaveProperty('statusCode', 409);

    await expect(categoryService.deleteCategory(category._id, admin))
      .rejects
      .toHaveProperty('statusCode', 409);
  });
});
