require('dotenv').config({ quiet: true });

const mongoose = require('mongoose');
const Category = require('../src/models/Category');
const Book = require('../src/models/Book');
const logger = require('../src/utils/logger');
const { slugify } = require('../src/services/categoryService');

const DEFAULT_OPTIONS = {
  dryRun: true,
  useTransaction: true
};

const parseBooleanFlag = (value, fallback = false) => {
  if (value === undefined) return fallback;
  return ['true', '1', 'yes'].includes(String(value).toLowerCase());
};

const normalizeName = (value) => String(value || '').trim().toLowerCase();

const uniqueSlug = (baseSlug, usedSlugs, categoryId) => {
  const base = baseSlug || `category-${categoryId}`;
  let candidate = base;
  let suffix = 2;

  while (usedSlugs.has(candidate) && usedSlugs.get(candidate) !== String(categoryId)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  usedSlugs.set(candidate, String(categoryId));
  return candidate;
};

const groupDuplicates = (items, keyFn) => {
  const groups = new Map();
  items.forEach((item) => {
    const key = keyFn(item);
    if (!key) return;
    const values = groups.get(key) || [];
    values.push(item);
    groups.set(key, values);
  });

  return [...groups.entries()]
    .filter(([, values]) => values.length > 1)
    .map(([value, values]) => ({
      value,
      categoryIds: values.map((item) => String(item._id)),
      count: values.length
    }));
};

const createEmptyReport = (options) => ({
  dryRun: options.dryRun,
  startedAt: new Date(),
  completedAt: null,
  summary: {
    categoriesScanned: 0,
    booksScanned: 0,
    categorySlugUpdates: 0,
    activeFieldUpdates: 0,
    bookCountUpdates: 0,
    orphanBookReferences: 0,
    duplicateSlugGroups: 0,
    duplicateNameGroups: 0
  },
  plannedUpdates: [],
  orphanBooks: [],
  duplicateSlugs: [],
  duplicateNames: [],
  errors: []
});

async function buildCategoryMigrationPlan({ categoryModel = Category, bookModel = Book, options = DEFAULT_OPTIONS } = {}) {
  const migrationOptions = { ...DEFAULT_OPTIONS, ...options };
  const report = createEmptyReport(migrationOptions);

  const [categories, books] = await Promise.all([
    categoryModel.find({}).lean(),
    bookModel.find({}).select('_id title slug category').lean()
  ]);

  report.summary.categoriesScanned = categories.length;
  report.summary.booksScanned = books.length;

  const categoryIds = new Set(categories.map((category) => String(category._id)));
  const usedSlugs = new Map();
  categories.forEach((category) => {
    if (category.slug) usedSlugs.set(category.slug, String(category._id));
  });

  const bookCounts = new Map();
  books.forEach((book) => {
    if (!book.category || !categoryIds.has(String(book.category))) {
      report.orphanBooks.push({
        bookId: String(book._id),
        title: book.title,
        slug: book.slug,
        category: book.category ? String(book.category) : null
      });
      return;
    }
    const categoryId = String(book.category);
    bookCounts.set(categoryId, (bookCounts.get(categoryId) || 0) + 1);
  });

  report.duplicateSlugs = groupDuplicates(categories, (category) => category.slug);
  report.duplicateNames = groupDuplicates(categories, (category) => normalizeName(category.name));

  report.summary.orphanBookReferences = report.orphanBooks.length;
  report.summary.duplicateSlugGroups = report.duplicateSlugs.length;
  report.summary.duplicateNameGroups = report.duplicateNames.length;

  categories.forEach((category) => {
    const update = {};
    const reasons = [];
    const categoryId = String(category._id);

    if (!category.slug) {
      update.slug = uniqueSlug(slugify(category.name), usedSlugs, categoryId);
      reasons.push('missing_slug');
    }

    if (category.active === undefined) {
      update.active = category.isActive === undefined ? true : Boolean(category.isActive);
      reasons.push('missing_active');
    }

    const expectedBookCount = bookCounts.get(categoryId) || 0;
    if (category.bookCount !== expectedBookCount) {
      update.bookCount = expectedBookCount;
      reasons.push('book_count_mismatch');
    }

    if (Object.keys(update).length) {
      report.plannedUpdates.push({
        categoryId,
        name: category.name,
        slug: category.slug,
        update,
        reasons
      });
    }
  });

  report.summary.categorySlugUpdates = report.plannedUpdates.filter((item) => item.reasons.includes('missing_slug')).length;
  report.summary.activeFieldUpdates = report.plannedUpdates.filter((item) => item.reasons.includes('missing_active')).length;
  report.summary.bookCountUpdates = report.plannedUpdates.filter((item) => item.reasons.includes('book_count_mismatch')).length;
  report.completedAt = new Date();

  return report;
}

async function applyCategoryMigrationPlan(report, { categoryModel = Category, session } = {}) {
  for (const item of report.plannedUpdates) {
    await categoryModel.updateOne(
      { _id: item.categoryId },
      { $set: item.update },
      { session }
    );
  }
}

async function withOptionalTransaction(callback, options = {}) {
  if (!options.useTransaction) return callback();

  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const result = await callback(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

async function runCategoryMigration(inputOptions = {}) {
  const options = { ...DEFAULT_OPTIONS, ...inputOptions };
  logger.info('category_migration.started', { dryRun: options.dryRun });

  const report = await buildCategoryMigrationPlan({ options });

  if (!options.dryRun && report.plannedUpdates.length) {
    await withOptionalTransaction(
      (session) => applyCategoryMigrationPlan(report, { session }),
      options
    );
  }

  logger.info('category_migration.completed', {
    dryRun: options.dryRun,
    summary: report.summary
  });

  return report;
}

async function runCli() {
  const args = new Set(process.argv.slice(2));
  const dryRun = !args.has('--apply') && !parseBooleanFlag(process.env.CATEGORY_MIGRATION_APPLY, false);
  const useTransaction = !args.has('--no-transaction');

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is required to run category migration');
  }

  await mongoose.connect(process.env.MONGODB_URI);
  const report = await runCategoryMigration({ dryRun, useTransaction });
  console.log(JSON.stringify(report, null, 2));
  await mongoose.disconnect();
}

if (require.main === module) {
  runCli().catch(async (error) => {
    logger.error('category_migration.failed', { message: error.message });
    console.error(error.message);
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
    process.exit(1);
  });
}

module.exports = {
  buildCategoryMigrationPlan,
  applyCategoryMigrationPlan,
  runCategoryMigration,
  uniqueSlug,
  groupDuplicates
};
