const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../src/models/User');
const AuthorAccessPlan = require('../src/models/AuthorAccessPlan');
const AuthorAccessPurchase = require('../src/models/AuthorAccessPurchase');
const AuthorAccessEntitlement = require('../src/models/AuthorAccessEntitlement');

async function runAuthorAccessAudit(options = {}) {
  const isJson = options.json || process.argv.includes('--json');

  const [
    authors,
    entitlements,
    plans,
    purchases
  ] = await Promise.all([
    User.find({ role: 'author' }).select('_id name email createdAt').lean(),
    AuthorAccessEntitlement.find({ feature: 'AUTHOR_DASHBOARD' }).lean(),
    AuthorAccessPlan.find().lean(),
    AuthorAccessPurchase.find().lean()
  ]);

  const entitlementMap = new Map();
  entitlements.forEach(e => {
    entitlementMap.set(String(e.user), e);
  });

  let activeCount = 0;
  let revokedCount = 0;
  let noPlanCount = 0;

  const authorDetails = authors.map(author => {
    const ent = entitlementMap.get(String(author._id));
    let status = 'APPROVED_AUTHOR_NO_PLAN';
    if (ent) {
      if (ent.status === 'ACTIVE') {
        activeCount++;
        status = 'ACTIVE';
      } else if (ent.status === 'REVOKED') {
        revokedCount++;
        status = 'REVOKED';
      }
    } else {
      noPlanCount++;
    }

    return {
      id: author._id,
      name: author.name,
      email: author.email,
      dashboardStatus: status,
      entitlementSource: ent ? ent.source : null
    };
  });

  const report = {
    summary: {
      totalAuthors: authors.length,
      activeEntitlements: activeCount,
      revokedEntitlements: revokedCount,
      authorsWithoutPlan: noPlanCount,
      totalPlans: plans.length,
      totalPurchases: purchases.length
    },
    authors: authorDetails
  };

  if (isJson) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log('\n--- AUTHOR ACCESS AUDIT REPORT ---');
    console.log(`Total Authors: ${report.summary.totalAuthors}`);
    console.log(`Active Entitlements: ${report.summary.activeEntitlements}`);
    console.log(`Revoked Entitlements: ${report.summary.revokedEntitlements}`);
    console.log(`Authors Without Paid Plan: ${report.summary.authorsWithoutPlan}`);
    console.log(`Total Configured Plans: ${report.summary.totalPlans}`);
    console.log(`Total Access Purchases: ${report.summary.totalPurchases}`);
    console.log('-----------------------------------\n');
  }

  return report;
}

if (require.main === module) {
  const dbUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/hm_backend';
  mongoose
    .connect(dbUri)
    .then(async () => {
      await runAuthorAccessAudit();
      await mongoose.disconnect();
      process.exit(0);
    })
    .catch(err => {
      console.error('Audit failed:', err);
      process.exit(1);
    });
}

module.exports = {
  runAuthorAccessAudit
};
