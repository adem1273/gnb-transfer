import mongoose from 'mongoose';

/**
 * Campaign Model (Enhanced)
 *
 * @module models/Campaign
 * @description Advanced campaign management with auto-coupon generation and season multipliers
 *
 * Features:
 * - Date range campaigns
 * - Percentage or fixed discount
 * - Route-specific or general campaigns
 * - Auto-generated coupon codes
 * - Season multipliers (e.g., summer ×1.2)
 * - Usage tracking
 */

const campaignSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Campaign name is required'],
      trim: true,
      maxlength: [100, 'Campaign name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    type: {
      type: String,
      enum: ['discount', 'seasonal_multiplier', 'route_specific', 'general'],
      required: true,
      default: 'general',
    },
    // Discount settings
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'percentage',
    },
    discountValue: {
      type: Number,
      required: function() {
        return this.type === 'discount' || this.type === 'route_specific' || this.type === 'general';
      },
      min: [0, 'Discount value cannot be negative'],
    },
    // Season multiplier (e.g., 1.2 for 20% increase in summer)
    seasonMultiplier: {
      type: Number,
      default: 1.0,
      min: [0.1, 'Season multiplier must be at least 0.1'],
      max: [5.0, 'Season multiplier cannot exceed 5.0'],
    },
    // Date range
    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    // Route specifications (empty = applies to all routes)
    applicableRoutes: [
      {
        origin: String,
        destination: String,
      },
    ],
    // Applicable tours (empty = all tours)
    applicableTours: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tour',
      },
    ],
    // Auto-generated coupon code
    couponCode: {
      type: String,
      uppercase: true,
      trim: true,
      unique: true,
      sparse: true, // Allow null values, but unique when present
      maxlength: [20, 'Coupon code cannot exceed 20 characters'],
    },
    autoGenerateCoupon: {
      type: Boolean,
      default: false,
    },
    // Usage limits
    maxUsage: {
      type: Number,
      default: null, // null = unlimited
      min: [0, 'Max usage cannot be negative'],
    },
    currentUsage: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Minimum purchase amount
    minPurchaseAmount: {
      type: Number,
      default: 0,
      min: [0, 'Minimum purchase amount cannot be negative'],
    },
    // Maximum discount amount (for percentage discounts)
    maxDiscountAmount: {
      type: Number,
      default: null, // null = no limit
    },
    // Status
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    // Priority (higher number = higher priority when multiple campaigns apply)
    priority: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Tracking
    appliedCount: {
      type: Number,
      default: 0,
    },
    totalDiscount: {
      type: Number,
      default: 0,
    },
    // Creator
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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

// Indexes for performance
campaignSchema.index({ active: 1, startDate: 1, endDate: 1 });
campaignSchema.index({ type: 1, active: 1 });
campaignSchema.index({ couponCode: 1 }, { unique: true, sparse: true });
campaignSchema.index({ priority: -1 });

// Validation: endDate must be after startDate
campaignSchema.pre('save', function (next) {
  if (this.endDate <= this.startDate) {
    return next(new Error('End date must be after start date'));
  }
  
  // Auto-generate coupon code if requested and not already set
  if (this.autoGenerateCoupon && !this.couponCode) {
    this.couponCode = generateCouponCode(this.name, this.startDate);
  }
  
  return next();
});

// Virtual: check if campaign is currently valid
campaignSchema.virtual('isValid').get(function () {
  const now = new Date();
  const isTimeValid = now >= this.startDate && now <= this.endDate;
  const isUsageValid = this.maxUsage === null || this.currentUsage < this.maxUsage;
  return this.active && isTimeValid && isUsageValid;
});

// Method: check if campaign applies to a specific booking
campaignSchema.methods.appliesTo = function ({ origin, destination, tourId, bookingAmount }) {
  if (!this.isValid) {
    return false;
  }
  
  // Check minimum purchase amount
  if (bookingAmount && this.minPurchaseAmount > 0 && bookingAmount < this.minPurchaseAmount) {
    return false;
  }
  
  // Check route applicability
  if (this.applicableRoutes && this.applicableRoutes.length > 0) {
    const routeMatch = this.applicableRoutes.some(
      (route) =>
        route.origin?.toLowerCase() === origin?.toLowerCase() &&
        route.destination?.toLowerCase() === destination?.toLowerCase()
    );
    if (!routeMatch) {
      return false;
    }
  }
  
  // Check tour applicability
  if (this.applicableTours && this.applicableTours.length > 0 && tourId) {
    const tourIdStr = tourId.toString();
    const tourMatch = this.applicableTours.some((id) => id.toString() === tourIdStr);
    if (!tourMatch) {
      return false;
    }
  }
  
  return true;
};

// Method: calculate discount amount
campaignSchema.methods.calculateDiscount = function (baseAmount) {
  if (this.type === 'seasonal_multiplier') {
    // Season multipliers don't provide discounts, they adjust base prices
    return 0;
  }
  
  let discount = 0;
  
  if (this.discountType === 'percentage') {
    discount = (baseAmount * this.discountValue) / 100;
  } else {
    discount = this.discountValue;
  }
  
  // Apply max discount limit if set
  if (this.maxDiscountAmount !== null && discount > this.maxDiscountAmount) {
    discount = this.maxDiscountAmount;
  }
  
  // Ensure discount doesn't exceed booking amount
  if (discount > baseAmount) {
    discount = baseAmount;
  }
  
  return Math.round(discount * 100) / 100;
};

// Method: apply campaign (increment usage)
campaignSchema.methods.apply = async function (discountAmount) {
  this.currentUsage += 1;
  this.appliedCount += 1;
  this.totalDiscount += discountAmount || 0;
  return this.save();
};

// Static method: find active campaigns for a booking
campaignSchema.statics.findApplicableCampaigns = async function ({
  origin,
  destination,
  tourId,
  bookingAmount,
  date = new Date(),
}) {
  const campaigns = await this.find({
    active: true,
    startDate: { $lte: date },
    endDate: { $gte: date },
    $or: [
      { maxUsage: null },
      { $expr: { $lt: ['$currentUsage', '$maxUsage'] } },
    ],
  })
    .sort({ priority: -1 })
    .lean();
  
  // Filter campaigns that apply to this booking
  return campaigns.filter((campaign) => {
    const campaignDoc = new this(campaign);
    return campaignDoc.appliesTo({ origin, destination, tourId, bookingAmount });
  });
};

/**
 * Generate a unique coupon code based on campaign name and date
 */
function generateCouponCode(name, startDate) {
  const namePart = name
    .replace(/[^a-zA-Z0-9]/g, '')
    .substring(0, 6)
    .toUpperCase();
  
  const year = new Date(startDate).getFullYear();
  const random = Math.floor(Math.random() * 100)
    .toString()
    .padStart(2, '0');
  
  return `${namePart}${year}${random}`;
}

const Campaign = mongoose.models.Campaign || mongoose.model('Campaign', campaignSchema);

export default Campaign;
