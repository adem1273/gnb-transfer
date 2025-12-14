/**
 * PriceRule Model
 *
 * @module models/PriceRule
 * @description Manages dynamic pricing rules for routes and tours
 * 
 * This model allows flexible pricing based on various conditions:
 * - Time-based pricing (peak hours, weekends, holidays)
 * - Demand-based pricing (occupancy rates)
 * - Distance-based pricing
 * - Season-based pricing
 */

import mongoose from 'mongoose';

const priceRuleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Price rule name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    // Rule type determines how the price adjustment is calculated
    ruleType: {
      type: String,
      required: [true, 'Rule type is required'],
      enum: ['time_based', 'demand_based', 'distance_based', 'season_based', 'custom'],
      index: true,
    },
    // Adjustment can be percentage or fixed amount
    adjustmentType: {
      type: String,
      required: [true, 'Adjustment type is required'],
      enum: ['percentage', 'fixed'],
      default: 'percentage',
    },
    // Adjustment value (positive for increase, negative for decrease)
    adjustmentValue: {
      type: Number,
      required: [true, 'Adjustment value is required'],
    },
    // Minimum price after applying rule
    minPrice: {
      type: Number,
      min: [0, 'Minimum price cannot be negative'],
    },
    // Maximum price after applying rule
    maxPrice: {
      type: Number,
      min: [0, 'Maximum price cannot be negative'],
    },
    // Priority for applying multiple rules (higher priority applied first)
    priority: {
      type: Number,
      default: 0,
      min: [0, 'Priority cannot be negative'],
    },
    // Active status
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    // Time-based conditions
    timeConditions: {
      // Days of week (0 = Sunday, 6 = Saturday)
      daysOfWeek: [
        {
          type: Number,
          min: 0,
          max: 6,
        },
      ],
      // Hour ranges (24-hour format)
      hourRanges: [
        {
          start: {
            type: Number,
            min: 0,
            max: 23,
          },
          end: {
            type: Number,
            min: 0,
            max: 23,
          },
        },
      ],
      // Date ranges
      dateRanges: [
        {
          startDate: Date,
          endDate: Date,
        },
      ],
    },
    // Demand-based conditions
    demandConditions: {
      // Minimum occupancy rate to trigger rule (0-100)
      minOccupancyRate: {
        type: Number,
        min: 0,
        max: 100,
      },
      // Maximum occupancy rate for rule to apply
      maxOccupancyRate: {
        type: Number,
        min: 0,
        max: 100,
      },
    },
    // Distance-based conditions
    distanceConditions: {
      minDistance: {
        type: Number,
        min: 0,
      },
      maxDistance: {
        type: Number,
        min: 0,
      },
      // Unit: 'km' or 'mi'
      unit: {
        type: String,
        enum: ['km', 'mi'],
        default: 'km',
      },
    },
    // Apply to specific routes (if empty, applies to all)
    applicableRoutes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tour',
      },
    ],
    // Apply to specific vehicle types (if empty, applies to all)
    applicableVehicleTypes: [
      {
        type: String,
        enum: ['sedan', 'suv', 'van', 'minibus', 'luxury', 'economy'],
      },
    ],
    // Metadata for tracking
    metadata: {
      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      lastModifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      appliedCount: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
priceRuleSchema.index({ active: 1, priority: -1 });
priceRuleSchema.index({ ruleType: 1, active: 1 });
priceRuleSchema.index({ 'timeConditions.dateRanges.startDate': 1, 'timeConditions.dateRanges.endDate': 1 });

// Virtual to check if rule is currently applicable based on time
priceRuleSchema.virtual('isCurrentlyApplicable').get(function () {
  if (!this.active) return false;

  const now = new Date();
  const currentDay = now.getDay();
  const currentHour = now.getHours();

  // Check day of week
  if (
    this.timeConditions?.daysOfWeek?.length > 0 &&
    !this.timeConditions.daysOfWeek.includes(currentDay)
  ) {
    return false;
  }

  // Check hour ranges
  if (this.timeConditions?.hourRanges?.length > 0) {
    const inRange = this.timeConditions.hourRanges.some((range) => {
      return currentHour >= range.start && currentHour <= range.end;
    });
    if (!inRange) return false;
  }

  // Check date ranges
  if (this.timeConditions?.dateRanges?.length > 0) {
    const inDateRange = this.timeConditions.dateRanges.some((range) => {
      return now >= range.startDate && now <= range.endDate;
    });
    if (!inDateRange) return false;
  }

  return true;
});

// Method to calculate price with this rule
priceRuleSchema.methods.calculatePrice = function (basePrice) {
  let adjustedPrice = basePrice;

  if (this.adjustmentType === 'percentage') {
    adjustedPrice = basePrice * (1 + this.adjustmentValue / 100);
  } else if (this.adjustmentType === 'fixed') {
    adjustedPrice = basePrice + this.adjustmentValue;
  }

  // Apply min/max constraints
  if (this.minPrice !== undefined && adjustedPrice < this.minPrice) {
    adjustedPrice = this.minPrice;
  }
  if (this.maxPrice !== undefined && adjustedPrice > this.maxPrice) {
    adjustedPrice = this.maxPrice;
  }

  return Math.round(adjustedPrice * 100) / 100; // Round to 2 decimal places
};

// Static method to find applicable rules for a route/conditions
priceRuleSchema.statics.findApplicableRules = async function (routeId, conditions = {}) {
  const query = { active: true };

  // Filter by route if specified
  if (routeId) {
    query.$or = [
      { applicableRoutes: { $size: 0 } }, // Rules with no specific routes apply to all
      { applicableRoutes: routeId },
    ];
  }

  // Fetch rules sorted by priority
  const rules = await this.find(query).sort({ priority: -1 });

  // Filter by additional conditions
  return rules.filter((rule) => {
    // Check time-based conditions
    if (rule.ruleType === 'time_based' && !rule.isCurrentlyApplicable) {
      return false;
    }

    // Check demand-based conditions
    if (rule.ruleType === 'demand_based' && conditions.occupancyRate !== undefined) {
      const { minOccupancyRate, maxOccupancyRate } = rule.demandConditions || {};
      if (minOccupancyRate && conditions.occupancyRate < minOccupancyRate) return false;
      if (maxOccupancyRate && conditions.occupancyRate > maxOccupancyRate) return false;
    }

    // Check distance-based conditions
    if (rule.ruleType === 'distance_based' && conditions.distance !== undefined) {
      const { minDistance, maxDistance } = rule.distanceConditions || {};
      if (minDistance && conditions.distance < minDistance) return false;
      if (maxDistance && conditions.distance > maxDistance) return false;
    }

    return true;
  });
};

const PriceRule = mongoose.models.PriceRule || mongoose.model('PriceRule', priceRuleSchema);

export default PriceRule;
