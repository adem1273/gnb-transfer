/**
 * Coupon Model
 *
 * @module models/Coupon
 * @description Manages discount coupon codes for marketing campaigns
 */

import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Coupon code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      minlength: [3, 'Coupon code must be at least 3 characters'],
      maxlength: [20, 'Coupon code cannot exceed 20 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, 'Description cannot exceed 200 characters'],
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: true,
      default: 'percentage',
    },
    discountValue: {
      type: Number,
      required: [true, 'Discount value is required'],
      min: [0, 'Discount value cannot be negative'],
    },
    minPurchaseAmount: {
      type: Number,
      default: 0,
      min: [0, 'Minimum purchase amount cannot be negative'],
    },
    maxDiscountAmount: {
      type: Number,
      default: null, // null means no maximum
    },
    usageLimit: {
      type: Number,
      default: null, // null means unlimited
      min: [0, 'Usage limit cannot be negative'],
    },
    usageCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    validFrom: {
      type: Date,
      required: true,
      default: Date.now,
    },
    validUntil: {
      type: Date,
      required: [true, 'Expiry date is required'],
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    applicableTours: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tour',
      },
    ],
    // If empty, applies to all tours
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
couponSchema.index({ code: 1 }, { unique: true });
couponSchema.index({ active: 1, validFrom: 1, validUntil: 1 }); // Active valid coupons
couponSchema.index({ createdAt: -1 });
couponSchema.index({ applicableTours: 1 }); // Tour-specific coupons

// Virtual for checking if coupon is currently valid
couponSchema.virtual('isValid').get(function () {
  const now = new Date();
  return (
    this.active &&
    now >= this.validFrom &&
    now <= this.validUntil &&
    (this.usageLimit === null || this.usageCount < this.usageLimit)
  );
});

// Method to check if coupon can be applied to a booking
couponSchema.methods.canApply = function (bookingAmount, tourId) {
  if (!this.isValid) {
    return { valid: false, reason: 'Coupon is not valid or has expired' };
  }

  if (this.minPurchaseAmount > 0 && bookingAmount < this.minPurchaseAmount) {
    return {
      valid: false,
      reason: `Minimum purchase amount is $${this.minPurchaseAmount}`,
    };
  }

  if (this.applicableTours.length > 0) {
    const tourIdStr = tourId.toString();
    const isApplicable = this.applicableTours.some((id) => id.toString() === tourIdStr);

    if (!isApplicable) {
      return {
        valid: false,
        reason: 'Coupon is not applicable to this tour',
      };
    }
  }

  return { valid: true };
};

// Method to calculate discount amount
couponSchema.methods.calculateDiscount = function (bookingAmount) {
  let discount = 0;

  if (this.discountType === 'percentage') {
    discount = (bookingAmount * this.discountValue) / 100;
  } else {
    discount = this.discountValue;
  }

  // Apply max discount limit if set
  if (this.maxDiscountAmount !== null && discount > this.maxDiscountAmount) {
    discount = this.maxDiscountAmount;
  }

  // Ensure discount doesn't exceed booking amount
  if (discount > bookingAmount) {
    discount = bookingAmount;
  }

  return Math.round(discount * 100) / 100;
};

const Coupon = mongoose.models.Coupon || mongoose.model('Coupon', couponSchema);

export default Coupon;
