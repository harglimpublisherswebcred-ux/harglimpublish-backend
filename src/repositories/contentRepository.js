const Content = require('../models/Content');

class ContentRepository {
  findGlobal({ includeAdmin = false } = {}) {
    const query = Content.findOne({ key: 'global' });
    if (includeAdmin) query.select('+adminProfileImage');
    return query.lean();
  }

  upsertGlobal(data) {
    return Content.findOneAndUpdate(
      { key: 'global' },
      { $set: data, $setOnInsert: { key: 'global' } },
      { returnDocument: 'after', upsert: true, runValidators: true }
    ).lean();
  }
}

module.exports = new ContentRepository();
module.exports.ContentRepository = ContentRepository;
