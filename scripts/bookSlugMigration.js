require('dotenv').config({ quiet: true });

const mongoose = require('mongoose');
const Book = require('../src/models/Book');
const logger = require('../src/utils/logger');
const { createBaseSlug, normalizeSlug, slugCandidate } = require('../src/utils/bookSlug');

const DEFAULT_OPTIONS = {
  dryRun: true,
  useTransaction: true
};

const parseBooleanFlag = (value, fallback = false) => {
  if (value === undefined) return fallback;
  return ['true', '1', 'yes'].includes(String(value).toLowerCase());
};

const isValidSlugValue = (value) => typeof value === 'string' && value.trim() !== '' && normalizeSlug(value) === value;

const createEmptyReport = (options) => ({
  dryRun: options.dryRun,
  startedAt: new Date(),
  completedAt: null,
  summary: {
    scanned: 0,
    totalBooks: 0,
    alreadyValid: 0,
    validSlugs: 0,
    missingSlugs: 0,
    nullSlugs: 0,
    emptySlugs: 0,
    duplicateSlugs: 0,
    proposedBackfills: 0,
    backfilled: 0,
    conflictsResolved: 0,
    failed: 0
  },
  plannedUpdates: [],
  duplicateSlugGroups: [],
  errors: []
});

const reserveSlug = (baseSlug, reserved) => {
  for (let attempt = 0; attempt < 1000; attempt += 1) {
    const candidate = slugCandidate(baseSlug, attempt);
    if (!reserved.has(candidate)) {
      reserved.add(candidate);
      return { slug: candidate, conflictsResolved: attempt > 0 };
    }
  }
  throw new Error(`Unable to reserve unique slug for base: ${baseSlug}`);
};

async function buildBookSlugMigrationPlan({ bookModel = Book, options = DEFAULT_OPTIONS } = {}) {
  const migrationOptions = { ...DEFAULT_OPTIONS, ...options };
  const report = createEmptyReport(migrationOptions);
  const books = await bookModel.find({}).select('_id title slug').sort({ createdAt: 1, _id: 1 }).lean();
  const slugGroups = new Map();
  const reserved = new Set();

  report.summary.totalBooks = books.length;
  report.summary.scanned = books.length;

  for (const book of books) {
    const slug = book.slug;
    if (slug === undefined) report.summary.missingSlugs += 1;
    else if (slug === null) report.summary.nullSlugs += 1;
    else if (String(slug).trim() === '') report.summary.emptySlugs += 1;

    if (isValidSlugValue(slug)) {
      const group = slugGroups.get(slug) || [];
      group.push(book);
      slugGroups.set(slug, group);
    }
  }

  for (const [slug, group] of slugGroups.entries()) {
    if (group.length > 1) {
      report.duplicateSlugGroups.push({
        slug,
        bookIds: group.map((book) => String(book._id))
      });
      report.summary.duplicateSlugs += group.length;
    }
  }

  for (const [slug, group] of slugGroups.entries()) {
    if (group.length === 1) {
      reserved.add(slug);
      report.summary.validSlugs += 1;
      report.summary.alreadyValid += 1;
      continue;
    }

    const [first, ...duplicates] = group;
    reserved.add(slug);
    report.summary.validSlugs += 1;
    report.summary.alreadyValid += 1;

    for (const book of duplicates) {
      const baseSlug = createBaseSlug(book.title, book._id);
      const reservedSlug = reserveSlug(baseSlug, reserved);
      report.plannedUpdates.push({
        bookId: String(book._id),
        title: book.title,
        currentSlug: book.slug,
        proposedSlug: reservedSlug.slug,
        reason: 'duplicate-slug'
      });
      report.summary.conflictsResolved += 1;
    }

    void first;
  }

  for (const book of books) {
    if (isValidSlugValue(book.slug)) continue;
    const baseSlug = createBaseSlug(book.title, book._id);
    const reservedSlug = reserveSlug(baseSlug, reserved);
    report.plannedUpdates.push({
      bookId: String(book._id),
      title: book.title,
      currentSlug: book.slug === undefined ? '<missing>' : book.slug,
      proposedSlug: reservedSlug.slug,
      reason: book.slug === undefined ? 'missing-slug' : (book.slug === null ? 'null-slug' : 'empty-slug')
    });
    if (reservedSlug.conflictsResolved) report.summary.conflictsResolved += 1;
  }

  report.summary.backfilled = report.plannedUpdates.length;
  report.summary.proposedBackfills = report.plannedUpdates.length;
  report.completedAt = new Date();
  return report;
}

async function applyBookSlugMigration({ bookModel = Book, options = DEFAULT_OPTIONS } = {}) {
  const migrationOptions = { ...DEFAULT_OPTIONS, ...options, dryRun: false };
  const report = await buildBookSlugMigrationPlan({ bookModel, options: migrationOptions });

  if (report.plannedUpdates.length === 0) return report;

  const session = migrationOptions.useTransaction ? await mongoose.startSession() : null;

  try {
    if (session) session.startTransaction();

    for (const update of report.plannedUpdates) {
      await bookModel.updateOne(
        { _id: update.bookId },
        { $set: { slug: update.proposedSlug } },
        { runValidators: true, session }
      );
    }

    if (session) await session.commitTransaction();
    return report;
  } catch (error) {
    report.summary.failed += 1;
    report.errors.push({ message: error.message });
    if (session) await session.abortTransaction();
    throw error;
  } finally {
    if (session) await session.endSession();
  }
}

async function run() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--apply') && !parseBooleanFlag(process.env.BOOK_SLUG_MIGRATION_APPLY, false);
  const options = {
    dryRun,
    useTransaction: !args.includes('--no-transaction')
  };

  await mongoose.connect(process.env.MONGODB_URI);
  const report = dryRun
    ? await buildBookSlugMigrationPlan({ options })
    : await applyBookSlugMigration({ options });

  console.log(JSON.stringify(report, null, 2));
  logger.info('book_slug_migration.completed', { dryRun, summary: report.summary });
  await mongoose.disconnect();
}

if (require.main === module) {
  run().catch(async (error) => {
    logger.error('book_slug_migration.failed', { message: error.message, stack: error.stack });
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
    process.exit(1);
  });
}

module.exports = {
  buildBookSlugMigrationPlan,
  applyBookSlugMigration
};
