import mongoose from 'mongoose';

/**
 * CampaignRule Model
 *
 * @module models/CampaignRule
 * @description Mongoose model for dynamic campaign rules
 *
 * Features:
 * - Automatic discounts based on conditions (date, city, tour type)
 * - Schedule-based activation with start/end dates
 * - Multiple condition types supported
 */

const campaignRuleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    conditionType: {
      type: String,
      enum: ['date', 'city', 'tourType', 'dayOfWeek', 'bookingCount'],
      required: true,
    },
    target: { type: String, required: true, trim: true }, // e.g., "Istanbul", "Adventure", "Monday"
    discountRate: { type: Number, required: true, min: 0, max: 100 }, // Percentage
    active: { type: Boolean, default: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    appliedCount: { type: Number, default: 0 }, // Track how many times applied
  },
  { timestamps: true }
);

// Performance indexes
campaignRuleSchema.index({ active: 1, startDate: 1, endDate: 1 });
campaignRuleSchema.index({ conditionType: 1 });

// Validation: endDate must be after startDate
campaignRuleSchema.pre('save', function (next) {
  if (this.endDate <= this.startDate) {
    return next(new Error('End date must be after start date'));
  }
  return next();
});

const CampaignRule =
  mongoose.models.CampaignRule || mongoose.model('CampaignRule', campaignRuleSchema);
export default CampaignRule;
