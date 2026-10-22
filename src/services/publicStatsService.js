const publicStatsRepository = require('../repositories/publicStatsRepository');

class PublicStatsService {
  constructor(repository = publicStatsRepository) {
    this.repository = repository;
  }

  async getPublicStats() {
    const [booksCount, authorsCount] = await Promise.all([
      this.repository.countPublishedBooks(),
      this.repository.countActiveAuthors(),
    ]);
    return { booksCount, authorsCount };
  }
}

module.exports = new PublicStatsService();
module.exports.PublicStatsService = PublicStatsService;
