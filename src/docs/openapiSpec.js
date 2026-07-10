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

const schemas = {
  ApiSuccess: {
    type: 'object',
    properties: {
      success: { type: 'boolean', examples: [true] },
      data: { type: 'object' },
      message: { type: 'string' }
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
  RegisterRequest: {
    type: 'object',
    required: ['name', 'email', 'password'],
    properties: {
      name: { type: 'string', minLength: 2 },
      email: { type: 'string', format: 'email' },
      password: { type: 'string', minLength: 6 },
      role: { type: 'string', enum: ['visitor', 'reader', 'author', 'admin'], default: 'reader' }
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
  BookCreateRequest: {
    type: 'object',
    required: ['title', 'description', 'category', 'price'],
    properties: {
      title: { type: 'string' },
      description: { type: 'string' },
      author: { type: 'string', description: 'Optional author ObjectId. Defaults to current admin user when omitted.' },
      category: { type: 'string', description: 'Category ObjectId.' },
      price: { type: 'number' },
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
  BookUpdateRequest: {
    type: 'object',
    properties: {
      title: { type: 'string' },
      description: { type: 'string' },
      author: { type: 'string' },
      category: { type: 'string' },
      price: { type: 'number' },
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
  PublishRequestCreate: {
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
  MultipartImageRequest: {
    type: 'object',
    properties: { image: { type: 'string', format: 'binary' } }
  },
  MultipartDocumentRequest: {
    type: 'object',
    properties: { document: { type: 'string', format: 'binary' } }
  }
};

const schemaExamples = {
  RegisterRequest: {
    name: 'Ghani Reader',
    email: 'user@example.com',
    password: 'StrongPass123!',
    role: 'reader'
  },
  LoginRequest: {
    email: 'user@example.com',
    password: 'StrongPass123!'
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
    status: 'PROCESSING',
    reason: 'Status updated by admin'
  },
  RejectPaymentRequest: {
    reason: 'UTR could not be verified'
  },
  UserUpdateRequest: {
    name: 'Ghani Khan',
    profilePicture: 'https://example.com/profile.jpg'
  },
  WishlistRequest: {
    bookId: '66b4f5a2a44d2c0012a9c101'
  },
  BookCreateRequest: {
    title: 'Enterprise Publishing Systems',
    description: 'A practical book about modern publishing operations.',
    category: '66b4f5a2a44d2c0012a9c102',
    author: '66b4f5a2a44d2c0012a9c103',
    price: 499,
    coverImage: 'https://example.com/cover.jpg',
    stock: 100,
    status: 'published',
    discountPrice: 399,
    isFeatured: true,
    isbn: '9781234567890',
    pages: 320,
    format: 'paperback'
  },
  BookUpdateRequest: {
    price: 449,
    stock: 120,
    status: 'published',
    isBestseller: true
  },
  PublishRequestCreate: {
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
    paths[endpoint.path][endpoint.method.toLowerCase()] = {
      tags: [endpoint.tag],
      summary: endpoint.summary,
      description: `${endpoint.summary}. Controller: ${endpoint.controller}. Authentication: ${endpoint.auth}. ${endpoint.notes || ''}`.trim(),
      operationId: toOperationId(endpoint),
      security: securityFor(endpoint),
      parameters: [
        ...(endpoint.params || []).map(parameterFor),
        ...(endpoint.query || []).map(queryFor)
      ],
      ...(body ? { requestBody: body } : {}),
      responses: {
        200: {
          description: 'Successful response.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiSuccess' }, examples: { success: { value: successExample } } } }
        },
        201: {
          description: 'Created successfully where applicable.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiSuccess' } } }
        },
        400: { $ref: '#/components/responses/BadRequest' },
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        404: { $ref: '#/components/responses/NotFound' },
        429: { $ref: '#/components/responses/RateLimited' },
        500: { $ref: '#/components/responses/InternalServerError' }
      }
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
        RateLimited: { description: 'Rate limit exceeded.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } } },
        InternalServerError: { description: 'Unexpected server error.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } } }
      }
    },
    security: [{ bearerAuth: [] }],
    'x-event-catalog': EVENT_CATALOG
  };
}

module.exports = { buildOpenApiSpec, schemas };
