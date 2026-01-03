/**
 * Driver Location Model
 *
 * @module models/DriverLocation
 * @description Stores real-time driver GPS location data
 */

import mongoose from 'mongoose';

const driverLocationSchema = new mongoose.Schema({
  driverId: {
    type: String,
    required: true,
    index: true,
  },
  lat: {
    type: Number,
    required: true,
  },
  lng: {
    type: Number,
    required: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for efficient queries
driverLocationSchema.index({ driverId: 1, updatedAt: -1 }); // Latest location by driver
driverLocationSchema.index({ updatedAt: -1 }); // Recent location updates
// TTL index to auto-delete old location data after 24 hours
driverLocationSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 86400 });

export const DriverLocation = mongoose.model('DriverLocation', driverLocationSchema);
