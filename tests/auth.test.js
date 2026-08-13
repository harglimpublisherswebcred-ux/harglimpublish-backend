jest.setTimeout(600000); // 10 minutes for MongoDB download
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server');
const User = require('../src/models/User');
const AuthSession = require('../src/models/AuthSession');
const AuthIdentity = require('../src/models/AuthIdentity');
const AuthorApplication = require('../src/models/AuthorApplication');
const authService = require('../src/services/authService');
const googleIdentityProvider = require('../src/services/googleIdentityProvider');
const { generateToken } = require('../src/utils/tokenUtils');

let mongoServer;

beforeAll(async () => {
  process.env.JWT_SECRET = 'test_secret';
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
  await AuthSession.deleteMany({});
  await AuthIdentity.deleteMany({});
  await AuthorApplication.deleteMany({});
  authService.googleProvider = googleIdentityProvider;
});

describe('Auth API', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toEqual(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user.email).toEqual('john@example.com');
      expect(res.body.data.user.role).toEqual('reader');
    });

    it('should ignore public admin role escalation attempts', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Bad Actor',
          email: 'attack-admin@example.com',
          password: 'password123',
          role: 'admin'
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.data.user.role).toEqual('reader');

      const user = await User.findOne({ email: 'attack-admin@example.com' });
      expect(user.role).toEqual('reader');
    });

    it('should ignore public author role bypass attempts', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Bad Actor',
          email: 'attack-author@example.com',
          password: 'password123',
          role: 'author'
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.data.user.role).toEqual('reader');

      const user = await User.findOne({ email: 'attack-author@example.com' });
      expect(user.role).toEqual('reader');
    });

    it('should keep visitor role input from changing public registration away from reader', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Visitor Attempt',
          email: 'visitor-attempt@example.com',
          password: 'password123',
          role: 'visitor'
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.data.user.role).toEqual('reader');

      const user = await User.findOne({ email: 'visitor-attempt@example.com' });
      expect(user.role).toEqual('reader');
    });

    it('should enforce reader role when authService.register is called directly with admin role', async () => {
      const data = await authService.register({
        name: 'Direct Service',
        email: 'direct-service@example.com',
        password: 'password123',
        role: 'admin'
      });

      expect(data.user.role).toEqual('reader');

      const user = await User.findOne({ email: 'direct-service@example.com' });
      expect(user.role).toEqual('reader');
    });

    it('should fail if email is invalid', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'John Doe',
          email: 'invalid-email',
          password: 'password123'
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toEqual(false);
    });
  });

  describe('role promotion and admin management regressions', () => {
    it('should preserve author promotion after admin approves an author application', async () => {
      const reader = await User.create({
        name: 'Applicant',
        email: 'applicant@example.com',
        password: 'password123',
        role: 'reader'
      });
      const admin = await User.create({
        name: 'Admin',
        email: 'admin@example.com',
        password: 'password123',
        role: 'admin'
      });
      const application = await AuthorApplication.create({
        user: reader._id,
        penName: 'Applicant',
        status: 'pending'
      });

      const res = await request(app)
        .put(`/api/admin/author-applications/${application._id}/status`)
        .set('Authorization', `Bearer ${generateToken(admin._id)}`)
        .send({ status: 'approved' });

      expect(res.statusCode).toEqual(200);

      const promoted = await User.findById(reader._id);
      expect(promoted.role).toEqual('author');
    });

    it('should allow trusted admin role management and reject reader access', async () => {
      const admin = await User.create({
        name: 'Admin',
        email: 'admin-role@example.com',
        password: 'password123',
        role: 'admin'
      });
      const reader = await User.create({
        name: 'Reader',
        email: 'reader-role@example.com',
        password: 'password123',
        role: 'reader'
      });
      const target = await User.create({
        name: 'Target',
        email: 'target-role@example.com',
        password: 'password123',
        role: 'reader'
      });

      await request(app)
        .put(`/api/admin/users/${target._id}/role`)
        .set('Authorization', `Bearer ${generateToken(reader._id)}`)
        .send({ role: 'admin' })
        .expect(403);

      const res = await request(app)
        .put(`/api/admin/users/${target._id}/role`)
        .set('Authorization', `Bearer ${generateToken(admin._id)}`)
        .send({ role: 'admin' });

      expect(res.statusCode).toEqual(200);

      const promoted = await User.findById(target._id);
      expect(promoted.role).toEqual('admin');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send({
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'password123'
      });
    });

    it('should login successfully with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'jane@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toEqual(true);
      expect(res.body.data).toHaveProperty('token');
    });

    it('should fail with incorrect password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'jane@example.com',
          password: 'wrongpassword'
        });

      expect(res.statusCode).toEqual(401);
    });
  });

  describe('POST /api/auth/google', () => {
    const verifiedGoogleIdentity = (overrides = {}) => ({
      provider: 'GOOGLE',
      providerSubject: 'google-sub-001',
      email: 'google-reader@example.com',
      emailVerified: true,
      name: 'Google Reader',
      picture: 'https://example.com/avatar.jpg',
      ...overrides
    });

    beforeEach(() => {
      process.env.GOOGLE_CLIENT_ID = 'test-google-client-id.apps.googleusercontent.com';
      authService.googleProvider = {
        verifyCredential: jest.fn().mockResolvedValue(verifiedGoogleIdentity())
      };
    });

    it('creates a new Google user as reader and issues normal HM tokens', async () => {
      const res = await request(app)
        .post('/api/auth/google')
        .send({ credential: 'valid-google-id-token' });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toEqual(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data).toHaveProperty('refreshToken');
      expect(res.body.data.user.role).toEqual('reader');

      const user = await User.findOne({ email: 'google-reader@example.com' }).select('+password');
      expect(user.role).toEqual('reader');
      expect(user.password).toBeUndefined();

      const identity = await AuthIdentity.findOne({ provider: 'GOOGLE', providerSubject: 'google-sub-001' });
      expect(identity.user.toString()).toEqual(user._id.toString());

      const session = await AuthSession.findOne({ user: user._id });
      expect(session).toBeTruthy();
    });

    it('logs in a returning mapped Google user without duplicating user or identity', async () => {
      const user = await User.create({
        name: 'Mapped Reader',
        email: 'mapped-reader@example.com',
        password: 'password123',
        role: 'reader'
      });
      await AuthIdentity.create({
        user: user._id,
        provider: 'GOOGLE',
        providerSubject: 'google-sub-known',
        providerEmail: 'mapped-reader@example.com',
        emailVerified: true
      });
      authService.googleProvider.verifyCredential.mockResolvedValue(verifiedGoogleIdentity({
        providerSubject: 'google-sub-known',
        email: 'mapped-reader@example.com'
      }));

      await request(app).post('/api/auth/google').send({ credential: 'token-1' }).expect(200);
      const res = await request(app).post('/api/auth/google').send({ credential: 'token-2' }).expect(200);

      expect(res.body.data.user._id.toString()).toEqual(user._id.toString());
      expect(await User.countDocuments({ email: 'mapped-reader@example.com' })).toEqual(1);
      expect(await AuthIdentity.countDocuments({ provider: 'GOOGLE', providerSubject: 'google-sub-known' })).toEqual(1);
    });

    it('does not silently link a new Google subject to an existing local email', async () => {
      await User.create({
        name: 'Local User',
        email: 'collision@example.com',
        password: 'password123',
        role: 'reader'
      });
      authService.googleProvider.verifyCredential.mockResolvedValue(verifiedGoogleIdentity({
        providerSubject: 'new-google-sub',
        email: 'collision@example.com'
      }));

      const res = await request(app).post('/api/auth/google').send({ credential: 'valid-token' });

      expect(res.statusCode).toEqual(409);
      expect(res.body.error).toEqual('ACCOUNT_LINK_REQUIRED');
      expect(await AuthIdentity.countDocuments()).toEqual(0);
      expect(await User.countDocuments({ email: 'collision@example.com' })).toEqual(1);
    });

    it('preserves existing author and admin roles for already mapped HM users', async () => {
      const author = await User.create({
        name: 'Mapped Author',
        email: 'mapped-author@example.com',
        password: 'password123',
        role: 'author'
      });
      const admin = await User.create({
        name: 'Mapped Admin',
        email: 'mapped-admin@example.com',
        password: 'password123',
        role: 'admin'
      });
      await AuthIdentity.create({
        user: author._id,
        provider: 'GOOGLE',
        providerSubject: 'author-sub',
        providerEmail: author.email,
        emailVerified: true
      });
      await AuthIdentity.create({
        user: admin._id,
        provider: 'GOOGLE',
        providerSubject: 'admin-sub',
        providerEmail: admin.email,
        emailVerified: true
      });

      authService.googleProvider.verifyCredential.mockResolvedValueOnce(verifiedGoogleIdentity({
        providerSubject: 'author-sub',
        email: author.email
      }));
      const authorRes = await request(app).post('/api/auth/google').send({ credential: 'author-token' }).expect(200);
      expect(authorRes.body.data.user.role).toEqual('author');

      authService.googleProvider.verifyCredential.mockResolvedValueOnce(verifiedGoogleIdentity({
        providerSubject: 'admin-sub',
        email: admin.email
      }));
      const adminRes = await request(app).post('/api/auth/google').send({ credential: 'admin-token' }).expect(200);
      expect(adminRes.body.data.user.role).toEqual('admin');
    });

    it('blocks inactive mapped users from Google login', async () => {
      const user = await User.create({
        name: 'Inactive User',
        email: 'inactive-google@example.com',
        password: 'password123',
        role: 'reader',
        isActive: false
      });
      await AuthIdentity.create({
        user: user._id,
        provider: 'GOOGLE',
        providerSubject: 'inactive-sub',
        providerEmail: user.email,
        emailVerified: true
      });
      authService.googleProvider.verifyCredential.mockResolvedValue(verifiedGoogleIdentity({
        providerSubject: 'inactive-sub',
        email: user.email
      }));

      const res = await request(app).post('/api/auth/google').send({ credential: 'inactive-token' });

      expect(res.statusCode).toEqual(403);
      expect(res.body.error).toEqual('USER_INACTIVE');
    });

    it('rejects role, email, and provider-subject injection fields from clients', async () => {
      await request(app)
        .post('/api/auth/google')
        .send({ credential: 'valid-token', role: 'admin' })
        .expect(400);

      await request(app)
        .post('/api/auth/google')
        .send({ credential: 'valid-token', email: 'victim@example.com' })
        .expect(400);

      await request(app)
        .post('/api/auth/google')
        .send({ credential: 'valid-token', googleId: 'victim-google-id' })
        .expect(400);
    });

    it('returns a deterministic error for invalid Google credentials', async () => {
      const error = new Error('Invalid Google credential');
      error.statusCode = 401;
      error.code = 'INVALID_GOOGLE_CREDENTIAL';
      authService.googleProvider.verifyCredential.mockRejectedValue(error);

      const res = await request(app).post('/api/auth/google').send({ credential: 'bad-token' });

      expect(res.statusCode).toEqual(401);
      expect(res.body.error).toEqual('INVALID_GOOGLE_CREDENTIAL');
      expect(await User.countDocuments()).toEqual(0);
    });

    it('returns a deterministic error when Google login is not configured', async () => {
      delete process.env.GOOGLE_CLIENT_ID;
      authService.googleProvider = googleIdentityProvider;

      const res = await request(app).post('/api/auth/google').send({ credential: 'any-token' });

      expect(res.statusCode).toEqual(503);
      expect(res.body.error).toEqual('GOOGLE_AUTH_NOT_CONFIGURED');
      expect(await User.countDocuments()).toEqual(0);
    });

    it('uses Google-issued HM tokens with refresh, logout, auth/me, and user context', async () => {
      const login = await request(app).post('/api/auth/google').send({ credential: 'valid-token' }).expect(200);
      const { token, refreshToken } = login.body.data;

      await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`).expect(200);
      await request(app).get('/api/users/me/context').set('Authorization', `Bearer ${token}`).expect(200);

      const refreshed = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);
      expect(refreshed.body.data).toHaveProperty('token');

      await request(app)
        .post('/api/auth/logout')
        .send({ refreshToken: refreshed.body.data.refreshToken })
        .expect(200);
    });

    it('keeps Google-only accounts from logging in with a password', async () => {
      await request(app).post('/api/auth/google').send({ credential: 'valid-token' }).expect(200);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'google-reader@example.com', password: 'anything123' });

      expect(res.statusCode).toEqual(401);
    });
  });
});
