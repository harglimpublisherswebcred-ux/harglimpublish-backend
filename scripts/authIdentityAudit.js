require('dotenv').config();
const mongoose = require('mongoose');
const AuthIdentity = require('../src/models/AuthIdentity');
const User = require('../src/models/User');
const logger = require('../src/utils/logger');

const run = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is required');

  await mongoose.connect(uri);

  const [googleIdentityCount, duplicateProviderSubjects, duplicateUserProviders] = await Promise.all([
    AuthIdentity.countDocuments({ provider: 'GOOGLE' }),
    AuthIdentity.aggregate([
      { $group: { _id: { provider: '$provider', providerSubject: '$providerSubject' }, count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } },
      { $count: 'count' }
    ]),
    AuthIdentity.aggregate([
      { $group: { _id: { user: '$user', provider: '$provider' }, count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } },
      { $count: 'count' }
    ])
  ]);

  const identities = await AuthIdentity.find({}).select('user provider').lean();
  const userIds = identities.map((identity) => identity.user).filter(Boolean);
  const existingUsers = await User.find({ _id: { $in: userIds } }).select('_id').lean();
  const existingUserIds = new Set(existingUsers.map((user) => user._id.toString()));
  const missingUsers = identities.filter((identity) => !identity.user || !existingUserIds.has(identity.user.toString())).length;

  const report = {
    googleIdentityCount,
    duplicateProviderSubjectGroups: duplicateProviderSubjects[0]?.count || 0,
    duplicateUserProviderGroups: duplicateUserProviders[0]?.count || 0,
    identitiesReferencingMissingUsers: missingUsers
  };

  console.log(JSON.stringify(report, null, 2));
  logger.info('auth_identity_audit.completed', report);
};

run()
  .catch((error) => {
    logger.error('auth_identity_audit.failed', { message: error.message });
    console.error(`Auth identity audit failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  });
