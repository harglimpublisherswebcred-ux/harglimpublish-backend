const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const categoryRepository = require('../src/repositories/categoryRepository');
const Category = require('../src/models/Category');
const Book = require('../src/models/Book');
const User = require('../src/models/User');

jest.setTimeout(600000);
process.env.MONGOMS_DOWNLOAD_DIR = 'node_modules/.cache/mongodb-binaries';

describe('CategoryRepository', () => {
  let mongoServer;
  let author;

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
    await Promise.all([Category.deleteMany({}), Book.deleteMany({}), User.deleteMany({})]);
    author = await User.create({ name: 'Author', email: 'cat-author@example.com', password: 'password123', role: 'author' });
  });

  it('creates, searches, updates, and counts category books', async () => {
    const category = await categoryRepository.create({ name: 'Business', slug: 'business', featured: true });
    await Book.create({
      title: 'Business Book',
      slug: 'business-book',
      description: 'A book',
      author: author._id,
      category: category._id,
      price: 100,
      status: 'published'
    });

    const search = await categoryRepository.search({ featured: true, search: 'bus' }, { page: 1, limit: 5 });
    const count = await categoryRepository.countBooks(category._id);
    const updated = await categoryRepository.updateBookCount(category._id, count);

    expect(search.pagination.total).toBe(1);
    expect(count).toBe(1);
    expect(updated.bookCount).toBe(1);
  });

  it('maps duplicate slug or name errors to repository errors', async () => {
    await categoryRepository.create({ name: 'Fiction', slug: 'fiction' });

    await expect(categoryRepository.create({ name: 'Fiction', slug: 'fiction-2' }))
      .rejects
      .toHaveProperty('code', 'CATEGORY_DUPLICATE');
  });
});
