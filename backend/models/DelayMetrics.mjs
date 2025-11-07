/**
 * DelayMetrics model for storing delay guarantee calculations
 */

import mongoose from 'mongoose';

const delayMetricsSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Booking reference is required'],
      index: true,
    },
    route: {
      origin: {
        type: String,
        required: [true, 'Origin is required'],
        trim: true,
      },
      destination: {
        type: String,
        required: [true, 'Destination is required'],
        trim: true,
      },
      distance: {
        type: Number,
        min: [0, 'Distance cannot be negative'],
      },
      estimatedDuration: {
        type: Number,
        min: [0, 'Duration cannot be negative'],
      },
    },
    delayRiskScore: {
      type: Number,
      required: [true, 'Delay risk score is required'],
      min: [0, 'Risk score cannot be negative'],
      max: [100, 'Risk score cannot exceed 100'],
      index: true,
    },
    estimatedDelay: {
      type: Number,
      default: 0,
      min: [0, 'Estimated delay cannot be negative'],
    },
    discountCode: {
      type: String,
      trim: true,
    },
    calculatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for booking lookups
delayMetricsSchema.index({ booking: 1, createdAt: -1 });

// Index for discount code lookups
delayMetricsSchema.index({ discountCode: 1 }, { sparse: true });

const DelayMetrics =
  mongoose.models.DelayMetrics || mongoose.model('DelayMetrics', delayMetricsSchema);

export default DelayMetrics;
