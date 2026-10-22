const ManualRoyaltyStatement = require('../models/ManualRoyaltyStatement');
const User = require('../models/User');
const Book = require('../models/Book');

class ManualRoyaltyRepository {
  findAuthorById(id) {
    return User.findOne({ _id: id, role: 'author' }).select('_id name email role').lean();
  }

  findBookById(id) {
    return Book.findById(id).select('_id title author').lean();
  }

  create(data) {
    return ManualRoyaltyStatement.create(data);
  }

  findById(id) {
    return ManualRoyaltyStatement.findById(id)
      .populate('author', 'name email')
      .populate('createdBy', 'name email')
      .populate('voidedBy', 'name email')
      .lean();
  }

  async list(query, { skip, limit }) {
    const [data, total] = await Promise.all([
      ManualRoyaltyStatement.find(query)
        .populate('author', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ManualRoyaltyStatement.countDocuments(query),
    ]);
    return { data, total };
  }

  voidRecorded(id, data) {
    return ManualRoyaltyStatement.findOneAndUpdate(
      { _id: id, status: 'RECORDED' },
      { $set: { ...data, status: 'VOID' } },
      { returnDocument: 'after', runValidators: true }
    ).populate('author', 'name email');
  }
}

module.exports = new ManualRoyaltyRepository();
module.exports.ManualRoyaltyRepository = ManualRoyaltyRepository;
