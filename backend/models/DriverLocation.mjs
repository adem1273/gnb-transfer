/**
 * Driver Location Model
 *
 * @module models/DriverLocation
 * @description Stores real-time driver GPS location data
 */

import mongoose from 'mongoose';

// TTL for location data
// Default: 86400 seconds (24 hours = 24 * 60 * 60)
// Can be configured via DRIVER_LOCATION_TTL environment variable
const LOCATION_TTL_SECONDS = parseInt(process.env.DRIVER_LOCATION_TTL || '86400', 10);

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
// TTL index to auto-delete old location data
driverLocationSchema.index({ updatedAt: 1 }, { expireAfterSeconds: LOCATION_TTL_SECONDS });

export const DriverLocation = mongoose.model('DriverLocation', driverLocationSchema);
