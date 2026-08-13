require('dotenv').config({ quiet: true });

const mongoose = require('mongoose');
const Book = require('../src/models/Book');
const logger = require('../src/utils/logger');

const DEFAULT_OPTIONS = {
  dryRun: true,
  useTransaction: true
};

const parseBooleanFlag = (value, fallback = false) => {
  if (value === undefined) return fallback;
  return ['true', '1', 'yes'].includes(String(value).toLowerCase());
};

const hasValue = (value) => value !== undefined && value !== null;
const isValidAmount = (value) => Number.isFinite(Number(value)) && Number(value) >= 0;

const createEmptyReport = (options) => ({
  dryRun: options.dryRun,
  startedAt: new Date(),
  completedAt: null,
  summary: {
    totalBooks: 0,
    alreadyMigrated: 0,
    backfilled: 0,
    invalidPrice: 0,
    missingPrice: 0,
    conflicts: 0,
    failed: 0
  },
  plannedUpdates: [],
  invalidPrices: [],
  missingPrices: [],
  conflicts: [],
  errors: []
});

async function buildBookMrpMigrationPlan({ bookModel = Book, options = DEFAULT_OPTIONS } = {}) {
  const migrationOptions = { ...DEFAULT_OPTIONS, ...options };
  const report = createEmptyReport(migrationOptions);
  const books = await bookModel.find({}).select('_id title slug price mrp').lean();

  report.summary.totalBooks = books.length;

  books.forEach((book) => {
    const bookId = String(book._id);
    const hasPrice = hasValue(book.price);
    const hasMrp = hasValue(book.mrp);

    if (hasMrp && hasPrice && Number(book.mrp) !== Number(book.price)) {
      report.conflicts.push({
        bookId,
        title: book.title,
        slug: book.slug,
        price: book.price,
        mrp: book.mrp
      });
      return;
    }

    if (hasMrp) {
      report.summary.alreadyMigrated += 1;
      return;
    }

    if (!hasPrice) {
      report.missingPrices.push({ bookId, title: book.title, slug: book.slug });
      return;
    }

    if (!isValidAmount(book.price)) {
      report.invalidPrices.push({
        bookId,
        title: book.title,
        slug: book.slug,
        price: book.price
      });
      return;
    }

    report.plannedUpdates.push({
      bookId,
      title: book.title,
      slug: book.slug,
      update: {
        mrp: Number(book.price),
        price: Number(book.price)
      }
    });
  });

  report.summary.backfilled = report.plannedUpdates.length;
  report.summary.invalidPrice = report.invalidPrices.length;
  report.summary.missingPrice = report.missingPrices.length;
  report.summary.conflicts = report.conflicts.length;
  report.completedAt = new Date();

  return report;
}

async function applyBookMrpMigrationPlan(report, { bookModel = Book, session } = {}) {
  for (const item of report.plannedUpdates) {
    try {
      await bookModel.updateOne(
        { _id: item.bookId },
        { $set: item.update },
        { session, runValidators: true }
      );
    } catch (error) {
      report.summary.failed += 1;
      report.errors.push({
        bookId: item.bookId,
        message: error.message
      });
      throw error;
    }
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

async function runBookMrpMigration(inputOptions = {}) {
  const options = { ...DEFAULT_OPTIONS, ...inputOptions };
  logger.info('book_mrp_migration.started', { dryRun: options.dryRun });

  const report = await buildBookMrpMigrationPlan({ options });

  if (!options.dryRun && report.plannedUpdates.length) {
    if (report.conflicts.length > 0) {
      throw new Error('Book MRP migration has price/MRP conflicts. Resolve conflicts before applying.');
    }

    await withOptionalTransaction(
      (session) => applyBookMrpMigrationPlan(report, { session }),
      options
    );
  }

  logger.info('book_mrp_migration.completed', {
    dryRun: options.dryRun,
    summary: report.summary
  });

  return report;
}

async function runCli() {
  const args = new Set(process.argv.slice(2));
  const dryRun = !args.has('--apply') && !parseBooleanFlag(process.env.BOOK_MRP_MIGRATION_APPLY, false);
  const useTransaction = !args.has('--no-transaction');

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is required to run book MRP migration');
  }

  await mongoose.connect(process.env.MONGODB_URI);
  const report = await runBookMrpMigration({ dryRun, useTransaction });
  console.log(JSON.stringify(report, null, 2));
  await mongoose.disconnect();
}

if (require.main === module) {
  runCli().catch(async (error) => {
    logger.error('book_mrp_migration.failed', { message: error.message });
    console.error(error.message);
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
    process.exit(1);
  });
}

module.exports = {
  buildBookMrpMigrationPlan,
  applyBookMrpMigrationPlan,
  runBookMrpMigration
};
