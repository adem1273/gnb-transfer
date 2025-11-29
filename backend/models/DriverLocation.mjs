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

export const DriverLocation = mongoose.model('DriverLocation', driverLocationSchema);
