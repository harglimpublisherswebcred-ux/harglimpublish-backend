jest.mock('../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Category = require('../src/models/Category');
const Book = require('../src/models/Book');
const User = require('../src/models/User');
const {
  buildCategoryMigrationPlan,
  runCategoryMigration,
  groupDuplicates
} = require('../scripts/categoryMigration');

jest.setTimeout(600000);
process.env.MONGOMS_DOWNLOAD_DIR = 'node_modules/.cache/mongodb-binaries';

describe('Category migration utility', () => {
  let mongoServer;
  let author;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) await mongoServer.stop();
  });

  beforeEach(async () => {
    await mongoose.connection.dropDatabase();
    author = await User.create({
      name: 'Migration Author',
      email: 'migration-author@example.com',
      password: 'password123',
      role: 'author'
    });
  });

  it('builds a dry-run report without mutating category data', async () => {
    const legacy = await Category.collection.insertOne({
      name: 'Legacy Business',
      isActive: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    await Book.create({
      title: 'Legacy Book',
      slug: 'legacy-book',
      description: 'Existing book',
      author: author._id,
      category: legacy.insertedId,
      price: 100,
      status: 'published'
    });
    await Book.collection.insertOne({
      title: 'Orphan Book',
      slug: 'orphan-book',
      description: 'Orphan book',
      author: author._id,
      category: new mongoose.Types.ObjectId(),
      price: 100,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const report = await buildCategoryMigrationPlan({ options: { dryRun: true } });
    const unchanged = await Category.collection.findOne({ _id: legacy.insertedId });

    expect(report.dryRun).toBe(true);
    expect(report.summary.categorySlugUpdates).toBe(1);
    expect(report.summary.activeFieldUpdates).toBe(1);
    expect(report.summary.bookCountUpdates).toBe(1);
    expect(report.summary.orphanBookReferences).toBe(1);
    expect(report.plannedUpdates[0].update).toMatchObject({
      slug: 'legacy-business',
      active: false,
      bookCount: 1
    });
    expect(unchanged.slug).toBeUndefined();
    expect(unchanged.active).toBeUndefined();
  });

  it('applies idempotent updates and produces a clean second report', async () => {
    const legacy = await Category.collection.insertOne({
      name: 'Legacy Fiction',
      isActive: true,
      bookCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    await Book.create({
      title: 'Fiction Book',
      slug: 'fiction-book',
      description: 'Existing book',
      author: author._id,
      category: legacy.insertedId,
      price: 120,
      status: 'published'
    });

    const first = await runCategoryMigration({ dryRun: false, useTransaction: false });
    const migrated = await Category.findById(legacy.insertedId).lean();
    const second = await runCategoryMigration({ dryRun: true, useTransaction: false });

    expect(first.summary.categorySlugUpdates).toBe(1);
    expect(migrated.slug).toBe('legacy-fiction');
    expect(migrated.active).toBe(true);
    expect(migrated.bookCount).toBe(1);
    expect(second.plannedUpdates).toHaveLength(0);
  });

  it('detects duplicate names and duplicate slugs in reports', async () => {
    await Category.create({ name: 'Poetry', slug: 'poetry' });
    await Category.create({ name: 'poetry', slug: 'poetry-2' });

    const report = await buildCategoryMigrationPlan({ options: { dryRun: true } });
    const duplicateSlugs = groupDuplicates([
      { _id: '1', slug: 'same' },
      { _id: '2', slug: 'same' }
    ], (item) => item.slug);

    expect(report.duplicateNames[0]).toMatchObject({ value: 'poetry', count: 2 });
    expect(duplicateSlugs[0]).toMatchObject({ value: 'same', count: 2 });
  });
});
