const mongoose = require('mongoose');

const eventApplicationSchema = new mongoose.Schema(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    houseId: { type: mongoose.Schema.Types.ObjectId, ref: 'FragranceHouse', required: true },
    applicantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, trim: true, default: '' },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

// One application per house per event
eventApplicationSchema.index({ eventId: 1, houseId: 1 }, { unique: true });

module.exports = mongoose.model('EventApplication', eventApplicationSchema);
