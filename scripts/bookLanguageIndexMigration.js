require('dotenv').config();
const mongoose = require('mongoose');
const Book = require('../src/models/Book');
const logger = require('../src/utils/logger');

mongoose.set('autoIndex', false);

const APPLY = process.argv.includes('--apply');
const EXPECTED_OVERRIDE = '_searchLanguage';

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const indexes = await Book.collection.indexes();
  const textIndex = indexes.find((index) => Object.values(index.key || {}).includes('text'));
  const report = {
    mode: APPLY ? 'apply' : 'dry-run',
    currentTextIndex: textIndex ? {
      name: textIndex.name,
      key: textIndex.key,
      languageOverride: textIndex.language_override || 'language'
    } : null,
    expectedLanguageOverride: EXPECTED_OVERRIDE,
    requiresMigration: !textIndex || textIndex.language_override !== EXPECTED_OVERRIDE,
    changed: false
  };

  if (APPLY && report.requiresMigration) {
    if (textIndex) await Book.collection.dropIndex(textIndex.name);
    try {
      await Book.collection.createIndex(
        { title: 'text', description: 'text' },
        { name: textIndex?.name || 'title_text_description_text', language_override: EXPECTED_OVERRIDE }
      );
    } catch (error) {
      if (textIndex) {
        const originalTextKeys = Object.fromEntries(
          Object.keys(textIndex.weights || { title: 1, description: 1 }).map((field) => [field, 'text'])
        );
        await Book.collection.createIndex(originalTextKeys, {
          name: textIndex.name,
          language_override: textIndex.language_override || 'language',
          default_language: textIndex.default_language || 'english',
          ...(textIndex.weights && { weights: textIndex.weights })
        });
      }
      throw error;
    }
    report.changed = true;
  }

  console.log(JSON.stringify(report, null, 2));
  logger.info('book_language_index.migration_completed', report);
  await mongoose.disconnect();
};

run().catch(async (error) => {
  logger.error('book_language_index.migration_failed', { message: error.message, mode: APPLY ? 'apply' : 'dry-run' });
  try { await mongoose.disconnect(); } catch (_) { /* no-op */ }
  process.exit(1);
});
