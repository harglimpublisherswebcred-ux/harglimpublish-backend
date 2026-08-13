const AuthorAccessPlan = require('../models/AuthorAccessPlan');
const AuthorAccessPurchase = require('../models/AuthorAccessPurchase');
const AuthorAccessEntitlement = require('../models/AuthorAccessEntitlement');

class AuthorAccessRepository {
  constructor({
    planModel = AuthorAccessPlan,
    purchaseModel = AuthorAccessPurchase,
    entitlementModel = AuthorAccessEntitlement
  } = {}) {
    this.Plan = planModel;
    this.Purchase = purchaseModel;
    this.Entitlement = entitlementModel;
  }

  // --- PLAN METHODS ---
  async findActivePlan(options = {}) {
    const query = this.Plan.findOne({ status: 'ACTIVE' });
    if (options.session) query.session(options.session);
    return query.exec();
  }

  async findPlanById(id, options = {}) {
    const query = this.Plan.findById(id);
    if (options.session) query.session(options.session);
    return query.exec();
  }

  async findPlans(filter = {}, options = {}) {
    const query = this.Plan.find(filter).sort({ createdAt: -1 });
    if (options.session) query.session(options.session);
    return query.exec();
  }

  async createPlan(planData, options = {}) {
    const doc = new this.Plan(planData);
    return doc.save({ session: options.session });
  }

  async updatePlan(id, updateData, options = {}) {
    return this.Plan.findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true, session: options.session });
  }

  async deactivateAllActivePlans(options = {}) {
    return this.Plan.updateMany({ status: 'ACTIVE' }, { $set: { status: 'ARCHIVED' } }, { session: options.session });
  }

  // --- PURCHASE METHODS ---
  async findPendingPurchaseForUser(userId, options = {}) {
    const query = this.Purchase.findOne({ user: userId, status: 'PENDING' }).sort({ createdAt: -1 });
    if (options.session) query.session(options.session);
    return query.exec();
  }

  async findPurchaseById(id, options = {}) {
    const query = this.Purchase.findById(id);
    if (options.session) query.session(options.session);
    return query.exec();
  }

  async findPurchaseByPaymentId(paymentId, options = {}) {
    const query = this.Purchase.findOne({ payment: paymentId });
    if (options.session) query.session(options.session);
    return query.exec();
  }

  async findPurchases(filter = {}, options = {}) {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.Purchase.find(filter)
        .populate('user', 'name email role')
        .populate('plan', 'name amount currency version')
        .populate('payment', 'status utr utrSubmittedAt verifiedAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.Purchase.countDocuments(filter)
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async createPurchase(purchaseData, options = {}) {
    const doc = new this.Purchase(purchaseData);
    return doc.save({ session: options.session });
  }

  async updatePurchase(id, updateData, options = {}) {
    return this.Purchase.findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true, session: options.session });
  }

  // --- ENTITLEMENT METHODS ---
  async findEntitlementByUserId(userId, options = {}) {
    const query = this.Entitlement.findOne({ user: userId, feature: 'AUTHOR_DASHBOARD' });
    if (options.session) query.session(options.session);
    return query.exec();
  }

  async findEntitlements(filter = {}, options = {}) {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.Entitlement.find(filter)
        .populate('user', 'name email role')
        .populate('grantedBy', 'name email')
        .populate('revokedBy', 'name email')
        .populate('restoredBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.Entitlement.countDocuments(filter)
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async createEntitlement(entitlementData, options = {}) {
    const doc = new this.Entitlement(entitlementData);
    return doc.save({ session: options.session });
  }

  async updateEntitlement(id, updateData, options = {}) {
    return this.Entitlement.findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true, session: options.session });
  }
}

module.exports = new AuthorAccessRepository();
module.exports.AuthorAccessRepository = AuthorAccessRepository;
