const { endpointInventory } = require('./apiInventory');
const { EVENT_CATALOG } = require('../events/eventCatalog');

const successExample = {
  success: true,
  data: {}
};

const errorExample = {
  success: false,
  message: 'Error message'
};

const endpointExamples = {
  Authentication: { success: true, token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', data: { _id: '66b4f5a2a44d2c0012a9c100', name: 'Ghani Reader', email: 'user@example.com', role: 'reader' } },
  Books: { success: true, data: [{ _id: '66b4f5a2a44d2c0012a9c101', title: 'Enterprise Publishing Systems', slug: 'enterprise-publishing-systems', price: 499, status: 'published' }], pagination: { total: 1, page: 1, pages: 1 } },
  Categories: { success: true, data: [{ _id: '66b4f5a2a44d2c0012a9c102', name: 'Business Books', slug: 'business-books', active: true, featured: true, bookCount: 12 }], pagination: { total: 1, page: 1, limit: 10, pages: 1 } },
  Orders: { success: true, data: { _id: '66b4f5a2a44d2c0012a9c120', orderNumber: 'HM-20260710-0001', totalPrice: 998, isPaid: false, paymentMethod: 'UPI', payment: '66b4f5a2a44d2c0012a9c130', qrCodeDataUrl: 'data:image/png;base64,...' } },
  Uploads: { success: true, data: { url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg', public_id: 'hm_uploads/sample' } },
  'Admin Categories': { success: true, data: { _id: '66b4f5a2a44d2c0012a9c102', name: 'Business Books', slug: 'business-books', active: true, featured: true, bookCount: 12 } },
  'Admin Operations': { success: true, data: { items: [], pagination: { total: 0, page: 1, limit: 20, pages: 0 } } },
  'Admin Invoices': { success: true, data: { invoiceNumber: 'INV-202607-000001', status: 'GENERATED', total: 998, currency: 'INR' } },
  'Admin Notifications': { success: true, data: { items: [], pagination: { total: 0, page: 1, limit: 20, pages: 0 } } },
  'Admin Shipments': { success: true, data: { shipmentNumber: 'SHP-202607-000001', status: 'CREATED' } },
  'Admin Analytics': { success: true, data: { report: 'dashboard', generatedAt: '2026-07-10T00:00:00.000Z', data: {} } },
  'Royalty Settlements': { success: true, data: { settlementNumber: 'SETTLE-20260808-1001', status: 'APPROVED', totalRoyalty: 500, currency: 'INR' } }
};

const schemas = {
  ApiSuccess: {
    type: 'object',
    properties: {
      success: { type: 'boolean', examples: [true] },
      data: { type: 'object' },
      message: { type: 'string' }
    }
  },
  Pagination: {
    type: 'object',
    properties: {
      total: { type: 'integer', minimum: 0 },
      page: { type: 'integer', minimum: 1 },
      limit: { type: 'integer', minimum: 1 },
      pages: { type: 'integer', minimum: 0 }
    }
  },
  PaginatedSuccess: {
    type: 'object',
    properties: {
      success: { type: 'boolean', examples: [true] },
      data: { type: 'array', items: { type: 'object' } },
      pagination: { $ref: '#/components/schemas/Pagination' }
    }
  },
  ApiError: {
    type: 'object',
    required: ['message'],
    properties: {
      success: { type: 'boolean', examples: [false] },
      status: { type: 'string', examples: ['error'] },
      message: { type: 'string' },
      stack: { type: 'string', description: 'Development only.' }
    }
  },
  User: {
    type: 'object',
    properties: {
      _id: { type: 'string' },
      name: { type: 'string' },
      email: { type: 'string', format: 'email' },
      role: { type: 'string', enum: ['visitor', 'reader', 'author', 'admin'] },
      profilePicture: { type: 'string' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' }
    }
  },
  Category: {
    type: 'object',
    properties: {
      _id: { type: 'string' },
      name: { type: 'string' },
      slug: { type: 'string' },
      description: { type: 'string' },
      shortDescription: { type: 'string' },
      image: { type: 'string' },
      banner: { type: 'string' },
      icon: { type: 'string' },
      seoTitle: { type: 'string' },
      seoDescription: { type: 'string' },
      parentCategory: { type: 'string', nullable: true },
      sortOrder: { type: 'number' },
      bookCount: { type: 'integer' },
      featured: { type: 'boolean' },
      active: { type: 'boolean' },
      isActive: { type: 'boolean', description: 'Legacy compatibility field synchronized with active.' },
      metadata: { type: 'object', additionalProperties: true },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' }
    }
  },
  Content: {
    type: 'object',
    properties: {
      key: { type: 'string', default: 'global' },
      hero: { type: 'object', additionalProperties: true },
      about: { type: 'object', additionalProperties: true },
      contact: { type: 'object', additionalProperties: true },
      faq: { type: 'array', items: { type: 'object', additionalProperties: true } },
      footer: { type: 'object', additionalProperties: true },
      socialLinks: { type: 'object', additionalProperties: true },
      seo: { type: 'object', additionalProperties: true },
      announcements: { type: 'array', items: { type: 'object', additionalProperties: true } },
      siteSettings: { type: 'object', additionalProperties: true },
      homeTitle: { type: 'string' },
      homeSubtitle: { type: 'string' },
      publishTitle: { type: 'string' },
      publishSubtitle: { type: 'string' },
      packagesJson: { type: 'string' },
      updatedAt: { type: 'string', format: 'date-time' }
    }
  },
  Book: {
    type: 'object',
    properties: {
      _id: { type: 'string' },
      title: { type: 'string' },
      slug: { type: 'string' },
      description: { type: 'string' },
      author: { oneOf: [{ type: 'string' }, { $ref: '#/components/schemas/User' }] },
      category: { oneOf: [{ type: 'string' }, { $ref: '#/components/schemas/Category' }] },
      price: { type: 'number' },
      royaltyPercentage: { type: 'number', minimum: 0, maximum: 100, default: 0 },
      coverImage: { type: 'string' },
      stock: { type: 'integer' },
      reservedStock: { type: 'integer' },
      ratings: { type: 'number' },
      reviewCount: { type: 'integer' },
      status: { type: 'string', enum: ['draft', 'published', 'archived'] },
      discountPrice: { type: 'number' },
      isBestseller: { type: 'boolean' },
      isFeatured: { type: 'boolean' },
      isNewRelease: { type: 'boolean' },
      isbn: { type: 'string' },
      pages: { type: 'integer' },
      format: { type: 'string', enum: ['hardcover', 'paperback', 'ebook', 'audiobook'] },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' }
    }
  },
  OrderItem: {
    type: 'object',
    properties: {
      book: { oneOf: [{ type: 'string' }, { $ref: '#/components/schemas/Book' }] },
      quantity: { type: 'integer', minimum: 1 },
      price: { type: 'number' }
    }
  },
  Order: {
    type: 'object',
    properties: {
      _id: { type: 'string' },
      orderNumber: { type: 'string' },
      user: { oneOf: [{ type: 'string' }, { $ref: '#/components/schemas/User' }] },
      items: { type: 'array', items: { $ref: '#/components/schemas/OrderItem' } },
      totalPrice: { type: 'number' },
      status: { type: 'string' },
      isPaid: { type: 'boolean' },
      paidAt: { type: 'string', format: 'date-time' },
      paymentMethod: { type: 'string' },
      utr: { type: 'string' },
      payment: { type: 'string' },
      qrCode: { type: 'string' },
      qrCodeDataUrl: { type: 'string' },
      createdAt: { type: 'string', format: 'date-time' }
    }
  },
  Payment: {
    type: 'object',
    properties: {
      _id: { type: 'string' },
      order: { type: 'string' },
      user: { type: 'string' },
      amount: { type: 'number' },
      currency: { type: 'string', examples: ['INR'] },
      provider: { type: 'string' },
      paymentMethod: { type: 'string' },
      status: { type: 'string' },
      utr: { type: 'string' },
      successfulPayment: { type: 'boolean' },
      activeIntent: { type: 'boolean' },
      expiresAt: { type: 'string', format: 'date-time' },
      verifiedAt: { type: 'string', format: 'date-time' }
    }
  },
  PaymentLedger: {
    type: 'object',
    properties: {
      ledgerId: { type: 'string' },
      paymentId: { type: 'string' },
      orderId: { type: 'string' },
      userId: { type: 'string' },
      eventType: { type: 'string' },
      previousStatus: { type: 'string' },
      currentStatus: { type: 'string' },
      amount: { type: 'number' },
      currency: { type: 'string' },
      provider: { type: 'string' },
      reference: { type: 'string' },
      createdAt: { type: 'string', format: 'date-time' }
    }
  },
  InventoryReservation: {
    type: 'object',
    properties: {
      _id: { type: 'string' },
      order: { type: 'string' },
      payment: { type: 'string' },
      book: { type: 'string' },
      quantity: { type: 'integer' },
      status: { type: 'string' },
      reservedAt: { type: 'string', format: 'date-time' },
      expiresAt: { type: 'string', format: 'date-time' }
    }
  },
  InventoryLedger: {
    type: 'object',
    properties: {
      _id: { type: 'string' },
      reservation: { type: 'string' },
      order: { type: 'string' },
      payment: { type: 'string' },
      book: { type: 'string' },
      eventType: { type: 'string' },
      quantity: { type: 'integer' },
      createdAt: { type: 'string', format: 'date-time' }
    }
  },
  Invoice: {
    type: 'object',
    properties: {
      _id: { type: 'string' },
      invoiceNumber: { type: 'string' },
      order: { type: 'string' },
      payment: { type: 'string' },
      customer: { type: 'string' },
      items: { type: 'array', items: { type: 'object' } },
      total: { type: 'number' },
      currency: { type: 'string' },
      status: { type: 'string' },
      generatedAt: { type: 'string', format: 'date-time' }
    }
  },
  Shipment: {
    type: 'object',
    properties: {
      _id: { type: 'string' },
      shipmentNumber: { type: 'string' },
      order: { type: 'string' },
      invoice: { type: 'string' },
      status: { type: 'string' },
      courier: { type: 'object', additionalProperties: true },
      tracking: { type: 'array', items: { type: 'object' } },
      createdAt: { type: 'string', format: 'date-time' }
    }
  },
  ShipmentLedger: {
    type: 'object',
    properties: {
      _id: { type: 'string' },
      shipment: { type: 'string' },
      order: { type: 'string' },
      eventType: { type: 'string' },
      previousStatus: { type: 'string' },
      currentStatus: { type: 'string' },
      createdAt: { type: 'string', format: 'date-time' }
    }
  },
  Notification: {
    type: 'object',
    properties: {
      _id: { type: 'string' },
      user: { type: 'string' },
      eventType: { type: 'string' },
      channel: { type: 'string' },
      subject: { type: 'string' },
      status: { type: 'string' },
      retryCount: { type: 'integer' },
      sentAt: { type: 'string', format: 'date-time' }
    }
  },
  AnalyticsEvent: {
    type: 'object',
    properties: {
      eventId: { type: 'string' },
      eventType: { type: 'string' },
      occurredAt: { type: 'string', format: 'date-time' },
      bucketDay: { type: 'string' },
      amount: { type: 'number' },
      quantity: { type: 'number' },
      metadata: { type: 'object', additionalProperties: true }
    }
  },
  RegisterRequest: {
    type: 'object',
    required: ['name', 'email', 'password'],
    properties: {
      name: { type: 'string', minLength: 2 },
      email: { type: 'string', format: 'email' },
      password: { type: 'string', minLength: 6 }
    }
  },
  LoginRequest: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: { type: 'string', format: 'email' },
      password: { type: 'string' }
    }
  },
  GoogleLoginRequest: {
    type: 'object',
    required: ['credential'],
    additionalProperties: false,
    properties: {
      credential: {
        type: 'string',
        maxLength: 4096,
        description: 'Google Identity Services ID token. Backend verifies signature, expiry, issuer, and audience against GOOGLE_CLIENT_ID.'
      }
    }
  },
  OrderCreateRequest: {
    type: 'object',
    required: ['items', 'shippingAddress'],
    properties: {
      items: {
        type: 'array',
        minItems: 1,
        items: {
          type: 'object',
          required: ['book', 'quantity'],
          properties: {
            book: { type: 'string', description: 'Book ObjectId.' },
            quantity: { type: 'integer', minimum: 1 }
          }
        }
      },
      shippingAddress: {
        type: 'object',
        required: ['fullName', 'addressLine1', 'city', 'postalCode', 'country'],
        properties: {
          fullName: { type: 'string' },
          addressLine1: { type: 'string' },
          addressLine2: { type: 'string' },
          city: { type: 'string' },
          postalCode: { type: 'string' },
          country: { type: 'string' }
        }
      },
      paymentMethod: { type: 'string', default: 'UPI', examples: ['UPI'] }
    }
  },
  PaymentVerificationRequest: {
    type: 'object',
    required: ['utr'],
    properties: {
      utr: { type: 'string', pattern: '^[A-Z0-9-]{6,64}$' }
    }
  },
  StatusUpdateRequest: {
    type: 'object',
    required: ['status'],
    properties: {
      status: { type: 'string' },
      reason: { type: 'string' },
      description: { type: 'string' },
      location: { type: 'string' },
      occurredAt: { type: 'string', format: 'date-time' }
    }
  },
  RejectPaymentRequest: {
    type: 'object',
    properties: {
      reason: { type: 'string', maxLength: 500 }
    }
  },
  UserUpdateRequest: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      bio: { type: 'string', description: 'Accepted by controller but currently not persisted in User schema.' },
      profilePicture: { type: 'string', format: 'uri' }
    }
  },
  WishlistRequest: {
    type: 'object',
    required: ['bookId'],
    properties: {
      bookId: { type: 'string' }
    }
  },
  AuthorBookCreateRequest: {
    type: 'object',
    required: ['title', 'description', 'category'],
    properties: {
      title: { type: 'string' },
      description: { type: 'string' },
      category: { type: 'string', description: 'Category ObjectId.' },
      mrp: { type: 'number', minimum: 0, description: 'Canonical book price. Preferred field for new frontend code.' },
      price: { type: 'number', minimum: 0, description: 'Legacy compatibility alias for mrp. If supplied with mrp, both values must match.' },
      format: { type: 'string', enum: ['hardcover', 'paperback', 'ebook', 'audiobook'], default: 'paperback' },
      coverImage: { type: 'string', format: 'uri' },
      isbn: { type: 'string' },
      pages: { type: 'integer', minimum: 1 }
    }
  },
  AuthorBookUpdateRequest: {
    type: 'object',
    properties: {
      title: { type: 'string' },
      description: { type: 'string' },
      category: { type: 'string', description: 'Category ObjectId.' },
      mrp: { type: 'number', minimum: 0, description: 'Canonical book price. Preferred field for new frontend code.' },
      price: { type: 'number', minimum: 0, description: 'Legacy compatibility alias for mrp. If supplied with mrp, both values must match.' },
      format: { type: 'string', enum: ['hardcover', 'paperback', 'ebook', 'audiobook'] },
      coverImage: { type: 'string', format: 'uri' },
      isbn: { type: 'string' },
      pages: { type: 'integer', minimum: 1 }
    }
  },
  AdminBookCreateRequest: {
    type: 'object',
    description: 'Admin book creation payload. slug is server-owned, generated from title, URL-safe, and unique. Frontend should not send slug. Book.mrp is canonical; price is a temporary compatibility alias.',
    required: ['title', 'description', 'category', 'mrp'],
    properties: {
      title: { type: 'string' },
      description: { type: 'string' },
      author: { type: 'string', description: 'Optional author ObjectId. Defaults to current admin user when omitted.' },
      category: { type: 'string', description: 'Category ObjectId.' },
      mrp: { type: 'number', minimum: 0, description: 'Canonical book price. Preferred field for new frontend code.' },
      price: { type: 'number', minimum: 0, description: 'Legacy compatibility alias for mrp. If supplied with mrp, both values must match.' },
      royaltyPercentage: { type: 'number', minimum: 0, maximum: 100, default: 0 },
      coverImage: { type: 'string', format: 'uri' },
      stock: { type: 'integer', minimum: 0 },
      reservedStock: { type: 'integer', minimum: 0 },
      status: { type: 'string', enum: ['draft', 'published', 'archived'], default: 'draft' },
      discountPrice: { type: 'number' },
      isBestseller: { type: 'boolean' },
      isFeatured: { type: 'boolean' },
      isNewRelease: { type: 'boolean' },
      isbn: { type: 'string' },
      pages: { type: 'integer', minimum: 1 },
      format: { type: 'string', enum: ['hardcover', 'paperback', 'ebook', 'audiobook'], default: 'paperback' }
    }
  },
  AdminBookUpdateRequest: {
    type: 'object',
    description: 'Admin book update payload. slug is stable after creation and remains server-owned. Title updates do not regenerate slug.',
    properties: {
      title: { type: 'string' },
      description: { type: 'string' },
      author: { type: 'string' },
      category: { type: 'string' },
      mrp: { type: 'number', minimum: 0, description: 'Canonical book price. Preferred field for new frontend code.' },
      price: { type: 'number', minimum: 0, description: 'Legacy compatibility alias for mrp. If supplied with mrp, both values must match.' },
      royaltyPercentage: { type: 'number', minimum: 0, maximum: 100, default: 0 },
      coverImage: { type: 'string', format: 'uri' },
      stock: { type: 'integer', minimum: 0 },
      reservedStock: { type: 'integer', minimum: 0 },
      status: { type: 'string', enum: ['draft', 'published', 'archived'] },
      discountPrice: { type: 'number' },
      isBestseller: { type: 'boolean' },
      isFeatured: { type: 'boolean' },
      isNewRelease: { type: 'boolean' },
      isbn: { type: 'string' },
      pages: { type: 'integer', minimum: 1 },
      format: { type: 'string', enum: ['hardcover', 'paperback', 'ebook', 'audiobook'] }
    }
  },
  BookCreateRequest: {
    type: 'object',
    description: 'Backward-compatible alias for AdminBookCreateRequest. New docs should prefer AdminBookCreateRequest or AuthorBookCreateRequest.',
    allOf: [{ $ref: '#/components/schemas/AdminBookCreateRequest' }]
  },
  BookUpdateRequest: {
    type: 'object',
    description: 'Backward-compatible alias for AdminBookUpdateRequest. New docs should prefer AdminBookUpdateRequest or AuthorBookUpdateRequest.',
    allOf: [{ $ref: '#/components/schemas/AdminBookUpdateRequest' }]
  },
  BookSubmissionRequest: {
    type: 'object',
    required: ['fileUrl'],
    properties: {
      fileUrl: { type: 'string', format: 'uri', description: 'Uploaded manuscript URL. documentUrl or manuscriptUrl are accepted compatibility aliases.' },
      documentUrl: { type: 'string', format: 'uri', description: 'Compatibility alias for fileUrl.' },
      manuscriptUrl: { type: 'string', format: 'uri', description: 'Compatibility alias for fileUrl.' },
      packageId: { type: 'string', description: 'Optional PublishPackage ObjectId. Defaults to the first active package when omitted.' },
      genre: { type: 'string', description: 'Optional. Defaults from category name or General.' },
      wordCount: { type: 'integer', minimum: 1, description: 'Optional. Defaults from pages * 300 or 25000.' },
      pages: { type: 'integer', minimum: 1, description: 'Optional helper for deriving wordCount when wordCount is omitted.' }
    }
  },
  EditorialReasonRequest: {
    type: 'object',
    properties: {
      reason: { type: 'string', description: 'Optional admin reason. Runtime supplies a default when omitted.' }
    }
  },
  EditorialNotesRequest: {
    type: 'object',
    properties: {
      notes: { type: 'string', description: 'Optional admin notes. Runtime supplies a default when omitted.' }
    }
  },
  CategoryCreateRequest: {
    type: 'object',
    required: ['name'],
    properties: {
      name: { type: 'string' },
      slug: { type: 'string', description: 'Optional. Generated from name when omitted.' },
      description: { type: 'string' },
      shortDescription: { type: 'string' },
      image: { type: 'string', format: 'uri' },
      banner: { type: 'string', format: 'uri' },
      icon: { type: 'string' },
      seoTitle: { type: 'string' },
      seoDescription: { type: 'string' },
      parentCategory: { type: 'string', nullable: true },
      sortOrder: { type: 'number', default: 0 },
      featured: { type: 'boolean', default: false },
      active: { type: 'boolean', default: true },
      metadata: { type: 'object', additionalProperties: true }
    }
  },
  CategoryUpdateRequest: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      slug: { type: 'string' },
      description: { type: 'string' },
      shortDescription: { type: 'string' },
      image: { type: 'string', format: 'uri' },
      banner: { type: 'string', format: 'uri' },
      icon: { type: 'string' },
      seoTitle: { type: 'string' },
      seoDescription: { type: 'string' },
      parentCategory: { type: 'string', nullable: true },
      sortOrder: { type: 'number' },
      featured: { type: 'boolean' },
      active: { type: 'boolean' },
      metadata: { type: 'object', additionalProperties: true }
    }
  },
  CategoryStatusRequest: {
    type: 'object',
    required: ['active'],
    properties: {
      active: { type: 'boolean' }
    }
  },
  RefreshTokenRequest: {
    type: 'object',
    properties: {
      refreshToken: { type: 'string', description: 'Opaque refresh token issued by login/register/reset-password.' }
    }
  },
  LogoutRequest: {
    type: 'object',
    properties: {
      refreshToken: { type: 'string', description: 'Refresh token to revoke. Optional when bearer token is supplied.' },
      all: { type: 'boolean', default: false, description: 'Revoke all active sessions for the authenticated user.' }
    }
  },
  ResetPasswordRequest: {
    type: 'object',
    required: ['password'],
    properties: { password: { type: 'string', minLength: 6 } }
  },
  ChangePasswordRequest: {
    type: 'object',
    required: ['currentPassword', 'password'],
    properties: {
      currentPassword: { type: 'string', minLength: 6 },
      password: { type: 'string', minLength: 6 }
    }
  },  ForgotPasswordRequest: {
    type: 'object',
    required: ['email'],
    properties: { email: { type: 'string', format: 'email' } }
  },
  PasswordResetRequest: {
    type: 'object',
    required: ['password'],
    properties: { password: { type: 'string', minLength: 6 } }
  },
  AuthorApplicationRequest: {
    type: 'object',
    properties: {
      penName: { type: 'string' },
      bio: { type: 'string' },
      portfolioUrl: { type: 'string', format: 'uri' },
      experience: { type: 'string' }
    }
  },
  AuthorApplicationStatusRequest: {
    type: 'object',
    required: ['status'],
    properties: { status: { type: 'string', enum: ['approved', 'rejected'] } }
  },
  ReviewRequest: {
    type: 'object',
    properties: { book: { type: 'string' }, rating: { type: 'integer', minimum: 1, maximum: 5 }, comment: { type: 'string' } }
  },
  ReviewCreateRequest: {
    type: 'object',
    required: ['book', 'rating', 'comment'],
    properties: { book: { type: 'string' }, rating: { type: 'integer', minimum: 1, maximum: 5 }, comment: { type: 'string' } }
  },
  ReviewUpdateRequest: {
    type: 'object',
    properties: { rating: { type: 'integer', minimum: 1, maximum: 5 }, comment: { type: 'string' } }
  },
  ReviewModerationRequest: {
    type: 'object',
    required: ['status'],
    properties: { status: { type: 'string', enum: ['approved', 'pending', 'rejected'] } }
  },
  ContentUpdateRequest: {
    type: 'object',
    properties: {
      hero: { type: 'object', additionalProperties: true },
      about: { type: 'object', additionalProperties: true },
      contact: { type: 'object', additionalProperties: true },
      faq: { type: 'array', items: { type: 'object', additionalProperties: true } },
      footer: { type: 'object', additionalProperties: true },
      socialLinks: { type: 'object', additionalProperties: true },
      seo: { type: 'object', additionalProperties: true },
      announcements: { type: 'array', items: { type: 'object', additionalProperties: true } },
      siteSettings: { type: 'object', additionalProperties: true },
      homeTitle: { type: 'string' },
      homeSubtitle: { type: 'string' },
      publishTitle: { type: 'string' },
      publishSubtitle: { type: 'string' },
      packagesJson: { type: 'string' }
    }
  },
  AdminUserUpdateRequest: {
    type: 'object',
    properties: {
      role: { type: 'string', enum: ['user', 'visitor', 'reader', 'author', 'admin'], description: 'user is normalized to reader.' },
      isActive: { type: 'boolean' },
      status: { type: 'string', enum: ['Active', 'Suspended'], description: 'Frontend compatibility alias for isActive.' }
    }
  },
  UserRoleRequest: {
    type: 'object',
    required: ['role'],
    properties: { role: { type: 'string', enum: ['user', 'visitor', 'reader', 'author', 'admin'], description: 'user is normalized to reader for frontend compatibility.' } }
  },
  UserStatusRequest: {
    type: 'object',
    required: ['isActive'],
    properties: { isActive: { type: 'boolean' } }
  },
  AdminRoleUpdateRequest: {
    type: 'object',
    required: ['role'],
    properties: { role: { type: 'string', enum: ['user', 'visitor', 'reader', 'author', 'admin'], description: 'user is normalized to reader for frontend compatibility.' } }
  },
  AdminUserStatusRequest: {
    type: 'object',
    required: ['isActive'],
    properties: { isActive: { type: 'boolean' } }
  },
  AdminPasswordResetRequest: {
    type: 'object',
    required: ['password'],
    properties: { password: { type: 'string', minLength: 6 } }
  },  PublishRequestCreate: {
    type: 'object',
    required: ['title', 'genre', 'wordCount', 'packageId', 'fileUrl'],
    properties: {
      title: { type: 'string' },
      genre: { type: 'string' },
      wordCount: { type: 'integer', minimum: 1 },
      packageId: { type: 'string', description: 'PublishPackage ObjectId.' },
      fileUrl: { type: 'string', format: 'uri' }
    }
  },
  CourierAssignRequest: {
    type: 'object',
    properties: {
      provider: { type: 'string', default: 'manual' },
      serviceName: { type: 'string', default: 'Manual Courier' },
      trackingNumber: { type: 'string' },
      trackingUrl: { type: 'string' },
      estimatedDelivery: { type: 'string', format: 'date-time' }
    }
  },
  PaymentActionRequest: {
    type: 'object',
    properties: {
      reason: { type: 'string', maxLength: 500 },
      metadata: { type: 'object', additionalProperties: true }
    }
  },
  QRRegenerateRequest: {
    type: 'object',
    properties: {
      force: { type: 'boolean', default: true },
      reason: { type: 'string', default: 'Admin QR regeneration' }
    }
  },
  NotificationRetryRequest: {
    type: 'object',
    properties: {
      reason: { type: 'string' },
      force: { type: 'boolean', default: false }
    }
  },
  ShipmentCancelRequest: {
    type: 'object',
    properties: {
      reason: { type: 'string' }
    }
  },
  AuthorAccessPlanRequest: {
    type: 'object',
    required: ['amount'],
    properties: {
      name: { type: 'string', default: 'Author Dashboard Access' },
      description: { type: 'string', default: 'One-time author dashboard operational access plan' },
      amount: { type: 'number', minimum: 0 },
      currency: { type: 'string', default: 'INR' },
      status: { type: 'string', enum: ['DRAFT', 'ACTIVE', 'ARCHIVED'], default: 'ACTIVE' },
      version: { type: 'integer', minimum: 1 }
    }
  },
  AuthorAccessGrantRequest: {
    type: 'object',
    required: ['userId'],
    properties: {
      userId: { type: 'string', description: 'Author user ObjectId to grant dashboard entitlement.' },
      reason: { type: 'string', description: 'Optional audit reason.' }
    }
  },
  AuthorAccessReasonRequest: {
    type: 'object',
    properties: {
      reason: { type: 'string', description: 'Optional audit reason. userId comes from the URL path.' }
    }
  },
  SettlementPreviewRequest: {
    type: 'object',
    required: ['authorId'],
    properties: {
      authorId: { type: 'string', description: 'Author user ObjectId.' },
      from: { type: 'string', format: 'date-time', description: 'Optional sales window start.' },
      to: { type: 'string', format: 'date-time', description: 'Optional sales window end.' }
    }
  },
  SettlementCreateRequest: {
    type: 'object',
    required: ['authorId', 'periodStart', 'periodEnd'],
    properties: {
      authorId: { type: 'string', description: 'Author user ObjectId.' },
      periodStart: { type: 'string', format: 'date-time' },
      periodEnd: { type: 'string', format: 'date-time' }
    }
  },
  SettlementMarkPaidRequest: {
    type: 'object',
    required: ['transactionReference'],
    properties: {
      paymentMethod: { type: 'string', enum: ['MANUAL_BANK_TRANSFER', 'MANUAL_UPI', 'CHEQUE', 'OTHER'], default: 'MANUAL_BANK_TRANSFER' },
      transactionReference: { type: 'string', description: 'External/manual payout reference recorded by admin.' },
      paidAt: { type: 'string', format: 'date-time', description: 'Optional. Defaults to current server time.' },
      notes: { type: 'string' }
    }
  },
  SettlementCancelRequest: {
    type: 'object',
    properties: {
      reason: { type: 'string', default: 'Cancelled by admin' }
    }
  },
  MultipartImageRequest: {
    type: 'object',
    required: ['image'],
    properties: {
      image: {
        type: 'string',
        format: 'binary',
        description: 'Multipart field name: image. Allowed MIME types: image/jpeg, image/png, image/webp, image/gif. Default max size: 25MB unless UPLOAD_MAX_BYTES is configured.'
      }
    }
  },
  MultipartDocumentRequest: {
    type: 'object',
    required: ['document'],
    properties: {
      document: {
        type: 'string',
        format: 'binary',
        description: 'Multipart field name: document. Allowed MIME types: application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document. Default max size: 25MB unless UPLOAD_MAX_BYTES is configured.'
      }
    }
  }
};

const schemaExamples = {
  RegisterRequest: {
    name: 'Ghani Reader',
    email: 'user@example.com',
    password: 'StrongPass123!'
  },
  LoginRequest: {
    email: 'user@example.com',
    password: 'StrongPass123!'
  },
  GoogleLoginRequest: {
    credential: '<GOOGLE_ID_TOKEN>'
  },
  OrderCreateRequest: {
    items: [
      { book: '66b4f5a2a44d2c0012a9c101', quantity: 2 }
    ],
    shippingAddress: {
      fullName: 'Ghani Khan',
      addressLine1: '12 MG Road',
      addressLine2: 'Near Central Mall',
      city: 'Bengaluru',
      postalCode: '560001',
      country: 'India'
    },
    paymentMethod: 'UPI'
  },
  PaymentVerificationRequest: {
    utr: 'UPI1234567890'
  },
  StatusUpdateRequest: {
    status: 'Processing',
    reason: 'Status updated by admin'
  },
  RejectPaymentRequest: {
    reason: 'UTR could not be verified'
  },
  ContentUpdateRequest: {
    homeTitle: 'You write, we print.',
    homeSubtitle: 'Explore inspiring books.',
    publishTitle: 'Publish Your Book With Us',
    packagesJson: '[]'
  },
  UserUpdateRequest: {
    name: 'Ghani Khan',
    profilePicture: 'https://example.com/profile.jpg'
  },
  WishlistRequest: {
    bookId: '66b4f5a2a44d2c0012a9c101'
  },
  AuthorBookCreateRequest: {
    title: 'My Publishing Journey',
    description: 'A draft manuscript prepared by the authenticated author.',
    category: '66b4f5a2a44d2c0012a9c102',
    mrp: 399,
    coverImage: 'https://example.com/cover.jpg',
    pages: 240,
    format: 'paperback'
  },
  AuthorBookUpdateRequest: {
    title: 'My Updated Publishing Journey',
    mrp: 449,
    pages: 260
  },
  AdminBookCreateRequest: {
    title: 'Enterprise Publishing Systems',
    description: 'A practical book about modern publishing operations.',
    category: '66b4f5a2a44d2c0012a9c102',
    author: '66b4f5a2a44d2c0012a9c103',
    mrp: 499,
    royaltyPercentage: 10,
    coverImage: 'https://example.com/cover.jpg',
    stock: 100,
    status: 'published',
    discountPrice: 399,
    isFeatured: true,
    isbn: '9781234567890',
    pages: 320,
    format: 'paperback'
  },
  AdminBookUpdateRequest: {
    mrp: 449,
    royaltyPercentage: 12,
    stock: 120,
    status: 'published',
    isBestseller: true
  },
  BookCreateRequest: {
    title: 'Enterprise Publishing Systems',
    description: 'A practical book about modern publishing operations.',
    category: '66b4f5a2a44d2c0012a9c102',
    mrp: 499
  },
  BookUpdateRequest: {
    mrp: 449,
    stock: 120
  },
  BookSubmissionRequest: {
    fileUrl: 'https://res.cloudinary.com/demo/raw/upload/manuscript.pdf',
    packageId: '66b4f5a2a44d2c0012a9c104',
    genre: 'Business',
    wordCount: 52000
  },
  EditorialReasonRequest: {
    reason: 'Please upload a higher-resolution cover image.'
  },
  EditorialNotesRequest: {
    notes: 'Approved after editorial review.'
  },
  AuthorAccessPlanRequest: {
    name: 'Author Dashboard Access',
    description: 'One-time author dashboard operational access plan',
    amount: 4999,
    currency: 'INR',
    status: 'ACTIVE'
  },
  AuthorAccessGrantRequest: {
    userId: '66b4f5a2a44d2c0012a9c105',
    reason: 'Manual access approved by operations.'
  },
  AuthorAccessReasonRequest: {
    reason: 'Administrative entitlement update.'
  },
  SettlementPreviewRequest: {
    authorId: '66b4f5a2a44d2c0012a9c105',
    from: '2026-08-01T00:00:00.000Z',
    to: '2026-08-31T23:59:59.999Z'
  },
  SettlementCreateRequest: {
    authorId: '66b4f5a2a44d2c0012a9c105',
    periodStart: '2026-08-01T00:00:00.000Z',
    periodEnd: '2026-08-31T23:59:59.999Z'
  },
  SettlementMarkPaidRequest: {
    paymentMethod: 'MANUAL_BANK_TRANSFER',
    transactionReference: 'BANK-UTR-123456789',
    paidAt: '2026-09-02T10:30:00.000Z',
    notes: 'Paid through manual bank transfer.'
  },
  SettlementCancelRequest: {
    reason: 'Incorrect settlement period selected.'
  },
  CategoryCreateRequest: {
    name: 'Business Books',
    description: 'Books for founders, operators, and enterprise teams.',
    shortDescription: 'Business and operations titles.',
    featured: true,
    sortOrder: 10,
    seoTitle: 'Business Books',
    seoDescription: 'Business books from Harglim Publishers.'
  },
  CategoryUpdateRequest: {
    description: 'Updated category description.',
    featured: false,
    sortOrder: 20
  },
  CategoryStatusRequest: {
    active: false
  },
  RefreshTokenRequest: {
    type: 'object',
    properties: {
      refreshToken: { type: 'string', description: 'Opaque refresh token issued by login/register/reset-password.' }
    }
  },
  LogoutRequest: {
    type: 'object',
    properties: {
      refreshToken: { type: 'string', description: 'Refresh token to revoke. Optional when bearer token is supplied.' },
      all: { type: 'boolean', default: false, description: 'Revoke all active sessions for the authenticated user.' }
    }
  },
  ResetPasswordRequest: {
    type: 'object',
    required: ['password'],
    properties: { password: { type: 'string', minLength: 6 } }
  },
  ChangePasswordRequest: {
    type: 'object',
    required: ['currentPassword', 'password'],
    properties: {
      currentPassword: { type: 'string', minLength: 6 },
      password: { type: 'string', minLength: 6 }
    }
  },  ForgotPasswordRequest: {
    type: 'object',
    required: ['email'],
    properties: { email: { type: 'string', format: 'email' } }
  },
  PasswordResetRequest: {
    type: 'object',
    required: ['password'],
    properties: { password: { type: 'string', minLength: 6 } }
  },
  AuthorApplicationRequest: {
    type: 'object',
    properties: {
      penName: { type: 'string' },
      bio: { type: 'string' },
      portfolioUrl: { type: 'string', format: 'uri' },
      experience: { type: 'string' }
    }
  },
  AuthorApplicationStatusRequest: {
    type: 'object',
    required: ['status'],
    properties: { status: { type: 'string', enum: ['approved', 'rejected'] } }
  },
  ReviewRequest: {
    type: 'object',
    properties: { book: { type: 'string' }, rating: { type: 'integer', minimum: 1, maximum: 5 }, comment: { type: 'string' } }
  },
  ReviewCreateRequest: {
    type: 'object',
    required: ['book', 'rating', 'comment'],
    properties: { book: { type: 'string' }, rating: { type: 'integer', minimum: 1, maximum: 5 }, comment: { type: 'string' } }
  },
  ReviewUpdateRequest: {
    type: 'object',
    properties: { rating: { type: 'integer', minimum: 1, maximum: 5 }, comment: { type: 'string' } }
  },
  ReviewModerationRequest: {
    type: 'object',
    required: ['status'],
    properties: { status: { type: 'string', enum: ['approved', 'pending', 'rejected'] } }
  },
  ContentUpdateRequest: {
    type: 'object',
    properties: {
      hero: { type: 'object', additionalProperties: true },
      about: { type: 'object', additionalProperties: true },
      contact: { type: 'object', additionalProperties: true },
      faq: { type: 'array', items: { type: 'object', additionalProperties: true } },
      footer: { type: 'object', additionalProperties: true },
      socialLinks: { type: 'object', additionalProperties: true },
      seo: { type: 'object', additionalProperties: true },
      announcements: { type: 'array', items: { type: 'object', additionalProperties: true } },
      siteSettings: { type: 'object', additionalProperties: true },
      homeTitle: { type: 'string' },
      homeSubtitle: { type: 'string' },
      publishTitle: { type: 'string' },
      publishSubtitle: { type: 'string' },
      packagesJson: { type: 'string' }
    }
  },
  AdminUserUpdateRequest: {
    type: 'object',
    properties: {
      role: { type: 'string', enum: ['user', 'visitor', 'reader', 'author', 'admin'], description: 'user is normalized to reader.' },
      isActive: { type: 'boolean' },
      status: { type: 'string', enum: ['Active', 'Suspended'], description: 'Frontend compatibility alias for isActive.' }
    }
  },
  UserRoleRequest: {
    type: 'object',
    required: ['role'],
    properties: { role: { type: 'string', enum: ['user', 'visitor', 'reader', 'author', 'admin'], description: 'user is normalized to reader for frontend compatibility.' } }
  },
  UserStatusRequest: {
    type: 'object',
    required: ['isActive'],
    properties: { isActive: { type: 'boolean' } }
  },
  AdminRoleUpdateRequest: {
    type: 'object',
    required: ['role'],
    properties: { role: { type: 'string', enum: ['user', 'visitor', 'reader', 'author', 'admin'], description: 'user is normalized to reader for frontend compatibility.' } }
  },
  AdminUserStatusRequest: {
    type: 'object',
    required: ['isActive'],
    properties: { isActive: { type: 'boolean' } }
  },
  AdminPasswordResetRequest: {
    type: 'object',
    required: ['password'],
    properties: { password: { type: 'string', minLength: 6 } }
  },  PublishRequestCreate: {
    title: 'My Manuscript',
    genre: 'Business',
    wordCount: 65000,
    packageId: '66b4f5a2a44d2c0012a9c104',
    fileUrl: 'https://res.cloudinary.com/demo/raw/upload/manuscript.pdf'
  },
  CourierAssignRequest: {
    provider: 'manual',
    serviceName: 'Manual Courier',
    trackingNumber: 'MAN-123456',
    trackingUrl: '/track/MAN-123456',
    estimatedDelivery: '2026-07-15T10:00:00.000Z'
  },
  PaymentActionRequest: {
    reason: 'Approved after manual verification',
    metadata: { source: 'admin-dashboard' }
  },
  QRRegenerateRequest: {
    force: true,
    reason: 'Customer requested a fresh QR'
  },
  NotificationRetryRequest: {
    reason: 'Retry after provider recovery',
    force: false
  },
  ShipmentCancelRequest: {
    reason: 'Customer cancelled before dispatch'
  }
};

function toOperationId(endpoint) {
  return `${endpoint.method.toLowerCase()}_${endpoint.path.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '')}`;
}

function parameterFor(name) {
  return {
    name,
    in: 'path',
    required: true,
    schema: { type: 'string' }
  };
}

function queryFor(name) {
  const querySchemas = {
    page: { type: 'integer', minimum: 1, default: 1 },
    limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
    minPrice: { type: 'number', minimum: 0 },
    maxPrice: { type: 'number', minimum: 0 },
    featured: { type: 'boolean' },
    active: { type: 'boolean' },
    bestseller: { type: 'boolean' },
    newRelease: { type: 'boolean' },
    threshold: { type: 'integer', minimum: 0 },
    from: { type: 'string', format: 'date-time' },
    to: { type: 'string', format: 'date-time' },
    period: { type: 'string', enum: ['daily', 'weekly', 'monthly', 'yearly'] },
    status: { type: 'string' },
    sort: { type: 'string' }
  };

  return {
    name,
    in: 'query',
    required: false,
    schema: querySchemas[name] || { type: 'string' }
  };
}

function authHeaderFor() {
  return [];
}

function successExampleFor(endpoint) {
  return endpointExamples[endpoint.tag] || successExample;
}

function requestBodyFor(endpoint) {
  if (!endpoint.body) return undefined;
  const isMultipart = endpoint.body.startsWith('Multipart');
  const optionalBodies = new Set([
    'PaymentActionRequest',
    'QRRegenerateRequest',
    'NotificationRetryRequest',
    'ShipmentCancelRequest'
  ]);
  return {
    required: !endpoint.body.includes('Update') && !optionalBodies.has(endpoint.body),
    content: {
      [isMultipart ? 'multipart/form-data' : 'application/json']: {
        schema: { $ref: `#/components/schemas/${endpoint.body}` },
        ...(schemaExamples[endpoint.body] ? {
          examples: {
            default: {
              summary: `${endpoint.body} example`,
              value: schemaExamples[endpoint.body]
            }
          }
        } : {})
      }
    }
  };
}

function securityFor(endpoint) {
  return endpoint.auth === 'Public' ? [] : [{ bearerAuth: [] }];
}

function buildOpenApiSpec() {
  const paths = {};

  for (const endpoint of endpointInventory) {
    paths[endpoint.path] = paths[endpoint.path] || {};
    const body = requestBodyFor(endpoint);
    const responses = {
      200: {
        description: 'Successful response.',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiSuccess' }, examples: { success: { value: successExampleFor(endpoint) } } } }
  },
  SettlementPreviewRequest: {
    type: 'object',
    required: ['authorId'],
    properties: {
      authorId: { type: 'string', description: 'Author user ObjectId.' },
      from: { type: 'string', format: 'date-time', description: 'Optional sales window start.' },
      to: { type: 'string', format: 'date-time', description: 'Optional sales window end.' }
    }
  },
  SettlementCreateRequest: {
    type: 'object',
    required: ['authorId', 'periodStart', 'periodEnd'],
    properties: {
      authorId: { type: 'string', description: 'Author user ObjectId.' },
      periodStart: { type: 'string', format: 'date-time' },
      periodEnd: { type: 'string', format: 'date-time' }
    }
  },
  SettlementMarkPaidRequest: {
    type: 'object',
    required: ['transactionReference'],
    properties: {
      paymentMethod: { type: 'string', enum: ['MANUAL_BANK_TRANSFER', 'MANUAL_UPI', 'CHEQUE', 'OTHER'], default: 'MANUAL_BANK_TRANSFER' },
      transactionReference: { type: 'string', description: 'External/manual payout reference recorded by admin.' },
      paidAt: { type: 'string', format: 'date-time', description: 'Optional. Defaults to current server time.' },
      notes: { type: 'string' }
    }
  },
  SettlementCancelRequest: {
    type: 'object',
    properties: {
      reason: { type: 'string', default: 'Cancelled by admin' }
    }
  },
      201: {
        description: 'Created successfully where applicable.',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiSuccess' }, examples: { created: { value: successExampleFor(endpoint) } } } }
      },
      400: { $ref: '#/components/responses/BadRequest' },
      401: { $ref: '#/components/responses/Unauthorized' },
      403: { $ref: '#/components/responses/Forbidden' },
      404: { $ref: '#/components/responses/NotFound' },
      429: { $ref: '#/components/responses/RateLimited' },
      500: { $ref: '#/components/responses/InternalServerError' }
    };

    if (endpoint.tag === 'Uploads') {
      responses[503] = { $ref: '#/components/responses/ServiceUnavailable' };
    }
    if (endpoint.tag === 'Admin Categories' || endpoint.path.includes('/operations/payments')) {
      responses[409] = { $ref: '#/components/responses/Conflict' };
    }

    paths[endpoint.path][endpoint.method.toLowerCase()] = {
      tags: [endpoint.tag],
      summary: endpoint.summary,
      description: `${endpoint.summary}. Controller: ${endpoint.controller}. Authentication: ${endpoint.auth}. API routes are rate limited and return standard error envelopes. ${endpoint.notes || ''}`.trim(),
      operationId: toOperationId(endpoint),
      security: securityFor(endpoint),
      parameters: [
        ...authHeaderFor(endpoint),
        ...(endpoint.params || []).map(parameterFor),
        ...(endpoint.query || []).map(queryFor)
      ],
      ...(body ? { requestBody: body } : {}),
      responses
    };
  }

  return {
    openapi: '3.1.0',
    info: {
      title: 'HM Backend API',
      version: '1.0.0',
      description: 'Production API documentation generated from the Express route inventory.'
    },
    servers: [
      { url: 'http://localhost:5000', description: 'Development' },
      { url: 'https://staging.example.com', description: 'Staging' },
      { url: 'https://api.example.com', description: 'Production' }
    ],
    tags: [...new Set(endpointInventory.map((endpoint) => endpoint.tag))].map((name) => ({ name })),
    paths,
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas,
      responses: {
        BadRequest: { description: 'Invalid input or business rule failure.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' }, examples: { error: { value: errorExample } } } } },
        Unauthorized: { description: 'Missing or invalid bearer token.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } } },
        Forbidden: { description: 'Authenticated user does not have the required role.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } } },
        NotFound: { description: 'Resource or route not found.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } } },
        Conflict: { description: 'Duplicate resource or state conflict.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' }, examples: { duplicate: { value: { success: false, message: 'Resource already exists' } } } } } },
        PayloadTooLarge: { description: 'Request body or upload exceeds configured size limits.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' }, examples: { tooLarge: { value: { success: false, message: 'File too large' } } } } } },
        UnsupportedMediaType: { description: 'Unsupported upload MIME type or file extension.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' }, examples: { unsupported: { value: { success: false, message: 'Unsupported file type' } } } } } },
        UnprocessableEntity: { description: 'Validation passed transport parsing but failed business validation.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } } },
        RateLimited: {
          description: 'Rate limit exceeded.',
          headers: {
            RateLimit: { schema: { type: 'string' }, description: 'Standard rate limit policy header.' },
            'RateLimit-Policy': { schema: { type: 'string' }, description: 'Configured rate-limit policy.' }
          },
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' }, examples: { rateLimited: { value: { success: false, message: 'Too many requests from this IP, please try again later.' } } } } }
        },
        ServiceUnavailable: { description: 'Required runtime dependency is unavailable or not configured.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } } },
        InternalServerError: { description: 'Unexpected server error.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } } }
      }
    },
    security: [{ bearerAuth: [] }],
    'x-event-catalog': EVENT_CATALOG
  };
}

module.exports = { buildOpenApiSpec, schemas };
