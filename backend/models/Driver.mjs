/**
 * Driver Model
 *
 * @module models/Driver
 * @description Manages driver information for transfers and tours
 */

import mongoose from 'mongoose';

const driverSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Driver name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    licenseNumber: {
      type: String,
      required: [true, 'License number is required'],
      unique: true,
      trim: true,
    },
    licenseExpiry: {
      type: Date,
      required: [true, 'License expiry date is required'],
    },
    languages: [
      {
        type: String,
        enum: ['en', 'ar', 'de', 'es', 'it', 'ru', 'zh', 'hi', 'tr'],
      },
    ],
    status: {
      type: String,
      enum: ['active', 'inactive', 'on-duty', 'off-duty'],
      default: 'active',
      index: true,
    },
    rating: {
      type: Number,
      default: 5.0,
      min: 0,
      max: 5,
    },
    totalTrips: {
      type: Number,
      default: 0,
      min: 0,
    },
    vehicleAssigned: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      default: null,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Work schedule
    availability: {
      monday: { available: { type: Boolean, default: true }, hours: String },
      tuesday: { available: { type: Boolean, default: true }, hours: String },
      wednesday: { available: { type: Boolean, default: true }, hours: String },
      thursday: { available: { type: Boolean, default: true }, hours: String },
      friday: { available: { type: Boolean, default: true }, hours: String },
      saturday: { available: { type: Boolean, default: true }, hours: String },
      sunday: { available: { type: Boolean, default: true }, hours: String },
    },
    notes: {
      type: String,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
driverSchema.index({ email: 1 });
driverSchema.index({ licenseNumber: 1 });
driverSchema.index({ status: 1 });
driverSchema.index({ rating: -1 });

// Virtual for checking if license is expired
driverSchema.virtual('isLicenseValid').get(function () {
  return this.licenseExpiry > new Date();
});

const Driver = mongoose.models.Driver || mongoose.model('Driver', driverSchema);

export default Driver;
