jest.setTimeout(600000);

process.env.JWT_SECRET = 'test_secret';

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../src/models/User');
const { generateToken } = require('../src/utils/tokenUtils');
const { handleUploadError } = require('../src/config/cloudinary');

let originalCloudinaryEnv;

const cloudinaryKeys = [
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET'
];

const setCloudinaryEnv = (values = {}) => {
  for (const key of cloudinaryKeys) {
    if (Object.prototype.hasOwnProperty.call(values, key)) {
      process.env[key] = values[key];
    } else {
      delete process.env[key];
    }
  }
};

const authorizeNextRequest = () => {
  const userId = new mongoose.Types.ObjectId();
  jest.spyOn(User, 'findById').mockReturnValue({
    select: jest.fn().mockResolvedValue({
      _id: userId,
      id: userId.toString(),
      name: 'Upload Tester',
      email: 'upload-tester@example.com',
      role: 'reader'
    })
  });

  return generateToken(userId);
};

beforeAll(() => {
  originalCloudinaryEnv = cloudinaryKeys.reduce((env, key) => {
    env[key] = process.env[key];
    return env;
  }, {});
});

afterAll(() => {
  setCloudinaryEnv(originalCloudinaryEnv);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('Upload API hardening', () => {
  it('requires authorization before checking Cloudinary configuration', async () => {
    setCloudinaryEnv();

    const res = await request(app)
      .post('/api/uploads/image')
      .attach('image', Buffer.from('not-a-real-image'), 'cover.jpg');

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe('Not authorized, no token');
  });

  it('returns a clear service unavailable response when Cloudinary configuration is missing', async () => {
    setCloudinaryEnv();
    const token = authorizeNextRequest();

    const res = await request(app)
      .post('/api/uploads/image')
      .set('Authorization', `Bearer ${token}`)
      .attach('image', Buffer.from('not-a-real-image'), 'cover.jpg');

    expect(res.statusCode).toBe(503);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Cloudinary upload is not configured/);
    expect(res.body.missing).toEqual(expect.arrayContaining(cloudinaryKeys));
  });

  it('rejects placeholder or disabled Cloudinary configuration values', async () => {
    setCloudinaryEnv({
      CLOUDINARY_CLOUD_NAME: 'disabled',
      CLOUDINARY_API_KEY: 'CHANGE_ME',
      CLOUDINARY_API_SECRET: 'your_api_secret'
    });
    const token = authorizeNextRequest();

    const res = await request(app)
      .post('/api/uploads/document')
      .set('Authorization', `Bearer ${token}`)
      .attach('document', Buffer.from('manuscript'), 'manuscript.pdf');

    expect(res.statusCode).toBe(503);
    expect(res.body.success).toBe(false);
    expect(res.body.missing).toEqual(expect.arrayContaining(cloudinaryKeys));
  });

  it('maps Cloudinary provider failures to safe service unavailable responses', () => {
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    const next = jest.fn();

    handleUploadError(new Error('cloud_name is disabled'), {}, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: expect.stringMatching(/Cloudinary upload is not configured/)
    });
  });

  it('maps non-provider upload middleware failures to bad request responses', () => {
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    const next = jest.fn();

    handleUploadError(new Error('Unexpected file field'), {}, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Unexpected file field'
    });
  });

  it('rejects invalid image upload MIME types before provider upload', async () => {
    setCloudinaryEnv({
      CLOUDINARY_CLOUD_NAME: 'valid-cloud',
      CLOUDINARY_API_KEY: 'valid-key',
      CLOUDINARY_API_SECRET: 'valid-secret'
    });
    const token = authorizeNextRequest();

    const res = await request(app)
      .post('/api/uploads/image')
      .set('Authorization', `Bearer ${token}`)
      .attach('image', Buffer.from('not-an-image'), {
        filename: 'cover.txt',
        contentType: 'text/plain'
      });

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({
      success: false,
      message: 'Invalid file type for upload'
    });
  });

  it('maps oversized file middleware failures to safe bad request responses', () => {
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    const next = jest.fn();
    const error = new Error('File too large');
    error.code = 'LIMIT_FILE_SIZE';

    handleUploadError(error, {}, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Uploaded file is too large'
    });
  });
});
