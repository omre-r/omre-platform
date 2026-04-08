const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    houseId: { type: mongoose.Schema.Types.ObjectId, ref: 'FragranceHouse', required: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, lowercase: true },
    description: { type: String, trim: true, default: '' },
    notes: {
      top: { type: [String], default: [] },
      middle: { type: [String], default: [] },
      base: { type: [String], default: [] },
    },
    concentration: {
      type: String,
      enum: ['EDP', 'EDT', 'Parfum', 'EDC', 'Cologne', 'Other'],
      default: 'EDP',
    },
    sizeML: { type: Number, required: true },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, default: 0, min: 0 },
    imageUrl: { type: String, trim: true, default: '' },
    featured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Generate slug as houseId-productName for uniqueness across houses
productSchema.pre('validate', async function (next) {
  if (this.isModified('name') || this.isModified('houseId') || !this.slug) {
    const nameSlug = this.name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '');
    this.slug = `${this.houseId.toString()}-${nameSlug}`;
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);
