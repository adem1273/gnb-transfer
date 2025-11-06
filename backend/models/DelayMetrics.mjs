/**
 * DelayMetrics model for tracking delay guarantees and risk scores
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
    min: [0, 'Score must be between 0 and 100'],
    max: [100, 'Score must be between 0 and 100']
  },
  estimatedDelayMinutes: {
    type: Number,
    default: 0,
    min: [0, 'Estimated delay cannot be negative']
  },
  factors: {
    traffic: { type: Number, default: 0 },
    weather: { type: Number, default: 0 },
    timeOfDay: { type: Number, default: 0 },
    dayOfWeek: { type: Number, default: 0 }
  },
  discountGenerated: {
    type: Boolean,
    default: false
  },
  discountCode: {
    type: String,
    trim: true,
    sparse: true
  },
  discountAmount: {
    type: Number,
    min: [0, 'Discount amount cannot be negative'],
    default: 0
  }
}, {
  timestamps: true
});

// Index for efficient queries
delayMetricsSchema.index({ booking: 1 });
delayMetricsSchema.index({ delayRiskScore: 1 });
delayMetricsSchema.index({ createdAt: -1 });

// Compound index for discount queries
delayMetricsSchema.index({ discountGenerated: 1, createdAt: -1 });

const DelayMetrics = mongoose.model('DelayMetrics', delayMetricsSchema);

export default DelayMetrics;
