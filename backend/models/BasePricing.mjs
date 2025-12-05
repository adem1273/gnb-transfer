/**
 * Base Pricing Model
 *
 * @module models/BasePricing
 * @description Manages base pricing between airports and districts
 */

import mongoose from 'mongoose';

const basePricingSchema = new mongoose.Schema(
  {
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
    originType: {
      type: String,
      enum: ['airport', 'district', 'hotel', 'landmark'],
      required: true,
    },
    destinationType: {
      type: String,
      enum: ['airport', 'district', 'hotel', 'landmark'],
      required: true,
    },
    prices: {
      sedan: {
        type: Number,
        required: true,
        min: [0, 'Price cannot be negative'],
      },
      minivan: {
        type: Number,
        required: true,
        min: [0, 'Price cannot be negative'],
      },
      vip: {
        type: Number,
        required: true,
        min: [0, 'Price cannot be negative'],
      },
    },
    currency: {
      type: String,
      default: 'USD',
      enum: ['USD', 'EUR', 'TRY', 'GBP', 'SAR', 'AED'],
    },
    distanceKm: {
      type: Number,
      min: [0, 'Distance cannot be negative'],
    },
    estimatedDuration: {
      type: Number, // in minutes
      min: [0, 'Duration cannot be negative'],
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    notes: {
      type: String,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for route lookups
basePricingSchema.index({ origin: 1, destination: 1 }, { unique: true });
basePricingSchema.index({ originType: 1, destinationType: 1 });
basePricingSchema.index({ active: 1 });

// Static method to get price for a route
basePricingSchema.statics.getPriceForRoute = async function (origin, destination, vehicleType = 'sedan') {
  const route = await this.findOne({
    origin: { $regex: new RegExp(`^${origin}$`, 'i') },
    destination: { $regex: new RegExp(`^${destination}$`, 'i') },
    active: true,
  });

  if (!route) {
    return null;
  }

  return {
    price: route.prices[vehicleType] || route.prices.sedan,
    route,
  };
};

const BasePricing = mongoose.models.BasePricing || mongoose.model('BasePricing', basePricingSchema);

export default BasePricing;
