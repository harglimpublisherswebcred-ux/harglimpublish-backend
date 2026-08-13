require('dotenv').config({ quiet: true });

const mongoose = require('mongoose');
const Payment = require('../src/models/Payment');
const PaymentLedger = require('../src/models/PaymentLedger');
const logger = require('../src/utils/logger');

const DEFAULT_OPTIONS = {
  dryRun: true,
  useTransaction: true
};

const parseBooleanFlag = (value, fallback = false) => {
  if (value === undefined) return fallback;
  return ['true', '1', 'yes'].includes(String(value).toLowerCase());
};

const createEmptyReport = (options) => ({
  dryRun: options.dryRun,
  startedAt: new Date(),
  completedAt: null,
  summary: {
    totalPayments: 0,
    alreadyMigratedPayments: 0,
    backfilledPayments: 0,
    missingOrderPayments: 0,
    totalLedgerEntries: 0,
    alreadyMigratedLedger: 0,
    backfilledLedger: 0,
    missingOrderLedger: 0,
    failed: 0
  },
  plannedPaymentUpdates: [],
  plannedLedgerUpdates: [],
  missingOrderPayments: [],
  missingOrderLedgers: [],
  errors: []
});

async function buildPaymentPurposeMigrationPlan({
  paymentModel = Payment,
  ledgerModel = PaymentLedger,
  options = DEFAULT_OPTIONS
} = {}) {
  const migrationOptions = { ...DEFAULT_OPTIONS, ...options };
  const report = createEmptyReport(migrationOptions);

  const payments = await paymentModel.find({}).select('_id order user purpose subjectType subjectId status').lean();
  report.summary.totalPayments = payments.length;

  payments.forEach((payment) => {
    const paymentId = String(payment._id);

    if (payment.purpose) {
      report.summary.alreadyMigratedPayments += 1;
      return;
    }

    if (!payment.order) {
      report.missingOrderPayments.push({
        paymentId,
        user: payment.user ? String(payment.user) : undefined,
        status: payment.status
      });
      return;
    }

    report.plannedPaymentUpdates.push({
      paymentId: payment._id,
      update: {
        purpose: 'ORDER_PURCHASE',
        subjectType: 'ORDER',
        subjectId: payment.order
      }
    });
  });

  report.summary.backfilledPayments = report.plannedPaymentUpdates.length;
  report.summary.missingOrderPayments = report.missingOrderPayments.length;

  const ledgers = await ledgerModel.find({}).select('_id paymentId orderId purpose subjectType subjectId').lean();
  report.summary.totalLedgerEntries = ledgers.length;

  ledgers.forEach((ledger) => {
    const ledgerId = String(ledger._id);

    if (ledger.purpose) {
      report.summary.alreadyMigratedLedger += 1;
      return;
    }

    if (!ledger.orderId) {
      report.missingOrderLedgers.push({
        ledgerId,
        paymentId: ledger.paymentId ? String(ledger.paymentId) : undefined
      });
      return;
    }

    report.plannedLedgerUpdates.push({
      ledgerId: ledger._id,
      update: {
        purpose: 'ORDER_PURCHASE',
        subjectType: 'ORDER',
        subjectId: ledger.orderId
      }
    });
  });

  report.summary.backfilledLedger = report.plannedLedgerUpdates.length;
  report.summary.missingOrderLedger = report.missingOrderLedgers.length;
  report.completedAt = new Date();

  return report;
}

async function applyPaymentPurposeMigrationPlan(report, {
  paymentModel = Payment,
  ledgerModel = PaymentLedger,
  session = null
} = {}) {
  const options = { session };

  for (const item of report.plannedPaymentUpdates) {
    await paymentModel.updateOne(
      { _id: item.paymentId },
      { $set: item.update },
      options
    );
  }

  for (const item of report.plannedLedgerUpdates) {
    await ledgerModel.collection.updateOne(
      { _id: item.ledgerId },
      { $set: item.update },
      options
    );
  }

  return {
    appliedPayments: report.plannedPaymentUpdates.length,
    appliedLedgerEntries: report.plannedLedgerUpdates.length
  };
}

async function runPaymentPurposeMigration(inputOptions = {}) {
  const options = {
    dryRun: inputOptions.dryRun !== undefined ? inputOptions.dryRun : !process.argv.includes('--apply'),
    useTransaction: inputOptions.useTransaction !== undefined ? inputOptions.useTransaction : !process.argv.includes('--no-transaction')
  };

  const hasDbConnection = mongoose.connection && mongoose.connection.readyState === 1;
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/hm_backend';

  if (!hasDbConnection) {
    await mongoose.connect(mongoUri);
  }

  try {
    const report = await buildPaymentPurposeMigrationPlan({ options });

    logger.info('payment_purpose_migration.plan_built', {
      dryRun: report.dryRun,
      summary: report.summary
    });

    if (report.dryRun) {
      return report;
    }

    const supportsTransactions = Boolean(mongoose.connection.client && mongoose.connection.client.topology && mongoose.connection.client.topology.hasSession);
    const shouldUseTransaction = options.useTransaction && supportsTransactions;

    if (shouldUseTransaction) {
      const session = await mongoose.startSession();
      try {
        await session.withTransaction(async () => {
          await applyPaymentPurposeMigrationPlan(report, { session });
        });
      } finally {
        await session.endSession();
      }
    } else {
      await applyPaymentPurposeMigrationPlan(report);
    }

    report.completedAt = new Date();
    logger.info('payment_purpose_migration.applied', { summary: report.summary });

    return report;
  } finally {
    if (!hasDbConnection) {
      await mongoose.disconnect();
    }
  }
}

if (require.main === module) {
  runPaymentPurposeMigration()
    .then((report) => {
      console.log('\n--- PAYMENT PURPOSE MIGRATION REPORT ---');
      console.log(`Mode: ${report.dryRun ? 'DRY-RUN' : 'APPLIED'}`);
      console.log(`Total Payments: ${report.summary.totalPayments}`);
      console.log(`Already Migrated Payments: ${report.summary.alreadyMigratedPayments}`);
      console.log(`Backfilled Payments: ${report.summary.backfilledPayments}`);
      console.log(`Missing Order Payments: ${report.summary.missingOrderPayments}`);
      console.log(`Total Ledger Entries: ${report.summary.totalLedgerEntries}`);
      console.log(`Already Migrated Ledger Entries: ${report.summary.alreadyMigratedLedger}`);
      console.log(`Backfilled Ledger Entries: ${report.summary.backfilledLedger}`);
      console.log(`Missing Order Ledger Entries: ${report.summary.missingOrderLedger}`);
      console.log('---------------------------------------\n');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = {
  buildPaymentPurposeMigrationPlan,
  applyPaymentPurposeMigrationPlan,
  runPaymentPurposeMigration
};
