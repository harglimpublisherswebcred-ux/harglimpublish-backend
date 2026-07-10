const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const path = require('path');

const REQUIRED_CLOUDINARY_ENV = [
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET'
];

const PLACEHOLDER_VALUES = new Set([
  'change_me',
  'disabled',
  'your_cloud_name',
  'your_api_key',
  'your_api_secret'
]);

const isUsableEnvValue = (value) => {
  if (!value || typeof value !== 'string') return false;
  return !PLACEHOLDER_VALUES.has(value.trim().toLowerCase());
};

const getMissingCloudinaryConfig = () => (
  REQUIRED_CLOUDINARY_ENV.filter((key) => !isUsableEnvValue(process.env[key]))
);

const isCloudinaryConfigured = () => getMissingCloudinaryConfig().length === 0;

const cloudinaryUnavailableMessage = 'Cloudinary upload is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in the deployment environment.';
const maxUploadBytes = Number(process.env.UPLOAD_MAX_BYTES || 25 * 1024 * 1024);

const allowedUploads = {
  image: {
    mimeTypes: new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
    extensions: new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif'])
  },
  document: {
    mimeTypes: new Set([
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]),
    extensions: new Set(['.pdf', '.doc', '.docx'])
  }
};

const expectedUploadKind = (file) => {
  if (file.fieldname === 'image') return 'image';
  if (file.fieldname === 'document') return 'document';
  return null;
};

const isAllowedUpload = (file) => {
  const kind = expectedUploadKind(file);
  if (!kind) return false;

  const rules = allowedUploads[kind];
  const extension = path.extname(file.originalname || '').toLowerCase();
  return rules.mimeTypes.has(file.mimetype) && rules.extensions.has(extension);
};

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // Determine folder and resource_type based on the upload type
    let folderName = 'harglim/images';
    let resourceType = 'image';

    // Check if it is a document/manuscript
    if (file.originalname.match(/\.(pdf|doc|docx)$/i)) {
      folderName = 'harglim/manuscripts';
      resourceType = 'raw';
    } else if (file.mimetype.startsWith('image/')) {
      folderName = 'harglim/images';
    }

    return {
      folder: folderName,
      resource_type: resourceType,
      public_id: `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9_.-]/g, '')}`,
    };
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: maxUploadBytes,
    files: 1
  },
  fileFilter: (req, file, callback) => {
    if (!isAllowedUpload(file)) {
      return callback(new Error('Invalid file type for upload'));
    }
    return callback(null, true);
  }
});

const requireCloudinaryConfig = (req, res, next) => {
  const missingConfig = getMissingCloudinaryConfig();

  if (missingConfig.length > 0) {
    return res.status(503).json({
      success: false,
      message: cloudinaryUnavailableMessage,
      missing: missingConfig
    });
  }

  return next();
};

const handleUploadError = (error, req, res, next) => {
  if (!error) return next();

  const errorMessage = error.message || 'Upload failed';
  const cloudinaryConfigFailure = /cloudinary|cloud_name|api_key|api_secret|disabled/i.test(errorMessage);
  const fileTooLarge = error.code === 'LIMIT_FILE_SIZE';

  if (cloudinaryConfigFailure) {
    return res.status(503).json({
      success: false,
      message: cloudinaryUnavailableMessage
    });
  }

  return res.status(400).json({
    success: false,
    message: fileTooLarge ? 'Uploaded file is too large' : errorMessage
  });
};

module.exports = {
  cloudinary,
  upload,
  isCloudinaryConfigured,
  getMissingCloudinaryConfig,
  requireCloudinaryConfig,
  handleUploadError,
  isAllowedUpload
};
