const PublishRequest = require('../models/PublishRequest');
const PublishPackage = require('../models/PublishPackage');

class PublishingRepository {
  createPublishRequest(data) {
    return PublishRequest.create(data);
  }

  listActivePackages() {
    return PublishPackage.find({ isActive: true });
  }
}

module.exports = new PublishingRepository();
module.exports.PublishingRepository = PublishingRepository;
