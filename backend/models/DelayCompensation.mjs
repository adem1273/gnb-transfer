import mongoose from 'mongoose';

/**
 * DelayCompensation Model
 * 
 * Stores delay compensation requests and their approval status
 */
const delayCompensationSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    delayMinutes: {
      type: Number,
      required: true,
    },
    compensationType: {
      type: String,
      enum: ['discount', 'refund', 'voucher', 'points'],
      default: 'discount',
    },
    compensationValue: {
      type: Number,
      required: true,
    },
    discountCode: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'applied'],
      default: 'pending',
      index: true,
    },
    reason: {
      type: String,
      trim: true,
    },
    aiSuggestion: {
      recommended: Boolean,
      confidence: Number,
      reasoning: String,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
    reviewNotes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for quick lookups
delayCompensationSchema.index({ status: 1, createdAt: -1 });
delayCompensationSchema.index({ booking: 1 });

const DelayCompensation = mongoose.model('DelayCompensation', delayCompensationSchema);

export default DelayCompensation;
