require('dotenv').config({ quiet: true });

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const contentService = require('../src/services/contentService');
const logger = require('../src/utils/logger');

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const forceProduction = args.includes('--force-production');
const fileIndex = args.indexOf('--file');
const inputPath = fileIndex >= 0 ? args[fileIndex + 1] : path.join(process.cwd(), 'data', 'site-content-seed.json');

const fail = (message) => {
  const error = new Error(message);
  error.isUsageError = true;
  throw error;
};

const readPayload = () => {
  if (!inputPath || !fs.existsSync(inputPath)) {
    fail(`Content seed file not found: ${inputPath}. Pass --file <path-to-site-content-seed.json>.`);
  }
  const parsed = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
    fail('Content seed must be a JSON object');
  }
  return parsed;
};

const changedFields = (current = {}, payload = {}) => Object.keys(payload).filter(
  (key) => JSON.stringify(current[key]) !== JSON.stringify(payload[key])
);

async function run() {
  if (!process.env.MONGODB_URI) fail('MONGODB_URI is required');
  if (apply && process.env.NODE_ENV === 'production' && !forceProduction) {
    fail('Refusing production content seed apply without --force-production');
  }

  const payload = readPayload();
  await mongoose.connect(process.env.MONGODB_URI);
  const current = await contentService.getAdminContent();
  const report = {
    mode: apply ? 'apply' : 'dry-run',
    file: path.resolve(inputPath),
    suppliedFields: Object.keys(payload).length,
    changedFields: changedFields(current || {}, payload),
  };

  if (apply) {
    await contentService.updateGlobalContent(payload, null);
    const stored = await contentService.getAdminContent();
    report.applied = true;
    report.remainingDifferences = changedFields(stored || {}, payload);
  } else {
    report.applied = false;
  }

  logger.info('content_seed.completed', report);
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

run()
  .catch((error) => {
    logger.error('content_seed.failed', { message: error.message });
    process.stderr.write(`Content seed failed: ${error.message}\n`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => {});
  });
