const Spotlight = require('../models/Spotlight');
const User = require('../models/User');

class SpotlightRepository {
  findAuthorById(id) {
    return User.findOne({ _id: id, role: 'author', isActive: true }).select('_id name').lean();
  }

  async listPublic({ skip = 0, limit = 24 } = {}) {
    const query = { isActive: true };
    const [data, total] = await Promise.all([
      Spotlight.find(query)
        .populate('author', 'name profilePicture')
        .sort({ sortOrder: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Spotlight.countDocuments(query),
    ]);
    return { data, total };
  }

  async listAdmin(query, { skip = 0, limit = 24 } = {}) {
    const [data, total] = await Promise.all([
      Spotlight.find(query)
        .select('+imagePublicId')
        .populate('author', 'name email profilePicture')
        .populate('createdBy', 'name email')
        .sort({ sortOrder: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Spotlight.countDocuments(query),
    ]);
    return { data, total };
  }

  findById(id, { includePrivate = false } = {}) {
    const query = Spotlight.findById(id);
    if (includePrivate) query.select('+imagePublicId');
    return query;
  }

  create(data) {
    return Spotlight.create(data);
  }

  update(id, data) {
    return Spotlight.findByIdAndUpdate(id, { $set: data }, {
      returnDocument: 'after',
      runValidators: true,
    }).populate('author', 'name email profilePicture');
  }
}

module.exports = new SpotlightRepository();
module.exports.SpotlightRepository = SpotlightRepository;
