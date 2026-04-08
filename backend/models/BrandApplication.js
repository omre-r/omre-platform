const mongoose = require('mongoose');

const brandApplicationSchema = new mongoose.Schema(
  {
    applicantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    proposedHouseName: { type: String, required: true, trim: true },
    slug: { type: String, trim: true, lowercase: true },
    description: { type: String, required: true, trim: true },
    logoUrl: { type: String, trim: true, default: '' },
    bannerUrl: { type: String, trim: true, default: '' },
    location: { type: String, trim: true, default: '' },
    instagramUrl: { type: String, trim: true, default: '' },
    websiteUrl: { type: String, trim: true, default: '' },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    adminNote: { type: String, trim: true, default: '' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Auto-generate slug from proposed name
brandApplicationSchema.pre('validate', function (next) {
  if (this.isModified('proposedHouseName') || !this.slug) {
    this.slug = this.proposedHouseName
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '');
  }
  next();
});

module.exports = mongoose.model('BrandApplication', brandApplicationSchema);
