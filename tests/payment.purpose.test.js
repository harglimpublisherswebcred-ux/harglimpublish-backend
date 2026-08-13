const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const Payment = require('../src/models/Payment');
const PaymentLedger = require('../src/models/PaymentLedger');
const Order = require('../src/models/Order');
const User = require('../src/models/User');
const Book = require('../src/models/Book');
const Category = require('../src/models/Category');
const Invoice = require('../src/models/Invoice');
const Shipment = require('../src/models/Shipment');
const Notification = require('../src/models/Notification');
const AnalyticsEvent = require('../src/models/AnalyticsEvent');

const paymentService = require('../src/services/paymentService');
const orderPaymentBridgeService = require('../src/services/orderPaymentBridgeService');
const adminOperationsService = require('../src/services/adminOperationsService');
const eventBus = require('../src/events/eventBus');
const { DOMAIN_EVENTS } = require('../src/events/eventCatalog');

const {
  buildPaymentPurposeMigrationPlan,
  applyPaymentPurposeMigrationPlan
} = require('../scripts/paymentPurposeMigration');

const { registerInvoiceSubscriber, resetInvoiceSubscriberRegistration } = require('../src/events/invoiceSubscriber');
const { registerShipmentSubscriber, resetShipmentSubscriberRegistration } = require('../src/events/shipmentSubscriber');
const { registerNotificationSubscriber, resetNotificationSubscriberRegistration } = require('../src/events/notificationSubscriber');
const { registerAnalyticsSubscriber, resetAnalyticsSubscriberRegistration } = require('../src/events/analyticsSubscriber');

jest.setTimeout(600000);
process.env.MONGOMS_DOWNLOAD_DIR = 'node_modules/.cache/mongodb-binaries';

describe('Phase 2: Multi-Purpose Payment Foundation', () => {
  let replSet;
  let customer;
  let admin;
  let author;
  let category;
  let book;

  const validShippingAddress = {
    fullName: 'Payment Customer',
    addressLine1: '123 Main St',
    city: 'Bengaluru',
    postalCode: '560001',
    country: 'India',
    phone: '9999999999'
  };

  beforeAll(async () => {
    replSet = await MongoMemoryReplSet.create({
      replSet: { count: 1 },
      instanceOpts: [{ launchTimeout: 60000 }]
    });
    await mongoose.connect(replSet.getUri());
    await Promise.all([
      Payment.syncIndexes(),
      PaymentLedger.syncIndexes(),
      Order.syncIndexes(),
      User.syncIndexes(),
      Book.syncIndexes(),
      Category.syncIndexes(),
      Invoice.syncIndexes(),
      Shipment.syncIndexes(),
      Notification.syncIndexes(),
      AnalyticsEvent.syncIndexes()
    ]);

    resetInvoiceSubscriberRegistration();
    resetShipmentSubscriberRegistration();
    resetNotificationSubscriberRegistration();
    resetAnalyticsSubscriberRegistration();

    registerInvoiceSubscriber();
    registerShipmentSubscriber();
    registerNotificationSubscriber();
    registerAnalyticsSubscriber();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (replSet) await replSet.stop();
  });

  beforeEach(async () => {
    await Promise.all([
      Payment.deleteMany({}),
      PaymentLedger.collection.deleteMany({}),
      Order.deleteMany({}),
      User.deleteMany({}),
      Book.deleteMany({}),
      Category.deleteMany({}),
      Invoice.deleteMany({}),
      Shipment.deleteMany({}),
      Notification.deleteMany({}),
      AnalyticsEvent.deleteMany({})
    ]);

    customer = await User.create({ name: 'Payment Customer', email: 'customer-pay@example.com', password: 'password123', role: 'reader' });
    admin = await User.create({ name: 'Payment Admin', email: 'admin-pay@example.com', password: 'password123', role: 'admin' });
    author = await User.create({ name: 'Payment Author', email: 'author-pay@example.com', password: 'password123', role: 'author' });
    category = await Category.create({ name: 'Fiction', slug: 'fiction' });
    book = await Book.create({
      title: 'Foundation Book',
      slug: 'foundation-book',
      description: 'Test book for payment foundation',
      author: author._id,
      category: category._id,
      mrp: 500,
      price: 500,
      stock: 50
    });
  });

  describe('Model Schema & Validation Invariants', () => {
    it('defaults purpose to ORDER_PURCHASE and sets subjectType and subjectId for order checkout', async () => {
      const order = await Order.create({
        orderNumber: 'ORD-1001',
        user: customer._id,
        items: [{ book: book._id, quantity: 1, price: 500 }],
        subtotal: 500,
        tax: 0,
        shippingPrice: 0,
        totalPrice: 500,
        shippingAddress: validShippingAddress
      });

      const payment = await Payment.create({
        order: order._id,
        user: customer._id,
        amount: 500
      });

      expect(payment.purpose).toBe('ORDER_PURCHASE');
      expect(payment.subjectType).toBe('ORDER');
      expect(String(payment.subjectId)).toBe(String(order._id));
      expect(String(payment.order)).toBe(String(order._id));
    });

    it('allows creating a reserved AUTHOR_ACCESS payment without an order', async () => {
      const payment = await Payment.create({
        purpose: 'AUTHOR_ACCESS',
        subjectType: 'AUTHOR_SUBSCRIPTION',
        subjectId: new mongoose.Types.ObjectId(),
        user: customer._id,
        amount: 1999
      });

      expect(payment.purpose).toBe('AUTHOR_ACCESS');
      expect(payment.order).toBeUndefined();
      expect(payment.subjectType).toBe('AUTHOR_SUBSCRIPTION');
      expect(payment.amount).toBe(1999);
    });

    it('rejects ORDER_PURCHASE payment if order is missing', async () => {
      const payment = new Payment({
        purpose: 'ORDER_PURCHASE',
        user: customer._id,
        amount: 500
      });

      let validationError;
      try {
        await payment.validate();
      } catch (err) {
        validationError = err;
      }

      expect(validationError).toBeDefined();
      expect(validationError.errors.order).toBeDefined();
    });

    it('rejects invalid payment purpose enum values', async () => {
      const order = await Order.create({
        orderNumber: 'ORD-1002',
        user: customer._id,
        items: [{ book: book._id, quantity: 1, price: 500 }],
        subtotal: 500,
        tax: 0,
        shippingPrice: 0,
        totalPrice: 500,
        shippingAddress: validShippingAddress
      });

      const payment = new Payment({
        order: order._id,
        purpose: 'INVALID_PURPOSE',
        user: customer._id,
        amount: 500
      });

      let validationError;
      try {
        await payment.validate();
      } catch (err) {
        validationError = err;
      }

      expect(validationError).toBeDefined();
      expect(validationError.errors.purpose).toBeDefined();
    });

    it('allows multiple non-order payments (order = null) with successfulPayment = true without index collision', async () => {
      const subId1 = new mongoose.Types.ObjectId();
      const subId2 = new mongoose.Types.ObjectId();

      const pay1 = await Payment.create({
        purpose: 'AUTHOR_ACCESS',
        subjectType: 'AUTHOR_PLAN',
        subjectId: subId1,
        user: customer._id,
        amount: 999,
        status: 'PAYMENT_VERIFIED',
        successfulPayment: true
      });

      const pay2 = await Payment.create({
        purpose: 'AUTHOR_ACCESS',
        subjectType: 'AUTHOR_PLAN',
        subjectId: subId2,
        user: customer._id,
        amount: 1499,
        status: 'PAYMENT_VERIFIED',
        successfulPayment: true
      });

      expect(pay1._id).toBeDefined();
      expect(pay2._id).toBeDefined();
      expect(pay1.order).toBeUndefined();
      expect(pay2.order).toBeUndefined();
    });
  });

  describe('Migration Script Safety & Idempotency', () => {
    it('dry-run identifies unmigrated legacy payments and produces accurate plan without writes', async () => {
      const order = await Order.create({
        orderNumber: 'ORD-1003',
        user: customer._id,
        items: [{ book: book._id, quantity: 1, price: 500 }],
        subtotal: 500,
        tax: 0,
        shippingPrice: 0,
        totalPrice: 500,
        shippingAddress: validShippingAddress
      });

      const legacyPaymentDoc = new Payment({
        order: order._id,
        user: customer._id,
        amount: 500,
        status: 'INTENT_CREATED'
      });
      // Bypass pre-validate purpose assignment to simulate legacy doc
      legacyPaymentDoc.purpose = undefined;
      await Payment.collection.insertOne(legacyPaymentDoc.toObject());

      const report = await buildPaymentPurposeMigrationPlan({ options: { dryRun: true } });

      expect(report.summary.totalPayments).toBe(1);
      expect(report.summary.backfilledPayments).toBe(1);
      expect(report.plannedPaymentUpdates[0].update.purpose).toBe('ORDER_PURCHASE');

      // Verify no DB mutations occurred during dry run
      const docAfterDryRun = await Payment.findById(legacyPaymentDoc._id).lean();
      expect(docAfterDryRun.purpose).toBeUndefined();
    });

    it('migration apply backfills legacy Payment and PaymentLedger documents idempotently', async () => {
      const order = await Order.create({
        orderNumber: 'ORD-1004',
        user: customer._id,
        items: [{ book: book._id, quantity: 1, price: 500 }],
        subtotal: 500,
        tax: 0,
        shippingPrice: 0,
        totalPrice: 500,
        shippingAddress: validShippingAddress
      });

      const legacyPaymentDoc = new Payment({
        order: order._id,
        user: customer._id,
        amount: 500,
        status: 'PAYMENT_VERIFIED'
      });
      legacyPaymentDoc.purpose = undefined;
      await Payment.collection.insertOne(legacyPaymentDoc.toObject());

      const legacyLedgerDoc = new PaymentLedger({
        paymentId: legacyPaymentDoc._id,
        orderId: order._id,
        userId: customer._id,
        eventType: 'PAYMENT_VERIFIED',
        currentStatus: 'PAYMENT_VERIFIED',
        amount: 500
      });
      legacyLedgerDoc.purpose = undefined;
      await PaymentLedger.collection.insertOne(legacyLedgerDoc.toObject());

      // First migration run
      const report1 = await buildPaymentPurposeMigrationPlan({ options: { dryRun: false } });
      await applyPaymentPurposeMigrationPlan(report1);

      const updatedPay = await Payment.findById(legacyPaymentDoc._id).lean();
      const updatedLedger = await PaymentLedger.findById(legacyLedgerDoc._id).lean();

      expect(updatedPay.purpose).toBe('ORDER_PURCHASE');
      expect(updatedPay.subjectType).toBe('ORDER');
      expect(String(updatedPay.subjectId)).toBe(String(order._id));

      expect(updatedLedger.purpose).toBe('ORDER_PURCHASE');
      expect(updatedLedger.subjectType).toBe('ORDER');
      expect(String(updatedLedger.subjectId)).toBe(String(order._id));

      // Idempotency: second run should backfill 0 records
      const report2 = await buildPaymentPurposeMigrationPlan({ options: { dryRun: false } });
      expect(report2.summary.backfilledPayments).toBe(0);
      expect(report2.summary.backfilledLedger).toBe(0);
      expect(report2.summary.alreadyMigratedPayments).toBe(1);
      expect(report2.summary.alreadyMigratedLedger).toBe(1);
    });
  });

  describe('Purpose Isolation: Non-Order Payments', () => {
    it('prevents non-order AUTHOR_ACCESS payment verification from creating Invoice, Shipment, Stock Deduction, or Order Notifications/Analytics', async () => {
      const initialStock = book.stock;

      // 1. Create AUTHOR_ACCESS payment intent
      const nonOrderPayment = await paymentService.createPayment({
        purpose: 'AUTHOR_ACCESS',
        subjectType: 'AUTHOR_PLAN',
        subjectId: new mongoose.Types.ObjectId(),
        user: customer._id,
        amount: 2999,
        status: 'PAYMENT_SUBMITTED',
        activeIntent: true,
        utr: 'UTR-AUTHOR-9999'
      });

      expect(nonOrderPayment.purpose).toBe('AUTHOR_ACCESS');
      expect(nonOrderPayment.order).toBeUndefined();

      // 2. Verify non-order payment via PaymentService
      const verified = await paymentService.verifyPayment(nonOrderPayment._id, { userId: admin._id }, {
        actorType: 'ADMIN',
        reason: 'Verified author access plan'
      });

      expect(verified.status).toBe('PAYMENT_VERIFIED');

      // 3. Assert zero side-effects on book-commerce domain
      const invoicesCount = await Invoice.countDocuments({ payment: verified._id });
      expect(invoicesCount).toBe(0);

      const shipmentsCount = await Shipment.countDocuments({});
      expect(shipmentsCount).toBe(0);

      const updatedBook = await Book.findById(book._id);
      expect(updatedBook.stock).toBe(initialStock);

      const notifications = await Notification.find({ user: customer._id });
      const orderNotifications = notifications.filter(n => n.eventType === DOMAIN_EVENTS.PAYMENT_VERIFIED && n.body && n.body.includes('order'));
      expect(orderNotifications.length).toBe(0);

      const analyticsEvents = await AnalyticsEvent.find({ payment: verified._id });
      expect(analyticsEvents.length).toBe(0);

      // 4. Assert PaymentLedger entry IS recorded for non-order payment transition
      const ledgerEntries = await PaymentLedger.find({ paymentId: verified._id });
      expect(ledgerEntries.length).toBeGreaterThan(0);
      expect(ledgerEntries[0].purpose).toBe('AUTHOR_ACCESS');
      expect(ledgerEntries[0].orderId).toBeUndefined();
    });

    it('fails safely when OrderPaymentBridgeService attempts to resolve a non-order payment', async () => {
      const nonOrderPayment = await paymentService.createPayment({
        purpose: 'AUTHOR_ACCESS',
        subjectType: 'AUTHOR_PLAN',
        subjectId: new mongoose.Types.ObjectId(),
        user: customer._id,
        amount: 1999
      });

      const fakeOrder = {
        _id: new mongoose.Types.ObjectId(),
        payment: nonOrderPayment._id
      };

      await expect(orderPaymentBridgeService.resolveOrderPayment(fakeOrder))
        .rejects
        .toThrow('Payment is not an order purchase payment');
    });

    it('safely handles non-order payments in Admin Operations listing and detail', async () => {
      const nonOrderPayment = await paymentService.createPayment({
        purpose: 'AUTHOR_ACCESS',
        subjectType: 'AUTHOR_PLAN',
        subjectId: new mongoose.Types.ObjectId(),
        user: customer._id,
        amount: 2499,
        status: 'INTENT_CREATED',
        activeIntent: true
      });

      const listResult = await adminOperationsService.listPayments({ page: 1, limit: 10 });
      expect(listResult.items.length).toBeGreaterThan(0);
      const foundItem = listResult.items.find(p => String(p._id) === String(nonOrderPayment._id));
      expect(foundItem).toBeDefined();
      expect(!foundItem.order).toBe(true);

      const detail = await adminOperationsService.getPaymentDetail(nonOrderPayment._id);
      expect(detail.payment).toBeDefined();
      expect(!detail.order).toBe(true);
      expect(detail.books).toEqual([]);
    });
  });

  describe('Order Payment Regression: ORDER_PURCHASE Flow Unchanged', () => {
    it('executes complete order payment lifecycle with inventory reservation, invoice generation, and notifications', async () => {
      const result = await orderPaymentBridgeService.createOrderWithPaymentIntent({
        user: customer,
        items: [{ bookId: book._id, quantity: 2 }],
        shippingAddress: validShippingAddress,
        paymentMethod: 'UPI'
      });

      const orderId = result.order._id;
      const payment = await paymentService.getActivePaymentIntent(orderId);
      expect(payment).toBeDefined();
      expect(payment.purpose).toBe('ORDER_PURCHASE');
      expect(String(payment.order)).toBe(String(orderId));

      await paymentService.submitUTR(payment._id, 'UTR-FULL-REGRESSION-100', { userId: customer._id });

      const verifiedOrder = await orderPaymentBridgeService.verifyOrderPayment(orderId, admin, {
        reason: 'Order payment verified'
      });

      expect(verifiedOrder.isPaid).toBe(true);

      // Verify book stock deducted
      const updatedBook = await Book.findById(book._id);
      expect(updatedBook.stock).toBe(48);

      // Verify Invoice created
      const invoice = await Invoice.findOne({ order: orderId });
      expect(invoice).toBeDefined();
      expect(invoice.invoiceNumber).toBeDefined();

      // Verify Ledger created with ORDER_PURCHASE
      const ledger = await PaymentLedger.findOne({ orderId: orderId, eventType: 'PAYMENT_VERIFIED' });
      expect(ledger).toBeDefined();
      expect(ledger.purpose).toBe('ORDER_PURCHASE');
    });
  });
});
