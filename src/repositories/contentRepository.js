const Content = require('../models/Content');

class ContentRepository {
  findGlobal() {
    return Content.findOne({ key: 'global' }).lean();
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