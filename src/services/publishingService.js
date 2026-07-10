const publishingRepository = require('../repositories/publishingRepository');

class PublishingService {
  constructor(repository = publishingRepository) {
    this.repository = repository;
  }

  createPublishRequest(user, payload) {
    const { title, genre, wordCount, packageId, fileUrl } = payload;
    if (!title || !genre || !wordCount || !packageId || !fileUrl) {
      const error = new Error('All fields are required');
      error.statusCode = 400;
      throw error;
    }

    return this.repository.createPublishRequest({
      user: user._id,
      title,
      genre,
      wordCount,
      packageId,
      fileUrl
    });
  }

  listActivePackages() {
    return this.repository.listActivePackages();
  }
}

module.exports = new PublishingService();
module.exports.PublishingService = PublishingService;
