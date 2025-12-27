import mongoose from 'mongoose';

/**
 * GlobalSettings Model
 *
 * @module models/GlobalSettings
 * @description Mongoose model for managing global application settings
 *
 * Features:
 * - Single document pattern (only one settings document)
 * - Site-wide configuration (name, logo, contact info)
 * - Feature flags for enabling/disabling features
 * - Currency and language settings
 *
 * Access Control:
 * - Admin role: full read/write access
 * - Manager role: read-only access
 */

const globalSettingsSchema = new mongoose.Schema(
  {
    // Singleton pattern: ensure only one document exists
    key: {
      type: String,
      required: true,
      unique: true,
      default: 'global',
      immutable: true,
    },
    siteName: {
      type: String,
      required: true,
      default: 'GNB Transfer',
      trim: true,
      maxlength: [100, 'Site name cannot exceed 100 characters'],
    },
    logo: {
      type: String, // Media reference/URL - placeholder ID for now
      default: null,
    },
    contactEmail: {
      type: String,
      required: true,
      default: 'contact@gnbtransfer.com',
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    contactPhone: {
      type: String,
      required: true,
      default: '+1234567890',
      trim: true,
    },
    address: {
      type: String,
      required: true,
      default: '123 Main Street, City, Country',
      trim: true,
      maxlength: [500, 'Address cannot exceed 500 characters'],
    },
    currency: {
      type: String,
      required: true,
      default: 'USD',
      enum: {
        values: ['USD', 'EUR', 'TRY', 'GBP', 'SAR', 'AED'],
        message: '{VALUE} is not a supported currency',
      },
      uppercase: true,
    },
    defaultLanguage: {
      type: String,
      required: true,
      default: 'en',
      enum: {
        values: ['en', 'ar', 'de', 'es', 'hi', 'it', 'ru', 'zh'],
        message: '{VALUE} is not a supported language',
      },
      lowercase: true,
    },
    featureFlags: {
      type: Map,
      of: Boolean,
      default: new Map([
        ['enableBookings', true],
        ['enablePayments', true],
        ['enableLoyalty', true],
        ['enableReferrals', true],
        ['enableChatSupport', false],
        ['enableBlog', false],
        ['enableReviews', true],
        ['enableCoupons', true],
      ]),
    },
  },
  {
    timestamps: true,
  }
);

// Index for singleton pattern
globalSettingsSchema.index({ key: 1 }, { unique: true });

/**
 * Static method to get global settings (singleton pattern)
 * Creates default settings if none exist
 *
 * @returns {Promise<Document>} The global settings document
 */
globalSettingsSchema.statics.getGlobalSettings = async function () {
  let settings = await this.findOne({ key: 'global' });
  if (!settings) {
    settings = await this.create({ key: 'global' });
  }
  return settings;
};

/**
 * Static method to update global settings (singleton pattern)
 * Ensures only the global settings document is updated
 *
 * @param {Object} updates - Updates to apply to settings
 * @returns {Promise<Document>} The updated settings document
 */
globalSettingsSchema.statics.updateGlobalSettings = async function (updates) {
  // Remove immutable fields from updates
  delete updates.key;
  delete updates._id;

  const settings = await this.findOneAndUpdate(
    { key: 'global' },
    { $set: updates },
    { new: true, upsert: true, runValidators: true }
  );

  return settings;
};

const GlobalSettings =
  mongoose.models.GlobalSettings || mongoose.model('GlobalSettings', globalSettingsSchema);

export default GlobalSettings;
