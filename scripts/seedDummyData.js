const crypto = require('crypto');
const mongoose = require('mongoose');
require('dotenv').config();

const logger = require('../src/utils/logger');
const AnalyticsEvent = require('../src/models/AnalyticsEvent');
const AuthorApplication = require('../src/models/AuthorApplication');
const Book = require('../src/models/Book');
const Category = require('../src/models/Category');
const Counter = require('../src/models/Counter');
const InventoryLedger = require('../src/models/InventoryLedger');
const InventoryReservation = require('../src/models/InventoryReservation');
const Invoice = require('../src/models/Invoice');
const Notification = require('../src/models/Notification');
const Order = require('../src/models/Order');
const Payment = require('../src/models/Payment');
const PaymentLedger = require('../src/models/PaymentLedger');
const PublishPackage = require('../src/models/PublishPackage');
const PublishRequest = require('../src/models/PublishRequest');
const Review = require('../src/models/Review');
const Shipment = require('../src/models/Shipment');
const ShipmentLedger = require('../src/models/ShipmentLedger');
const User = require('../src/models/User');

const SEED_PREFIX = 'hm-demo';
const DEFAULT_PASSWORD = process.env.DUMMY_SEED_PASSWORD || 'DemoPass123!';

const argv = new Set(process.argv.slice(2));
const options = {
  dryRun: argv.has('--dry-run'),
  forceProduction: argv.has('--force-production')
};

const now = () => new Date();
const daysFromNow = (days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);
const isoDay = (date = new Date()) => date.toISOString().slice(0, 10);
const objectId = () => new mongoose.Types.ObjectId();

const stats = {
  planned: 0,
  created: 0,
  updated: 0,
  reused: 0,
  skipped: 0
};

const created = {
  users: {},
  categories: {},
  books: {},
  packages: {},
  orders: {},
  payments: {},
  reservations: {},
  invoices: {},
  shipments: {}
};

const slugify = (value) => value
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

const hashBuffer = (value) => crypto.createHash('sha256').update(value).digest('hex');

const logStep = (message, metadata = {}) => {
  logger.info(`dummy_seed.${message}`, metadata);
};

const print = (message) => process.stdout.write(`${message}\n`);

const ensureIndexes = async () => {
  if (options.dryRun) return;

  await Promise.all([
    AnalyticsEvent.syncIndexes(),
    AuthorApplication.syncIndexes(),
    Book.syncIndexes(),
    Category.syncIndexes(),
    Counter.syncIndexes(),
    InventoryLedger.syncIndexes(),
    InventoryReservation.syncIndexes(),
    Invoice.syncIndexes(),
    Notification.syncIndexes(),
    Order.syncIndexes(),
    Payment.syncIndexes(),
    PaymentLedger.syncIndexes(),
    PublishPackage.syncIndexes(),
    PublishRequest.syncIndexes(),
    Review.syncIndexes(),
    Shipment.syncIndexes(),
    ShipmentLedger.syncIndexes(),
    User.syncIndexes()
  ]);
};

const ensureDocument = async ({ model, label, query, create, update, assign }) => {
  stats.planned += 1;
  const existing = await model.findOne(query);

  if (options.dryRun) {
    stats.skipped += 1;
    print(`[dry-run] ${existing ? 'would reuse/update' : 'would create'} ${label}`);
    const doc = existing || { _id: objectId(), ...create };
    if (assign) assign(doc);
    return doc;
  }

  if (existing) {
    if (update && Object.keys(update).length > 0) {
      existing.set(update);
      await existing.save();
      stats.updated += 1;
      logStep('updated', { label, id: String(existing._id) });
    } else {
      stats.reused += 1;
      logStep('reused', { label, id: String(existing._id) });
    }

    if (assign) assign(existing);
    return existing;
  }

  const doc = await model.create(create);
  stats.created += 1;
  logStep('created', { label, id: String(doc._id) });
  if (assign) assign(doc);
  return doc;
};

const seedUsers = async () => {
  print('Seeding users...');
  const users = [
    { key: 'admin', name: 'Demo Admin', email: 'admin.demo@harglim.com', role: 'admin' },
    { key: 'reader', name: 'Demo Reader', email: 'reader.demo@harglim.com', role: 'reader' },
    { key: 'author', name: 'Demo Author', email: 'author.demo@harglim.com', role: 'author' },
    { key: 'visitor', name: 'Demo Visitor', email: 'visitor.demo@harglim.com', role: 'visitor' }
  ];

  for (const user of users) {
    await ensureDocument({
      model: User,
      label: `user:${user.key}`,
      query: { email: user.email },
      create: {
        name: user.name,
        email: user.email,
        password: DEFAULT_PASSWORD,
        role: user.role,
        isActive: true,
        profilePicture: `https://placehold.co/160x160/png?text=${encodeURIComponent(user.name)}`
      },
      update: {
        name: user.name,
        role: user.role,
        isActive: true
      },
      assign: (doc) => { created.users[user.key] = doc; }
    });
  }
};

const seedCategories = async () => {
  print('Seeding categories...');
  const categories = [
    { key: 'fiction', name: 'Fiction', featured: true, sortOrder: 1 },
    { key: 'business', name: 'Business & Leadership', featured: true, sortOrder: 2 },
    { key: 'self-help', name: 'Self Help', featured: true, sortOrder: 3 },
    { key: 'technology', name: 'Technology', featured: false, sortOrder: 4 },
    { key: 'children', name: 'Children Books', featured: false, sortOrder: 5 }
  ];

  for (const category of categories) {
    const slug = slugify(category.name);
    await ensureDocument({
      model: Category,
      label: `category:${category.key}`,
      query: { slug },
      create: {
        name: category.name,
        slug,
        description: `${category.name} books curated for storefront testing.`,
        shortDescription: `Demo ${category.name} collection`,
        image: `https://placehold.co/600x400/png?text=${encodeURIComponent(category.name)}`,
        banner: `https://placehold.co/1200x360/png?text=${encodeURIComponent(category.name)}`,
        icon: 'book-open',
        seoTitle: `${category.name} Books`,
        seoDescription: `Browse ${category.name} demo books.`,
        sortOrder: category.sortOrder,
        featured: category.featured,
        active: true,
        isActive: true,
        metadata: { seededBy: SEED_PREFIX, seedKey: category.key }
      },
      update: {
        description: `${category.name} books curated for storefront testing.`,
        shortDescription: `Demo ${category.name} collection`,
        sortOrder: category.sortOrder,
        featured: category.featured,
        active: true,
        isActive: true,
        metadata: { seededBy: SEED_PREFIX, seedKey: category.key }
      },
      assign: (doc) => { created.categories[category.key] = doc; }
    });
  }
};

const seedBooks = async () => {
  print('Seeding books...');
  const books = [
    {
      key: 'midnight-letters',
      title: 'Midnight Letters',
      category: 'fiction',
      price: 399,
      mrp: 399,
      discountPrice: 299,
      stock: 45,
      flags: { isBestseller: true, isFeatured: true, isNewRelease: false },
      format: 'paperback'
    },
    {
      key: 'founder-playbook',
      title: 'The Founder Playbook',
      category: 'business',
      price: 549,
      mrp: 549,
      discountPrice: 449,
      stock: 32,
      flags: { isBestseller: false, isFeatured: true, isNewRelease: true },
      format: 'hardcover'
    },
    {
      key: 'small-habits-big-days',
      title: 'Small Habits, Big Days',
      category: 'self-help',
      price: 299,
      mrp: 299,
      stock: 60,
      flags: { isBestseller: true, isFeatured: false, isNewRelease: true },
      format: 'paperback'
    },
    {
      key: 'node-apis-production',
      title: 'Node APIs in Production',
      category: 'technology',
      price: 699,
      mrp: 699,
      discountPrice: 599,
      stock: 20,
      flags: { isBestseller: false, isFeatured: true, isNewRelease: false },
      format: 'ebook'
    },
    {
      key: 'moon-map-adventures',
      title: 'Moon Map Adventures',
      category: 'children',
      price: 249,
      mrp: 249,
      stock: 80,
      flags: { isBestseller: false, isFeatured: false, isNewRelease: true },
      format: 'paperback'
    }
  ];

  for (const book of books) {
    const category = created.categories[book.category];
    await ensureDocument({
      model: Book,
      label: `book:${book.key}`,
      query: { slug: book.key },
      create: {
        title: book.title,
        slug: book.key,
        description: `${book.title} is a demo catalog title used for storefront, checkout, review, inventory, and reporting flows.`,
        author: created.users.author._id,
        category: category._id,
        price: book.price,
        mrp: book.mrp,
        discountPrice: book.discountPrice,
        coverImage: `https://placehold.co/720x1080/png?text=${encodeURIComponent(book.title)}`,
        stock: book.stock,
        reservedStock: 0,
        ratings: 4.5,
        reviewCount: 1,
        status: 'published',
        isbn: `978-93-${Math.floor(1000000 + Math.random() * 8999999)}`,
        pages: 220,
        format: book.format,
        ...book.flags
      },
      update: {
        author: created.users.author._id,
        category: category._id,
        price: book.price,
        mrp: book.mrp,
        discountPrice: book.discountPrice,
        stock: book.stock,
        status: 'published',
        ...book.flags
      },
      assign: (doc) => { created.books[book.key] = doc; }
    });
  }

  if (!options.dryRun) {
    for (const [key, category] of Object.entries(created.categories)) {
      const bookCount = await Book.countDocuments({ category: category._id, status: 'published' });
      category.bookCount = bookCount;
      await category.save();
      logStep('category_book_count_synced', { key, bookCount });
    }
  }
};

const seedPublishWorkflow = async () => {
  print('Seeding publishing workflow...');
  const packages = [
    {
      key: 'starter',
      name: 'Demo Starter Publishing',
      description: 'Starter demo publishing package for testing package listing and publish requests.',
      price: 4999,
      features: ['Manuscript review', 'Basic formatting', 'Standard cover design']
    },
    {
      key: 'pro',
      name: 'Demo Pro Publishing',
      description: 'Professional demo publishing package with richer editorial support.',
      price: 14999,
      features: ['Editorial review', 'Premium formatting', 'Cover design', 'Launch checklist']
    }
  ];

  for (const pkg of packages) {
    await ensureDocument({
      model: PublishPackage,
      label: `publish-package:${pkg.key}`,
      query: { name: pkg.name },
      create: { ...pkg, isActive: true },
      update: { description: pkg.description, price: pkg.price, features: pkg.features, isActive: true },
      assign: (doc) => { created.packages[pkg.key] = doc; }
    });
  }

  await ensureDocument({
    model: PublishRequest,
    label: 'publish-request:demo-author',
    query: { user: created.users.author._id, title: 'Demo Manuscript Submission' },
    create: {
      user: created.users.author._id,
      title: 'Demo Manuscript Submission',
      genre: 'Fiction',
      wordCount: 52000,
      packageId: created.packages.starter._id,
      fileUrl: 'https://example.com/demo-manuscript.pdf',
      status: 'pending'
    },
    update: { packageId: created.packages.starter._id, status: 'pending' }
  });

  await ensureDocument({
    model: AuthorApplication,
    label: 'author-application:visitor',
    query: { user: created.users.visitor._id },
    create: {
      user: created.users.visitor._id,
      penName: 'Demo Pen',
      bio: 'A demo author application used by admin review screens.',
      portfolioUrl: 'https://example.com/demo-portfolio',
      experience: 'Two short stories and one draft novel.',
      status: 'pending'
    },
    update: { status: 'pending' }
  });
};

const seedOrderPaymentInventory = async () => {
  print('Seeding order, payment, inventory, invoice, shipment...');
  const book = created.books['midnight-letters'];
  const secondBook = created.books['founder-playbook'];
  const firstUnitPrice = Number(book.mrp || book.price);
  const secondUnitPrice = Number(secondBook.mrp || secondBook.price);
  const subtotal = firstUnitPrice + secondUnitPrice;
  const tax = 0;
  const shippingPrice = subtotal > 500 ? 0 : 50;
  const totalPrice = subtotal + tax + shippingPrice;
  const orderNumber = `${SEED_PREFIX.toUpperCase()}-ORDER-1001`;
  const utr = `${SEED_PREFIX.toUpperCase()}UTR1001`.replace(/-/g, '');

  const order = await ensureDocument({
    model: Order,
    label: 'order:paid-demo',
    query: { orderNumber },
    create: {
      orderNumber,
      user: created.users.reader._id,
      items: [
        { book: book._id, quantity: 1, price: firstUnitPrice },
        { book: secondBook._id, quantity: 1, price: secondUnitPrice }
      ],
      shippingAddress: {
        fullName: 'Demo Reader',
        addressLine1: '123 Demo Street',
        addressLine2: 'Near Test Circle',
        city: 'Chennai',
        postalCode: '600001',
        country: 'India'
      },
      subtotal,
      tax,
      shippingPrice,
      totalPrice,
      isPaid: true,
      paymentMethod: 'UPI',
      paidAt: now(),
      utr,
      status: 'PROCESSING',
      trackingUpdates: [{ status: 'PROCESSING', location: 'Chennai', description: 'Demo order is ready for fulfillment.' }]
    },
    update: { isPaid: true, paymentMethod: 'UPI', utr, status: 'PROCESSING' },
    assign: (doc) => { created.orders.paid = doc; }
  });

  const payment = await ensureDocument({
    model: Payment,
    label: 'payment:paid-demo',
    query: { provider: 'manual_upi', providerOrderId: `${SEED_PREFIX}-provider-order-1001` },
    create: {
      order: order._id,
      user: created.users.reader._id,
      amount: totalPrice,
      currency: 'INR',
      paymentMethod: 'UPI',
      provider: 'manual_upi',
      status: 'PAYMENT_VERIFIED',
      attemptNumber: 1,
      utr,
      providerOrderId: `${SEED_PREFIX}-provider-order-1001`,
      providerPaymentId: `${SEED_PREFIX}-provider-payment-1001`,
      qrPayload: `upi://pay?pa=demo@upi&pn=Harglim%20Publish&am=${totalPrice}&cu=INR&tn=${orderNumber}`,
      qrGeneratedAt: now(),
      qrExpiresAt: daysFromNow(1),
      expiresAt: daysFromNow(1),
      submittedAt: now(),
      verifiedAt: now(),
      verifiedBy: created.users.admin._id,
      successfulPayment: true,
      activeIntent: false,
      statusHistory: [
        { status: 'INTENT_CREATED', changedBy: created.users.reader._id, reason: 'Dummy seed intent' },
        { status: 'PAYMENT_SUBMITTED', changedBy: created.users.reader._id, reason: 'Dummy seed UTR submitted' },
        { status: 'VERIFICATION_PENDING', changedBy: created.users.reader._id, reason: 'Dummy seed verification pending' },
        { status: 'PAYMENT_VERIFIED', changedBy: created.users.admin._id, reason: 'Dummy seed admin verified' }
      ],
      metadata: { seededBy: SEED_PREFIX, seedKey: 'paid-demo' }
    },
    update: { status: 'PAYMENT_VERIFIED', successfulPayment: true, activeIntent: false, verifiedBy: created.users.admin._id },
    assign: (doc) => { created.payments.paid = doc; }
  });

  if (!options.dryRun && String(order.payment || '') !== String(payment._id)) {
    order.payment = payment._id;
    await order.save();
  }

  const reservation = await ensureDocument({
    model: InventoryReservation,
    label: 'inventory-reservation:deducted-demo',
    query: { order: order._id, payment: payment._id, book: book._id, status: 'DEDUCTED' },
    create: {
      reservationId: `${SEED_PREFIX}-reservation-1001`,
      order: order._id,
      payment: payment._id,
      book: book._id,
      quantity: 1,
      status: 'DEDUCTED',
      reservedAt: now(),
      expiresAt: daysFromNow(1),
      deductedAt: now(),
      reason: 'Dummy seed verified payment deduction',
      metadata: { seededBy: SEED_PREFIX }
    },
    update: { status: 'DEDUCTED', deductedAt: now(), reason: 'Dummy seed verified payment deduction' },
    assign: (doc) => { created.reservations.deducted = doc; }
  });

  const ledgerEntries = [
    [PaymentLedger, 'payment-ledger:intent', { eventKey: `${SEED_PREFIX}:payment:${payment._id}:INTENT_CREATED` }, {
      paymentId: payment._id,
      orderId: order._id,
      userId: created.users.reader._id,
      eventType: 'INTENT_CREATED',
      previousStatus: undefined,
      currentStatus: 'INTENT_CREATED',
      amount: totalPrice,
      currency: 'INR',
      provider: 'manual_upi',
      reference: orderNumber,
      actor: created.users.reader._id,
      actorType: 'CUSTOMER',
      reason: 'Dummy seed payment intent created',
      metadata: { seededBy: SEED_PREFIX }
    }],
    [PaymentLedger, 'payment-ledger:verified', { eventKey: `${SEED_PREFIX}:payment:${payment._id}:PAYMENT_VERIFIED` }, {
      paymentId: payment._id,
      orderId: order._id,
      userId: created.users.reader._id,
      eventType: 'PAYMENT_VERIFIED',
      previousStatus: 'VERIFICATION_PENDING',
      currentStatus: 'PAYMENT_VERIFIED',
      amount: totalPrice,
      currency: 'INR',
      provider: 'manual_upi',
      reference: utr,
      actor: created.users.admin._id,
      actorType: 'ADMIN',
      reason: 'Dummy seed payment verified',
      metadata: { seededBy: SEED_PREFIX }
    }],
    [InventoryLedger, 'inventory-ledger:reserved', { eventKey: `${SEED_PREFIX}:inventory:${reservation._id}:RESERVED` }, {
      reservation: reservation._id,
      order: order._id,
      payment: payment._id,
      book: book._id,
      eventType: 'RESERVED',
      previousStatus: undefined,
      currentStatus: 'RESERVED',
      quantity: 1,
      actor: created.users.reader._id,
      actorType: 'CUSTOMER',
      reason: 'Dummy seed stock reserved',
      metadata: { seededBy: SEED_PREFIX }
    }],
    [InventoryLedger, 'inventory-ledger:deducted', { eventKey: `${SEED_PREFIX}:inventory:${reservation._id}:DEDUCTED` }, {
      reservation: reservation._id,
      order: order._id,
      payment: payment._id,
      book: book._id,
      eventType: 'DEDUCTED',
      previousStatus: 'RESERVED',
      currentStatus: 'DEDUCTED',
      quantity: 1,
      actor: created.users.admin._id,
      actorType: 'SYSTEM',
      reason: 'Dummy seed stock deducted',
      metadata: { seededBy: SEED_PREFIX }
    }]
  ];

  for (const [model, label, query, data] of ledgerEntries) {
    await ensureDocument({ model, label, query, create: { ...query, ...data } });
  }

  const invoice = await ensureDocument({
    model: Invoice,
    label: 'invoice:paid-demo',
    query: { invoiceNumber: `${SEED_PREFIX.toUpperCase()}-INV-1001` },
    create: {
      invoiceNumber: `${SEED_PREFIX.toUpperCase()}-INV-1001`,
      order: order._id,
      payment: payment._id,
      customer: created.users.reader._id,
      items: [
        { book: book._id, title: book.title, quantity: 1, unitPrice: firstUnitPrice, taxAmount: 0, discountAmount: 0, lineTotal: firstUnitPrice },
        { book: secondBook._id, title: secondBook.title, quantity: 1, unitPrice: secondUnitPrice, taxAmount: 0, discountAmount: 0, lineTotal: secondUnitPrice }
      ],
      subtotal,
      taxTotal: tax,
      discountTotal: 0,
      shippingTotal: shippingPrice,
      total: totalPrice,
      currency: 'INR',
      status: 'GENERATED',
      generatedAt: now(),
      document: {
        contentType: 'application/pdf',
        fileName: `${SEED_PREFIX}-invoice-1001.pdf`,
        data: Buffer.from('%PDF-1.4\n% Dummy invoice PDF placeholder\n'),
        generatedAt: now(),
        template: 'dummy-seed',
        checksum: hashBuffer(`${SEED_PREFIX}-invoice-1001`)
      },
      metadata: { seededBy: SEED_PREFIX }
    },
    update: { status: 'GENERATED' },
    assign: (doc) => { created.invoices.paid = doc; }
  });

  const shipment = await ensureDocument({
    model: Shipment,
    label: 'shipment:paid-demo',
    query: { shipmentId: `${SEED_PREFIX}-shipment-1001` },
    create: {
      shipmentId: `${SEED_PREFIX}-shipment-1001`,
      order: order._id,
      payment: payment._id,
      invoice: invoice._id,
      customer: created.users.reader._id,
      shippingAddress: order.shippingAddress,
      courier: { provider: 'manual', serviceName: 'Demo Courier', assignedAt: now(), assignedBy: created.users.admin._id },
      trackingNumber: `${SEED_PREFIX.toUpperCase()}TRACK1001`.replace(/-/g, ''),
      trackingUrl: 'https://example.com/track/HMDEMO1001',
      status: 'IN_TRANSIT',
      pickupDate: now(),
      dispatchDate: now(),
      estimatedDelivery: daysFromNow(4),
      packages: [{ items: [{ book: book._id, quantity: 1 }, { book: secondBook._id, quantity: 1 }], weightGrams: 650, dimensions: { lengthCm: 24, widthCm: 18, heightCm: 5 } }],
      trackingHistory: [
        { status: 'CREATED', location: 'Chennai', description: 'Dummy shipment created.' },
        { status: 'IN_TRANSIT', location: 'Chennai Hub', description: 'Dummy shipment in transit.' }
      ],
      audit: { createdBy: created.users.admin._id, updatedBy: created.users.admin._id },
      metadata: { seededBy: SEED_PREFIX },
      active: true
    },
    update: { status: 'IN_TRANSIT', active: true },
    assign: (doc) => { created.shipments.paid = doc; }
  });

  await ensureDocument({
    model: ShipmentLedger,
    label: 'shipment-ledger:created',
    query: { eventKey: `${SEED_PREFIX}:shipment:${shipment._id}:SHIPMENT_CREATED` },
    create: {
      eventKey: `${SEED_PREFIX}:shipment:${shipment._id}:SHIPMENT_CREATED`,
      shipment: shipment._id,
      order: order._id,
      payment: payment._id,
      invoice: invoice._id,
      customer: created.users.reader._id,
      eventType: 'SHIPMENT_CREATED',
      currentStatus: 'CREATED',
      actor: created.users.admin._id,
      actorType: 'SYSTEM',
      reason: 'Dummy seed shipment created',
      metadata: { seededBy: SEED_PREFIX }
    }
  });
};

const seedSocialAndCommunication = async () => {
  print('Seeding reviews, notifications, analytics...');
  await ensureDocument({
    model: Review,
    label: 'review:reader-midnight-letters',
    query: { book: created.books['midnight-letters']._id, user: created.users.reader._id },
    create: {
      book: created.books['midnight-letters']._id,
      user: created.users.reader._id,
      rating: 5,
      comment: 'Excellent demo title for testing reviews and storefront cards.',
      status: 'visible'
    },
    update: { rating: 5, comment: 'Excellent demo title for testing reviews and storefront cards.', status: 'visible' }
  });

  const notifications = [
    { key: 'payment-verified', eventType: 'PaymentVerified', subject: 'Payment verified', body: 'Your demo payment has been verified.', status: 'SENT', sentAt: now() },
    { key: 'invoice-generated', eventType: 'InvoiceGenerated', subject: 'Invoice generated', body: 'Your demo invoice is ready.', status: 'SENT', sentAt: now() },
    { key: 'shipment-created', eventType: 'ShipmentCreated', subject: 'Shipment created', body: 'Your demo shipment is on the way.', status: 'PENDING' }
  ];

  for (const item of notifications) {
    await ensureDocument({
      model: Notification,
      label: `notification:${item.key}`,
      query: { idempotencyKey: `${SEED_PREFIX}:notification:${item.key}` },
      create: {
        idempotencyKey: `${SEED_PREFIX}:notification:${item.key}`,
        user: created.users.reader._id,
        eventType: item.eventType,
        channel: 'IN_APP',
        subject: item.subject,
        body: item.body,
        status: item.status,
        sentAt: item.sentAt,
        templateKey: `dummy-${item.key}`,
        recipient: { name: created.users.reader.name, email: created.users.reader.email },
        metadata: { seededBy: SEED_PREFIX }
      },
      update: { status: item.status, subject: item.subject, body: item.body }
    });
  }

  const analyticsEvents = [
    { key: 'order-created', eventType: 'OrderCreated', amount: created.orders.paid.totalPrice, quantity: 2, status: created.orders.paid.status },
    { key: 'payment-verified', eventType: 'PaymentVerified', amount: created.payments.paid.amount, quantity: 1, status: created.payments.paid.status },
    { key: 'invoice-generated', eventType: 'InvoiceGenerated', amount: created.invoices.paid.total, quantity: 1, status: created.invoices.paid.status },
    { key: 'shipment-created', eventType: 'ShipmentCreated', amount: 0, quantity: 1, status: created.shipments.paid.status }
  ];

  for (const event of analyticsEvents) {
    await ensureDocument({
      model: AnalyticsEvent,
      label: `analytics:${event.key}`,
      query: { eventId: `${SEED_PREFIX}:analytics:${event.key}` },
      create: {
        eventId: `${SEED_PREFIX}:analytics:${event.key}`,
        eventType: event.eventType,
        occurredAt: now(),
        bucketDay: isoDay(),
        order: created.orders.paid._id,
        payment: created.payments.paid._id,
        invoice: created.invoices.paid._id,
        shipment: created.shipments.paid._id,
        user: created.users.reader._id,
        book: created.books['midnight-letters']._id,
        amount: event.amount,
        quantity: event.quantity,
        status: event.status,
        metadata: { seededBy: SEED_PREFIX }
      },
      update: { amount: event.amount, quantity: event.quantity, status: event.status }
    });
  }
};

const seedCounters = async () => {
  print('Seeding counters...');
  await ensureDocument({
    model: Counter,
    label: 'counter:invoice',
    query: { key: 'invoice' },
    create: { key: 'invoice', sequence: 1001 },
    update: {}
  });
};

const run = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is required to seed dummy data');
  }

  if (process.env.NODE_ENV === 'production' && !options.forceProduction) {
    throw new Error('Refusing to seed production without --force-production');
  }

  print(options.dryRun ? 'Starting dummy data dry-run...' : 'Starting dummy data seed...');
  logStep('started', { dryRun: options.dryRun, nodeEnv: process.env.NODE_ENV || 'development' });

  await mongoose.connect(process.env.MONGODB_URI);
  await ensureIndexes();

  await seedUsers();
  await seedCategories();
  await seedBooks();
  await seedPublishWorkflow();
  await seedOrderPaymentInventory();
  await seedSocialAndCommunication();
  await seedCounters();

  print('\nDummy data seed completed.');
  print(`Planned: ${stats.planned}`);
  print(`Created: ${stats.created}`);
  print(`Updated: ${stats.updated}`);
  print(`Reused: ${stats.reused}`);
  print(`Skipped: ${stats.skipped}`);
  print(`Demo password for seeded users: ${DEFAULT_PASSWORD}`);
  print('Seeded user emails:');
  print('- admin.demo@harglim.com');
  print('- reader.demo@harglim.com');
  print('- author.demo@harglim.com');
  print('- visitor.demo@harglim.com');

  logStep('completed', stats);
};

run()
  .catch((error) => {
    logger.error('dummy_seed.failed', { message: error.message, stack: error.stack });
    process.stderr.write(`Dummy seed failed: ${error.message}\n`);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });


