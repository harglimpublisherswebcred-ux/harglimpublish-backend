const PublishRequest = require('../models/PublishRequest');
const PublishPackage = require('../models/PublishPackage');

class PublishingRepository {
  createPublishRequest(data) {
    return PublishRequest.create(data);
  }

  listActivePackages() {
    return PublishPackage.find({ isActive: true }).sort({ price: 1, createdAt: 1 });
  }

  async listPackages(filters = {}) {
    const page = Math.max(Number.parseInt(filters.page, 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(filters.limit, 10) || 20, 1), 100);
    const query = {};

    if (filters.isActive !== undefined) query.isActive = filters.isActive;
    if (filters.search) {
      const escaped = String(filters.search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { name: { $regex: escaped, $options: 'i' } },
        { description: { $regex: escaped, $options: 'i' } }
      ];
    }

    const sort = filters.sort === 'price_asc'
      ? { price: 1, createdAt: -1 }
      : filters.sort === 'price_desc'
        ? { price: -1, createdAt: -1 }
        : { createdAt: -1 };

    const [items, total] = await Promise.all([
      PublishPackage.find(query).sort(sort).skip((page - 1) * limit).limit(limit).lean(),
      PublishPackage.countDocuments(query)
    ]);

    return {
      items,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) }
    };
  }

  findPackageById(id) {
    return PublishPackage.findById(id);
  }

  findPackageByName(name, excludeId) {
    const query = { name: { $regex: `^${String(name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } };
    if (excludeId) query._id = { $ne: excludeId };
    return PublishPackage.findOne(query).lean();
  }

  createPackage(data) {
    return PublishPackage.create(data);
  }

  updatePackage(id, data) {
    return PublishPackage.findByIdAndUpdate(id, { $set: data }, {
      returnDocument: 'after',
      runValidators: true
    });
  }
}

module.exports = new PublishingRepository();
module.exports.PublishingRepository = PublishingRepository;
