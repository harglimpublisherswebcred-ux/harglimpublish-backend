const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a category name'],
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
    },
    description: { type: String },
    shortDescription: { type: String, trim: true },
    image: { type: String },
    banner: { type: String },
    icon: { type: String },
    seoTitle: { type: String, trim: true },
    seoDescription: { type: String, trim: true },
    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
      index: true,
    },
    sortOrder: { type: Number, default: 0, index: true },
    bookCount: { type: Number, default: 0, min: 0 },
    featured: { type: Boolean, default: false, index: true },
    active: { type: Boolean, default: true, index: true },
    isActive: { type: Boolean, default: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
  }
);

categorySchema.pre('validate', function syncActiveCompatibility() {
  if (this.isModified('active')) {
    this.isActive = this.active;
  } else if (this.isModified('isActive')) {
    this.active = this.isActive;
  }
});

categorySchema.index({ active: 1, featured: 1, sortOrder: 1 });
categorySchema.index({ active: 1, sortOrder: 1 });

module.exports = mongoose.model('Category', categorySchema);
