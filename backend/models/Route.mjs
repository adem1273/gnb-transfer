/**
 * Route Model
 *
 * @module models/Route
 * @description Manages transfer routes (origin-destination pairs) with dynamic pricing
 * 
 * This model represents specific transfer routes between locations.
 * It works alongside the Tour model but focuses on point-to-point transfers.
 * Routes can have base pricing and dynamic pricing rules applied to them.
 */

import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Location name is required'],
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    // Coordinates for distance calculation
    coordinates: {
      lat: {
        type: Number,
        required: [true, 'Latitude is required'],
        min: -90,
        max: 90,
      },
      lng: {
        type: Number,
        required: [true, 'Longitude is required'],
        min: -180,
        max: 180,
      },
    },
    // Location type (airport, hotel, city center, etc.)
    type: {
      type: String,
      enum: ['airport', 'hotel', 'city_center', 'attraction', 'port', 'station', 'custom'],
      default: 'custom',
    },
  },
  { _id: false }
);

const routeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Route name is required'],
      trim: true,
      maxlength: [200, 'Name cannot exceed 200 characters'],
      index: true,
    },
    // Multi-language support
    name_ar: { type: String, trim: true },
    name_ru: { type: String, trim: true },
    name_es: { type: String, trim: true },
    name_zh: { type: String, trim: true },
    name_hi: { type: String, trim: true },
    name_de: { type: String, trim: true },
    name_it: { type: String, trim: true },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    description_ar: { type: String, trim: true },
    description_ru: { type: String, trim: true },
    description_es: { type: String, trim: true },
    description_zh: { type: String, trim: true },
    description_hi: { type: String, trim: true },
    description_de: { type: String, trim: true },
    description_it: { type: String, trim: true },
    // Origin and destination
    origin: {
      type: locationSchema,
      required: [true, 'Origin is required'],
    },
    destination: {
      type: locationSchema,
      required: [true, 'Destination is required'],
    },
    // Distance in kilometers
    distance: {
      type: Number,
      required: [true, 'Distance is required'],
      min: [0, 'Distance cannot be negative'],
    },
    // Estimated duration in minutes
    duration: {
      type: Number,
      required: [true, 'Duration is required'],
      min: [1, 'Duration must be at least 1 minute'],
    },
    // Base pricing by vehicle type
    basePricing: {
      economy: {
        type: Number,
        min: [0, 'Price cannot be negative'],
      },
      sedan: {
        type: Number,
        min: [0, 'Price cannot be negative'],
      },
      suv: {
        type: Number,
        min: [0, 'Price cannot be negative'],
      },
      van: {
        type: Number,
        min: [0, 'Price cannot be negative'],
      },
      minibus: {
        type: Number,
        min: [0, 'Price cannot be negative'],
      },
      luxury: {
        type: Number,
        min: [0, 'Price cannot be negative'],
      },
    },
    // Default vehicle type pricing (fallback)
    basePrice: {
      type: Number,
      required: [true, 'Base price is required'],
      min: [0, 'Price cannot be negative'],
      index: true,
    },
    // Currency
    currency: {
      type: String,
      default: 'EUR',
      enum: ['EUR', 'USD', 'TRY', 'GBP'],
    },
    // Active status
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    // Popular route flag
    isPopular: {
      type: Boolean,
      default: false,
      index: true,
    },
    // Associated price rules
    priceRules: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PriceRule',
      },
    ],
    // Categories/tags for filtering
    categories: [
      {
        type: String,
        trim: true,
      },
    ],
    // Additional information
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
    // Booking statistics
    stats: {
      totalBookings: {
        type: Number,
        default: 0,
        min: 0,
      },
      totalRevenue: {
        type: Number,
        default: 0,
        min: 0,
      },
      averageRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
routeSchema.index({ active: 1, isPopular: -1 });
routeSchema.index({ 'origin.name': 1, 'destination.name': 1 });
routeSchema.index({ 'origin.type': 1, 'destination.type': 1 });
routeSchema.index({ distance: 1, basePrice: 1 });
routeSchema.index({ categories: 1 });

// Text index for search functionality
routeSchema.index({
  name: 'text',
  description: 'text',
  'origin.name': 'text',
  'destination.name': 'text',
});

// Virtual for formatted route name
routeSchema.virtual('formattedName').get(function () {
  return `${this.origin.name} → ${this.destination.name}`;
});

// Virtual for price per km
routeSchema.virtual('pricePerKm').get(function () {
  if (this.distance === 0) return 0;
  return Math.round((this.basePrice / this.distance) * 100) / 100;
});

// Method to calculate dynamic price
routeSchema.methods.calculateDynamicPrice = async function (vehicleType = 'sedan', conditions = {}) {
  // Get base price for vehicle type
  let basePrice = this.basePricing?.[vehicleType] || this.basePrice;

  // Find applicable price rules
  const PriceRule = mongoose.model('PriceRule');
  const applicableRules = await PriceRule.findApplicableRules(this._id, {
    ...conditions,
    distance: this.distance,
  });

  // Apply rules in priority order
  let finalPrice = basePrice;
  const appliedRules = [];

  for (const rule of applicableRules) {
    // Check if rule applies to this vehicle type
    if (
      rule.applicableVehicleTypes?.length > 0 &&
      !rule.applicableVehicleTypes.includes(vehicleType)
    ) {
      continue;
    }

    finalPrice = rule.calculatePrice(finalPrice);
    appliedRules.push({
      ruleId: rule._id,
      ruleName: rule.name,
      adjustment: rule.adjustmentValue,
      adjustmentType: rule.adjustmentType,
    });

    // Update rule application count
    rule.metadata.appliedCount += 1;
    await rule.save();
  }

  return {
    basePrice,
    finalPrice: Math.round(finalPrice * 100) / 100,
    appliedRules,
    currency: this.currency,
  };
};

// Static method to find routes between locations
routeSchema.statics.findByLocations = function (originName, destinationName) {
  const query = {};

  if (originName) {
    query['origin.name'] = new RegExp(originName, 'i');
  }

  if (destinationName) {
    query['destination.name'] = new RegExp(destinationName, 'i');
  }

  return this.find(query).sort({ isPopular: -1, 'stats.totalBookings': -1 });
};

// Static method to find routes by location type
routeSchema.statics.findByLocationType = function (originType, destinationType) {
  const query = { active: true };

  if (originType) {
    query['origin.type'] = originType;
  }

  if (destinationType) {
    query['destination.type'] = destinationType;
  }

  return this.find(query).sort({ isPopular: -1 });
};

// Pre-save hook to update formatted fields
routeSchema.pre('save', function (next) {
  // Ensure distance is calculated if coordinates change
  // This could integrate with a distance calculation service
  next();
});

// Include virtuals in JSON/Object output
routeSchema.set('toJSON', { virtuals: true });
routeSchema.set('toObject', { virtuals: true });

const Route = mongoose.models.Route || mongoose.model('Route', routeSchema);

export default Route;
