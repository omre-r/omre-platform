const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, trim: true, default: '' },
    location: { type: String, trim: true, default: '' },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    applicationDeadline: { type: Date, default: null },
    boothFee: { type: Number, default: 0 },
    boothSize: { type: String, default: '10x10', trim: true },
    imageUrl: { type: String, trim: true, default: '' },
    capacity: { type: Number, default: null },
    isPublished: { type: Boolean, default: false },
    participatingHouses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'FragranceHouse' }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

eventSchema.pre('validate', function (next) {
  if (this.isModified('title') || !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '');
  }
  next();
});

module.exports = mongoose.model('Event', eventSchema);
