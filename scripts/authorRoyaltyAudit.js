require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../src/config/database');
const Order = require('../src/models/Order');
const Book = require('../src/models/Book');

async function runAudit() {
  try {
    console.log('--- HISTORICAL AUTHOR ROYALTY SNAPSHOT AUDIT ---');
    await connectDB();

    const orders = await Order.find({
      $or: [
        { isPaid: true },
        { status: { $in: ['PROCESSING', 'SHIPPED', 'DELIVERED'] } }
      ]
    }).populate('items.book');

    let totalItems = 0;
    let itemsWithAuthorSnapshot = 0;
    let itemsWithoutAuthorSnapshot = 0;
    let itemsWithRoyaltySnapshot = 0;
    let itemsWithoutRoyaltySnapshot = 0;
    let itemsWithExistingBook = 0;
    let itemsWithMissingBook = 0;
    let completeSnapshotCount = 0;
    let legacyAttributableRateUnknownCount = 0;
    let legacyAmbiguousCount = 0;
    let knownRoyaltyAmountTotal = 0;
    let legacyGrossRevenueWithUnknownRoyalty = 0;

    orders.forEach((order) => {
      order.items.forEach((item) => {
        totalItems++;

        const hasAuthor = Boolean(item.author);
        const hasRoyalty = typeof item.royaltyPercentage === 'number';
        const bookExists = Boolean(item.book);
        const qty = item.quantity || 0;
        const price = item.price || 0;
        const gross = qty * price;

        if (hasAuthor) itemsWithAuthorSnapshot++;
        else itemsWithoutAuthorSnapshot++;

        if (hasRoyalty) itemsWithRoyaltySnapshot++;
        else itemsWithoutRoyaltySnapshot++;

        if (bookExists) itemsWithExistingBook++;
        else itemsWithMissingBook++;

        if (hasAuthor && hasRoyalty) {
          completeSnapshotCount++;
          knownRoyaltyAmountTotal += Math.round((gross * item.royaltyPercentage) / 100 * 100) / 100;
        } else if (bookExists && (item.author || item.book.author)) {
          legacyAttributableRateUnknownCount++;
          legacyGrossRevenueWithUnknownRoyalty += gross;
        } else {
          legacyAmbiguousCount++;
        }
      });
    });

    console.log(`Total Paid Order Items Evaluated: ${totalItems}`);
    console.log(`Items with Author Snapshot: ${itemsWithAuthorSnapshot}`);
    console.log(`Items without Author Snapshot: ${itemsWithoutAuthorSnapshot}`);
    console.log(`Items with Royalty Snapshot: ${itemsWithRoyaltySnapshot}`);
    console.log(`Items without Royalty Snapshot: ${itemsWithoutRoyaltySnapshot}`);
    console.log(`Items whose Book currently exists: ${itemsWithExistingBook}`);
    console.log(`Items whose Book is missing: ${itemsWithMissingBook}`);
    console.log('-----------------------------------------------');
    console.log(`Classification:`);
    console.log(`- COMPLETE_SNAPSHOT (Immutable Purchase-Time Data): ${completeSnapshotCount}`);
    console.log(`- LEGACY_ATTRIBUTABLE_RATE_UNKNOWN (Book Exists, Historical Royalty Rate Missing): ${legacyAttributableRateUnknownCount}`);
    console.log(`- LEGACY_AMBIGUOUS (Missing Book or Unprovable Attribution): ${legacyAmbiguousCount}`);
    console.log('-----------------------------------------------');
    console.log(`Financial Metrics:`);
    console.log(`- Known Royalty Amount Total: ₹${knownRoyaltyAmountTotal}`);
    console.log(`- Legacy Gross Revenue with Unknown Royalty: ₹${legacyGrossRevenueWithUnknownRoyalty}`);
    console.log(`- Unresolved Royalty Item Count: ${legacyAttributableRateUnknownCount + legacyAmbiguousCount}`);
    console.log('-----------------------------------------------');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Audit failed:', error.message);
    process.exit(1);
  }
}

runAudit();
