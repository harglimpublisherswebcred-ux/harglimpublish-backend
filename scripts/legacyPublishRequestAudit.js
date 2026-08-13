require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../src/config/database');
const PublishRequest = require('../src/models/PublishRequest');

async function runAudit() {
  try {
    console.log('--- LEGACY PUBLISH REQUEST AUDIT REPORT ---');
    await connectDB();

    const [
      totalRequests,
      linkedToBook,
      unlinkedLegacy,
      pendingRequests,
      approvedRequests,
      rejectedRequests,
      changesRequested
    ] = await Promise.all([
      PublishRequest.countDocuments(),
      PublishRequest.countDocuments({ book: { $exists: true, $ne: null } }),
      PublishRequest.countDocuments({ $or: [{ book: { $exists: false } }, { book: null }] }),
      PublishRequest.countDocuments({ status: { $in: ['PENDING', 'pending'] } }),
      PublishRequest.countDocuments({ status: { $in: ['APPROVED', 'accepted'] } }),
      PublishRequest.countDocuments({ status: { $in: ['REJECTED', 'rejected'] } }),
      PublishRequest.countDocuments({ status: 'CHANGES_REQUESTED' })
    ]);

    console.log(`Total PublishRequests: ${totalRequests}`);
    console.log(`Linked to Book: ${linkedToBook}`);
    console.log(`Unlinked Legacy Requests: ${unlinkedLegacy}`);
    console.log(`Pending Requests: ${pendingRequests}`);
    console.log(`Approved Requests: ${approvedRequests}`);
    console.log(`Rejected Requests: ${rejectedRequests}`);
    console.log(`Changes Requested: ${changesRequested}`);
    console.log('-------------------------------------------');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Audit failed:', error.message);
    process.exit(1);
  }
}

runAudit();
