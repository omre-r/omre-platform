const mongoose = require('mongoose');

const fragranceHouseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    description: { type: String, trim: true, default: '' },
    logoUrl: { type: String, trim: true, default: '' },
    bannerUrl: { type: String, trim: true, default: '' },
    location: { type: String, trim: true, default: '' },
    websiteUrl: { type: String, trim: true, default: '' },
    instagramUrl: { type: String, trim: true, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Auto-generate slug from name before saving
fragranceHouseSchema.pre('validate', function (next) {
  if (this.isModified('name') || !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '');
  }
  next();
});

module.exports = mongoose.model('FragranceHouse', fragranceHouseSchema);
