require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../src/config/database');
const User = require('../src/models/User');
const AuthorApplication = require('../src/models/AuthorApplication');
const logger = require('../src/utils/logger');

const includeDetails = process.argv.includes('--details');

const maskEmail = (email = '') => {
  const [name, domain] = String(email).split('@');
  if (!domain) return '<invalid-email>';
  return `${name.slice(0, 2)}***@${domain}`;
};

const classifyAuthor = (user, application) => {
  if (application && application.status === 'approved') return 'LEGITIMATE_APPROVED_AUTHOR';
  return 'UNPROVEN_PRIVILEGED_ACCOUNT';
};

const run = async () => {
  await connectDB();

  const [admins, authors, applications] = await Promise.all([
    User.find({ role: 'admin' }).select('_id email name createdAt').lean(),
    User.find({ role: 'author' }).select('_id email name createdAt').lean(),
    AuthorApplication.find({ status: 'approved' }).select('_id user status reviewedAt').lean()
  ]);

  const approvedByUser = new Map(applications.map((application) => [String(application.user), application]));
  const authorClassifications = authors.map((user) => ({
    user,
    classification: classifyAuthor(user, approvedByUser.get(String(user._id)))
  }));

  const summary = {
    adminsReviewed: admins.length,
    authorsReviewed: authors.length,
    legitimateAdmins: admins.length,
    legitimateApprovedAuthors: authorClassifications.filter((item) => item.classification === 'LEGITIMATE_APPROVED_AUTHOR').length,
    unprovenPrivilegedAccounts: authorClassifications.filter((item) => item.classification === 'UNPROVEN_PRIVILEGED_ACCOUNT').length,
    suspiciousPrivilegeAccounts: 0
  };

  console.log('Privileged user audit summary (read-only):');
  console.table(summary);

  if (includeDetails) {
    console.log('Admin accounts for operator review:');
    console.table(admins.map((user) => ({
      id: user._id.toString(),
      email: maskEmail(user.email),
      classification: 'LEGITIMATE_ADMIN_REQUIRES_OPERATOR_CONFIRMATION',
      createdAt: user.createdAt
    })));

    console.log('Author accounts for operator review:');
    console.table(authorClassifications.map(({ user, classification }) => ({
      id: user._id.toString(),
      email: maskEmail(user.email),
      classification,
      createdAt: user.createdAt
    })));
  }

  logger.info('privileged_user_audit.completed', summary);
};

run()
  .catch((error) => {
    logger.error('privileged_user_audit.failed', { message: error.message });
    console.error(`Privileged user audit failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });
