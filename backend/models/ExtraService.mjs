/**
 * Extra Services Model
 *
 * @module models/ExtraService
 * @description Manages extra services and their pricing
 */

import mongoose from 'mongoose';

const extraServiceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Service name is required'],
      trim: true,
      unique: true,
    },
    code: {
      type: String,
      required: [true, 'Service code is required'],
      trim: true,
      unique: true,
      uppercase: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    category: {
      type: String,
      enum: ['safety', 'comfort', 'luxury', 'convenience', 'accessibility'],
      default: 'convenience',
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    currency: {
      type: String,
      default: 'USD',
      enum: ['USD', 'EUR', 'TRY', 'GBP', 'SAR', 'AED'],
    },
    priceType: {
      type: String,
      enum: ['fixed', 'per_person', 'per_hour', 'per_km'],
      default: 'fixed',
    },
    maxQuantity: {
      type: Number,
      default: 10,
      min: [1, 'Max quantity must be at least 1'],
    },
    icon: {
      type: String,
      trim: true,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    order: {
      type: Number,
      default: 0,
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

// Indexes
extraServiceSchema.index({ code: 1 });
extraServiceSchema.index({ category: 1 });
extraServiceSchema.index({ active: 1, order: 1 });

// Static method to get active services
extraServiceSchema.statics.getActiveServices = function () {
  return this.find({ active: true }).sort({ order: 1, name: 1 });
};

// Static method to calculate total for selected services
extraServiceSchema.statics.calculateTotal = async function (selectedServices) {
  if (!selectedServices || selectedServices.length === 0) {
    return { total: 0, breakdown: [] };
  }

  const serviceCodes = selectedServices.map((s) => s.code);
  const services = await this.find({
    code: { $in: serviceCodes },
    active: true,
  });

  let total = 0;
  const breakdown = [];

  for (const service of services) {
    const selected = selectedServices.find((s) => s.code === service.code);
    const quantity = selected?.quantity || 1;
    const serviceTotal = service.price * quantity;

    total += serviceTotal;
    breakdown.push({
      code: service.code,
      name: service.name,
      price: service.price,
      quantity,
      total: serviceTotal,
    });
  }

  return { total, breakdown };
};

const ExtraService = mongoose.models.ExtraService || mongoose.model('ExtraService', extraServiceSchema);

export default ExtraService;
