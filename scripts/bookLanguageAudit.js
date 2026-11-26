require('dotenv').config();
const mongoose = require('mongoose');
const Book = require('../src/models/Book');
const logger = require('../src/utils/logger');

mongoose.set('autoIndex', false);

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const books = await Book.find({}).select('_id title slug language').sort({ _id: 1 }).lean();
  const missing = [];
  const blank = [];
  const invalidType = [];

  for (const book of books) {
    if (!Object.prototype.hasOwnProperty.call(book, 'language') || book.language === null) {
      missing.push(book);
    } else if (typeof book.language !== 'string') {
      invalidType.push(book);
    } else if (!book.language.trim()) {
      blank.push(book);
    }
  }

  const compact = (book) => ({ id: String(book._id), title: book.title, slug: book.slug });
  const report = {
    scanned: books.length,
    valid: books.length - missing.length - blank.length - invalidType.length,
    missingOrNull: missing.length,
    blank: blank.length,
    invalidType: invalidType.length,
    recordsRequiringVerifiedLanguage: [...missing, ...blank, ...invalidType].map(compact),
    writesPerformed: 0
  };
  console.log(JSON.stringify(report, null, 2));
  logger.info('book_language.audit_completed', {
    scanned: report.scanned,
    valid: report.valid,
    requiringReview: report.recordsRequiringVerifiedLanguage.length
  });
  await mongoose.disconnect();
};

run().catch(async (error) => {
  logger.error('book_language.audit_failed', { message: error.message });
  try { await mongoose.disconnect(); } catch (_) { /* no-op */ }
  process.exit(1);
});
