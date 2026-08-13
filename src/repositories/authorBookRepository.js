const Book = require('../models/Book');
const PublishRequest = require('../models/PublishRequest');
const PublishPackage = require('../models/PublishPackage');

class AuthorBookRepository {
  constructor(bookModel = Book, publishRequestModel = PublishRequest, packageModel = PublishPackage) {
    this.Book = bookModel;
    this.PublishRequest = publishRequestModel;
    this.PublishPackage = packageModel;
  }

  async findAuthorBooks(userId, filters = {}, pagination = {}) {
    const query = { author: userId };

    if (filters.status) {
      const statusUpper = String(filters.status).toLowerCase();
      if (['draft', 'published', 'archived'].includes(statusUpper)) {
        query.status = statusUpper;
      }
    }

    if (filters.search || filters.q) {
      const regex = new RegExp(String(filters.search || filters.q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [{ title: regex }, { description: regex }];
    }

    const page = Math.max(parseInt(pagination.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(pagination.limit, 10) || 20, 1), 100);
    const skip = (page - 1) * limit;

    const sort = filters.sort ? filters.sort : { createdAt: -1 };

    const [books, total] = await Promise.all([
      this.Book.find(query)
        .populate('category', 'name slug')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      this.Book.countDocuments(query)
    ]);

    return {
      books,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async findAuthorBookById(userId, bookId) {
    return this.Book.findOne({ _id: bookId, author: userId }).populate('category', 'name slug');
  }

  async findBookById(bookId) {
    return this.Book.findById(bookId).populate('category', 'name slug');
  }

  async createDraft(bookData) {
    const book = new this.Book({
      ...bookData,
      status: 'draft'
    });
    return book.save();
  }

  async updateDraft(bookId, updateData) {
    return this.Book.findByIdAndUpdate(
      bookId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('category', 'name slug');
  }

  async deleteDraft(bookId) {
    return this.Book.findByIdAndDelete(bookId);
  }

  async findLatestPublishRequestByBookId(bookId) {
    return this.PublishRequest.findOne({ book: bookId })
      .sort({ createdAt: -1 })
      .populate('packageId', 'name price')
      .populate('reviewedBy', 'name email')
      .lean();
  }

  async findActivePublishRequestByBookId(bookId) {
    return this.PublishRequest.findOne({
      book: bookId,
      status: { $in: ['PENDING', 'UNDER_REVIEW', 'CHANGES_REQUESTED', 'pending', 'reviewed'] }
    });
  }

  async createPublishRequest(data) {
    return this.PublishRequest.create(data);
  }

  async updatePublishRequest(id, data) {
    return this.PublishRequest.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    );
  }

  async getDefaultPackage() {
    let pkg = await this.PublishPackage.findOne({ isActive: true });
    if (!pkg) {
      pkg = await this.PublishPackage.create({
        name: 'Standard Author Package',
        description: 'Standard self-publishing package',
        price: 0,
        features: ['Editing', 'Distribution', 'Cover Formatting'],
        isActive: true
      });
    }
    return pkg;
  }
}

module.exports = new AuthorBookRepository();
module.exports.AuthorBookRepository = AuthorBookRepository;
