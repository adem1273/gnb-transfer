/**
 * DelayMetrics Model
 * Stores delay risk calculations for transfer routes
 */

import mongoose from 'mongoose';

const delayMetricsSchema = new mongoose.Schema({
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: [true, 'Booking reference is required'],
    index: true
  },
  route: {
    origin: {
      type: String,
      required: [true, 'Origin is required'],
      trim: true
    },
    destination: {
      type: String,
      required: [true, 'Destination is required'],
      trim: true
    },
    distance: {
      type: Number,
      min: [0, 'Distance cannot be negative']
    },
    estimatedDuration: {
      type: Number,
      min: [0, 'Duration cannot be negative']
    }
  },
  delayRiskScore: {
    type: Number,
    required: [true, 'Delay risk score is required'],
    min: [0, 'Risk score cannot be negative'],
    max: [100, 'Risk score cannot exceed 100']
  },
  estimatedDelay: {
    type: Number,
    default: 0,
    min: [0, 'Estimated delay cannot be negative']
  },
  discountCode: {
    type: String,
    default: null
  },
  discountApplied: {
    type: Boolean,
    default: false
  },
  calculatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
delayMetricsSchema.index({ booking: 1, calculatedAt: -1 });

const DelayMetrics = mongoose.model('DelayMetrics', delayMetricsSchema);

export default DelayMetrics;
