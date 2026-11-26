const PublishingTermsAcceptance = require('../models/PublishingTermsAcceptance');

class PublishingTermsRepository {
  create(data, options = {}) {
    return PublishingTermsAcceptance.create([data], {
      ...(options.session ? { session: options.session } : {})
    }).then(([acceptance]) => acceptance);
  }

  findByUserAndVersion(userId, version, options = {}) {
    const query = PublishingTermsAcceptance.findOne({ user: userId, version });
    if (options.session) query.session(options.session);
    return options.lean === false ? query : query.lean();
  }

  findLatestByUser(userId) {
    return PublishingTermsAcceptance.findOne({ user: userId })
      .sort({ acceptedAt: -1 })
      .lean();
  }
}

module.exports = new PublishingTermsRepository();
module.exports.PublishingTermsRepository = PublishingTermsRepository;
