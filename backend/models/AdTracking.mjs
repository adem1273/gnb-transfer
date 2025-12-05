/**
 * AdTracking Model
 *
 * @module models/AdTracking
 * @description Tracks ad pixel data and conversion tracking
 */

import mongoose from 'mongoose';

const conversionEventSchema = new mongoose.Schema(
  {
    eventName: {
      type: String,
      required: true,
      enum: [
        'page_view',
        'view_content',
        'add_to_cart',
        'initiate_checkout',
        'purchase',
        'lead',
        'complete_registration',
        'contact',
        'find_location',
        'schedule',
        'custom',
      ],
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    value: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  { _id: true }
);

const adTrackingSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    // UTM Parameters
    utm: {
      source: { type: String, trim: true },
      medium: { type: String, trim: true },
      campaign: { type: String, trim: true },
      term: { type: String, trim: true },
      content: { type: String, trim: true },
    },
    // Referrer info
    referrer: {
      type: String,
      trim: true,
    },
    landingPage: {
      type: String,
      trim: true,
    },
    // Ad platform specific IDs
    adPlatform: {
      type: String,
      enum: ['google', 'meta', 'tiktok', 'twitter', 'linkedin', 'organic', 'direct', 'other'],
      index: true,
    },
    adCampaignId: {
      type: String,
      trim: true,
    },
    adSetId: {
      type: String,
      trim: true,
    },
    adId: {
      type: String,
      trim: true,
    },
    // Click IDs from ad platforms
    gclid: { type: String }, // Google Click ID
    fbclid: { type: String }, // Facebook Click ID
    ttclid: { type: String }, // TikTok Click ID
    // Device and browser info
    device: {
      type: { type: String, enum: ['desktop', 'mobile', 'tablet'] },
      os: String,
      browser: String,
      screenResolution: String,
    },
    // Geographic info
    geo: {
      country: String,
      city: String,
      region: String,
    },
    // Conversion tracking
    events: [conversionEventSchema],
    // Attribution
    firstTouchDate: {
      type: Date,
      default: Date.now,
    },
    lastTouchDate: {
      type: Date,
      default: Date.now,
    },
    // Conversion status
    converted: {
      type: Boolean,
      default: false,
      index: true,
    },
    conversionValue: {
      type: Number,
      default: 0,
    },
    conversionDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for reporting
adTrackingSchema.index({ 'utm.source': 1, 'utm.campaign': 1 });
adTrackingSchema.index({ adPlatform: 1, converted: 1 });
adTrackingSchema.index({ createdAt: 1 });
adTrackingSchema.index({ gclid: 1 }, { sparse: true });
adTrackingSchema.index({ fbclid: 1 }, { sparse: true });

// Static method to track event
adTrackingSchema.statics.trackEvent = async function (sessionId, eventName, data = {}) {
  return this.findOneAndUpdate(
    { sessionId },
    {
      $push: {
        events: {
          eventName,
          value: data.value || 0,
          currency: data.currency || 'USD',
          booking: data.bookingId,
          metadata: data.metadata,
        },
      },
      $set: { lastTouchDate: new Date() },
    },
    { upsert: true, new: true }
  );
};

// Static method to mark as converted
adTrackingSchema.statics.markConverted = async function (sessionId, value = 0) {
  return this.findOneAndUpdate(
    { sessionId },
    {
      $set: {
        converted: true,
        conversionValue: value,
        conversionDate: new Date(),
      },
    },
    { new: true }
  );
};

// Static method to get campaign performance
adTrackingSchema.statics.getCampaignPerformance = async function (startDate, endDate) {
  const matchStage = {
    createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
    'utm.campaign': { $exists: true, $ne: null },
  };

  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          source: '$utm.source',
          campaign: '$utm.campaign',
          medium: '$utm.medium',
        },
        sessions: { $sum: 1 },
        conversions: { $sum: { $cond: ['$converted', 1, 0] } },
        revenue: { $sum: '$conversionValue' },
      },
    },
    {
      $project: {
        _id: 0,
        source: '$_id.source',
        campaign: '$_id.campaign',
        medium: '$_id.medium',
        sessions: 1,
        conversions: 1,
        revenue: 1,
        conversionRate: {
          $cond: [
            { $eq: ['$sessions', 0] },
            0,
            { $multiply: [{ $divide: ['$conversions', '$sessions'] }, 100] },
          ],
        },
      },
    },
    { $sort: { revenue: -1 } },
  ]);
};

// Static method to get platform summary
adTrackingSchema.statics.getPlatformSummary = async function (startDate, endDate) {
  const matchStage = {
    createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
  };

  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$adPlatform',
        sessions: { $sum: 1 },
        conversions: { $sum: { $cond: ['$converted', 1, 0] } },
        revenue: { $sum: '$conversionValue' },
      },
    },
    {
      $project: {
        _id: 0,
        platform: { $ifNull: ['$_id', 'direct'] },
        sessions: 1,
        conversions: 1,
        revenue: 1,
        conversionRate: {
          $cond: [
            { $eq: ['$sessions', 0] },
            0,
            { $multiply: [{ $divide: ['$conversions', '$sessions'] }, 100] },
          ],
        },
      },
    },
    { $sort: { revenue: -1 } },
  ]);
};

const AdTracking = mongoose.models.AdTracking || mongoose.model('AdTracking', adTrackingSchema);

export default AdTracking;
