const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Book = require('../src/models/Book');
const User = require('../src/models/User');
const Category = require('../src/models/Category');
const {
  buildBookMrpMigrationPlan,
  applyBookMrpMigrationPlan
} = require('../scripts/bookMrpMigration');

jest.setTimeout(600000);
process.env.MONGOMS_DOWNLOAD_DIR = 'node_modules/.cache/mongodb-binaries';

describe('Book MRP compatibility', () => {
  let mongoServer;
  let author;
  let category;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create({ instance: { launchTimeout: 60000 } });
    await mongoose.connect(mongoServer.getUri());
    await Promise.all([Book.syncIndexes(), User.syncIndexes(), Category.syncIndexes()]);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) await mongoServer.stop();
  });

  beforeEach(async () => {
    await Promise.all([Book.deleteMany({}), User.deleteMany({}), Category.deleteMany({})]);
    author = await User.create({ name: 'MRP Author', email: 'mrp-author@example.com', password: 'password123', role: 'author' });
    category = await Category.create({ name: 'MRP Category', slug: 'mrp-category' });
  });

  const bookPayload = (overrides = {}) => {
    const id = new mongoose.Types.ObjectId();
    return {
    title: `MRP Book ${id}`,
    slug: `mrp-book-${id}`,
    description: 'MRP compatibility book',
    author: author._id,
    category: category._id,
    ...overrides
  };
  };

  it('accepts canonical mrp and synchronizes legacy price', async () => {
    const book = await Book.create(bookPayload({ mrp: 499 }));

    expect(book.mrp).toBe(499);
    expect(book.price).toBe(499);
  });

  it('accepts legacy price and backfills mrp for compatibility', async () => {
    const book = await Book.create(bookPayload({ price: 399 }));

    expect(book.mrp).toBe(399);
    expect(book.price).toBe(399);
  });

  it('rejects conflicting mrp and legacy price values', async () => {
    await expect(Book.create(bookPayload({ mrp: 499, price: 599 })))
      .rejects.toThrow(/MRP and legacy price must match/);
  });

  it('supports partial updates without requiring mrp and synchronizes price changes', async () => {
    const book = await Book.create(bookPayload({ mrp: 300 }));

    const titleOnly = await Book.findByIdAndUpdate(
      book._id,
      { title: 'Updated MRP Book' },
      { returnDocument: 'after', runValidators: true }
    );
    expect(titleOnly.title).toBe('Updated MRP Book');
    expect(titleOnly.mrp).toBe(300);
    expect(titleOnly.price).toBe(300);

    const updatedPrice = await Book.findByIdAndUpdate(
      book._id,
      { price: 350 },
      { returnDocument: 'after', runValidators: true }
    );
    expect(updatedPrice.mrp).toBe(350);
    expect(updatedPrice.price).toBe(350);

    const updatedMrp = await Book.findByIdAndUpdate(
      book._id,
      { mrp: 420 },
      { returnDocument: 'after', runValidators: true }
    );
    expect(updatedMrp.mrp).toBe(420);
    expect(updatedMrp.price).toBe(420);
  });

  it('synchronizes price and mrp across updateOne and updateMany', async () => {
    const book = await Book.create(bookPayload({ mrp: 300 }));

    await Book.updateOne({ _id: book._id }, { mrp: 500 });
    let fetched = await Book.findById(book._id).lean();
    expect(fetched.mrp).toBe(500);
    expect(fetched.price).toBe(500);

    await Book.updateMany({ _id: book._id }, { price: 600 });
    fetched = await Book.findById(book._id).lean();
    expect(fetched.mrp).toBe(600);
    expect(fetched.price).toBe(600);
  });

  it('rejects invalid or negative pricing values', async () => {
    await expect(Book.create(bookPayload({ mrp: -100 }))).rejects.toThrow();
    await expect(Book.create(bookPayload({ price: -50 }))).rejects.toThrow();
    await expect(Book.create(bookPayload({ mrp: null }))).rejects.toThrow();
  });

  it('builds an idempotent migration plan and reports conflicts without dry-run writes', async () => {
    const legacy = await Book.collection.insertOne(bookPayload({ price: 250 }));
    await Book.collection.insertOne(bookPayload({ price: 300, mrp: 300 }));
    await Book.collection.insertOne(bookPayload({ price: 400, mrp: 450 }));
    await Book.collection.insertOne(bookPayload({ title: 'Missing Price', description: 'Missing price', author: author._id, category: category._id }));

    const report = await buildBookMrpMigrationPlan();

    expect(report.summary.totalBooks).toBe(4);
    expect(report.summary.alreadyMigrated).toBe(1);
    expect(report.summary.backfilled).toBe(1);
    expect(report.summary.conflicts).toBe(1);
    expect(report.summary.missingPrice).toBe(1);
    expect((await Book.collection.findOne({ _id: legacy.insertedId })).mrp).toBeUndefined();
  });

  it('applies migration updates safely and reruns without duplicate work', async () => {
    const legacy = await Book.collection.insertOne(bookPayload({ price: 275 }));
    const report = await buildBookMrpMigrationPlan({ options: { dryRun: false } });

    await applyBookMrpMigrationPlan(report);

    const migrated = await Book.findById(legacy.insertedId).lean();
    expect(migrated.mrp).toBe(275);
    expect(migrated.price).toBe(275);

    const rerun = await buildBookMrpMigrationPlan({ options: { dryRun: true } });
    expect(rerun.summary.backfilled).toBe(0);
    expect(rerun.summary.alreadyMigrated).toBe(1);
  });
});
