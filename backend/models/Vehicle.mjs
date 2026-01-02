/**
 * Vehicle Model
 *
 * @module models/Vehicle
 * @description Manages vehicle information for transfers
 */

import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema(
  {
    model: {
      type: String,
      required: [true, 'Vehicle model is required'],
      trim: true,
    },
    brand: {
      type: String,
      required: [true, 'Vehicle brand is required'],
      trim: true,
    },
    year: {
      type: Number,
      required: [true, 'Manufacturing year is required'],
      min: [1990, 'Year must be 1990 or later'],
      max: [new Date().getFullYear() + 1, 'Invalid year'],
    },
    plateNumber: {
      type: String,
      required: [true, 'Plate number is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    color: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['sedan', 'suv', 'van', 'minibus', 'luxury', 'economy'],
      default: 'sedan',
    },
    capacity: {
      type: Number,
      required: [true, 'Passenger capacity is required'],
      min: [1, 'Capacity must be at least 1'],
      max: [50, 'Capacity cannot exceed 50'],
    },
    status: {
      type: String,
      enum: ['available', 'in-use', 'maintenance', 'retired'],
      default: 'available',
      index: true,
    },
    features: [
      {
        type: String,
        enum: ['wifi', 'ac', 'gps', 'childSeat', 'wheelchair', 'luxury'],
      },
    ],
    mileage: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastMaintenanceDate: {
      type: Date,
    },
    nextMaintenanceDate: {
      type: Date,
    },
    insuranceExpiry: {
      type: Date,
      required: [true, 'Insurance expiry date is required'],
    },
    registrationExpiry: {
      type: Date,
      required: [true, 'Registration expiry date is required'],
    },
    currentDriver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
      default: null,
    },
    images: [
      {
        type: String, // URL to image
      },
    ],
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
vehicleSchema.index({ plateNumber: 1 }, { unique: true });
vehicleSchema.index({ status: 1, type: 1 }); // Available vehicles by type
vehicleSchema.index({ currentDriver: 1 }); // Driver-vehicle assignment
vehicleSchema.index({ insuranceExpiry: 1 }); // Insurance renewal tracking
vehicleSchema.index({ registrationExpiry: 1 }); // Registration renewal tracking
vehicleSchema.index({ type: 1, capacity: 1, status: 1 }); // Vehicle search by type and capacity

// Virtual for checking if insurance is valid
vehicleSchema.virtual('isInsuranceValid').get(function () {
  return this.insuranceExpiry > new Date();
});

// Virtual for checking if registration is valid
vehicleSchema.virtual('isRegistrationValid').get(function () {
  return this.registrationExpiry > new Date();
});

// Virtual for checking if maintenance is due
vehicleSchema.virtual('isMaintenanceDue').get(function () {
  if (!this.nextMaintenanceDate) return false;
  return this.nextMaintenanceDate <= new Date();
});

const Vehicle = mongoose.models.Vehicle || mongoose.model('Vehicle', vehicleSchema);

export default Vehicle;
