require('dotenv').config();
const mongoose = require('mongoose');
const ManualRoyaltyStatement = require('../src/models/ManualRoyaltyStatement');
const logger = require('../src/utils/logger');

mongoose.set('autoIndex', false);

const APPLY = process.argv.includes('--apply');
const INDEX_NAME = 'createdBy_1_idempotencyKey_1';

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const indexes = await ManualRoyaltyStatement.collection.indexes();
  const exists = indexes.some((index) => index.name === INDEX_NAME);
  const report = {
    mode: APPLY ? 'apply' : 'dry-run',
    index: INDEX_NAME,
    exists,
    requiresMigration: !exists,
    changed: false
  };

  if (APPLY && !exists) {
    await ManualRoyaltyStatement.collection.createIndex(
      { createdBy: 1, idempotencyKey: 1 },
      {
        name: INDEX_NAME,
        unique: true,
        partialFilterExpression: { idempotencyKey: { $type: 'string' } }
      }
    );
    report.changed = true;
  }

  console.log(JSON.stringify(report, null, 2));
  logger.info('manual_royalty_index.migration_completed', report);
  await mongoose.disconnect();
};

run().catch(async (error) => {
  logger.error('manual_royalty_index.migration_failed', { message: error.message, mode: APPLY ? 'apply' : 'dry-run' });
  try { await mongoose.disconnect(); } catch (_) { /* no-op */ }
  process.exit(1);
});
