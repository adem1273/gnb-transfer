/**
 * Booking model with validation and indexes
 * 
 * Ministry of Transport Compliance:
 * - Turkish Ministry of Transport requires passenger names for all transfers
 * - All passengers (adults + children) must have their names recorded
 */

import mongoose from 'mongoose';
import { invalidateTag } from '../utils/cache.mjs';
import logger from '../config/logger.mjs';

// Passenger schema for ministry-required passenger name collection
const passengerSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'Passenger first name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters'],
  },
  lastName: {
    type: String,
    required: [true, 'Passenger last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters'],
  },
  type: {
    type: String,
    enum: ['adult', 'child', 'infant'],
    default: 'adult',
  },
}, { _id: false });

const bookingSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Customer email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address'],
    },
    phone: {
      type: String,
      trim: true,
    },
    // Phone with country code for WhatsApp integration
    phoneCountryCode: {
      type: String,
      trim: true,
      default: '+90',
    },
    // WhatsApp link generated from phone and country code
    whatsappLink: {
      type: String,
      trim: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    tour: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tour',
      required: [true, 'Tour reference is required'],
    },
    // Kept for backward compatibility with existing code that uses tourId
    // Virtual property handles mapping between tour and tourId
    tourId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tour',
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
    },
    date: {
      type: Date,
      default: Date.now,
    },
    time: {
      type: String,
      trim: true,
    },
    // Flight information (required for transfers)
    flightNumber: {
      type: String,
      trim: true,
      uppercase: true,
    },
    // Guest counts by type
    adultsCount: {
      type: Number,
      default: 1,
      min: [1, 'Must have at least 1 adult'],
      max: [50, 'Cannot exceed 50 adults'],
    },
    childrenCount: {
      type: Number,
      default: 0,
      min: [0, 'Children count cannot be negative'],
      max: [50, 'Cannot exceed 50 children'],
    },
    infantsCount: {
      type: Number,
      default: 0,
      min: [0, 'Infants count cannot be negative'],
      max: [20, 'Cannot exceed 20 infants'],
    },
    guests: {
      type: Number,
      default: 1,
      min: [1, 'Must have at least 1 guest'],
    },
    // Ministry-required: All passenger names
    passengers: {
      type: [passengerSchema],
      validate: {
        validator: function(v) {
          // At least one passenger is required
          return v && v.length >= 1;
        },
        message: 'At least one passenger name is required (Turkish Ministry of Transport regulation)',
      },
    },
    // Extra services
    extraServices: {
      childSeat: {
        selected: { type: Boolean, default: false },
        quantity: { type: Number, default: 0, min: 0, max: 10 },
        price: { type: Number, default: 10 },
      },
      babySeat: {
        selected: { type: Boolean, default: false },
        quantity: { type: Number, default: 0, min: 0, max: 10 },
        price: { type: Number, default: 10 },
      },
      meetAndGreet: {
        selected: { type: Boolean, default: false },
        price: { type: Number, default: 15 },
      },
      vipLounge: {
        selected: { type: Boolean, default: false },
        price: { type: Number, default: 50 },
      },
    },
    // Extra services total
    extraServicesTotal: {
      type: Number,
      default: 0,
      min: [0, 'Extra services total cannot be negative'],
    },
    amount: {
      type: Number,
      min: [0, 'Amount cannot be negative'],
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'credit_card', 'stripe'],
      default: 'cash',
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed', 'paid'],
      default: 'pending',
      index: true,
    },
    pickupLocation: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
    aiMetadata: {
      isAIPackage: { type: Boolean, default: false },
      packageDiscount: { type: Number, default: 0 },
      recommendationId: { type: String },
      delayGuarantee: {
        riskScore: { type: Number },
        estimatedDelay: { type: Number },
        discountCode: { type: String },
      },
    },
    upsells: [
      {
        tourId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Tour',
        },
        type: {
          type: String,
          enum: ['tour', 'vip', 'addon'],
          default: 'tour',
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Compound index for user + status queries
bookingSchema.index({ user: 1, status: 1 });

// Index on email for quick lookups
bookingSchema.index({ email: 1 });

// Compound index for tourId lookups
bookingSchema.index({ tourId: 1, status: 1 });

// Additional performance indexes
bookingSchema.index({ date: 1 }); // Date-based queries
bookingSchema.index({ createdAt: -1 }); // Recent bookings
bookingSchema.index({ tour: 1, date: 1 }); // Tour availability queries
bookingSchema.index({ user: 1, createdAt: -1 }); // User booking history
bookingSchema.index({ driver: 1 }); // Driver assignment queries
bookingSchema.index({ vehicle: 1 }); // Vehicle assignment queries

// Pre-save hook to generate WhatsApp link
bookingSchema.pre('save', function(next) {
  if (this.phone && this.phoneCountryCode) {
    // Remove non-digit characters from phone for WhatsApp link
    const cleanPhone = this.phone.replace(/\D/g, '');
    const cleanCountryCode = this.phoneCountryCode.replace(/\D/g, '');
    this.whatsappLink = `https://wa.me/${cleanCountryCode}${cleanPhone}`;
  }
  
  // Calculate total guests from individual counts
  this.guests = (this.adultsCount || 1) + (this.childrenCount || 0) + (this.infantsCount || 0);
  
  // Calculate extra services total
  let extraTotal = 0;
  if (this.extraServices) {
    if (this.extraServices.childSeat?.selected) {
      extraTotal += (this.extraServices.childSeat.quantity || 0) * (this.extraServices.childSeat.price || 10);
    }
    if (this.extraServices.babySeat?.selected) {
      extraTotal += (this.extraServices.babySeat.quantity || 0) * (this.extraServices.babySeat.price || 10);
    }
    if (this.extraServices.meetAndGreet?.selected) {
      extraTotal += this.extraServices.meetAndGreet.price || 15;
    }
    if (this.extraServices.vipLounge?.selected) {
      extraTotal += this.extraServices.vipLounge.price || 50;
    }
  }
  this.extraServicesTotal = extraTotal;
  
  next();
});

// Virtual for backward compatibility with tourId
// This allows accessing tour via tourId property
bookingSchema.virtual('tourIdVirtual').get(function() {
  return this.tour;
});

bookingSchema.virtual('tourIdVirtual').set(function(value) {
  this.tour = value;
});

// Include virtuals in JSON/Object output
bookingSchema.set('toJSON', { virtuals: true });
bookingSchema.set('toObject', { virtuals: true });

// Cache invalidation hooks
bookingSchema.post('save', async function(doc) {
  try {
    await invalidateTag('bookings');
    logger.debug('Booking cache invalidated after save', { bookingId: doc._id });
  } catch (error) {
    logger.error('Failed to invalidate booking cache', { error: error.message });
  }
});

bookingSchema.post('findOneAndUpdate', async function(doc) {
  try {
    await invalidateTag('bookings');
    logger.debug('Booking cache invalidated after update');
  } catch (error) {
    logger.error('Failed to invalidate booking cache', { error: error.message });
  }
});

bookingSchema.post('findOneAndDelete', async function(doc) {
  try {
    await invalidateTag('bookings');
    logger.debug('Booking cache invalidated after delete');
  } catch (error) {
    logger.error('Failed to invalidate booking cache', { error: error.message });
  }
});

bookingSchema.post('deleteOne', async function() {
  try {
    await invalidateTag('bookings');
    logger.debug('Booking cache invalidated after deleteOne');
  } catch (error) {
    logger.error('Failed to invalidate booking cache', { error: error.message });
  }
});

bookingSchema.post('deleteMany', async function() {
  try {
    await invalidateTag('bookings');
    logger.debug('Booking cache invalidated after deleteMany');
  } catch (error) {
    logger.error('Failed to invalidate booking cache', { error: error.message });
  }
});

const Booking = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);

export default Booking;
