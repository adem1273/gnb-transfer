/**
 * Settings Model
 *
 * @module models/Settings
 * @description Global application settings including currency, pricing modifiers, etc.
 */

import mongoose from 'mongoose';
import { invalidateTag } from '../utils/cache.mjs';
import logger from '../config/logger.mjs';

const exchangeRateSchema = new mongoose.Schema(
  {
    currency: {
      type: String,
      required: true,
      uppercase: true,
    },
    rate: {
      type: Number,
      required: true,
      min: [0, 'Rate cannot be negative'],
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const seasonalMultiplierSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    multiplier: {
      type: Number,
      required: true,
      min: [0.5, 'Multiplier must be at least 0.5'],
      max: [3, 'Multiplier cannot exceed 3'],
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { _id: true }
);

const settingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: 'global',
    },
    company: {
      name: { type: String, default: 'GNB Transfer' },
      logo: { type: String },
      address: { type: String },
      phone: { type: String },
      email: { type: String },
      taxNumber: { type: String },
      website: { type: String },
    },
    currency: {
      default: {
        type: String,
        default: 'USD',
        enum: ['USD', 'EUR', 'TRY', 'GBP', 'SAR', 'AED'],
      },
      supported: {
        type: [String],
        default: ['USD', 'EUR', 'TRY', 'GBP'],
      },
      exchangeRates: {
        type: [exchangeRateSchema],
        default: [
          { currency: 'USD', rate: 1 },
          { currency: 'EUR', rate: 0.92 },
          { currency: 'TRY', rate: 34.5 },
          { currency: 'GBP', rate: 0.79 },
          { currency: 'SAR', rate: 3.75 },
          { currency: 'AED', rate: 3.67 },
        ],
      },
      autoUpdate: {
        type: Boolean,
        default: false,
      },
    },
    pricing: {
      nightSurchargeEnabled: { type: Boolean, default: true },
      nightSurchargeMultiplier: { type: Number, default: 1.25 },
      nightStartHour: { type: Number, default: 0, min: 0, max: 23 },
      nightEndHour: { type: Number, default: 6, min: 0, max: 23 },
      weekendSurchargeEnabled: { type: Boolean, default: false },
      weekendSurchargeMultiplier: { type: Number, default: 1.1 },
      minimumFare: { type: Number, default: 20, min: 0 },
      taxRate: { type: Number, default: 18, min: 0, max: 100 }, // VAT percentage
      taxIncluded: { type: Boolean, default: true },
    },
    seasonalMultipliers: {
      type: [seasonalMultiplierSchema],
      default: [],
    },
    loyalty: {
      enabled: { type: Boolean, default: true },
      pointsPerDollar: { type: Number, default: 1 },
      redemptionRate: { type: Number, default: 0.01 }, // 1 point = $0.01
      freeRideThreshold: { type: Number, default: 10 }, // 10th ride free
      discountAfterRides: { type: Number, default: 5 }, // 5th ride discount
      discountPercent: { type: Number, default: 20 }, // 20% off 5th ride
    },
    notifications: {
      emailEnabled: { type: Boolean, default: true },
      smsEnabled: { type: Boolean, default: false },
      whatsappEnabled: { type: Boolean, default: true },
      slackEnabled: { type: Boolean, default: false },
      slackWebhook: { type: String },
    },
    booking: {
      requirePassengerNames: { type: Boolean, default: true },
      requireFlightNumber: { type: Boolean, default: true },
      maxPassengers: { type: Number, default: 50 },
      cancellationPolicyHours: { type: Number, default: 24 },
      autoAssignDrivers: { type: Boolean, default: false },
    },
    adPixels: {
      googleAnalyticsId: { type: String },
      googleAdsId: { type: String },
      metaPixelId: { type: String },
      tiktokPixelId: { type: String },
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

// Index
settingsSchema.index({ key: 1 }, { unique: true });

// Static method to get global settings
settingsSchema.statics.getGlobalSettings = async function () {
  let settings = await this.findOne({ key: 'global' });
  if (!settings) {
    settings = await this.create({ key: 'global' });
  }
  return settings;
};

// Static method to get current seasonal multiplier
settingsSchema.statics.getCurrentSeasonalMultiplier = async function () {
  const settings = await this.getGlobalSettings();
  const now = new Date();

  const activeMultiplier = settings.seasonalMultipliers.find(
    (m) => m.active && now >= m.startDate && now <= m.endDate
  );

  return activeMultiplier?.multiplier || 1;
};

// Static method to convert price to different currency
settingsSchema.statics.convertCurrency = async function (amount, fromCurrency, toCurrency) {
  const settings = await this.getGlobalSettings();

  const fromRate = settings.currency.exchangeRates.find((r) => r.currency === fromCurrency)?.rate || 1;
  const toRate = settings.currency.exchangeRates.find((r) => r.currency === toCurrency)?.rate || 1;

  // Convert to USD first, then to target currency
  const usdAmount = amount / fromRate;
  const targetAmount = usdAmount * toRate;

  return Math.round(targetAmount * 100) / 100;
};

// Cache invalidation hooks
settingsSchema.post('save', async function(doc) {
  try {
    await invalidateTag('settings');
    logger.debug('Settings cache invalidated after save');
  } catch (error) {
    logger.error('Failed to invalidate settings cache', { error: error.message });
  }
});

settingsSchema.post('findOneAndUpdate', async function(doc) {
  try {
    await invalidateTag('settings');
    logger.debug('Settings cache invalidated after update');
  } catch (error) {
    logger.error('Failed to invalidate settings cache', { error: error.message });
  }
});

const Settings = mongoose.models.Settings || mongoose.model('Settings', settingsSchema);

export default Settings;
