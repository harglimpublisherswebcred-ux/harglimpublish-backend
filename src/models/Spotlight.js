const mongoose = require('mongoose');

const spotlightSchema = new mongoose.Schema({
  image: { type: String, required: true, trim: true },
  thumbnail: { type: String, required: true, trim: true },
  imagePublicId: { type: String, trim: true, select: false },
  author_name: { type: String, required: true, trim: true, maxlength: 120 },
  caption: { type: String, trim: true, maxlength: 500, default: '' },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isActive: { type: Boolean, default: true, index: true },
  sortOrder: { type: Number, default: 0, index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

spotlightSchema.index({ isActive: 1, sortOrder: 1, createdAt: -1 });
spotlightSchema.index({ author_name: 1, createdAt: -1 });

module.exports = mongoose.model('Spotlight', spotlightSchema);
