const spotlightService = require('../services/spotlightService');
const { cloudinary } = require('../config/cloudinary');

const uploadData = (file) => file ? {
  image: file.path,
  publicId: file.filename,
  thumbnail: cloudinary.url(file.filename, {
    secure: true,
    transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'auto', quality: 'auto' }],
  }),
} : null;

const discardUpload = (file) => {
  if (file?.filename) cloudinary.uploader.destroy(file.filename).catch(() => {});
};

const listPublic = async (req, res, next) => {
  try {
    const result = await spotlightService.listPublic(req.query);
    res.json({ success: true, data: result.data, pagination: result.pagination });
  } catch (error) { next(error); }
};

const listAdmin = async (req, res, next) => {
  try {
    const result = await spotlightService.listAdmin(req.query);
    res.json({ success: true, data: result.data, pagination: result.pagination });
  } catch (error) { next(error); }
};

const create = async (req, res, next) => {
  try {
    const data = await spotlightService.create(req.body, uploadData(req.file), req.user);
    res.status(201).json({ success: true, data });
  } catch (error) {
    discardUpload(req.file);
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const result = await spotlightService.update(req.params.id, req.body, uploadData(req.file), req.user);
    if (result.replacedImagePublicId) {
      cloudinary.uploader.destroy(result.replacedImagePublicId).catch(() => {});
    }
    res.json({ success: true, data: result.spotlight });
  } catch (error) {
    discardUpload(req.file);
    next(error);
  }
};

const archive = async (req, res, next) => {
  try {
    res.json({ success: true, data: await spotlightService.archive(req.params.id, req.user) });
  } catch (error) { next(error); }
};

module.exports = { listPublic, listAdmin, create, update, archive };
